import { describe, expect, it } from 'vitest'
import {
  chercherDepartement,
  DEPARTEMENTS,
  anciennesRegionsDe,
  departementsDe,
  nouvelleRegionDe,
  numero,
  parCode,
  suggestionsDepartements,
} from './departements.ts'
import { parId, REGIONS, tirables, type Mode } from './regions.ts'

describe('Les données des départements', () => {
  it('101 départements, chacun avec son propre numéro et son nom', () => {
    expect(DEPARTEMENTS).toHaveLength(101)
    expect(new Set(DEPARTEMENTS.map((departement) => departement.code)).size).toBe(101)
    for (const departement of DEPARTEMENTS) {
      expect(departement.nom.trim(), departement.code).not.toBe('')
    }
  })

  it('rangés dans l’ordre des numéros, la Corse entre 19 et 21, l’outre-mer à la fin', () => {
    const codes = DEPARTEMENTS.map((departement) => departement.code)
    expect(codes.slice(0, 3)).toEqual(['01', '02', '03'])
    expect(codes.slice(18, 22)).toEqual(['19', '2A', '2B', '21'])
    expect(codes.slice(-5)).toEqual(['971', '972', '973', '974', '976'])
  })

  it('chaque région des deux époques a ses départements', () => {
    for (const region of REGIONS) {
      expect(departementsDe(region).length, region.id).toBeGreaterThan(0)
    }
  })

  it.each(['nouvelles', 'anciennes'] as const)(
    'mode %s : chaque département est dans une seule région, et aucun n’est oublié',
    (mode: Mode) => {
      const codes = tirables(mode).flatMap((region) => departementsDe(region).map((departement) => departement.code))
      expect(codes).toHaveLength(101)
      expect(new Set(codes).size).toBe(101)
    },
  )

  it('quelques régions bien connues', () => {
    const codes = (id: string) => departementsDe(parId(id)).map((departement) => departement.code)
    expect(codes('bretagne')).toEqual(['22', '29', '35', '56'])
    expect(codes('corse')).toEqual(['2A', '2B'])
    expect(codes('guadeloupe')).toEqual(['971'])
    expect(codes('alsace')).toEqual(['67', '68'])
    expect(codes('occitanie')).toHaveLength(13)
    expect(parCode('29')?.nom).toBe('Finistère')
  })
})

describe('Retrouver un département', () => {
  it.each([
    ['29', '29'],
    [' 1 ', '01'],
    ['2a', '2A'],
    ['finistere', '29'],
    ['Côtes-d’Armor', '22'],
    ['COTES D ARMOR', '22'],
    ['corse du sud', '2A'],
    ['971', '971'],
  ])('« %s » -> %s', (saisie, code) => {
    expect(chercherDepartement(saisie)?.code).toBe(code)
  })

  it.each(['', 'bretagne', '20', '975', '0', '100'])('« %s » n’est pas un département', (saisie) => {
    expect(chercherDepartement(saisie)).toBeUndefined()
  })

  it('numéro : un chiffre prend un zéro devant, le reste ne change pas', () => {
    expect(numero('7')).toBe('07')
    expect(numero('2b')).toBe('2B')
    expect(numero('finistère')).toBe('FINISTÈRE')
  })
})

describe('Les suggestions de départements', () => {
  const noms = (saisie: string, region = 'corse') =>
    suggestionsDepartements(saisie, departementsDe(parId(region)), 'fr').map((departement) => departement.nom)

  it('d’abord les noms qui commencent par la saisie, puis ceux dont un mot commence par elle', () => {
    expect(noms('haute')).toEqual(['Haute-Corse'])
    expect(noms('corse')).toEqual(['Corse-du-Sud', 'Haute-Corse'])
    expect(noms('loire', 'pays-de-la-loire')).toEqual(['Loire-Atlantique', 'Maine-et-Loire'])
  })

  it('seulement parmi les départements donnés', () => {
    expect(noms('fin')).toEqual([])
    expect(noms('fin', 'bretagne')).toEqual(['Finistère'])
  })

  it('un numéro propose son département', () => {
    expect(noms('29', 'bretagne')).toEqual(['Finistère'])
    expect(noms('2a')).toEqual(['Corse-du-Sud'])
  })

  it('rien pour une saisie vide', () => {
    expect(noms('  ')).toEqual([])
  })
})

describe('Le lien entre les deux époques', () => {
  // les noms, triés : l'ordre de regions.ts n'est pas alphabétique
  const noms = (regions: readonly { nom: { fr: string } }[]) => regions.map((region) => region.nom.fr).toSorted()

  it('chaque ancienne région est dans une nouvelle région, qui la regroupe', () => {
    for (const ancienne of REGIONS.filter((region) => region.epoque === 'ancienne')) {
      expect(anciennesRegionsDe(nouvelleRegionDe(ancienne))).toContain(ancienne)
    }
  })

  it('chaque nouvelle région regroupe des anciennes régions, qui couvrent tous ses départements', () => {
    for (const nouvelle of REGIONS.filter((region) => region.epoque === 'nouvelle')) {
      const codes = (departements: readonly { code: string }[]) => departements.map((d) => d.code).toSorted()
      const couverts = anciennesRegionsDe(nouvelle).flatMap((ancienne) => departementsDe(ancienne))
      expect(codes(couverts)).toEqual(codes(departementsDe(nouvelle)))
    }
  })

  it('quelques exemples', () => {
    expect(nouvelleRegionDe(parId('alsace')).nom.fr).toBe('Grand Est')
    expect(noms(anciennesRegionsDe(parId('grand-est')))).toEqual(['Alsace', 'Champagne-Ardenne', 'Lorraine'])
    expect(noms(anciennesRegionsDe(parId('centre-val-de-loire')))).toEqual(['Centre'])
  })
})
