/*
La sauvegarde des parties du jour dans le navigateur (localStorage), pour retrouver sa partie en revenant sur la page
et calculer les statistiques. Il n'y a pas de serveur : tout reste sur l'appareil du joueur.

localStorage est un petit dictionnaire texte -> texte, propre au site, qui survit à la fermeture de la page (un peu
comme java.util.prefs.Preferences). On y range un seul texte JSON, sous une clé qui porte un numéro de version : si
le format change un jour, une nouvelle clé évitera de lire de travers les anciennes sauvegardes.

Ce qu'on garde de chaque partie : les régions proposées (leurs identifiants) et son état. Pas les distances ni les
pourcentages : on rejoue les propositions avec proposer(), qui les recalcule. Si une règle change, les anciennes
parties se rejouent avec la nouvelle règle, sans sauvegarde à convertir.
 */
import { abandonner, enCours, nouvellePartie, proposer, type Etat, type Partie } from './domaine/partie.ts'
import { parId, type Mode, type Region } from './domaine/regions.ts'
import type { Resultat } from './domaine/statistiques.ts'

export const CLE = 'francle.parties-du-jour.v1'

export interface PartieSauvee {
  readonly regions: readonly string[]
  readonly etat: Etat
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
    ['en-cours', 'gagnee', 'perdue', 'abandonnee'].includes(partie.etat)
  )
}

export function enregistrer(numero: number, partie: Partie, stockage: Storage = localStorage): void {
  const parties = lire(stockage)
  parties.set(numero, { regions: partie.essais.map((essai) => essai.region.id), etat: partie.etat })
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

// les résultats de toutes les parties sauvées, pour les statistiques
export function resultats(parties: ReadonlyMap<number, PartieSauvee>): Map<number, Resultat> {
  return new Map([...parties].map(([numero, partie]) => [numero, { etat: partie.etat, essais: partie.regions.length }]))
}
