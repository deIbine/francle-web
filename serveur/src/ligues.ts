/*
La ligue entre amis (web.9.3.2). Une seule ligue par joueur (décision 7 de web.9.3) ; on la rejoint par un lien qui
contient un code de 6 caractères, tapable aussi (décision 6) ; le créateur peut retirer un membre et changer le code.

    POST /ligues                 { nom } : crée une ligue et y entre (quitte l'ancienne)
    GET  /ligues/<code>          le nom d'une ligue et son nombre de membres, avant de la rejoindre (sans profil)
    POST /ligue/rejoindre        { code } : entre dans la ligue (quitte l'ancienne)
    POST /ligue/quitter          quitte sa ligue
    POST /ligue/retirer          { membre } : le créateur retire un membre
    POST /ligue/code             le créateur change le code (l'ancien lien ne marche plus)
    GET  /ligue/classement?mois= le classement de sa ligue pour un mois (décision 10)

Toutes, sauf l'aperçu, demandent le code secret du profil (en-tête Authorization).
 */
import { joursDuMois, type Classement, type LigneClassement } from '../../src/domaine/classement.ts'
import { tirer } from '../../src/domaine/chiffres.ts'
import { nettoyerPseudo, normaliserCode, refusNomLigue, tirerCodeLigue } from '../../src/domaine/pseudo.ts'
import type { Base, Requete } from './base.ts'
import { quitterLigues } from './effacer.ts'
import { json, lireChamp, vide } from './http.ts'
import { profilDe, SANS_PROFIL, type ProfilLu } from './profils.ts'

// au-delà, une ligue est pleine : une ligue n'est pas un classement public déguisé, et la garder petite garde le
// serveur léger (un choix de web.9.3.2, la décision 7 ne fixant que le nombre de ligues par joueur)
export const MEMBRES_MAX = 100

export interface Membre {
  readonly id: string
  readonly pseudo: string
  readonly createur: boolean
}

export interface InfosLigue {
  readonly id: string
  readonly nom: string
  readonly code: string
  // le joueur qui demande est-il le créateur ?
  readonly createur: boolean
  // dans l'ordre d'entrée
  readonly membres: readonly Membre[]
}

// la ligue n° ligue, vue par le profil n° moi
export async function infosLigue(base: Base, ligue: string, moi: string): Promise<InfosLigue | null> {
  const { results: ligues } = await base
    .prepare('SELECT id, nom, code, createur FROM ligues WHERE id = ?')
    .bind(ligue)
    .all<{ id: string; nom: string; code: string; createur: string }>()
  const trouvee = ligues[0]
  if (trouvee === undefined) {
    return null
  }
  const { results: membres } = await base
    .prepare('SELECT id, pseudo FROM profils WHERE ligue = ? ORDER BY entree_ligue')
    .bind(ligue)
    .all<{ id: string; pseudo: string }>()
  return {
    ...trouvee,
    createur: trouvee.createur === moi,
    membres: membres.map((membre) => ({ ...membre, createur: membre.id === trouvee.createur })),
  }
}

// le profil de la requête, ou la réponse 401 à rendre
async function profilOuRefus(requete: Request, base: Base): Promise<ProfilLu | Response> {
  return (await profilDe(requete, base)) ?? json(requete, 401, SANS_PROFIL)
}

// entrer dans une ligue : quitter l'ancienne (en la transmettant, ou en l'effaçant si on en était le dernier membre),
// puis entrer. maintenant donne l'ordre d'entrée. creation : les requêtes qui créent la nouvelle ligue, placées APRÈS
// le départ de l'ancienne (vu à web.9.3.2 : avant, le départ prenait la nouvelle ligue pour une ligue que son créateur
// quittait, et la base refusait de lui ôter son créateur)
function entrer(base: Base, profil: string, ligue: string, maintenant: Date, creation: Requete[] = []): Requete[] {
  return [
    ...quitterLigues(base, 'id = ?', profil),
    ...creation,
    base.prepare('UPDATE profils SET ligue = ?, entree_ligue = ? WHERE id = ?').bind(ligue, maintenant.getTime(), profil),
  ]
}

