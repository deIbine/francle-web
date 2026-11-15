/*
Le classement public et sa modération (web.9.3.3). Tout profil y apparaît (décision 8 de web.9.3), dès sa première
partie du mois ; sans protection de la partie du jour (décision 12) : le classement se fait à la confiance, le serveur
vérifiant seulement que chaque partie est possible.

    GET  /classement?mois=      les 100 premiers du mois, le nombre de classés, et la ligne du joueur (s'il envoie
                                son code) ; lisible sans profil
    POST /signaler              { profil } : signale un pseudo (une fois par joueur)
    GET  /moderation            les pseudos signalés ou retirés, avec le nombre de signalements
    POST /moderation/masquer    { profil, masque } : retire un pseudo du classement public, ou l'y remet

La modération demande la clé de modération (« Authorization: Bearer <clé> »), un secret du Worker rangé par
l'utilisateur dans Cloudflare (MODERATION, voir docs/plan.md), jamais dans le dépôt. Sans ce secret, la modération
est fermée.
 */
import type { Classement } from '../../src/domaine/classement.ts'
import type { Base } from './base.ts'
import { codeDe, empreinte, json, lireCorps } from './http.ts'
import { lignes, moisDemande } from './ligues.ts'
import { profilDe, SANS_PROFIL } from './profils.ts'

// les lignes envoyées du classement public : les 100 premiers (le joueur reçoit aussi la sienne, s'il est plus loin)
export const PREMIERS = 100

// les joueurs du classement public : ceux dont la modération n'a pas retiré le pseudo, avec au moins une partie
const PUBLICS = { filtre: 'p.masque = 0', valeurs: [], avecZero: false }

export async function classementPublic(requete: Request, base: Base): Promise<Response> {
  const mois = moisDemande(requete)
  if (mois === undefined) {
    return json(requete, 400, { erreur: 'mois-invalide' })
  }
  const premiers = await lignes(base, mois, { ...PUBLICS, limite: PREMIERS })
  // le nombre de classés : la ligne du dernier rang ne suffit pas (des rangs peuvent être partagés)
  const tous = await lignes(base, mois, { ...PUBLICS, limite: 1_000_000 })
  const profil = await profilDe(requete, base)
  const moi =
    profil === undefined || premiers.some((ligne) => ligne.id === profil.id)
      ? undefined
      : (await lignes(base, mois, { ...PUBLICS, seul: profil.id }))[0]
  const classement: Classement = { mois, lignes: premiers, joueurs: tous.length, ...(moi && { moi }) }
  // une minute en cache : le classement change lentement, et un joueur qui feuillette les mois ne redemande rien
  return json(requete, 200, classement, { 'Cache-Control': 'private, max-age=60' })
}

export async function signaler(requete: Request, base: Base): Promise<Response> {
  const profil = await profilDe(requete, base)
  if (profil === undefined) {
    return json(requete, 401, SANS_PROFIL)
  }
  const corps = (await lireCorps(requete, 1024)) as { profil?: unknown } | symbol
  const vise = typeof corps === 'object' && typeof corps.profil === 'string' ? corps.profil : undefined
  // on ne se signale pas soi-même ; « INSERT OR IGNORE » : un second signalement du même joueur ne compte pas
  if (vise !== undefined && vise !== profil.id) {
    await base
      .prepare('INSERT OR IGNORE INTO signalements (profil, par) SELECT id, ? FROM profils WHERE id = ?')
      .bind(profil.id, vise)
      .run()
  }
  return json(requete, 200, {})
}

// vrai si la requête porte la clé de modération. On compare les empreintes des deux clés plutôt que les clés : une
// comparaison de textes s'arrête au premier caractère différent, et son temps pourrait trahir la clé, petit à petit
async function estModeration(requete: Request, cle: string | undefined): Promise<boolean> {
  const recue = codeDe(requete)
  return cle !== undefined && cle !== '' && recue !== undefined && (await empreinte(recue)) === (await empreinte(cle))
}

export async function listeModeration(requete: Request, base: Base, cle: string | undefined): Promise<Response> {
  if (!(await estModeration(requete, cle))) {
    return json(requete, 403, { erreur: 'moderation-fermee' })
  }
  const { results } = await base
    .prepare(
      `SELECT p.id, p.pseudo, p.masque, (SELECT COUNT(*) FROM signalements s WHERE s.profil = p.id) AS signalements
       FROM profils p WHERE p.masque = 1 OR EXISTS (SELECT 1 FROM signalements s WHERE s.profil = p.id)
       ORDER BY signalements DESC, p.pseudo`,
    )
    .all<{ id: string; pseudo: string; masque: number; signalements: number }>()
  return json(
    requete,
    200,
    results.map((ligne) => ({ ...ligne, masque: ligne.masque === 1 })),
  )
}

export async function masquer(requete: Request, base: Base, cle: string | undefined): Promise<Response> {
  if (!(await estModeration(requete, cle))) {
    return json(requete, 403, { erreur: 'moderation-fermee' })
  }
  const corps = (await lireCorps(requete, 1024)) as { profil?: unknown; masque?: unknown } | symbol
  if (typeof corps !== 'object' || typeof corps.profil !== 'string' || typeof corps.masque !== 'boolean') {
    return json(requete, 400, { erreur: 'demande-illisible' })
  }
  // remis dans le public : ses signalements sont effacés, ils ont été examinés
  await base.batch([
    base.prepare('UPDATE profils SET masque = ? WHERE id = ?').bind(corps.masque ? 1 : 0, corps.profil),
    ...(corps.masque ? [] : [base.prepare('DELETE FROM signalements WHERE profil = ?').bind(corps.profil)]),
  ])
  return json(requete, 200, {})
}
