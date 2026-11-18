/*
Les chiffres de tous les joueurs (web.9.2) : ce que le site envoie au serveur, ce que le serveur répond, et les calculs
des deux côtés. Écrit une seule fois ici, importé par le site (src/) et par le serveur (serveur/) : les deux lisent
donc toujours le même format.

L'envoi : le format transmis de web.9.1 (transmission.ts), dont chaque partie porte en plus son « tirage », un numéro
tiré au hasard par le navigateur pour cette partie-là (décision 4 de web.9.2). Renvoyer la même partie (après le
bonus, par exemple) remplace l'envoi précédent au lieu d'en ajouter un. Le tirage change à chaque partie : il ne relie
pas deux parties du même joueur.

    { "v": 1, "parties": [ { "tirage": "3f9c…", "jour": 33, "regions": [...], "etat": "gagnee", ... } ] }

La réponse, pour un jour (seulement des nombres, aucune partie) :

    { "jour": 33, "joueurs": 152, "victoires": 123,
      "repartition": [4, 20, 41, 33, 17, 8],      les victoires en 1, 2… 6 essais
      "points": [29, 3, 8, 15, 22, 30, 21, 12, 7, 4, 1] }   le nombre de parties à 0, 1… 10 points
 */
import { ESSAIS_MAX, type Etat } from './partie.ts'
import { POINTS_MAX } from './score.ts'
import { estPartieTransmise, VERSION_TRANSMISSION, type PartieTransmise } from './transmission.ts'

// 16 octets tirés au hasard, écrits en hexadécimal : 32 caractères, 2^128 possibilités. Deux joueurs ne tirent
// jamais le même, et personne ne peut deviner celui d'un autre pour écraser sa partie
export const FORME_TIRAGE = /^[0-9a-f]{32}$/

export interface PartieEnvoyee extends PartieTransmise {
  readonly tirage: string
}

export interface EnvoiAuServeur {
  readonly v: typeof VERSION_TRANSMISSION
  readonly parties: readonly PartieEnvoyee[]
}

// les limites d'un envoi : au-delà, le serveur le refuse en entier (le site découpe un long historique en morceaux)
export const PARTIES_PAR_ENVOI = 50
export const TAILLE_MAX_ENVOI = 32 * 1024 // en octets ; une partie fait environ 200 octets

// tire un numéro pour une nouvelle partie. crypto.getRandomValues existe dans tous les navigateurs, même sur une page
// non sécurisée (contrairement à crypto.randomUUID), et dans le serveur
export function tirer(): string {
  const octets = crypto.getRandomValues(new Uint8Array(16))
  return [...octets].map((octet) => octet.toString(16).padStart(2, '0')).join('')
}

// lit un envoi reçu (le JSON déjà décodé) : undefined s'il n'a pas la bonne forme, la bonne version ou la bonne taille
export function lireEnvoiAuServeur(valeur: unknown): EnvoiAuServeur | undefined {
  const objet = valeur as EnvoiAuServeur
  if (
    typeof valeur !== 'object' ||
    valeur === null ||
    objet.v !== VERSION_TRANSMISSION ||
    !Array.isArray(objet.parties) ||
    objet.parties.length === 0 ||
    objet.parties.length > PARTIES_PAR_ENVOI ||
    !objet.parties.every((partie: unknown) => {
      const tirage = (partie as Partial<PartieEnvoyee> | null)?.tirage
      return estPartieTransmise(partie) && typeof tirage === 'string' && FORME_TIRAGE.test(tirage)
    })
  ) {
    return undefined
  }
  return objet
}

// la partie transmise seule, sans son tirage, et sans rien de ce qu'un envoi aurait ajouté en plus : on ne range que
// les champs connus
export function sansTirage(partie: PartieEnvoyee): PartieTransmise {
  const { jour, regions, etat, modes, bonus } = partie
  return {
    jour,
    regions,
    etat,
    modes: { rotation: modes.rotation, cachee: modes.cachee },
    ...(bonus && { bonus: { paires: bonus.paires, etat: bonus.etat, difficile: bonus.difficile } }),
  }
}

