import { describe, expect, it } from 'vitest'
import {
  abandonner,
  enCours,
  ESSAIS_MAX,
  INDICES,
  indiceApresEssai,
  indicesReveles,
  nouvellePartie,
  proposer,
  type Partie,
} from './partie.ts'
import { parId, type Mode } from './regions.ts'

// joue les propositions dans l'ordre et renvoie la partie (les saisies inconnues sont ignorées, comme en jeu)
function jouer(cible: string, mode: Mode, ...propositions: string[]): Partie {
  let partie = nouvellePartie(parId(cible), mode)
  for (const proposition of propositions) {
    partie = proposer(partie, proposition) ?? partie
  }
  return partie
}

const CINQ_RATES = ['Corse', 'Normandie', 'Occitanie', 'Grand Est', 'Guyane']

describe('Partie', () => {
  it('trouver la région au premier essai gagne la partie, à 0 km et 100 %', () => {
    const partie = jouer('bretagne', 'nouvelles', '  BRETAGNE ')

    expect(partie.etat).toBe('gagnee')
    expect(enCours(partie)).toBe(false)
    expect(partie.essais[0].distance).toBe(0)
    expect(partie.essais[0].proximite).toBe(100)
  })

  it('une proposition en anglais compte comme en français', () => {
    expect(jouer('bretagne', 'nouvelles', 'Brittany').etat).toBe('gagnee')
  })

  it('une saisie inconnue ne coûte pas d’essai', () => {
    const partie = nouvellePartie(parId('bretagne'), 'nouvelles')

    expect(proposer(partie, 'Paris')).toBeUndefined()
    expect(proposer(partie, '')).toBeUndefined()
    expect(partie.essais).toEqual([])
    expect(enCours(partie)).toBe(true)
  })

  it('on ne peut proposer que les régions du mode joué', () => {
    // Grand Est et Alsace ont la même capitale : les proposer l'une pour l'autre donnerait 0 km sans gagner
    expect(proposer(nouvellePartie(parId('alsace'), 'anciennes'), 'Grand Est')).toBeUndefined()
    expect(proposer(nouvellePartie(parId('grand-est'), 'nouvelles'), 'Alsace')).toBeUndefined()
  })

  it('six essais ratés font perdre la partie, cinq non', () => {
    expect(ESSAIS_MAX).toBe(6)
    expect(enCours(jouer('bretagne', 'nouvelles', ...CINQ_RATES))).toBe(true)

    const perdue = jouer('bretagne', 'nouvelles', ...CINQ_RATES, 'Martinique')
    expect(perdue.etat).toBe('perdue')
    expect(perdue.essais).toHaveLength(ESSAIS_MAX)
  })

  it('trouver au 6e essai est une victoire, pas une défaite', () => {
    expect(jouer('bretagne', 'nouvelles', ...CINQ_RATES, 'Bretagne').etat).toBe('gagnee')
  })

  it('jouer dans une partie terminée est une erreur de programmation', () => {
    const partie = jouer('bretagne', 'nouvelles', 'Bretagne')

    expect(() => proposer(partie, 'Corse')).toThrow('La partie est terminée')
    expect(() => abandonner(partie)).toThrow('La partie est terminée')
  })

  it('abandonner termine la partie dans l’état « abandonnee », en gardant les essais', () => {
    const partie = abandonner(jouer('corse', 'anciennes', 'Alsace'))

    expect(partie.etat).toBe('abandonnee')
    expect(partie.essais).toHaveLength(1)
  })

  it('jouer ne modifie jamais la partie d’avant : on reçoit une nouvelle partie', () => {
    const avant = nouvellePartie(parId('bretagne'), 'nouvelles')
    const apres = proposer(avant, 'Corse')

    expect(apres).not.toBe(avant)
    expect(avant.essais).toEqual([])
    expect(apres?.essais.map((essai) => essai.region.id)).toEqual(['corse'])
  })

  it('chaque essai porte la direction vers la cible', () => {
    expect(jouer('grand-est', 'nouvelles', 'Bretagne').essais[0].direction).toBe('est')
  })
})

describe('Indices', () => {
  it('superficie, spécialité, personnalité, capitale, monument, puis plus rien', () => {
    expect(INDICES).toEqual(['superficie', 'specialite', 'personnalite', 'capitale', 'monument'])
    expect([0, 1, 2, 3, 4].map(indiceApresEssai)).toEqual([...INDICES])
    expect(indiceApresEssai(5)).toBeUndefined()
    expect(indiceApresEssai(-1)).toBeUndefined()
  })

  it('un indice par essai raté, aucun pour l’essai gagnant', () => {
    expect(indicesReveles(nouvellePartie(parId('bretagne'), 'nouvelles'))).toEqual([])
    expect(indicesReveles(jouer('bretagne', 'nouvelles', 'Corse', 'Normandie'))).toEqual(['superficie', 'specialite'])
    expect(indicesReveles(jouer('bretagne', 'nouvelles', 'Corse', 'Bretagne'))).toEqual(['superficie'])
    // 6 essais ratés : 5 indices seulement, le dernier essai raté termine la partie
    expect(indicesReveles(jouer('bretagne', 'nouvelles', ...CINQ_RATES, 'Martinique'))).toEqual([...INDICES])
  })
})
