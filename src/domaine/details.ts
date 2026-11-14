/*
Les statistiques détaillées (web.9.1.2), à côté de celles de statistiques.ts : les essais moyens, les records, les
régions les mieux et les moins bien trouvées, les parties dans chaque mode difficile. Comme les autres, elles sont
recalculées à partir de l'historique à chaque fois, sans compteur tenu à part.

Seules les parties finies comptent : une partie en cours n'est encore ni trouvée ni manquée.
 */
import { regionDuNumero } from './regionDuJour.ts'
import type { Region } from './regions.ts'
import { cumulsParMois, points, POINTS_MAX } from './score.ts'
import type { Resultat } from './statistiques.ts'

// le bilan d'une région : combien de fois elle a été la région du jour (parties finies), combien de fois elle a été
// trouvée, et en combien d'essais en moyenne quand elle l'a été
export interface BilanRegion {
  readonly region: Region
  readonly parties: number
  readonly victoires: number
  // undefined si elle n'a jamais été trouvée
  readonly essaisMoyens?: number
}

// les parties jouées et gagnées dans un mode difficile
export interface BilanMode {
  readonly jouees: number
  readonly victoires: number
}

export interface Details {
  // le nombre moyen d'essais des victoires, au dixième (undefined sans victoire)
  readonly essaisMoyens?: number
  // le mois au plus de points (voir moisDuNumero), le plus ancien en cas d'égalité ; undefined sans partie finie
  readonly meilleurMois?: { readonly mois: number; readonly points: number }
  // les parties à 10 points
  readonly journeesParfaites: number
  // les trois régions les mieux trouvées, puis les trois les moins bien (sans reprendre les premières : avec quatre
  // régions jouées, la seconde liste n'en a qu'une)
  readonly mieuxTrouvees: readonly BilanRegion[]
  readonly moinsBienTrouvees: readonly BilanRegion[]
  readonly rotation: BilanMode
  readonly cachee: BilanMode
}

export const REGIONS_AFFICHEES = 3

const auDixieme = (valeur: number) => Math.round(valeur * 10) / 10

export function details(historique: ReadonlyMap<number, Resultat>): Details {
  const finies = [...historique].filter(([, resultat]) => resultat.etat !== 'en-cours')
  const victoires = finies.filter(([, resultat]) => resultat.etat === 'gagnee')
  const regions = bilansRegions(finies)
  const mieux = regions.slice(0, REGIONS_AFFICHEES)
  const moinsBien = regions.slice(REGIONS_AFFICHEES).reverse().slice(0, REGIONS_AFFICHEES)
  return {
    essaisMoyens:
      victoires.length === 0
        ? undefined
        : auDixieme(victoires.reduce((somme, [, resultat]) => somme + resultat.essais, 0) / victoires.length),
    meilleurMois: meilleurMois(historique),
    journeesParfaites: finies.filter(([, resultat]) => points(resultat) === POINTS_MAX).length,
    mieuxTrouvees: mieux,
    moinsBienTrouvees: moinsBien,
    rotation: bilanMode(finies.map(([, resultat]) => resultat).filter((resultat) => resultat.modes?.rotation)),
    cachee: bilanMode(finies.map(([, resultat]) => resultat).filter((resultat) => resultat.modes?.cachee)),
  }
}

function meilleurMois(historique: ReadonlyMap<number, Resultat>): Details['meilleurMois'] {
  let meilleur: Details['meilleurMois']
  // les mois dans l'ordre : à égalité, le premier atteint reste (« > » et non « >= »)
  for (const [mois, cumul] of [...cumulsParMois(historique)].sort(([a], [b]) => a - b)) {
    if (meilleur === undefined || cumul.points > meilleur.points) {
      meilleur = { mois, points: cumul.points }
    }
  }
  return meilleur
}

function bilanMode(resultats: readonly Resultat[]): BilanMode {
  return { jouees: resultats.length, victoires: resultats.filter((resultat) => resultat.etat === 'gagnee').length }
}

// les régions jouées, de la mieux trouvée à la moins bien : le taux de victoire d'abord, puis les essais moyens (moins,
// c'est mieux), puis le nombre de parties (une région trouvée 3 fois sur 3 passe devant une trouvée 1 fois sur 1),
// puis le nom, pour un ordre qui ne dépend pas du hasard
function bilansRegions(finies: readonly (readonly [number, Resultat])[]): BilanRegion[] {
  const parRegion = new Map<Region, Resultat[]>()
  for (const [jour, resultat] of finies) {
    const region = regionDuNumero(jour)
    parRegion.set(region, [...(parRegion.get(region) ?? []), resultat])
  }
  const bilans = [...parRegion].map(([region, resultats]): BilanRegion => {
    const gagnees = resultats.filter((resultat) => resultat.etat === 'gagnee')
    return {
      region,
      parties: resultats.length,
      victoires: gagnees.length,
      essaisMoyens:
        gagnees.length === 0
          ? undefined
          : auDixieme(gagnees.reduce((somme, resultat) => somme + resultat.essais, 0) / gagnees.length),
    }
  })
  return bilans.sort(
    (a, b) =>
      // a.victoires / a.parties > b.victoires / b.parties, sans division
      b.victoires * a.parties - a.victoires * b.parties ||
      (a.essaisMoyens ?? Infinity) - (b.essaisMoyens ?? Infinity) ||
      b.parties - a.parties ||
      a.region.id.localeCompare(b.region.id),
  )
}
