import { describe, expect, it } from 'vitest'
import { duree, minuitSuivant } from './temps.ts'

describe('Le temps avant la région suivante', () => {
  it('minuit suivant, y compris en fin de mois et d’année', () => {
    expect(minuitSuivant(new Date(2026, 9, 14, 15, 30))).toEqual(new Date(2026, 9, 15))
    expect(minuitSuivant(new Date(2026, 9, 31, 23, 59))).toEqual(new Date(2026, 10, 1))
    expect(minuitSuivant(new Date(2026, 11, 31, 0, 0))).toEqual(new Date(2027, 0, 1))
  })

  it('une durée en heures, minutes et secondes', () => {
    expect(duree(0)).toBe('00:00:00')
    expect(duree(999)).toBe('00:00:00')
    expect(duree((3 * 3600 + 7 * 60 + 9) * 1000)).toBe('03:07:09')
    expect(duree(24 * 3600 * 1000 - 1)).toBe('23:59:59')
    expect(duree(-5000)).toBe('00:00:00')
  })
})