// exécute des requêtes qui posent un nouveau code de ligue : si le code tiré au hasard est déjà pris (une chance sur des
// centaines de millions), la contrainte UNIQUE refuse, et on retire au sort, trois fois au plus
async function avecCodeNeuf(base: Base, requetes: (code: string) => Requete[]): Promise<void> {
  for (let essai = 0; ; essai++) {
    try {
      await base.batch(requetes(tirerCodeLigue()))
      return
    } catch (erreur) {
      if (essai >= 2 || !String(erreur).includes('UNIQUE')) {
        throw erreur
      }
    }
  }
}

export async function creerLigue(requete: Request, base: Base, maintenant: Date): Promise<Response> {
  const profil = await profilOuRefus(requete, base)
  if (profil instanceof Response) {
    return profil
  }
  const saisie = await lireChamp(requete, 'nom')
  if (saisie === undefined) {
    return json(requete, 400, { erreur: 'demande-illisible' })
  }
  const refus = refusNomLigue(saisie)
  if (refus !== undefined) {
    return json(requete, 422, { erreur: 'nom-refuse', raison: refus })
  }
  const id = tirer()
  await avecCodeNeuf(base, (code) =>
    entrer(base, profil.id, id, maintenant, [
      base
        .prepare('INSERT INTO ligues (id, nom, code, createur) VALUES (?, ?, ?, ?)')
        .bind(id, nettoyerPseudo(saisie), code, profil.id),
    ]),
  )
  return json(requete, 201, await infosLigue(base, id, profil.id))
}

// la ligue d'un code d'invitation, ou undefined
async function ligueDuCode(base: Base, code: string): Promise<{ id: string; nom: string; membres: number } | undefined> {
  const { results } = await base
    .prepare(
      `SELECT l.id, l.nom, (SELECT COUNT(*) FROM profils p WHERE p.ligue = l.id) AS membres
       FROM ligues l WHERE l.code = ?`,
    )
    .bind(normaliserCode(code))
    .all<{ id: string; nom: string; membres: number }>()
  return results[0]
}

// l'aperçu d'une ligue, pour la page qui s'ouvre avec un lien d'invitation : rien d'autre que son nom et sa taille
export async function apercu(requete: Request, base: Base, code: string): Promise<Response> {
  const ligue = await ligueDuCode(base, code)
  return ligue === undefined
    ? json(requete, 404, { erreur: 'ligue-inconnue' })
    : json(requete, 200, { nom: ligue.nom, membres: ligue.membres })
}

export async function rejoindre(requete: Request, base: Base, maintenant: Date): Promise<Response> {
  const profil = await profilOuRefus(requete, base)
  if (profil instanceof Response) {
    return profil
  }
  const code = await lireChamp(requete, 'code')
  const ligue = code === undefined ? undefined : await ligueDuCode(base, code)
  if (ligue === undefined) {
    return json(requete, 404, { erreur: 'ligue-inconnue' })
  }
  if (ligue.id !== profil.ligue) {
    if (ligue.membres >= MEMBRES_MAX) {
      return json(requete, 409, { erreur: 'ligue-pleine' })
    }
    await base.batch(entrer(base, profil.id, ligue.id, maintenant))
  }
  return json(requete, 200, await infosLigue(base, ligue.id, profil.id))
}

export async function quitter(requete: Request, base: Base): Promise<Response> {
  const profil = await profilOuRefus(requete, base)
  if (profil instanceof Response) {
    return profil
  }
  await base.batch(quitterLigues(base, 'id = ?', profil.id))
  return vide(requete)
}

// le profil de la requête, s'il est le créateur de sa ligue ; sinon la réponse à rendre (401, ou 403 : interdit)
async function createurOuRefus(requete: Request, base: Base): Promise<(ProfilLu & { ligue: string }) | Response> {
  const profil = await profilOuRefus(requete, base)
  if (profil instanceof Response) {
    return profil
  }
  const infos = profil.ligue === null ? null : await infosLigue(base, profil.ligue, profil.id)
  if (infos === null || !infos.createur) {
    return json(requete, 403, { erreur: 'pas-createur' })
  }
  return { ...profil, ligue: infos.id }
}

