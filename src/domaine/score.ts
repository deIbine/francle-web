/*
Le score Francle : des points par partie du jour, 10 au plus (décisions 2 et 3 de web.9, bornes fixées à web.9.1).

    victoire en n essais     7 − n        (1 essai : 6 points … 6 essais : 1 point)
    bonus des départements   0, 1 ou 2    (moins de 25 % trouvés : 0 ; de 25 % à 75 % inclus : 1 ; plus : 2)
    🌀 silhouette tournée     +1
    🙈 silhouette cachée      +1
    défaite ou abandon       0, et rien d'autre (le bonus n'existe qu'après une victoire, les modes ne comptent
                             qu'en cas de victoire)

Écrite une seule fois, ici, et reprise partout : la fenêtre des statistiques, le lien de comparaison, puis les
chiffres de tous (web.9.2) et les classements (web.9.3). Deux écrans ne peuvent donc jamais montrer deux scores
différents pour la même partie.

Les bornes sont comparées en nombres entiers (4 × trouvés < total), et non en pourcentages : 1 sur 3 donnerait
33,333… %, et une comparaison de nombres à virgule peut se tromper d'un cheveu sur une borne.
 */
import { moisDuNumero } from './regionDuJour.ts'
import type { Resultat, ScoreBonus } from './statistiques.ts'

export const POINTS_MAX = 10

// les points du bonus des départements fini (aucun s'il n'est pas fini, ou pas joué)
export function pointsBonus(bonus: ScoreBonus | undefined): number {
  if (bonus === undefined || bonus.total === 0) {
    return 0
  }
  // moins d'un quart : score / total < 1/4, c'est-à-dire 4 × score < total
  if (4 * bonus.score < bonus.total) {
    return 0
  }
  // jusqu'aux trois quarts inclus : score / total ≤ 3/4, c'est-à-dire 4 × score ≤ 3 × total
  return 4 * bonus.score <= 3 * bonus.total ? 1 : 2
}

// les points d'une partie : 0 si elle n'est pas gagnée (en cours, perdue, abandonnée)
export function points(resultat: Resultat): number {
  if (resultat.etat !== 'gagnee') {
    return 0
  }
  const modes = (resultat.modes?.rotation ? 1 : 0) + (resultat.modes?.cachee ? 1 : 0)
  return 7 - resultat.essais + pointsBonus(resultat.bonus) + modes
}

// les points d'un ensemble de parties finies : leur nombre, le total, et la moyenne par partie (arrondie au dixième,
// 0 sans partie)
export interface Cumul {
  readonly parties: number
  readonly points: number
  readonly moyenne: number
}

const AUCUN: Cumul = { parties: 0, points: 0, moyenne: 0 }

// le cumul des parties finies de l'historique (numéro du jour -> résultat) qui passent le filtre. Une partie en cours
// ne compte pas encore : ni dans le total, ni dans le nombre de parties qui divise la moyenne
export function cumul(
  historique: ReadonlyMap<number, Resultat>,
  filtre: (numeroDuJour: number) => boolean = () => true,
): Cumul {
  const finies = [...historique].filter(([jour, resultat]) => resultat.etat !== 'en-cours' && filtre(jour))
  if (finies.length === 0) {
    return AUCUN
  }
  const total = finies.reduce((somme, [, resultat]) => somme + points(resultat), 0)
  return { parties: finies.length, points: total, moyenne: Math.round((total * 10) / finies.length) / 10 }
}

// le cumul du mois de la partie n° numeroDuJour (le mois en cours, si c'est aujourd'hui)
export function cumulDuMois(historique: ReadonlyMap<number, Resultat>, numeroDuJour: number): Cumul {
  const mois = moisDuNumero(numeroDuJour)
  return cumul(historique, (jour) => moisDuNumero(jour) === mois)
}

// le cumul de chaque mois où au moins une partie est finie : mois (voir moisDuNumero) -> cumul
export function cumulsParMois(historique: ReadonlyMap<number, Resultat>): Map<number, Cumul> {
  const mois = new Set(
    [...historique].filter(([, resultat]) => resultat.etat !== 'en-cours').map(([jour]) => moisDuNumero(jour)),
  )
  return new Map([...mois].map((m) => [m, cumul(historique, (jour) => moisDuNumero(jour) === m)]))
}
