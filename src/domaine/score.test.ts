import { describe, expect, it } from 'vitest'
import { dateDuNumero, moisDuNumero, numero } from './regionDuJour.ts'
import { cumul, cumulDuMois, cumulsParMois, points, pointsBonus, POINTS_MAX } from './score.ts'
import type { Resultat } from './statistiques.ts'

const TOUS_LES_MODES = { rotation: true, cachee: true }

describe('Les points du bonus', () => {
  it('rien sans bonus fini', () => {
    expect(pointsBonus(undefined)).toBe(0)
  })

  it('moins d’un quart : 0 ; d’un quart aux trois quarts inclus : 1 ; au-delà : 2', () => {
    // les bornes exactes, sur l'Occitanie (13) et la Bretagne (4)
    expect(pointsBonus({ score: 3, total: 13 })).toBe(0) // 23 %
    expect(pointsBonus({ score: 4, total: 13 })).toBe(1) // 30,8 %
    expect(pointsBonus({ score: 1, total: 4 })).toBe(1) // 25 % tout juste : 1
    expect(pointsBonus({ score: 3, total: 4 })).toBe(1) // 75 % tout juste : 1
    expect(pointsBonus({ score: 4, total: 4 })).toBe(2)
    expect(pointsBonus({ score: 10, total: 13 })).toBe(2) // 76,9 %
    expect(pointsBonus({ score: 0, total: 4 })).toBe(0)
  })

  it('la Corse pèse autant que l’Occitanie', () => {
    expect(pointsBonus({ score: 1, total: 2 })).toBe(1)
    expect(pointsBonus({ score: 2, total: 2 })).toBe(2)
  })
})

describe('Les points d’une partie', () => {
  it('victoire en n essais : 7 − n', () => {
    for (let essais = 1; essais <= 6; essais++) {
      expect(points({ etat: 'gagnee', essais })).toBe(7 - essais)
    }
  })

  it('défaite, abandon et partie en cours : 0, même avec les modes', () => {
    expect(points({ etat: 'perdue', essais: 6, modes: TOUS_LES_MODES })).toBe(0)
    expect(points({ etat: 'abandonnee', essais: 2, modes: TOUS_LES_MODES })).toBe(0)
    expect(points({ etat: 'en-cours', essais: 1, modes: TOUS_LES_MODES })).toBe(0)
  })

  it('+1 par mode difficile, et le bonus en plus', () => {
    expect(points({ etat: 'gagnee', essais: 3, modes: { rotation: true, cachee: false } })).toBe(5)
    expect(points({ etat: 'gagnee', essais: 3, modes: TOUS_LES_MODES })).toBe(6)
    expect(points({ etat: 'gagnee', essais: 3, bonus: { score: 2, total: 4 } })).toBe(5)
  })

  it('10 points au plus : trouvée du premier coup, les deux modes, tout le bonus', () => {
    expect(points({ etat: 'gagnee', essais: 1, modes: TOUS_LES_MODES, bonus: { score: 5, total: 5 } })).toBe(
      POINTS_MAX,
    )
  })
})

describe('Les cumuls', () => {
  // le 1er novembre 2026 est la partie n° 20 (le n° 1 est le 13 octobre)
  const PREMIER_NOVEMBRE = 20
  const historique = new Map<number, Resultat>([
    [PREMIER_NOVEMBRE - 1, { etat: 'gagnee', essais: 1 }], // 31 octobre : 6 points
    [PREMIER_NOVEMBRE, { etat: 'gagnee', essais: 2 }], // 5 points
    [PREMIER_NOVEMBRE + 1, { etat: 'perdue', essais: 6 }], // 0 point
    [PREMIER_NOVEMBRE + 2, { etat: 'gagnee', essais: 6 }], // 1 point
    [PREMIER_NOVEMBRE + 3, { etat: 'en-cours', essais: 2 }], // ne compte pas encore
  ])

  it('le total, le nombre de parties finies et la moyenne au dixième', () => {
    expect(cumul(historique)).toEqual({ parties: 4, points: 12, moyenne: 3 })
    expect(cumul(new Map())).toEqual({ parties: 0, points: 0, moyenne: 0 })
  })

  it('le mois : il repart de zéro le 1er', () => {
    // 6 points sur 3 parties : 2
    expect(cumulDuMois(historique, PREMIER_NOVEMBRE + 3)).toEqual({ parties: 3, points: 6, moyenne: 2 })
    expect(cumulDuMois(historique, PREMIER_NOVEMBRE - 1)).toEqual({ parties: 1, points: 6, moyenne: 6 })
  })

  it('la moyenne s’arrondit au dixième', () => {
    const trois = new Map<number, Resultat>([
      [1, { etat: 'gagnee', essais: 1 }],
      [2, { etat: 'gagnee', essais: 6 }],
      [3, { etat: 'perdue', essais: 6 }],
    ])
    // 7 / 3 = 2,333…
    expect(cumul(trois).moyenne).toBe(2.3)
  })

  it('chaque mois joué a son cumul', () => {
    const parMois = cumulsParMois(historique)
    expect(parMois.size).toBe(2)
    expect(parMois.get(moisDuNumero(PREMIER_NOVEMBRE))).toEqual({ parties: 3, points: 6, moyenne: 2 })
  })
})

describe('La date d’une partie', () => {
  it('dateDuNumero est l’inverse de numero, même aux changements d’heure et d’année', () => {
    expect(dateDuNumero(1)).toEqual(new Date(2026, 9, 13))
    expect(dateDuNumero(20)).toEqual(new Date(2026, 10, 1))
    // le passage à l'heure d'hiver (25 octobre 2026) et à l'heure d'été (28 mars 2027), le 31 décembre
    for (let n = -400; n <= 800; n++) {
      expect(numero(dateDuNumero(n))).toBe(n)
    }
  })

  it('les mois se suivent d’une année à l’autre', () => {
    const decembre = numero(new Date(2026, 11, 31))
    expect(moisDuNumero(decembre + 1)).toBe(moisDuNumero(decembre) + 1)
  })
})