export interface ChiffresDuJour {
  readonly jour: number
  // les parties finies reçues ce jour-là (une par joueur qui a accepté l'envoi)
  readonly joueurs: number
  readonly victoires: number
  // repartition[n - 1] : les victoires en n essais
  readonly repartition: readonly number[]
  // points[p] : les parties qui ont rapporté p points (0 à 10)
  readonly points: readonly number[]
}

// une ligne lue dans la base, déjà regroupée : « nombre » parties de cet état, de ce nombre d'essais et de ces points
export interface Groupe {
  readonly etat: Etat
  readonly essais: number
  readonly points: number
  readonly nombre: number
}

// les chiffres d'un jour, à partir des groupes lus dans la base
export function chiffresDuJour(jour: number, groupes: readonly Groupe[]): ChiffresDuJour {
  const repartition: number[] = Array.from({ length: ESSAIS_MAX }, () => 0)
  const points: number[] = Array.from({ length: POINTS_MAX + 1 }, () => 0)
  let joueurs = 0
  let victoires = 0
  for (const groupe of groupes) {
    joueurs += groupe.nombre
    points[groupe.points] += groupe.nombre
    if (groupe.etat === 'gagnee') {
      victoires += groupe.nombre
      repartition[groupe.essais - 1] += groupe.nombre
    }
  }
  return { jour, joueurs, victoires, repartition, points }
}

const estListe = (valeur: unknown, longueur: number): valeur is number[] =>
  Array.isArray(valeur) && valeur.length === longueur && valeur.every((n) => Number.isSafeInteger(n) && n >= 0)

// lit la réponse du serveur, côté site : undefined si elle n'a pas la forme attendue (un serveur d'une autre version,
// une page d'erreur…). Comme pour la sauvegarde, on vérifie tout avant de s'en servir
export function lireChiffres(valeur: unknown): ChiffresDuJour | undefined {
  const chiffres = valeur as ChiffresDuJour
  if (
    typeof valeur !== 'object' ||
    valeur === null ||
    !Number.isSafeInteger(chiffres.jour) ||
    !Number.isSafeInteger(chiffres.joueurs) ||
    !Number.isSafeInteger(chiffres.victoires) ||
    !estListe(chiffres.repartition, ESSAIS_MAX) ||
    !estListe(chiffres.points, POINTS_MAX + 1)
  ) {
    return undefined
  }
  return chiffres
}

// le pourcentage de victoires du jour, arrondi (0 sans joueur)
export function tauxDeVictoire(chiffres: ChiffresDuJour): number {
  return chiffres.joueurs === 0 ? 0 : Math.round((chiffres.victoires * 100) / chiffres.joueurs)
}

// « tu fais autant ou mieux que 72 % » : la part des AUTRES joueurs du jour qui ont eu autant de points ou moins. compte :
// vrai si la partie du joueur est déjà parmi les chiffres (il l'a envoyée) ; on la retire alors, pour ne pas se comparer
// à soi-même. undefined s'il n'y a personne d'autre
//
// Depuis web.9.5.3, les ex aequo comptent : avant, seuls les joueurs à strictement moins de points comptaient, et un
// joueur à égalité avec tous lisait « tu fais mieux que 0 % des joueurs », comme s'il était dernier
export function autantOuMieuxQue(chiffres: ChiffresDuJour, mesPoints: number, compte: boolean): number | undefined {
  const autres = chiffres.joueurs - (compte ? 1 : 0)
  if (autres <= 0) {
    return undefined
  }
  // slice(0, mesPoints + 1) : les cases 0 à mesPoints, ses ex aequo compris (dont lui-même, s'il est compté)
  const autantOuMoins =
    chiffres.points.slice(0, mesPoints + 1).reduce((somme, nombre) => somme + nombre, 0) - (compte ? 1 : 0)
  return Math.round((autantOuMoins * 100) / autres)
}
