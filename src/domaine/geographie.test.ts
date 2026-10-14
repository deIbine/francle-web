import { describe, expect, it } from 'vitest'
import { azimut, direction, directionDepuisAzimut, distance, proximite, SYMBOLES } from './geographie.ts'
import { parId, REGIONS } from './regions.ts'

describe('distance', () => {
  it.each([
    ['bretagne', 'grand-est', 698],
    ['ile-de-france', 'auvergne-rhone-alpes', 392],
    ['ile-de-france', 'provence-alpes-cote-dazur', 661],
  ])('%s → %s ≈ %i km (à 5 km près)', (depart, arrivee, attendu) => {
    expect(Math.abs(distance(parId(depart), parId(arrivee)) - attendu)).toBeLessThan(5)
  })

  it('est symétrique, nulle d’une région à elle-même, et jamais NaN', () => {
    // à un mètre près : près de 1, acos amplifie les erreurs d'arrondi (1e-16 sur le cosinus = quelques centimètres)
    const unMetre = 0.001
    for (const a of REGIONS) {
      expect(distance(a, a), a.id).toBeLessThan(unMetre)
      for (const b of REGIONS) {
        expect(distance(a, b)).not.toBeNaN()
        expect(Math.abs(distance(a, b) - distance(b, a))).toBeLessThan(unMetre)
      }
    }
  })
})

describe('direction', () => {
  it.each([
    [0, 'nord'], [22.4, 'nord'], [22.6, 'nord-est'], [45, 'nord-est'], [90, 'est'], [135, 'sud-est'],
    [180, 'sud'], [225, 'sud-ouest'], [270, 'ouest'], [315, 'nord-ouest'], [337.4, 'nord-ouest'], [337.6, 'nord'],
    [359.9, 'nord'],
  ] as const)('%f° → %s : chaque direction couvre 45°, centrée sur son angle', (angle, attendue) => {
    expect(directionDepuisAzimut(angle)).toBe(attendue)
  })

  it('Rennes → Strasbourg : azimut connu d’avance, 82,32°', () => {
    // valeur calculée à part avec une autre méthode (vecteurs en 3D projetés sur le plan tangent à Rennes)
    expect(azimut(parId('bretagne'), parId('grand-est'))).toBeCloseTo(82.32, 2)
  })

  it.each([
    ['bretagne', 'grand-est', 'est'],
    ['grand-est', 'bretagne', 'ouest'],
    ['provence-alpes-cote-dazur', 'hauts-de-france', 'nord'],
    ['hauts-de-france', 'provence-alpes-cote-dazur', 'sud'],
    ['pays-de-la-loire', 'hauts-de-france', 'nord-est'],
    ['ile-de-france', 'corse', 'sud-est'],
    ['grand-est', 'nouvelle-aquitaine', 'sud-ouest'],
    ['provence-alpes-cote-dazur', 'bretagne', 'nord-ouest'],
  ])('%s → %s : %s', (depuis, vers, attendue) => {
    expect(direction(parId(depuis), parId(vers))).toBe(attendue)
  })

  it('deux régions à la même capitale (Lille) : pas de direction', () => {
    expect(direction(parId('nord-pas-de-calais'), parId('hauts-de-france'))).toBe('sur-place')
    expect(direction(parId('bretagne'), parId('bretagne'))).toBe('sur-place')
    expect(SYMBOLES['sur-place']).toBe('●')
  })
})

describe('proximite', () => {
  it('Bretagne → Normandie 76 %, Grand Est 35 %, Corse 0 %', () => {
    const cible = parId('bretagne')
    expect(proximite(cible, distance(cible, parId('normandie')))).toBe(76)
    expect(proximite(cible, distance(cible, parId('grand-est')))).toBe(35)
    expect(proximite(cible, distance(cible, parId('corse')))).toBe(0)
  })

  it('reste entre 0 et 100 pour toutes les paires de régions', () => {
    for (const cible of REGIONS) {
      for (const proposition of REGIONS) {
        const pourcentage = proximite(cible, distance(cible, proposition))
        expect(pourcentage, `${cible.id} → ${proposition.id}`).toBeGreaterThanOrEqual(0)
        expect(pourcentage, `${cible.id} → ${proposition.id}`).toBeLessThanOrEqual(100)
      }
    }
  })
})
