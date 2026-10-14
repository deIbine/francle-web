import { describe, expect, it } from 'vitest'
import { chercher, simplifier, suggestions } from './recherche.ts'
import { parId, REGIONS, tirables, type Langue, type Mode } from './regions.ts'

const ids = (saisie: string, mode: Mode, langue: Langue = 'fr') =>
  suggestions(saisie, mode, langue).map((region) => region.id)

describe('simplifier', () => {
  it.each([
    ['Île-de-France', 'iledefrance'],
    ['  ile de FRANCE', 'iledefrance'],
    ["Provence-Alpes-Côte d'Azur", 'provencealpescotedazur'],
    ['Provence-Alpes-Côte d’Azur', 'provencealpescotedazur'],
    ['La Réunion', 'lareunion'],
  ])('« %s » → %s', (saisie, attendu) => {
    expect(simplifier(saisie)).toBe(attendu)
  })
})

describe('chercher', () => {
  it('chaque région se retrouve par son nom français et par son nom anglais, dans son mode', () => {
    for (const region of REGIONS) {
      const mode: Mode = region.epoque === 'ancienne' ? 'anciennes' : 'nouvelles'
      expect(chercher(region.nom.fr, mode), region.id).toBe(region)
      expect(chercher(region.nom.en, mode), region.id).toBe(region)
    }
  })

  it('chaque mode refuse les régions de l’autre époque', () => {
    expect(chercher('Alsace', 'nouvelles')).toBeUndefined()
    expect(chercher('Alsace', 'anciennes')).toBe(parId('alsace'))
    expect(chercher('Grand Est', 'anciennes')).toBeUndefined()
    expect(chercher('Grand Est', 'nouvelles')).toBe(parId('grand-est'))
    // les régions inchangées en 2016 sont des deux époques
    expect(chercher('Bretagne', 'anciennes')).toBe(parId('bretagne'))
    expect(chercher('Bretagne', 'nouvelles')).toBe(parId('bretagne'))
    expect(chercher('Paris', 'nouvelles')).toBeUndefined()
  })

  it('accepte le nom anglais, avec ou sans accents ni majuscules', () => {
    expect(chercher('brittany', 'nouvelles')).toBe(parId('bretagne'))
    expect(chercher('  FRENCH guiana ', 'nouvelles')).toBe(parId('guyane'))
    expect(chercher('Reunion', 'nouvelles')).toBe(parId('la-reunion'))
    expect(chercher('Upper Normandy', 'anciennes')).toBe(parId('haute-normandie'))
    expect(chercher('Upper Normandy', 'nouvelles')).toBeUndefined()
  })
})

describe('suggestions', () => {
  it.each([
    ['bre', 'nouvelles', 'bretagne'],
    ['  ÎLE-de', 'nouvelles', 'ile-de-france'],
    ['nor', 'nouvelles', 'normandie'],
    // jamais de région de l'autre époque ; d'abord le nom, puis le mot « Normandie »
    ['nor', 'anciennes', 'nord-pas-de-calais basse-normandie haute-normandie'],
    // un mot du nom, pas son début : chaque groupe trié, Centre avant Pays
    ['loire', 'nouvelles', 'centre-val-de-loire pays-de-la-loire'],
    ['azur', 'nouvelles', 'provence-alpes-cote-dazur'],
  ] as const)('« %s » en mode %s → %s', (saisie, mode, attendues) => {
    expect(ids(saisie, mode)).toEqual(attendues.split(' '))
  })

  it('cherche aussi les noms anglais, et trie dans la langue du joueur', () => {
    // Brittany est la Bretagne : un joueur qui tape « bri » la voit, même en français
    expect(ids('bri', 'nouvelles')).toEqual(['bretagne'])
    // « cor » : la Corse, par son nom français comme anglais (Corsica), une seule fois
    expect(ids('cor', 'nouvelles')).toEqual(['corse'])
    // trié dans la langue du joueur : Lower Normandy (L) avant Upper Normandy (U) en anglais,
    // Basse-Normandie (B) avant Haute-Normandie (H) en français
    expect(ids('normand', 'anciennes', 'en')).toEqual(['basse-normandie', 'haute-normandie'])
    // « gu » : Guadeloupe et Guyane. En français, Guadeloupe avant Guyane ; en anglais, la Guyane s'appelle
    // French Guiana et passe devant
    expect(ids('gu', 'nouvelles', 'fr')).toEqual(['guadeloupe', 'guyane'])
    expect(ids('gu', 'nouvelles', 'en')).toEqual(['guyane', 'guadeloupe'])
  })

  it('aucune suggestion pour une saisie vide, inconnue, ou un petit mot (« de », « d’ »)', () => {
    for (const mode of ['anciennes', 'nouvelles'] as const) {
      for (const saisie of ['', "  -' ", 'xyz', 'de', 'd']) {
        expect(ids(saisie, mode), `« ${saisie} »`).toEqual([])
      }
    }
  })

  it('chaque région du mode est la première suggestion pour son nom complet, dans chaque langue', () => {
    for (const mode of ['anciennes', 'nouvelles'] as const) {
      for (const langue of ['fr', 'en'] as const) {
        for (const region of tirables(mode)) {
          const liste = suggestions(region.nom[langue], mode, langue)
          expect(liste[0], `${region.id} (${langue})`).toBe(region)
          // une suggestion choisie doit toujours être acceptée par chercher() : les deux règles restent d'accord
          for (const suggestion of liste) {
            expect(chercher(suggestion.nom[langue], mode)).toBe(suggestion)
          }
        }
      }
    }
  })

  it.each([
    ['nouvelles', 'ancienne'],
    ['anciennes', 'nouvelle'],
  ] as const)('mode %s : jamais de région %s suggérée', (mode, interdite) => {
    for (const lettre of 'abcdefghijklmnopqrstuvwxyz') {
      for (const region of suggestions(lettre, mode, 'fr')) {
        expect(region.epoque, `${lettre} → ${region.id}`).not.toBe(interdite)
      }
    }
  })
})
