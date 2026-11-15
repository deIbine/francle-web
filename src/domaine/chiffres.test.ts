import { describe, expect, it } from 'vitest'
import {
  chiffresDuJour,
  FORME_TIRAGE,
  lireChiffres,
  lireEnvoiAuServeur,
  mieuxQue,
  PARTIES_PAR_ENVOI,
  sansTirage,
  tauxDeVictoire,
  tirer,
  type ChiffresDuJour,
  type PartieEnvoyee,
} from './chiffres.ts'

const PARTIE: PartieEnvoyee = {
  tirage: 'a'.repeat(32),
  jour: 2,
  regions: ['bretagne'],
  etat: 'gagnee',
  modes: { rotation: false, cachee: true },
}

describe('tirer', () => {
  it('donne 32 chiffres hexadécimaux, jamais deux fois les mêmes', () => {
    const tirages = Array.from({ length: 100 }, tirer)
    expect(tirages.every((tirage) => FORME_TIRAGE.test(tirage))).toBe(true)
    expect(new Set(tirages).size).toBe(100)
  })
})

describe('lireEnvoiAuServeur', () => {
  it('lit un envoi bien formé', () => {
    expect(lireEnvoiAuServeur({ v: 1, parties: [PARTIE] })).toEqual({ v: 1, parties: [PARTIE] })
  })

  it('refuse un tirage absent ou mal formé, une autre version, un envoi vide ou trop long', () => {
    const { tirage: _, ...sans } = PARTIE
    expect(lireEnvoiAuServeur({ v: 1, parties: [sans] })).toBeUndefined()
    expect(lireEnvoiAuServeur({ v: 1, parties: [{ ...PARTIE, tirage: 'ABC' }] })).toBeUndefined()
    expect(lireEnvoiAuServeur({ v: 2, parties: [PARTIE] })).toBeUndefined()
    expect(lireEnvoiAuServeur({ v: 1, parties: [] })).toBeUndefined()
    expect(lireEnvoiAuServeur({ v: 1, parties: Array(PARTIES_PAR_ENVOI + 1).fill(PARTIE) })).toBeUndefined()
    expect(lireEnvoiAuServeur('{"v":1}')).toBeUndefined()
    expect(lireEnvoiAuServeur(null)).toBeUndefined()
  })
})

describe('sansTirage', () => {
  it('ne garde que les champs connus de la partie transmise', () => {
    const enTrop = { ...PARTIE, ip: '1.2.3.4', modes: { ...PARTIE.modes, pirate: 1 } } as PartieEnvoyee
    expect(sansTirage(enTrop)).toEqual({
      jour: 2,
      regions: ['bretagne'],
      etat: 'gagnee',
      modes: { rotation: false, cachee: true },
    })
  })
})

const CHIFFRES: ChiffresDuJour = chiffresDuJour(2, [
  { etat: 'gagnee', essais: 1, points: 6, nombre: 2 },
  { etat: 'gagnee', essais: 3, points: 4, nombre: 5 },
  { etat: 'gagnee', essais: 3, points: 6, nombre: 1 },
  { etat: 'perdue', essais: 6, points: 0, nombre: 1 },
  { etat: 'abandonnee', essais: 2, points: 0, nombre: 1 },
])

describe('chiffresDuJour', () => {
  it('additionne les groupes lus dans la base', () => {
    expect(CHIFFRES).toEqual({
      jour: 2,
      joueurs: 10,
      victoires: 8,
      repartition: [2, 0, 6, 0, 0, 0],
      points: [2, 0, 0, 0, 5, 0, 3, 0, 0, 0, 0],
    })
    expect(tauxDeVictoire(CHIFFRES)).toBe(80)
  })

  it('donne des zéros pour un jour sans partie', () => {
    const vide = chiffresDuJour(5, [])
    expect(vide.joueurs).toBe(0)
    expect(tauxDeVictoire(vide)).toBe(0)
  })
})

describe('lireChiffres', () => {
  it('lit une réponse bien formée, refuse le reste', () => {
    expect(lireChiffres(JSON.parse(JSON.stringify(CHIFFRES)))).toEqual(CHIFFRES)
    expect(lireChiffres({ ...CHIFFRES, repartition: [1, 2] })).toBeUndefined()
    expect(lireChiffres({ ...CHIFFRES, points: CHIFFRES.points.map(String) })).toBeUndefined()
    expect(lireChiffres({ erreur: 'serveur indisponible' })).toBeUndefined()
    expect(lireChiffres(undefined)).toBeUndefined()
  })
})

describe('mieuxQue', () => {
  it('compte les autres joueurs qui ont eu strictement moins de points', () => {
    // 6 points, partie comptée parmi les 10 : 7 des 9 autres ont moins (2 à 0, 5 à 4)
    expect(mieuxQue(CHIFFRES, 6, true)).toBe(78)
    // 4 points, partie pas envoyée : 2 des 10 ont moins
    expect(mieuxQue(CHIFFRES, 4, false)).toBe(20)
    expect(mieuxQue(CHIFFRES, 0, true)).toBe(0)
  })

  it("ne dit rien quand le joueur est seul", () => {
    const seul = chiffresDuJour(2, [{ etat: 'gagnee', essais: 2, points: 5, nombre: 1 }])
    expect(mieuxQue(seul, 5, true)).toBeUndefined()
    expect(mieuxQue(seul, 5, false)).toBe(0)
  })
})
