import { describe, expect, it } from 'vitest'
import {
  bonusAuHasard,
  bonusDuJour,
  commence,
  demande,
  nouveauBonus,
  ordreDuJour,
  passer,
  rang,
  rejouer,
  repondre,
  repondreSaisie,
  score,
  tentativeDe,
  total,
  type Bonus,
} from './bonus.ts'
import { departementsDe, parCode, type Departement } from './departements.ts'
import { parId } from './regions.ts'

const BRETAGNE = parId('bretagne')

function dep(code: string): Departement {
  const departement = parCode(code)
  if (departement === undefined) throw new Error(code)
  return departement
}

// la Bretagne dans l'ordre de ses numéros : 22, 29, 35, 56
function bonusBretagne(): Bonus {
  return nouveauBonus(BRETAGNE, departementsDe(BRETAGNE), 'carte')
}

describe('Le bonus des départements', () => {
  it('commence en cours, sans réponse, à la question 1', () => {
    const bonus = bonusBretagne()
    expect(bonus.etat).toBe('en-cours')
    expect(commence(bonus)).toBe(false)
    expect(demande(bonus).code).toBe('22')
    expect(rang(bonus)).toBe(1)
    expect(total(bonus)).toBe(4)
  })

  it('une réponse juste ou fausse passe au département suivant, sans modifier l’ancien bonus', () => {
    const debut = bonusBretagne()
    const apres = repondre(debut, dep('22'))
    const encore = repondre(apres, dep('35'))
    expect(debut.tentatives).toHaveLength(0)
    expect(commence(apres)).toBe(true)
    expect(demande(encore).code).toBe('35')
    expect(score(encore)).toBe(1)
    expect(tentativeDe(encore, dep('29'))?.donne.code).toBe('35')
    expect(tentativeDe(encore, dep('35'))).toBeUndefined()
  })

  it('se termine après la dernière réponse ; on ne peut plus jouer', () => {
    const fini = ['22', '29', '35', '29'].reduce((bonus, code) => repondre(bonus, dep(code)), bonusBretagne())
    expect(fini.etat).toBe('termine')
    expect(score(fini)).toBe(3)
    expect(() => demande(fini)).toThrow()
    expect(() => passer(fini)).toThrow()
  })

  it('passer garde les réponses données ; le reste compte comme non trouvé', () => {
    const passe = passer(repondre(bonusBretagne(), dep('22')))
    expect(passe.etat).toBe('passe')
    expect(score(passe)).toBe(1)
    expect(total(passe)).toBe(4)
    expect(() => repondre(passe, dep('29'))).toThrow()
  })

  it('une région d’un seul département demande son numéro, quel que soit le mode', () => {
    expect(nouveauBonus(parId('guadeloupe'), [dep('971')], 'carte').question).toBe('numero')
    expect(nouveauBonus(parId('guadeloupe'), [dep('971')], 'nom').question).toBe('numero')
    expect(bonusBretagne().question).toBe('carte')
  })

  it('refuse un ordre qui n’a pas exactement les départements de la région', () => {
    expect(() => nouveauBonus(BRETAGNE, [dep('22'), dep('29'), dep('35')])).toThrow()
    expect(() => nouveauBonus(BRETAGNE, [dep('22'), dep('29'), dep('35'), dep('44')])).toThrow()
    expect(() => nouveauBonus(BRETAGNE, departementsDe(BRETAGNE), 'numero')).toThrow()
  })
})

describe('Les réponses écrites (mode B et numéros)', () => {
  it('mode nom : le nom ou le numéro ; une saisie inconnue ne coûte rien', () => {
    const bonus = nouveauBonus(BRETAGNE, departementsDe(BRETAGNE), 'nom')
    expect(repondreSaisie(bonus, 'cotes d’armor')?.tentatives[0].donne.code).toBe('22')
    expect(repondreSaisie(bonus, '29')?.tentatives[0].donne.code).toBe('29')
    // un département d'une autre région est une réponse (fausse), pas une saisie inconnue
    expect(score(repondreSaisie(bonus, 'Nord') as Bonus)).toBe(0)
    expect(repondreSaisie(bonus, 'Brest')).toBeUndefined()
  })

  it('question numero : seulement un numéro, pas le nom', () => {
    const bonus = nouveauBonus(parId('guadeloupe'), [dep('971')], 'carte')
    expect(repondreSaisie(bonus, 'Guadeloupe')).toBeUndefined()
    const fini = repondreSaisie(bonus, ' 971 ') as Bonus
    expect(fini.etat).toBe('termine')
    expect(score(fini)).toBe(1)
    expect(score(repondreSaisie(bonus, '972') as Bonus)).toBe(0)
  })
})

describe('L’ordre des questions', () => {
  it('partie du jour : le même ordre à chaque appel, différent d’un jour à l’autre', () => {
    const occitanie = parId('occitanie')
    expect(ordreDuJour(occitanie, 5)).toEqual(ordreDuJour(occitanie, 5))
    expect(ordreDuJour(occitanie, 5)).not.toEqual(ordreDuJour(occitanie, 6))
    expect(bonusDuJour(occitanie, 5).ordre).toEqual(ordreDuJour(occitanie, 5))
  })

  it('partie libre : un mélange de tous les départements, décidé par le hasard donné', () => {
    // un hasard toujours à 0 : chaque élément est échangé avec le premier
    const bonus = bonusAuHasard(BRETAGNE, () => 0)
    expect(bonus.ordre.map((departement) => departement.code)).toEqual(['29', '35', '56', '22'])
    expect(new Set(bonusAuHasard(BRETAGNE).ordre)).toEqual(new Set(departementsDe(BRETAGNE)))
  })
})

describe('Rejouer une sauvegarde', () => {
  it('rejoue les numéros donnés, dans l’ordre', () => {
    const bonus = rejouer(bonusBretagne(), ['22', '35'])
    expect(bonus.tentatives.map((tentative) => tentative.donne.code)).toEqual(['22', '35'])
    expect(score(bonus)).toBe(1)
  })

  it('s’arrête à un numéro inconnu, ou quand le bonus est fini', () => {
    expect(rejouer(bonusBretagne(), ['22', 'zz', '35']).tentatives).toHaveLength(1)
    expect(rejouer(bonusBretagne(), ['22', '29', '35', '56', '22']).etat).toBe('termine')
  })
})
