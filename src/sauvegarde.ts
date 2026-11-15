/*
La sauvegarde des parties du jour dans le navigateur (localStorage), pour retrouver sa partie en revenant sur la page
et calculer les statistiques. Il n'y a pas de serveur : tout reste sur l'appareil du joueur.

localStorage est un petit dictionnaire texte -> texte, propre au site, qui survit à la fermeture de la page (un peu
comme java.util.prefs.Preferences). On y range un seul texte JSON, sous une clé qui porte un numéro de version : si
le format change un jour, une nouvelle clé évitera de lire de travers les anciennes sauvegardes.

Ce qu'on garde de chaque partie : les régions proposées (leurs identifiants) et son état. Pas les distances ni les
pourcentages : on rejoue les propositions avec proposer(), qui les recalcule. Si une règle change, les anciennes
parties se rejouent avec la nouvelle règle, sans sauvegarde à convertir.

De même pour le bonus des départements (depuis web.7) : ses réponses et son état, rejouées au retour. Le champ est
facultatif : les sauvegardes d'avant web.7 restent lisibles, sans nouvelle clé « v2 ». Seul un bonus commencé (au
moins une réponse) est sauvé : passé avant toute réponse, il n'a pas commencé et reste à jouer.

Les réponses du bonus, deux formats :
    reponses  (web.7) les numéros donnés, dans l'ordre du jour : le département demandé s'en déduit (mode A)
    paires    (depuis web.7.6) [numéro demandé, numéro donné] : en mode C, le joueur choisit l'ordre, il faut donc
              garder aussi le département qu'il a choisi
On n'écrit plus que des paires ; les deux se lisent.

Depuis web.7.14, le bonus garde aussi sa version (difficile ou non, fixée à la première réponse). Absente, le bonus a
été joué avant web.7.14, avec les 101 départements : il est relu comme difficile.
 */
import {
  avecDifficulte,
  bonusDuJour,
  bonusEnCours,
  commence,
  passer,
  rejouer,
  rejouerPaires,
  type Bonus,
  type EtatBonus,
} from './domaine/bonus.ts'
import { abandonner, enCours, nouvellePartie, proposer, type Etat, type Partie } from './domaine/partie.ts'
import { SANS_MODE, type ModesDifficiles } from './domaine/partage.ts'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import { parId, type Mode, type Region } from './domaine/regions.ts'
import type { Resultat } from './domaine/statistiques.ts'
import { FORME_TIRAGE, tirer, type PartieEnvoyee } from './domaine/chiffres.ts'
import { resume, type PartieTransmise } from './domaine/transmission.ts'

export const CLE = 'francle.parties-du-jour.v1'

export interface PartieSauvee {
  readonly regions: readonly string[]
  readonly etat: Etat
  // les modes difficiles fixés au premier essai (absents des sauvegardes d'avant web.4 : aucun mode)
  readonly modes?: ModesDifficiles
  // le bonus des départements, une fois commencé (absent avant web.7, ou tant qu'il n'a pas commencé)
  readonly bonus?: BonusSauve
  // depuis web.9.2.2, pour l'envoi au serveur des chiffres de tous : le numéro tiré au hasard pour cette partie
  // (domaine/chiffres.ts), et l'empreinte de ce qui a été envoyé la dernière fois (voir empreinte() plus bas). Deux
  // champs facultatifs de plus : l'ancien code les ignore et les garde (il recopie la partie sauvée avant de la
  // compléter), la clé « v1 » reste donc lisible par les deux versions
  readonly tirage?: string
  readonly envoyee?: string
  // depuis web.9.3.1 : ce qui a été envoyé au profil du joueur, « <id du profil>:<empreinte> ». L'id du profil y est,
  // pour qu'un nouveau profil (après une suppression) reçoive à nouveau tout l'historique
  readonly envoyeeProfil?: string
}

