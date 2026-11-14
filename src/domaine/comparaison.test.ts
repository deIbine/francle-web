import { describe, expect, it } from 'vitest'
import { adresseDuBilan, bilanDuFragment, faceAFace } from './comparaison.ts'
import { lire } from './lien.ts'
import type { Resultat } from './statistiques.ts'

const gagnee = (essais: number): Resultat => ({ etat: 'gagnee', essais })
const perdue: Resultat = { etat: 'perdue', essais: 6 }

describe('Le lien de comparaison', () => {
  it('l’adresse du jeu, puis le bilan codé dans le fragment', () => {
    const adresse = adresseDuBilan(new Map([[1, gagnee(2)]]), 3)
    expect(adresse).toBe('https://deibine.github.io/francle-web/#bilan=1.3.1.EA')
    const fragment = new URL(adresse).hash
    expect(lire(bilanDuFragment(fragment)!)?.parties.get(1)).toMatchObject({ etat: 'gagnee', essais: 2 })
  })

  it('un autre fragment n’est pas un lien de comparaison', () => {
    expect(bilanDuFragment('')).toBeUndefined()
    expect(bilanDuFragment('#regles')).toBeUndefined()
    expect(bilanDuFragment('#bilan=')).toBe('')
  })
})

describe('Le face-à-face', () => {
  it('seuls les jours finis par les deux comptent, et le plus de points l’emporte', () => {
    const moi = new Map<number, Resultat>([
      [1, gagnee(1)], // 6 contre 5 : pour moi
      [2, gagnee(4)], // 3 contre 3 : égalité
      [3, perdue], // 0 contre 1 : pour l'ami
      [4, gagnee(1)], // l'ami n'a pas joué
      [5, { etat: 'en-cours', essais: 1 }], // pas fini
    ])
    const ami = new Map<number, Resultat>([
      [1, gagnee(2)],
      [2, gagnee(4)],
      [3, gagnee(6)],
      [5, gagnee(1)],
      [6, gagnee(1)],
    ])
    expect(faceAFace(moi, ami)).toEqual({ jours: 3, moi: 1, ami: 1, egalites: 1 })
    expect(faceAFace(new Map(), ami)).toEqual({ jours: 0, moi: 0, ami: 0, egalites: 0 })
  })
})
