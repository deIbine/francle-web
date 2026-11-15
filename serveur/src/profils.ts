/*
Les profils (web.9.3.1) : un pseudo et un code secret, sans e-mail ni mot de passe (décision 1 de web.9.3).

    POST   /profils           crée un profil : { pseudo } -> { id, pseudo, code, secours }
    GET    /profil            le profil du code secret (en-tête Authorization) -> { id, pseudo, ligue }
    DELETE /profil            efface le profil, ses parties et sa place dans la ligue (décision 4)
    POST   /profil/secours    { secours } -> un nouveau code secret pour le profil ; l'ancien ne marche plus
    POST   /profil/parties    les parties du joueur, rattachées à son profil (format transmis, comme web.9.2)

Le code secret ne voyage que dans l'en-tête « Authorization: Bearer <code> », jamais dans l'adresse (qui finit dans
les historiques et les journaux). Le serveur n'en garde que l'empreinte (http.ts).
 */
import { tirer, PARTIES_PAR_ENVOI, TAILLE_MAX_ENVOI } from '../../src/domaine/chiffres.ts'
import { clePseudo, nettoyerPseudo, normaliserCode, refusPseudo, tirerSecours } from '../../src/domaine/pseudo.ts'
import { points } from '../../src/domaine/score.ts'
import { lireEnvoi, resume } from '../../src/domaine/transmission.ts'
import { estPossible } from '../../src/domaine/verification.ts'
import type { Base } from './base.ts'
import { effacerProfils } from './effacer.ts'
import { codeDe, empreinte, json, jourDuServeur, lireChamp, lireCorps, TROP_GROS, vide } from './http.ts'
import { infosLigue } from './ligues.ts'

// un profil sans partie pendant ce nombre de jours est effacé (décision 3), comme les parties anonymes de ce jour-là
export const JOURS_DE_CONSERVATION = 365

export interface ProfilLu {
  readonly id: string
  readonly pseudo: string
  // l'identifiant de sa ligue, ou null (depuis web.9.3.2)
  readonly ligue: string | null
}

// le profil dont la requête porte le code secret, ou undefined (pas de code, ou un code inconnu)
export async function profilDe(requete: Request, base: Base): Promise<ProfilLu | undefined> {
  const code = codeDe(requete)
  if (code === undefined) {
    return undefined
  }
  const { results } = await base
    .prepare('SELECT id, pseudo, ligue FROM profils WHERE empreinte_code = ?')
    .bind(await empreinte(code))
    .all<ProfilLu>()
  return results[0]
}

export const SANS_PROFIL = { erreur: 'profil-inconnu' }

