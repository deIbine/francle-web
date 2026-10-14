import { describe, expect, it } from 'vitest'
import { angleDuJour, MODE_DU_JOUR, numero, regionDuJour } from './regionDuJour.ts'
import { tirables } from './regions.ts'

// La région du jour, vérifiée sur n'importe quelle date : c'est le test qui choisit le jour, pas l'horloge.
// new Date(2026, 9, 13) : le 13 octobre 2026 à minuit, heure locale (les mois commencent à 0)
const PREMIER_JOUR = new Date(2026, 9, 13)
const NOUVELLES = tirables('nouvelles')

function plusJours(date: Date, jours: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + jours)
}

describe('Région du jour', () => {
  it('numéro de partie à la Wordle : 1 le premier jour, puis +1 par jour', () => {
    expect(numero(PREMIER_JOUR)).toBe(1)
    expect(numero(plusJours(PREMIER_JOUR, 1))).toBe(2)
    expect(numero(new Date(2027, 9, 13))).toBe(366)
    expect(numero(plusJours(PREMIER_JOUR, -1))).toBe(0)
  })

  it('le jour change à minuit chez le joueur, pas avant', () => {
    expect(numero(new Date(2026, 9, 13, 0, 0, 0))).toBe(1)
    expect(numero(new Date(2026, 9, 13, 23, 59, 59))).toBe(1)
    expect(numero(new Date(2026, 9, 14, 0, 0, 0))).toBe(2)
  })

  it('le passage à l’heure d’été ou d’hiver ne décale pas le numéro', () => {
    // 29 mars et 25 octobre 2026 : des journées de 23 et 25 heures en France
    expect(numero(new Date(2026, 2, 30)) - numero(new Date(2026, 2, 29))).toBe(1)
    expect(numero(new Date(2026, 9, 26)) - numero(new Date(2026, 9, 25))).toBe(1)
  })

  // les mêmes valeurs que RegionDuJourTest.java, figées le 13 octobre 2026
  it.each([
    [new Date(2000, 0, 1), 'auvergne-rhone-alpes'],
    [new Date(2024, 1, 29), 'la-reunion'],
    [new Date(2026, 0, 1), 'normandie'],
    [new Date(2026, 9, 12), 'hauts-de-france'],
  ])('valeur de référence : %s → %s', (date, attendue) => {
    expect(regionDuJour(date).id).toBe(attendue)
  })

  it('chaque région revient exactement une fois par cycle, avant comme après le premier jour', () => {
    for (let cycle = -30; cycle < 30; cycle++) {
      const vues = new Set<string>()
      for (let jour = 0; jour < NOUVELLES.length; jour++) {
        vues.add(regionDuJour(plusJours(PREMIER_JOUR, cycle * NOUVELLES.length + jour)).id)
      }
      expect(vues.size, `cycle ${cycle}`).toBe(NOUVELLES.length)
    }
  })

  it('jamais deux jours de suite la même région, même d’un cycle à l’autre', () => {
    let hier = regionDuJour(plusJours(PREMIER_JOUR, -2001))
    for (let jour = -2000; jour < 2000; jour++) {
      const aujourdhui = regionDuJour(plusJours(PREMIER_JOUR, jour))
      expect(aujourdhui, `jour ${jour}`).not.toBe(hier)
      hier = aujourdhui
    }
  })

  it('uniquement des nouvelles régions', () => {
    expect(MODE_DU_JOUR).toBe('nouvelles')
    for (let jour = 0; jour < 400; jour++) {
      expect(NOUVELLES).toContain(regionDuJour(plusJours(PREMIER_JOUR, jour)))
    }
  })

  it('l’angle du jour : le même pour une même date, entre 0 et 359°, et varié', () => {
    const angles = new Set<number>()
    for (let jour = 0; jour < 100; jour++) {
      const angle = angleDuJour(plusJours(PREMIER_JOUR, jour))
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
      expect(angleDuJour(plusJours(PREMIER_JOUR, jour))).toBe(angle)
      angles.add(angle)
    }
    // 100 jours, 360 angles possibles : s'ils étaient presque tous pareils, le hasard serait mal fait
    expect(angles.size).toBeGreaterThan(50)
  })
})
