import { describe, expect, it } from 'vitest'
import type { Etat } from './partie.ts'
import { statistiques, type Resultat } from './statistiques.ts'

// un historique écrit en abrégé : { 3: 'g4' } = la partie n° 3 gagnée en 4 essais ; 'p' perdue, 'a' abandonnée,
// 'c' en cours
function historique(parties: Record<number, string>): Map<number, Resultat> {
  const etats: Record<string, Etat> = { g: 'gagnee', p: 'perdue', a: 'abandonnee', c: 'en-cours' }
  return new Map(
    Object.entries(parties).map(([numero, code]) => [
      Number(numero),
      { etat: etats[code[0]], essais: code[0] === 'g' ? Number(code.slice(1)) : 6 },
    ]),
  )
}

describe('Les statistiques', () => {
  it('sans aucune partie, tout est à zéro', () => {
    expect(statistiques(new Map(), 10)).toEqual({
      jouees: 0,
      victoires: 0,
      pourcentage: 0,
      serie: 0,
      meilleureSerie: 0,
      repartition: [0, 0, 0, 0, 0, 0],
      bonusJoues: 0,
      scoreMoyenBonus: 0,
    })
  })

  it('le bonus : le nombre de bonus finis et la moyenne de leurs pourcentages', () => {
    const avecBonus = new Map<number, Resultat>([
      [1, { etat: 'gagnee', essais: 2, bonus: { score: 2, total: 2 } }],
      [2, { etat: 'gagnee', essais: 3, bonus: { score: 1, total: 4 } }],
      [3, { etat: 'gagnee', essais: 1 }],
      [4, { etat: 'perdue', essais: 6 }],
    ])
    const stats = statistiques(avecBonus, 4)
    expect(stats.bonusJoues).toBe(2)
    // (100 % + 25 %) / 2 = 62,5 %, arrondi
    expect(stats.scoreMoyenBonus).toBe(63)
  })

  it('compte les parties, les victoires et leur répartition par nombre d’essais', () => {
    const stats = statistiques(historique({ 1: 'g3', 2: 'g3', 3: 'p', 4: 'g1', 5: 'a', 6: 'g6' }), 6)
    expect(stats.jouees).toBe(6)
    expect(stats.victoires).toBe(4)
    expect(stats.pourcentage).toBe(67) // 4 / 6 = 66,7 %, arrondi
    expect(stats.repartition).toEqual([1, 0, 2, 0, 0, 1])
  })

  it('une partie en cours ne compte pas encore', () => {
    const stats = statistiques(historique({ 1: 'g2', 2: 'c' }), 2)
    expect(stats.jouees).toBe(1)
    expect(stats.pourcentage).toBe(100)
  })

  it('la série compte les victoires des jours consécutifs, jusqu’à aujourd’hui', () => {
    expect(statistiques(historique({ 1: 'g2', 2: 'g3', 3: 'g1' }), 3).serie).toBe(3)
  })

  it('la partie du jour pas encore finie (ou pas commencée) ne casse pas la série d’hier', () => {
    expect(statistiques(historique({ 1: 'g2', 2: 'g3', 3: 'c' }), 3).serie).toBe(2)
    expect(statistiques(historique({ 1: 'g2', 2: 'g3' }), 3).serie).toBe(2)
  })

  it('une défaite ou un abandon remet la série à zéro', () => {
    expect(statistiques(historique({ 1: 'g2', 2: 'g3', 3: 'p' }), 3).serie).toBe(0)
    expect(statistiques(historique({ 1: 'g2', 2: 'a', 3: 'g4' }), 3).serie).toBe(1)
  })

  it('un jour sauté remet la série à zéro', () => {
    // rien le jour 3 : la série d'aujourd'hui ne compte que les jours 4 et 5
    expect(statistiques(historique({ 1: 'g2', 2: 'g3', 4: 'g1', 5: 'g1' }), 5).serie).toBe(2)
    // et si le joueur n'a pas joué hier, la série en cours est perdue, même sans défaite
    expect(statistiques(historique({ 1: 'g2', 2: 'g3' }), 4).serie).toBe(0)
  })

  it('la meilleure série est la plus longue suite de jours gagnés, où qu’elle soit', () => {
    const stats = statistiques(historique({ 1: 'g1', 2: 'g1', 3: 'g1', 4: 'p', 5: 'g1', 7: 'g1', 8: 'g1' }), 8)
    expect(stats.meilleureSerie).toBe(3)
    expect(stats.serie).toBe(2)
  })
})