export interface BonusSauve {
  // depuis web.7.6 : [numéro du département demandé (choisi en mode C), numéro du département donné], dans l'ordre
  // des réponses
  readonly paires?: readonly (readonly [string, string])[]
  // web.7 : les numéros des départements donnés, dans l'ordre du jour (absent depuis web.7.6)
  readonly reponses?: readonly string[]
  readonly etat: EtatBonus
  // depuis web.7.14 : la version difficile (absente avant : difficile, voir en haut du fichier)
  readonly difficile?: boolean
}

// toutes les parties sauvées : numéro du jour -> partie. Une sauvegarde illisible (modifiée à la main, d'un autre
// format…) est ignorée plutôt que de bloquer le jeu
export function lire(stockage: Storage = localStorage): Map<number, PartieSauvee> {
  const parties = new Map<number, PartieSauvee>()
  try {
    const texte = stockage.getItem(CLE)
    const objet: unknown = texte === null ? {} : JSON.parse(texte)
    for (const [numero, partie] of Object.entries(objet as Record<string, unknown>)) {
      if (estPartieSauvee(partie)) {
        parties.set(Number(numero), partie)
      }
    }
  } catch {
    // localStorage refusé (navigation privée sur certains navigateurs) ou JSON invalide : on repart de rien
  }
  return parties
}

// vérifie la forme d'une valeur lue : JSON.parse renvoie n'importe quoi, TypeScript ne peut rien garantir.
// « valeur is PartieSauvee » : si la fonction renvoie true, TypeScript sait ensuite que c'en est une
function estPartieSauvee(valeur: unknown): valeur is PartieSauvee {
  const partie = valeur as PartieSauvee
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    Array.isArray(partie.regions) &&
    partie.regions.every((id) => typeof id === 'string') &&
    ['en-cours', 'gagnee', 'perdue', 'abandonnee'].includes(partie.etat) &&
    (partie.modes === undefined ||
      (typeof partie.modes === 'object' &&
        partie.modes !== null &&
        typeof partie.modes.rotation === 'boolean' &&
        typeof partie.modes.cachee === 'boolean')) &&
    (partie.bonus === undefined || estBonusSauve(partie.bonus))
  )
}

function estBonusSauve(valeur: unknown): valeur is BonusSauve {
  const bonus = valeur as BonusSauve
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    // l'un des deux formats de réponses (voir en haut du fichier)
    (estListeDeCodes(bonus.reponses) ||
      (Array.isArray(bonus.paires) &&
        bonus.paires.every((paire) => Array.isArray(paire) && paire.length === 2 && estListeDeCodes(paire)))) &&
    ['en-cours', 'termine', 'passe'].includes(bonus.etat) &&
    (bonus.difficile === undefined || typeof bonus.difficile === 'boolean')
  )
}

function estListeDeCodes(valeur: unknown): valeur is string[] {
  return Array.isArray(valeur) && valeur.every((code) => typeof code === 'string')
}

export function enregistrer(
  numero: number,
  partie: Partie,
  modes: ModesDifficiles = SANS_MODE,
  stockage: Storage = localStorage,
): void {
  const parties = lire(stockage)
  // ...parties.get(numero) : on garde ce qui était déjà sauvé de ce jour (le bonus), on remplace le reste
  parties.set(numero, {
    ...parties.get(numero),
    regions: partie.essais.map((essai) => essai.region.id),
    etat: partie.etat,
    modes,
  })
  ecrire(parties, stockage)
}

// sauve le bonus du jour, après chaque réponse. Un bonus pas encore commencé n'est pas sauvé
export function enregistrerBonus(numero: number, bonus: Bonus, stockage: Storage = localStorage): void {
  const parties = lire(stockage)
  const partie = parties.get(numero)
  if (partie === undefined || !commence(bonus)) {
    return
  }
  parties.set(numero, {
    ...partie,
    bonus: {
      paires: bonus.tentatives.map((tentative) => [tentative.demande.code, tentative.donne.code] as const),
      etat: bonus.etat,
      difficile: bonus.difficile,
    },
  })
  ecrire(parties, stockage)
}

