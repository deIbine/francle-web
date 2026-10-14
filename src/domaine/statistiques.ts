/*
Les statistiques du joueur, calculées à partir de l'historique de ses parties du jour.

On ne tient pas de compteurs à part (« parties jouées += 1 ») : on recompte tout à partir de l'historique à chaque
fois. Les statistiques ne peuvent donc jamais être fausses par rapport aux parties : elles en sont déduites.
 */
import { ESSAIS_MAX, type Etat } from './partie.ts'

// ce qu'il faut savoir d'une partie pour les statistiques
export interface Resultat {
  readonly etat: Etat
  readonly essais: number
}

export interface Statistiques {
  readonly jouees: number
  readonly victoires: number
  // pourcentage de victoires, arrondi (0 si aucune partie)
  readonly pourcentage: number
  readonly serie: number
  readonly meilleureSerie: number
  // repartition[n - 1] : le nombre de victoires en n essais, de 1 à 6
  readonly repartition: readonly number[]
}

// historique : le numéro de chaque partie du jour -> son résultat. aujourdhui : le numéro du jour
export function statistiques(historique: ReadonlyMap<number, Resultat>, aujourdhui: number): Statistiques {
  const repartition: number[] = Array.from({ length: ESSAIS_MAX }, () => 0)
  let jouees = 0
  let victoires = 0
  // les parties en cours ne comptent pas encore : ni victoire, ni défaite
  const terminees = [...historique].filter(([, resultat]) => resultat.etat !== 'en-cours')
  for (const [, resultat] of terminees) {
    jouees++
    if (resultat.etat === 'gagnee') {
      victoires++
      repartition[resultat.essais - 1]++
    }
  }
  return {
    jouees,
    victoires,
    pourcentage: jouees === 0 ? 0 : Math.round((victoires * 100) / jouees),
    serie: serieEnCours(historique, aujourdhui),
    meilleureSerie: meilleureSerie(historique),
    repartition,
  }
}

const gagnee = (historique: ReadonlyMap<number, Resultat>, jour: number) => historique.get(jour)?.etat === 'gagnee'

// la série en cours : les victoires des jours consécutifs qui finissent aujourd'hui, ou hier si la partie
// d'aujourd'hui n'est pas encore finie (elle peut encore prolonger la série). Un jour sauté la remet à zéro
function serieEnCours(historique: ReadonlyMap<number, Resultat>, aujourdhui: number): number {
  const auj = historique.get(aujourdhui)
  let jour = auj === undefined || auj.etat === 'en-cours' ? aujourdhui - 1 : aujourdhui
  let serie = 0
  while (gagnee(historique, jour)) {
    serie++
    jour--
  }
  return serie
}

// la plus longue suite de jours consécutifs gagnés
function meilleureSerie(historique: ReadonlyMap<number, Resultat>): number {
  let meilleure = 0
  for (const jour of historique.keys()) {
    // on ne compte qu'à partir du premier jour d'une série (la veille n'est pas gagnée), pour ne pas recompter
    // chaque série autant de fois qu'elle a de jours
    if (gagnee(historique, jour) && !gagnee(historique, jour - 1)) {
      let longueur = 0
      while (gagnee(historique, jour + longueur)) {
        longueur++
      }
      meilleure = Math.max(meilleure, longueur)
    }
  }
  return meilleure
}
