import { describe, expect, it } from 'vitest'
import { bonusDuJour, restants } from './bonus.ts'
import { MODE_DU_JOUR, regionDuNumero } from './regionDuJour.ts'
import { estDansLeMode, REGIONS, tirables } from './regions.ts'
import type { PartieTransmise } from './transmission.ts'
import { estPossible } from './verification.ts'

const JOUR = 2
const CIBLE = regionDuNumero(JOUR)
// des régions du jeu du jour qui ne sont pas la bonne réponse
const AUTRES = tirables(MODE_DU_JOUR)
  .filter((region) => region !== CIBLE)
  .map((region) => region.id)
const SANS_MODE = { rotation: false, cachee: false }

function partie(regions: string[], etat: PartieTransmise['etat'], bonus?: PartieTransmise['bonus']): PartieTransmise {
  return { jour: JOUR, regions, etat, modes: SANS_MODE, ...(bonus && { bonus }) }
}

describe('estPossible', () => {
  it('accepte une victoire, une défaite en six essais et un abandon', () => {
    expect(estPossible(partie([CIBLE.id], 'gagnee'), JOUR)).toBe(true)
    expect(estPossible(partie([...AUTRES.slice(0, 3), CIBLE.id], 'gagnee'), JOUR)).toBe(true)
    expect(estPossible(partie(AUTRES.slice(0, 6), 'perdue'), JOUR)).toBe(true)
    expect(estPossible(partie(AUTRES.slice(0, 2), 'abandonnee'), JOUR)).toBe(true)
    expect(estPossible(partie([], 'abandonnee'), JOUR)).toBe(true)
  })

  it("refuse un état qui ne correspond pas aux coups", () => {
    // une victoire qui ne finit pas sur la région du jour
    expect(estPossible(partie(AUTRES.slice(0, 2), 'gagnee'), JOUR)).toBe(false)
    // une défaite en cinq essais
    expect(estPossible(partie(AUTRES.slice(0, 5), 'perdue'), JOUR)).toBe(false)
    // un abandon après six essais ratés : la partie était déjà perdue
    expect(estPossible(partie(AUTRES.slice(0, 6), 'abandonnee'), JOUR)).toBe(false)
    // des essais après la victoire
    expect(estPossible(partie([CIBLE.id, AUTRES[0]], 'gagnee'), JOUR)).toBe(false)
  })

  it('refuse une région inconnue, d’une autre époque, ou proposée deux fois', () => {
    const ancienne = REGIONS.find((region) => !estDansLeMode(region, MODE_DU_JOUR))!
    expect(estPossible(partie(['atlantide', CIBLE.id], 'gagnee'), JOUR)).toBe(false)
    expect(estPossible(partie([ancienne.id, CIBLE.id], 'gagnee'), JOUR)).toBe(false)
    expect(estPossible(partie([AUTRES[0], AUTRES[0], CIBLE.id], 'gagnee'), JOUR)).toBe(false)
  })

  it('accepte la partie du lendemain (un joueur en avance), pas au-delà ni avant le premier jour', () => {
    const demain = regionDuNumero(JOUR + 1)
    expect(estPossible({ ...partie([demain.id], 'gagnee'), jour: JOUR + 1 }, JOUR)).toBe(true)
    const apresDemain = regionDuNumero(JOUR + 2)
    expect(estPossible({ ...partie([apresDemain.id], 'gagnee'), jour: JOUR + 2 }, JOUR)).toBe(false)
    expect(estPossible({ ...partie([], 'abandonnee'), jour: 0 }, JOUR)).toBe(false)
  })

  it('accepte un bonus après une victoire, avec des réponses possibles seulement', () => {
    const premier = restants(bonusDuJour(CIBLE, JOUR))[0].code
    const bonus = { paires: [[premier, premier]] as [string, string][], etat: 'en-cours' as const, difficile: false }
    expect(estPossible(partie([CIBLE.id], 'gagnee', bonus), JOUR)).toBe(true)
    // un bonus sans victoire
    expect(estPossible(partie([], 'abandonnee', bonus), JOUR)).toBe(false)
    // un département qui n'existe pas
    expect(estPossible(partie([CIBLE.id], 'gagnee', { ...bonus, paires: [['999', '999']] }), JOUR)).toBe(false)
    // le même département demandé deux fois
    expect(
      estPossible(partie([CIBLE.id], 'gagnee', { ...bonus, paires: [[premier, premier], [premier, premier]] }), JOUR),
    ).toBe(false)
  })
})
