/*
La sauvegarde des parties du jour dans le navigateur (localStorage), pour retrouver sa partie en revenant sur la page
et calculer les statistiques. Il n'y a pas de serveur : tout reste sur l'appareil du joueur.

localStorage est un petit dictionnaire texte -> texte, propre au site, qui survit à la fermeture de la page (un peu
comme java.util.prefs.Preferences). On y range un seul texte JSON, sous une clé qui porte un numéro de version : si
le format change un jour, une nouvelle clé évitera de lire de travers les anciennes sauvegardes.

Ce qu'on garde de chaque partie : les régions proposées (leurs identifiants) et son état. Pas les distances ni les
pourcentages : on rejoue les propositions avec proposer(), qui les recalcule. Si une règle change, les anciennes
parties se rejouent avec la nouvelle règle, sans sauvegarde à convertir.

De même pour le bonus des départements (depuis web.7) : les numéros donnés et son état, rejoués avec rejouer(). Le
champ est facultatif : les sauvegardes d'avant web.7 restent lisibles, sans nouvelle clé « v2 ». Seul un bonus
commencé (au moins une réponse) est sauvé : passé avant toute réponse, il n'a pas commencé et reste à jouer.
 */
import {
  bonusDuJour,
  bonusEnCours,
  commence,
  passer,
  rejouer,
  score,
  total,
  type Bonus,
  type EtatBonus,
} from './domaine/bonus.ts'
import { abandonner, enCours, nouvellePartie, proposer, type Etat, type Partie } from './domaine/partie.ts'
import { SANS_MODE, type ModesDifficiles } from './domaine/partage.ts'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import { parId, type Mode, type Region } from './domaine/regions.ts'
import type { Resultat } from './domaine/statistiques.ts'

export const CLE = 'francle.parties-du-jour.v1'

export interface PartieSauvee {
  readonly regions: readonly string[]
  readonly etat: Etat
  // les modes difficiles fixés au premier essai (absents des sauvegardes d'avant web.4 : aucun mode)
  readonly modes?: ModesDifficiles
  // le bonus des départements, une fois commencé (absent avant web.7, ou tant qu'il n'a pas commencé)
  readonly bonus?: BonusSauve
}

export interface BonusSauve {
  // les numéros des départements donnés, dans l'ordre des réponses
  readonly reponses: readonly string[]
  readonly etat: EtatBonus
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
    Array.isArray(bonus.reponses) &&
    bonus.reponses.every((code) => typeof code === 'string') &&
    ['en-cours', 'termine', 'passe'].includes(bonus.etat)
  )
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
    bonus: { reponses: bonus.tentatives.map((tentative) => tentative.donne.code), etat: bonus.etat },
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
  const bonus = rejouer(bonusDuJour(regionDuNumero(numero), numero), sauvee.bonus.reponses)
  if (!commence(bonus)) {
    return undefined
  }
  return sauvee.bonus.etat === 'passe' && bonusEnCours(bonus) ? passer(bonus) : bonus
}

// les modes d'une partie sauvée (aucun pour les sauvegardes d'avant web.4)
export function modesSauves(sauvee: PartieSauvee): ModesDifficiles {
  return sauvee.modes ?? SANS_MODE
}

// les résultats de toutes les parties sauvées, pour les statistiques. Le bonus ne compte qu'une fois fini
export function resultats(parties: ReadonlyMap<number, PartieSauvee>): Map<number, Resultat> {
  return new Map(
    [...parties].map(([numero, partie]): [number, Resultat] => {
      const resultat: Resultat = { etat: partie.etat, essais: partie.regions.length }
      const bonus = restaurerBonus(numero, partie)
      if (bonus === undefined || bonusEnCours(bonus)) {
        return [numero, resultat]
      }
      return [numero, { ...resultat, bonus: { score: score(bonus), total: total(bonus) } }]
    }),
  )
}
