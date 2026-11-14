import { describe, expect, it } from 'vitest'
import { details } from './details.ts'
import { moisDuNumero, regionDuNumero } from './regionDuJour.ts'
import type { Resultat } from './statistiques.ts'

const SANS_MODE = { rotation: false, cachee: false }
const gagnee = (essais: number, modes = SANS_MODE): Resultat => ({ etat: 'gagnee', essais, modes })
const perdue: Resultat = { etat: 'perdue', essais: 6 }

describe('Les statistiques détaillées', () => {
  it('sans partie finie : rien à montrer', () => {
    const d = details(new Map([[1, { etat: 'en-cours', essais: 2 }]]))
    expect(d.essaisMoyens).toBeUndefined()
    expect(d.meilleurMois).toBeUndefined()
    expect(d.mieuxTrouvees).toEqual([])
    expect(d.rotation).toEqual({ jouees: 0, victoires: 0 })
  })

  it('les essais moyens des victoires, au dixième', () => {
    // (1 + 2 + 2) / 3 = 1,666… ; la défaite ne compte pas
    const historique = new Map([
      [1, gagnee(1)],
      [2, gagnee(2)],
      [3, gagnee(2)],
      [4, perdue],
    ])
    expect(details(historique).essaisMoyens).toBe(1.7)
  })

  it('le meilleur mois et les parties à 10 points', () => {
    // le n° 19 est le 31 octobre, le n° 20 le 1er novembre
    const parfaite: Resultat = { ...gagnee(1, { rotation: true, cachee: true }), bonus: { score: 4, total: 4 } }
    const d = details(
      new Map([
        [19, gagnee(1)],
        [20, parfaite],
        [21, gagnee(6)],
      ]),
    )
    expect(d.meilleurMois).toEqual({ mois: moisDuNumero(20), points: 11 })
    expect(d.journeesParfaites).toBe(1)
  })

  it('à égalité, le premier mois atteint reste le meilleur', () => {
    const historique = new Map([
      [19, gagnee(1)],
      [20, gagnee(1)],
    ])
    expect(details(historique).meilleurMois?.mois).toBe(moisDuNumero(19))
  })

  it('les régions, de la mieux trouvée à la moins bien, sans reprendre les premières', () => {
    // les jours 1 à 5 : cinq régions différentes (une région ne revient qu'une fois par cycle de 18 jours)
    const d = details(
      new Map([
        [1, gagnee(1)],
        [2, gagnee(3)],
        [3, perdue],
        [4, gagnee(2)],
        [5, perdue],
      ]),
    )
    expect(d.mieuxTrouvees.map((bilan) => bilan.region)).toEqual([
      regionDuNumero(1),
      regionDuNumero(4),
      regionDuNumero(2),
    ])
    expect(d.mieuxTrouvees[0]).toEqual({ region: regionDuNumero(1), parties: 1, victoires: 1, essaisMoyens: 1 })
    // les deux restantes, toutes deux jamais trouvées
    expect(d.moinsBienTrouvees).toHaveLength(2)
    expect(d.moinsBienTrouvees.every((bilan) => bilan.victoires === 0 && bilan.essaisMoyens === undefined)).toBe(true)
  })

  it('une région trouvée plusieurs fois passe devant une trouvée une seule fois, à taux égal', () => {
    // le jour du cycle suivant (19 à 36) qui retombe sur la région du jour 1 : chaque cycle est mélangé à nouveau
    const memeRegion = Array.from({ length: 18 }, (_, i) => 19 + i).find((n) => regionDuNumero(n) === regionDuNumero(1))!
    const autre = memeRegion === 2 ? 3 : 2
    const d = details(
      new Map([
        [autre, gagnee(2)],
        [1, gagnee(2)],
        [memeRegion, gagnee(2)],
      ]),
    )
    expect(d.mieuxTrouvees[0]).toEqual({ region: regionDuNumero(1), parties: 2, victoires: 2, essaisMoyens: 2 })
  })

  it('les modes difficiles : jouées et gagnées', () => {
    const tournee = { rotation: true, cachee: false }
    const d = details(
      new Map([
        [1, gagnee(2, tournee)],
        [2, { ...perdue, modes: tournee }],
        [3, gagnee(1)],
      ]),
    )
    expect(d.rotation).toEqual({ jouees: 2, victoires: 1 })
    expect(d.cachee).toEqual({ jouees: 0, victoires: 0 })
  })
})
