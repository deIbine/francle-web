import { describe, expect, it } from 'vitest'
import { simplifier } from './recherche.ts'
import { estDansLeMode, parId, REGIONS, tirables, tirer, type Mode } from './regions.ts'

describe('Les données des régions', () => {
  it.each([
    ['nouvelles', 18],
    ['anciennes', 27],
  ] as const)('mode %s : %i régions tirables', (mode, attendu) => {
    expect(tirables(mode)).toHaveLength(attendu)
  })

  it('chaque région a ses 5 indices, ses noms et ses textes dans les deux langues', () => {
    for (const region of REGIONS) {
      expect(region.superficie, region.id).toBeGreaterThan(0)
      expect(region.capitale.trim(), region.id).not.toBe('')
      for (const texte of [region.nom, region.specialite, region.personnalite, region.monument]) {
        expect(texte.fr.trim(), region.id).not.toBe('')
        expect(texte.en.trim(), region.id).not.toBe('')
      }
    }
  })

  it('deux régions n’ont jamais le même identifiant (c’est aussi le nom de leur image)', () => {
    expect(new Set(REGIONS.map((region) => region.id)).size).toBe(REGIONS.length)
  })

  it('deux régions n’ont jamais le même nom, quelle que soit la langue (sinon une saisie serait ambiguë)', () => {
    const noms = REGIONS.flatMap((region) => [...new Set([simplifier(region.nom.fr), simplifier(region.nom.en)])])
    expect(new Set(noms).size).toBe(noms.length)
  })

  it.each([
    ['hauts-de-france', 'nord-pas-de-calais picardie'],
    ['normandie', 'haute-normandie basse-normandie'],
    ['grand-est', 'alsace champagne-ardenne lorraine'],
    ['bourgogne-franche-comte', 'bourgogne franche-comte'],
    ['auvergne-rhone-alpes', 'auvergne rhone-alpes'],
    ['nouvelle-aquitaine', 'aquitaine limousin poitou-charentes'],
    ['occitanie', 'languedoc-roussillon midi-pyrenees'],
    ['centre-val-de-loire', 'centre'],
  ])('la superficie de %s est la somme de celles de %s (à 2 km² près : arrondis)', (nouvelle, anciennes) => {
    const somme = anciennes.split(' ').reduce((total, id) => total + parId(id).superficie, 0)
    expect(Math.abs(parId(nouvelle).superficie - somme)).toBeLessThanOrEqual(2)
  })

  it.each(['anciennes', 'nouvelles'] as const)('une région tirée en mode %s est toujours de ce mode', (mode: Mode) => {
    for (let i = 0; i < 200; i++) {
      expect(estDansLeMode(tirer(mode), mode)).toBe(true)
    }
  })

  it('le tirage suit le hasard qu’on lui donne : 0 donne la première région, presque 1 la dernière', () => {
    const liste = tirables('nouvelles')
    expect(tirer('nouvelles', () => 0)).toBe(liste[0])
    expect(tirer('nouvelles', () => 0.9999)).toBe(liste[liste.length - 1])
  })

  it('parId refuse un identifiant inconnu', () => {
    expect(() => parId('atlantide')).toThrow('Région inconnue')
  })
})