function ecrire(parties: ReadonlyMap<number, PartieSauvee>, stockage: Storage): void {
  try {
    // Object.fromEntries : Map -> objet, car JSON ne sait pas écrire une Map
    stockage.setItem(CLE, JSON.stringify(Object.fromEntries(parties)))
  } catch {
    // stockage plein ou refusé : le joueur peut quand même jouer, sa partie ne sera simplement pas retrouvée
  }
}

// reconstruit la partie sauvée en rejouant ses propositions
export function restaurer(sauvee: PartieSauvee, cible: Region, mode: Mode): Partie {
  let partie = nouvellePartie(cible, mode)
  for (const id of sauvee.regions) {
    if (!enCours(partie)) {
      break
    }
    try {
      partie = proposer(partie, parId(id).nom.fr) ?? partie
    } catch {
      // une région disparue du jeu : on ignore cette proposition
    }
  }
  if (sauvee.etat === 'abandonnee' && enCours(partie)) {
    partie = abandonner(partie)
  }
  return partie
}

// reconstruit le bonus sauvé de la partie n° numero, en rejouant ses réponses ; undefined s'il n'a pas commencé
export function restaurerBonus(numero: number, sauvee: PartieSauvee | undefined): Bonus | undefined {
  if (sauvee?.bonus === undefined) {
    return undefined
  }
  const { paires, reponses, difficile = true } = sauvee.bonus
  const neuf = avecDifficulte(bonusDuJour(regionDuNumero(numero), numero), difficile)
  const bonus = paires !== undefined ? rejouerPaires(neuf, paires) : rejouer(neuf, reponses ?? [])
  if (!commence(bonus)) {
    return undefined
  }
  return sauvee.bonus.etat === 'passe' && bonusEnCours(bonus) ? passer(bonus) : bonus
}

// les modes d'une partie sauvée (aucun pour les sauvegardes d'avant web.4)
export function modesSauves(sauvee: PartieSauvee): ModesDifficiles {
  return sauvee.modes ?? SANS_MODE
}

// les parties sauvées, dans le format transmis (domaine/transmission.ts), dans l'ordre des jours. Le bonus sauvé dans
// l'ancien format (web.7, « reponses ») est rejoué pour retrouver ses paires : le format transmis n'en a qu'un
export function transmises(parties: ReadonlyMap<number, PartieSauvee>): PartieTransmise[] {
  return [...parties]
    .sort(([a], [b]) => a - b)
    .map(([jour, partie]): PartieTransmise => {
      const transmise = { jour, regions: partie.regions, etat: partie.etat, modes: modesSauves(partie) }
      const bonus = restaurerBonus(jour, partie)
      if (bonus === undefined) {
        return transmise
      }
      const paires = bonus.tentatives.map((tentative) => [tentative.demande.code, tentative.donne.code] as const)
      return { ...transmise, bonus: { paires, etat: bonus.etat, difficile: bonus.difficile } }
    })
}

// les résultats de toutes les parties sauvées, pour les statistiques et le score. Depuis web.9.1, ils passent par le
// format transmis et son résumé : les statistiques du joueur et celles qu'il envoie (lien, puis serveur) se calculent
// par le même chemin, et ne peuvent pas différer. Le bonus ne compte qu'une fois fini
export function resultats(parties: ReadonlyMap<number, PartieSauvee>): Map<number, Resultat> {
  return new Map(transmises(parties).map((partie): [number, Resultat] => [partie.jour, resume(partie)]))
}

// l'empreinte d'une partie transmise : ce qui change quand elle avance (son état, ses essais, son bonus). Une partie ne
// fait qu'avancer (on ajoute un essai, une réponse ; on ne retire rien) : deux empreintes égales, c'est la même partie,
// inutile de la renvoyer. Plus court que la partie entière, que l'on n'a pas besoin de recopier
export function empreinte(partie: PartieTransmise): string {
  return [partie.etat, partie.regions.length, partie.bonus?.etat ?? '-', partie.bonus?.paires.length ?? 0].join('.')
}

