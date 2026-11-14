import { describe, expect, it } from 'vitest'
import { semaines } from './calendrier.ts'
import { moisDuNumero, numero } from './regionDuJour.ts'
import type { Resultat } from './statistiques.ts'

const NOVEMBRE_2026 = moisDuNumero(numero(new Date(2026, 10, 1)))
const jours = (mois: number, historique = new Map<number, Resultat>()) =>
  semaines(historique, mois)
    .flat()
    .filter((place) => place !== null)

describe('Le calendrier', () => {
  it('un mois en semaines du lundi au dimanche, vides avant le 1er et après le dernier jour', () => {
    // le 1er novembre 2026 est un dimanche : six places vides avant ; le 30 est un lundi
    const mois = semaines(new Map(), NOVEMBRE_2026)
    expect(mois).toHaveLength(6)
    expect(mois[0].slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(mois[0][6]?.date).toEqual(new Date(2026, 10, 1))
    expect(mois[5][0]?.date).toEqual(new Date(2026, 10, 30))
    expect(mois[5].slice(1)).toEqual([null, null, null, null, null, null])
    expect(jours(NOVEMBRE_2026)).toHaveLength(30)
  })

  it('chaque jour a sa partie : trouvée, manquée, en cours ou pas jouée', () => {
    const le = (jour: number) => numero(new Date(2026, 10, jour))
    const historique = new Map<number, Resultat>([
      [le(2), { etat: 'gagnee', essais: 3 }],
      [le(3), { etat: 'abandonnee', essais: 1 }],
      [le(4), { etat: 'en-cours', essais: 1 }],
    ])
    const jour = (n: number) => jours(NOVEMBRE_2026, historique).find((place) => place.date.getDate() === n)
    expect(jour(2)).toMatchObject({ numero: le(2), etat: 'gagnee', essais: 3, points: 4 })
    expect(jour(3)).toMatchObject({ etat: 'manquee', points: 0 })
    expect(jour(4)).toMatchObject({ etat: 'en-cours' })
    expect(jour(5)).toMatchObject({ etat: 'absente', essais: 0, points: 0 })
  })

  it('février et décembre : le bon nombre de jours, d’une année à l’autre', () => {
    const fevrier2027 = moisDuNumero(numero(new Date(2027, 1, 10)))
    expect(fevrier2027).toBe(NOVEMBRE_2026 + 3)
    expect(jours(fevrier2027)).toHaveLength(28)
    expect(jours(NOVEMBRE_2026 + 1)).toHaveLength(31)
  })
})
