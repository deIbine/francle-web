/*
Le serveur des chiffres de tous (web.9.2.1), et des profils depuis web.9.3.1.

    POST /parties          reçoit des parties finies anonymes (src/domaine/chiffres.ts), les vérifie et les range
    GET  /chiffres/<jour>  donne les chiffres d'un jour : joueurs, victoires, répartition des essais et des points
    …                      les profils : voir profils.ts

Un Worker Cloudflare est une seule fonction : elle reçoit une requête HTTP (Request) et rend une réponse (Response),
comme une servlet Java, mais sans serveur à faire tourner soi-même. Cloudflare la lance à chaque requête, dans le
centre de données le plus proche du joueur.

Ce que le serveur ne fait pas, exprès : il ne lit ni ne garde l'adresse IP du joueur, ni l'heure d'arrivée ; il range
chaque partie anonyme à part, sans rien qui relie deux parties d'un même envoi (voir docs/plan.md, « Une limite née de
trois réponses ensemble »). Les parties d'un profil, elles, lui sont rattachées : c'est ce que le joueur a choisi en le
créant (web.9.3).
 */
import { chiffresDuJour, lireEnvoiAuServeur, sansTirage, TAILLE_MAX_ENVOI, type Groupe } from '../../src/domaine/chiffres.ts'
import { points } from '../../src/domaine/score.ts'
import { resume } from '../../src/domaine/transmission.ts'
import { estPossible } from '../../src/domaine/verification.ts'
import type { Base } from './base.ts'
import { entetesCors, ILLISIBLE, json, jourDuServeur, lireCorps, TROP_GROS } from './http.ts'
import { creer, lire, recevoirParties, secours, supprimer } from './profils.ts'

// les adresses fixes : « MÉTHODE /chemin » -> ce qui y répond
type Traitement = (requete: Request, base: Base, maintenant: Date) => Promise<Response>
const ADRESSES: Record<string, Traitement> = {
  'POST /parties': recevoir,
  'POST /profils': creer,
  'GET /profil': lire,
  'DELETE /profil': supprimer,
  'POST /profil/secours': secours,
  'POST /profil/parties': recevoirParties,
}

// le point d'entrée : maintenant est passé en paramètre (et non lu ici) pour que les tests choisissent le jour
export async function traiter(requete: Request, base: Base, maintenant: Date): Promise<Response> {
  const chemin = new URL(requete.url).pathname
  try {
    if (requete.method === 'OPTIONS') {
      // la question préalable d'un navigateur (« preflight ») avant certains envois : on répond seulement par les en-têtes
      return new Response(null, { status: 204, headers: entetesCors(requete) })
    }
    const traitement = ADRESSES[`${requete.method} ${chemin}`]
    if (traitement !== undefined) {
      return await traitement(requete, base, maintenant)
    }
    const jour = /^\/chiffres\/(\d{1,6})$/.exec(chemin)
    if (jour !== null && requete.method === 'GET') {
      return await donner(requete, base, Number(jour[1]))
    }
    return json(requete, 404, { erreur: 'adresse inconnue' })
  } catch {
    // la base ne répond pas, ou son quota du jour est dépassé : le site fait alors sans les chiffres. On ne renvoie
    // pas le détail de l'erreur, qui n'apprendrait rien d'utile au joueur
    return json(requete, 503, { erreur: 'serveur indisponible' })
  }
}

async function recevoir(requete: Request, base: Base, maintenant: Date): Promise<Response> {
  // la taille annoncée d'abord (sans rien lire), puis la taille réelle : un envoi trop gros est refusé en entier
  const corps = await lireCorps(requete, TAILLE_MAX_ENVOI)
  if (corps === TROP_GROS) {
    return json(requete, 413, { erreur: 'envoi trop gros' })
  }
  const envoi = corps === ILLISIBLE ? undefined : lireEnvoiAuServeur(corps)
  if (envoi === undefined) {
    return json(requete, 400, { erreur: 'envoi illisible' })
  }
  // le jour du serveur est celui du temps universel ; estPossible laisse un jour d'avance aux joueurs qui ont déjà
  // passé minuit
  const aujourdhui = jourDuServeur(maintenant)
  // seules les parties finies et possibles sont rangées ; les autres sont ignorées, sans refuser tout l'envoi
  const rangees = envoi.parties
    .map((envoyee) => ({ tirage: envoyee.tirage, partie: sansTirage(envoyee) }))
    .filter(({ partie }) => partie.etat !== 'en-cours' && estPossible(partie, aujourdhui))
  if (rangees.length > 0) {
    // la même partie renvoyée (même tirage) remplace la précédente, si elle est bien du même jour : on ne peut pas
    // déplacer une partie d'un jour à l'autre
    const requetes = rangees.map(({ tirage, partie }) =>
      base
        .prepare(
          `INSERT INTO parties (tirage, jour, partie, points) VALUES (?, ?, ?, ?)
           ON CONFLICT (tirage) DO UPDATE SET partie = excluded.partie, points = excluded.points
           WHERE parties.jour = excluded.jour`,
        )
        .bind(tirage, partie.jour, JSON.stringify(partie), points(resume(partie))),
    )
    await base.batch(requetes)
  }
  return json(requete, 200, { rangees: rangees.length, ignorees: envoi.parties.length - rangees.length })
}

async function donner(requete: Request, base: Base, jour: number): Promise<Response> {
  // les parties du jour, regroupées par état, essais et points : la base renvoie au plus une cinquantaine de lignes,
  // quel que soit le nombre de joueurs. json_extract et json_array_length lisent dans le JSON rangé (SQLite les connaît)
  const { results } = await base
    .prepare(
      `SELECT json_extract(partie, '$.etat') AS etat, json_array_length(partie, '$.regions') AS essais,
              points, COUNT(*) AS nombre
       FROM parties WHERE jour = ? GROUP BY etat, essais, points`,
    )
    .bind(jour)
    .all<Groupe>()
  // une minute en cache dans le navigateur : rouvrir la fenêtre des résultats ne redemande pas tout de suite
  return json(requete, 200, chiffresDuJour(jour, results), { 'Cache-Control': 'public, max-age=60' })
}