// les parties finies à envoyer au serveur : jamais envoyées, ou changées depuis (le bonus fini après la victoire).
// Une partie qui n'a pas encore de tirage en reçoit un, gardé avec elle (les parties d'avant web.9.2 aussi : c'est
// ainsi que tout l'historique part une fois, décision 5)
export function aEnvoyer(stockage: Storage = localStorage): PartieEnvoyee[] {
  const parties = lire(stockage)
  let tiree = false
  for (const [jour, partie] of parties) {
    // un tirage abîmé (sauvegarde modifiée à la main) est retiré au sort : le serveur refuserait tout l'envoi qui le
    // contient, et plus rien ne partirait
    if (partie.etat !== 'en-cours' && !(typeof partie.tirage === 'string' && FORME_TIRAGE.test(partie.tirage))) {
      parties.set(jour, { ...partie, tirage: tirer() })
      tiree = true
    }
  }
  if (tiree) {
    ecrire(parties, stockage)
  }
  return transmises(parties).flatMap((transmise) => {
    const sauvee = parties.get(transmise.jour)
    return transmise.etat !== 'en-cours' && sauvee?.tirage !== undefined && sauvee.envoyee !== empreinte(transmise)
      ? [{ ...transmise, tirage: sauvee.tirage }]
      : []
  })
}

// note que ces parties ont été reçues par le serveur. On relit la sauvegarde d'abord : pendant l'envoi, le joueur a pu
// avancer (une réponse du bonus) ; on note l'empreinte de ce qui est PARTI, et la partie avancée repartira
export function marquerEnvoyees(envoyees: readonly PartieEnvoyee[], stockage: Storage = localStorage): void {
  const parties = lire(stockage)
  for (const envoyee of envoyees) {
    const partie = parties.get(envoyee.jour)
    if (partie?.tirage === envoyee.tirage) {
      parties.set(envoyee.jour, { ...partie, envoyee: empreinte(envoyee) })
    }
  }
  ecrire(parties, stockage)
}

// vrai si la partie du jour n° jour, telle qu'elle est maintenant, a été reçue par le serveur : elle est alors déjà
// comptée dans les chiffres de tous
export function estEnvoyee(jour: number, stockage: Storage = localStorage): boolean {
  const parties = lire(stockage)
  const transmise = transmises(parties).find((partie) => partie.jour === jour)
  return transmise !== undefined && parties.get(jour)?.envoyee === empreinte(transmise)
}

// les parties finies à envoyer au profil n° profil : jamais envoyées à ce profil, ou changées depuis. Tout l'historique
// part ainsi au premier envoi (décision 5 du 14 novembre : les parties déjà jouées comptent partout)
export function aEnvoyerAuProfil(profil: string, stockage: Storage = localStorage): PartieTransmise[] {
  const parties = lire(stockage)
  return transmises(parties).filter(
    (transmise) =>
      transmise.etat !== 'en-cours' && parties.get(transmise.jour)?.envoyeeProfil !== marque(profil, transmise),
  )
}

// note que ces parties ont été reçues par le profil n° profil (comme marquerEnvoyees, pour les parties anonymes)
export function marquerEnvoyeesAuProfil(
  profil: string,
  envoyees: readonly PartieTransmise[],
  stockage: Storage = localStorage,
): void {
  const parties = lire(stockage)
  for (const envoyee of envoyees) {
    const partie = parties.get(envoyee.jour)
    if (partie !== undefined) {
      parties.set(envoyee.jour, { ...partie, envoyeeProfil: marque(profil, envoyee) })
    }
  }
  ecrire(parties, stockage)
}

// ce qu'on note d'une partie envoyée au profil n° profil
function marque(profil: string, partie: PartieTransmise): string {
  return `${profil}:${empreinte(partie)}`
}
