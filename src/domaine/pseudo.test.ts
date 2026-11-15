import { describe, expect, it } from 'vitest'
import { clePseudo, nettoyerPseudo, normaliserCode, refusPseudo, tirerCodeLigue, tirerSecours } from './pseudo.ts'

describe('Les pseudos', () => {
  it('deux pseudos sont identiques sans majuscules, accents, espaces ni ponctuation', () => {
    expect(clePseudo('Clément')).toBe('clement')
    expect(clePseudo('clé-ment')).toBe(clePseudo('CLEMENT'))
    expect(nettoyerPseudo('  Jean   Paul ')).toBe('Jean Paul')
  })

  it('accepte les lettres, les chiffres et quelques signes, de 3 à 20 caractères', () => {
    for (const pseudo of ['Loutre bretonne', 'Zoé_42', "L'Aveyronnais", 'Breizh.29', 'Ana-Lou']) {
      expect(refusPseudo(pseudo), pseudo).toBeUndefined()
    }
    expect(refusPseudo('ab')).toBe('longueur')
    expect(refusPseudo('a'.repeat(21))).toBe('longueur')
    // trois caractères, mais pas trois lettres ou chiffres
    expect(refusPseudo('a._')).toBe('longueur')
    expect(refusPseudo('moi@ici')).toBe('caracteres')
    expect(refusPseudo('<script>')).toBe('caracteres')
  })

  it('refuse les mots grossiers et ceux qui imitent le jeu, même cachés par des accents ou des majuscules', () => {
    expect(refusPseudo('Gros Connard')).toBe('mot')
    expect(refusPseudo('CONNÂRD')).toBe('mot')
    expect(refusPseudo('Admin Francle')).toBe('mot')
    // un mot court n'est refusé que comme mot entier : « habitant » contient un mot de 4 lettres, et reste permis
    expect(refusPseudo('Habitant')).toBeUndefined()
    expect(refusPseudo('Ma bite')).toBe('mot')
  })
})

describe('Les codes', () => {
  it('le code de secours : 16 caractères faciles à lire, en quatre groupes', () => {
    const code = tirerSecours()
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]{4}(-[A-HJKMNP-Z2-9]{4}){3}$/)
    expect(new Set(Array.from({ length: 50 }, tirerSecours)).size).toBe(50)
  })

  it('le code de ligue : 6 caractères', () => {
    expect(tirerCodeLigue()).toMatch(/^[A-HJKMNP-Z2-9]{6}$/)
  })

  it('un code tapé à la main est remis en forme', () => {
    expect(normaliserCode(' abcd efgh-jkmn pqrs ')).toBe('ABCDEFGHJKMNPQRS')
  })
})