export async function retirer(requete: Request, base: Base): Promise<Response> {
  const createur = await createurOuRefus(requete, base)
  if (createur instanceof Response) {
    return createur
  }
  const membre = await lireChamp(requete, 'membre')
  // le créateur ne se retire pas lui-même : il quitte la ligue (elle passe alors au plus ancien)
  if (membre !== undefined && membre !== createur.id) {
    await base
      .prepare('UPDATE profils SET ligue = NULL, entree_ligue = NULL WHERE id = ? AND ligue = ?')
      .bind(membre, createur.ligue)
      .run()
  }
  return json(requete, 200, await infosLigue(base, createur.ligue, createur.id))
}

export async function changerCode(requete: Request, base: Base): Promise<Response> {
  const createur = await createurOuRefus(requete, base)
  if (createur instanceof Response) {
    return createur
  }
  await avecCodeNeuf(base, (code) => [base.prepare('UPDATE ligues SET code = ? WHERE id = ?').bind(code, createur.ligue)])
  return json(requete, 200, await infosLigue(base, createur.ligue, createur.id))
}

// le mois demandé dans l'adresse (« ?mois=24322 », voir moisDuNumero), ou undefined s'il est absent ou invalide
export function moisDemande(requete: Request): number | undefined {
  const mois = Number(new URL(requete.url).searchParams.get('mois'))
  return Number.isSafeInteger(mois) && mois > 0 && mois < 100_000 ? mois : undefined
}

export interface OptionsClassement {
  // un « WHERE » sur profils p, et ses valeurs : les joueurs classés
  readonly filtre: string
  readonly valeurs: readonly unknown[]
  // garder les joueurs sans partie ce mois-là (dans une ligue, on voit tous ses membres ; pas en public)
  readonly avecZero: boolean
  // le nombre de lignes rendues, au plus
  readonly limite?: number
  // seulement la ligne de ce profil, avec son rang parmi TOUS les classés (le « toi » du classement public, web.9.3.3)
  readonly seul?: string
}

// les lignes d'un classement du mois : leur total et leurs parties du mois, et leur rang (RANK(), voir
// domaine/classement.ts). Le rang est calculé sur tous les classés AVANT de ne garder que les premiers ou une seule
// ligne : le 250e joueur reçoit bien « 250 »
export async function lignes(base: Base, mois: number, options: OptionsClassement): Promise<LigneClassement[]> {
  const { filtre, valeurs, avecZero, limite = 1000, seul } = options
  const [premier, dernier] = joursDuMois(mois)
  const { results } = await base
    .prepare(
      `WITH totaux AS (
         SELECT p.id, p.pseudo, COALESCE(SUM(pp.points), 0) AS total, COUNT(pp.jour) AS parties
         FROM profils p LEFT JOIN parties_profil pp ON pp.profil = p.id AND pp.jour BETWEEN ? AND ?
         WHERE ${filtre}
         GROUP BY p.id
         ${avecZero ? '' : 'HAVING COUNT(pp.jour) > 0'}
       ), classes AS (
         SELECT id, pseudo, total, parties, RANK() OVER (ORDER BY total DESC, parties ASC) AS rang FROM totaux
       )
       SELECT id, pseudo, total, parties, rang FROM classes ${seul === undefined ? '' : 'WHERE id = ?'}
       ORDER BY rang, pseudo LIMIT ?`,
    )
    .bind(premier, dernier, ...valeurs, ...(seul === undefined ? [] : [seul]), limite)
    .all<LigneClassement>()
  return results
}

export async function classementLigue(requete: Request, base: Base): Promise<Response> {
  const profil = await profilOuRefus(requete, base)
  if (profil instanceof Response) {
    return profil
  }
  const mois = moisDemande(requete)
  if (mois === undefined || profil.ligue === null) {
    return json(requete, 400, { erreur: mois === undefined ? 'mois-invalide' : 'sans-ligue' })
  }
  const classement: Classement = {
    mois,
    lignes: await lignes(base, mois, { filtre: 'p.ligue = ?', valeurs: [profil.ligue], avecZero: true }),
  }
  return json(requete, 200, classement)
}