export async function creer(requete: Request, base: Base, maintenant: Date): Promise<Response> {
  const saisie = await lireChamp(requete, 'pseudo')
  if (saisie === undefined) {
    return json(requete, 400, { erreur: 'demande-illisible' })
  }
  const refus = refusPseudo(saisie)
  if (refus !== undefined) {
    return json(requete, 422, { erreur: 'pseudo-refuse', raison: refus })
  }
  const pseudo = nettoyerPseudo(saisie)
  const cle = clePseudo(pseudo)
  const { results } = await base.prepare('SELECT 1 FROM profils WHERE cle_pseudo = ?').bind(cle).all()
  if (results.length > 0) {
    return json(requete, 409, { erreur: 'pseudo-pris' })
  }
  const profil = { id: tirer(), pseudo, code: tirer(), secours: tirerSecours() }
  // les empreintes calculées AVANT le try : une erreur ici (ou ailleurs que dans l'insertion) doit remonter comme
  // « serveur indisponible », et non se faire passer pour un pseudo pris
  const empreintes = [await empreinte(profil.code), await empreinte(normaliserCode(profil.secours))]
  const insertion = base
    .prepare(
      `INSERT INTO profils (id, pseudo, cle_pseudo, empreinte_code, empreinte_secours, dernier_jour)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(profil.id, pseudo, cle, ...empreintes, jourDuServeur(maintenant))
  try {
    await insertion.run()
  } catch (erreur) {
    // deux joueurs ont pris le même pseudo à la même seconde : la contrainte UNIQUE de la base a refusé le second.
    // Toute autre erreur remonte (503)
    if (String(erreur).includes('UNIQUE')) {
      return json(requete, 409, { erreur: 'pseudo-pris' })
    }
    throw erreur
  }
  return json(requete, 201, profil)
}

// le profil, et sa ligue s'il en a une (depuis web.9.3.2)
export async function lire(requete: Request, base: Base): Promise<Response> {
  const profil = await profilDe(requete, base)
  if (profil === undefined) {
    return json(requete, 401, SANS_PROFIL)
  }
  const { ligue, ...reste } = profil
  return json(requete, 200, { ...reste, ligue: ligue === null ? null : await infosLigue(base, ligue, profil.id) })
}

export async function supprimer(requete: Request, base: Base): Promise<Response> {
  const profil = await profilDe(requete, base)
  if (profil === undefined) {
    return json(requete, 401, SANS_PROFIL)
  }
  await base.batch(effacerProfils(base, 'id = ?', profil.id))
  return vide(requete)
}

export async function secours(requete: Request, base: Base): Promise<Response> {
  const code = await lireChamp(requete, 'secours')
  if (code === undefined) {
    return json(requete, 400, { erreur: 'demande-illisible' })
  }
  const { results } = await base
    .prepare('SELECT id, pseudo, ligue FROM profils WHERE empreinte_secours = ?')
    .bind(await empreinte(normaliserCode(code)))
    .all<ProfilLu>()
  const profil = results[0]
  if (profil === undefined) {
    return json(requete, 404, { erreur: 'secours-inconnu' })
  }
  // un nouveau code secret : l'ancien (celui du navigateur effacé, ou d'un autre appareil) ne marche plus. Un profil
  // reste ainsi sur un seul appareil à la fois (décision 2)
  const nouveau = tirer()
  await base.prepare('UPDATE profils SET empreinte_code = ? WHERE id = ?').bind(await empreinte(nouveau), profil.id).run()
  return json(requete, 200, { id: profil.id, pseudo: profil.pseudo, code: nouveau })
}

export async function recevoirParties(requete: Request, base: Base, maintenant: Date): Promise<Response> {
  const profil = await profilDe(requete, base)
  if (profil === undefined) {
    return json(requete, 401, SANS_PROFIL)
  }
  const corps = await lireCorps(requete, TAILLE_MAX_ENVOI)
  if (corps === TROP_GROS) {
    return json(requete, 413, { erreur: 'envoi trop gros' })
  }
  const envoi = lireEnvoi(corps)
  if (envoi === undefined || envoi.parties.length === 0 || envoi.parties.length > PARTIES_PAR_ENVOI) {
    return json(requete, 400, { erreur: 'envoi illisible' })
  }
  const aujourdhui = jourDuServeur(maintenant)
  // comme pour les parties anonymes : seules les parties finies et possibles sont rangées, une par jour
  const rangees = envoi.parties.filter((partie) => partie.etat !== 'en-cours' && estPossible(partie, aujourdhui))
  const requetes = rangees.map(({ jour, regions, etat, modes, bonus }) => {
    const partie = { jour, regions, etat, modes, ...(bonus && { bonus }) }
    return base
      .prepare(
        `INSERT INTO parties_profil (profil, jour, partie, points) VALUES (?, ?, ?, ?)
         ON CONFLICT (profil, jour) DO UPDATE SET partie = excluded.partie, points = excluded.points`,
      )
      .bind(profil.id, jour, JSON.stringify(partie), points(resume(partie)))
  })
  // une partie reçue, c'est un profil actif : son compte à rebours de 12 mois repart d'aujourd'hui
  requetes.push(
    base.prepare('UPDATE profils SET dernier_jour = MAX(dernier_jour, ?) WHERE id = ?').bind(aujourdhui, profil.id),
  )
  await base.batch(requetes)
  return json(requete, 200, { rangees: rangees.length, ignorees: envoi.parties.length - rangees.length })
}

// l'entretien de chaque nuit (la tâche planifiée de Cloudflare, voir index.ts) : les profils sans partie depuis 365
// jours, et les parties anonymes de plus de 365 jours (décision 3, et la réponse du 15 novembre 2026 pour les anonymes)
export async function entretien(base: Base, maintenant: Date): Promise<void> {
  const limite = jourDuServeur(maintenant) - JOURS_DE_CONSERVATION
  await base.batch([
    ...effacerProfils(base, 'dernier_jour < ?', limite),
    base.prepare('DELETE FROM parties WHERE jour < ?').bind(limite),
  ])
}
