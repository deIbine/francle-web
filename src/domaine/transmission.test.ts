import { describe, expect, it } from 'vitest'
import { ordreDuJour } from './bonus.ts'
import { SANS_MODE } from './partage.ts'
import { regionDuNumero } from './regionDuJour.ts'
import { envoi, lireEnvoi, resume, VERSION_TRANSMISSION, type PartieTransmise } from './transmission.ts'

const JOUR = 5
// les départements de la région du jour n° 5, dans l'ordre du jour
const DEPARTEMENTS = ordreDuJour(regionDuNumero(JOUR), JOUR)
const juste = (i: number) => [DEPARTEMENTS[i].code, DEPARTEMENTS[i].code] as const
const fausse = (i: number) => [DEPARTEMENTS[i].code, DEPARTEMENTS[(i + 1) % DEPARTEMENTS.length].code] as const

const GAGNEE: PartieTransmise = {
  jour: JOUR,
  regions: ['corse', regionDuNumero(JOUR).id],
  etat: 'gagnee',
  modes: { rotation: true, cachee: false },
}

describe('Le format transmis', () => {
  it('une enveloppe valide se relit telle quelle, même passée par JSON', () => {
    const avecBonus = { ...GAGNEE, bonus: { paires: [juste(0)], etat: 'en-cours' as const, difficile: false } }
    const texte = JSON.stringify(envoi([GAGNEE, avecBonus]))
    expect(lireEnvoi(JSON.parse(texte))).toEqual({ v: VERSION_TRANSMISSION, parties: [GAGNEE, avecBonus] })
  })

  it('une autre version, ou une forme inattendue, est refusée en entier', () => {
    expect(lireEnvoi({ v: 2, parties: [GAGNEE] })).toBeUndefined()
    expect(lireEnvoi({ v: 1, parties: [{ ...GAGNEE, etat: 'trichee' }] })).toBeUndefined()
    expect(lireEnvoi({ v: 1, parties: [{ ...GAGNEE, jour: 1.5 }] })).toBeUndefined()
    expect(lireEnvoi({ v: 1, parties: [{ ...GAGNEE, modes: undefined }] })).toBeUndefined()
    expect(lireEnvoi({ v: 1, parties: [{ ...GAGNEE, bonus: { paires: [['29']], etat: 'termine', difficile: false } }] }))
      .toBeUndefined()
    expect(lireEnvoi(null)).toBeUndefined()
    expect(lireEnvoi('{"v":1}')).toBeUndefined()
  })
})

describe('Le résumé d’une partie transmise', () => {
  it('les essais se comptent, les modes restent', () => {
    expect(resume(GAGNEE)).toEqual({ etat: 'gagnee', essais: 2, modes: { rotation: true, cachee: false } })
  })

  it('le bonus terminé : les départements trouvés, sur ceux de la région', () => {
    const paires = DEPARTEMENTS.map((_, i) => (i === 0 ? fausse(i) : juste(i)))
    const partie = { ...GAGNEE, bonus: { paires, etat: 'termine' as const, difficile: false } }
    expect(resume(partie).bonus).toEqual({ score: DEPARTEMENTS.length - 1, total: DEPARTEMENTS.length })
  })

  it('passé après une réponse : il compte, avec son score partiel', () => {
    const partie = { ...GAGNEE, bonus: { paires: [juste(0)], etat: 'passe' as const, difficile: true } }
    expect(resume(partie).bonus).toEqual({ score: 1, total: DEPARTEMENTS.length })
  })

  it('en cours, ou sans réponse lisible : il ne compte pas encore', () => {
    if (DEPARTEMENTS.length > 1) {
      const enCours = { ...GAGNEE, bonus: { paires: [juste(0)], etat: 'en-cours' as const, difficile: false } }
      expect(resume(enCours).bonus).toBeUndefined()
    }
    const abime = { ...GAGNEE, bonus: { paires: [['999', '999'] as const], etat: 'passe' as const, difficile: false } }
    expect(resume(abime).bonus).toBeUndefined()
  })

  it('une partie perdue n’a ni bonus ni modes qui comptent, mais garde ses essais', () => {
    expect(resume({ ...GAGNEE, etat: 'perdue', regions: Array(6).fill('corse'), modes: SANS_MODE })).toEqual({
      etat: 'perdue',
      essais: 6,
      modes: SANS_MODE,
    })
  })
})
