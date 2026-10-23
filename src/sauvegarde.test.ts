import { describe, expect, it } from 'vitest'
import { bonusDuJour, passer, repondreChoix, type Bonus } from './domaine/bonus.ts'
import { parCode } from './domaine/departements.ts'
import { SANS_MODE } from './domaine/partage.ts'
import { abandonner, nouvellePartie, proposer, type Partie } from './domaine/partie.ts'
import { parId } from './domaine/regions.ts'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import { CLE, enregistrer, enregistrerBonus, lire, restaurer, restaurerBonus, resultats } from './sauvegarde.ts'

const BRETAGNE = parId('bretagne')

function jouer(...propositions: string[]): Partie {
  let partie = nouvellePartie(BRETAGNE, 'nouvelles')
  for (const proposition of propositions) {
    partie = proposer(partie, proposition) ?? partie
  }
  return partie
}

describe('La sauvegarde', () => {
  it('une partie enregistrée se retrouve à l’identique', () => {
    const partie = jouer('Normandie', 'Brittany')
    enregistrer(5, partie)
    const sauvee = lire().get(5)
    expect(sauvee).toEqual({ regions: ['normandie', 'bretagne'], etat: 'gagnee', modes: SANS_MODE })
    // rejouée, elle redonne les mêmes essais, distances et pourcentages compris
    expect(restaurer(sauvee!, BRETAGNE, 'nouvelles')).toEqual(partie)
  })

  it('une partie en cours ou abandonnée aussi', () => {
    enregistrer(1, jouer('Corse'))
    enregistrer(2, abandonner(jouer('Corse', 'Occitanie')))
    const parties = lire()
    expect(restaurer(parties.get(1)!, BRETAGNE, 'nouvelles')).toEqual(jouer('Corse'))
    expect(restaurer(parties.get(2)!, BRETAGNE, 'nouvelles').etat).toBe('abandonnee')
    expect(resultats(parties)).toEqual(
      new Map([
        [1, { etat: 'en-cours', essais: 1 }],
        [2, { etat: 'abandonnee', essais: 2 }],
      ]),
    )
  })

  it('enregistrer un jour ne touche pas aux autres', () => {
    enregistrer(1, jouer('Bretagne'))
    enregistrer(2, jouer('Corse'))
    enregistrer(2, jouer('Corse', 'Occitanie'))
    expect([...lire().keys()]).toEqual([1, 2])
    expect(lire().get(1)!.etat).toBe('gagnee')
    expect(lire().get(2)!.regions).toHaveLength(2)
  })

  it('une sauvegarde abîmée est ignorée, sans bloquer le jeu', () => {
    localStorage.setItem(CLE, '{ pas du JSON')
    expect(lire().size).toBe(0)
    localStorage.setItem(CLE, JSON.stringify({ 1: { regions: ['bretagne'], etat: 'gagnee' }, 2: 'n’importe quoi' }))
    expect([...lire().keys()]).toEqual([1])
  })

  it('une région inconnue dans la sauvegarde est sautée', () => {
    const partie = restaurer({ regions: ['atlantide', 'corse'], etat: 'en-cours' }, BRETAGNE, 'nouvelles')
    expect(partie.essais.map((essai) => essai.region.id)).toEqual(['corse'])
  })
})

describe('La sauvegarde du bonus', () => {
  // la partie n° 1 : la Normandie, dont le bonus du jour demande 76, 27, 50, 61 puis 14 (voir reference.json)
  const NORMANDIE = regionDuNumero(1)
  const gagnee = () => proposer(nouvellePartie(NORMANDIE, 'nouvelles'), 'Normandie')!
  // le bonus du jour (mode C), après ces réponses : [département choisi, département donné]
  const repondu = (...paires: [string, string][]) =>
    paires.reduce(
      (bonus, [choisi, donne]) => repondreChoix(bonus, parCode(choisi)!, parCode(donne)!) as Bonus,
      bonusDuJour(NORMANDIE, 1),
    )

  it('un bonus commencé se retrouve tel quel, avec ses réponses', () => {
    enregistrer(1, gagnee())
    enregistrerBonus(1, repondu(['76', '76'], ['27', '14']))
    // des paires [demandé, donné] : 76 demandé, 76 donné ; puis 27 demandé, 14 donné
    expect(lire().get(1)!.bonus).toEqual({
      paires: [
        ['76', '76'],
        ['27', '14'],
      ],
      etat: 'en-cours',
    })
    expect(restaurerBonus(1, lire().get(1))).toEqual(repondu(['76', '76'], ['27', '14']))
  })

  it('une sauvegarde de web.7 (les numéros donnés, sans paires) se relit avec l’ordre du jour', () => {
    localStorage.setItem(
      CLE,
      JSON.stringify({ 1: { regions: ['normandie'], etat: 'gagnee', bonus: { reponses: ['76', '14'], etat: 'en-cours' } } }),
    )
    // 76 puis 27 demandés dans l'ordre du jour ; le bonus continue en mode C (web.7.6)
    expect(restaurerBonus(1, lire().get(1))).toEqual(repondu(['76', '76'], ['27', '14']))
  })

  it('une paire impossible (département hors de la région, ou déjà répondu) arrête la relecture', () => {
    localStorage.setItem(
      CLE,
      JSON.stringify({
        1: {
          regions: ['normandie'],
          etat: 'gagnee',
          bonus: {
            paires: [
              ['76', '76'],
              ['76', '14'],
              ['27', '27'],
            ],
            etat: 'en-cours',
          },
        },
      }),
    )
    expect(restaurerBonus(1, lire().get(1))!.tentatives).toHaveLength(1)
  })

  it('un bonus pas commencé n’est pas sauvé : il reste à jouer', () => {
    enregistrer(1, gagnee())
    enregistrerBonus(1, passer(bonusDuJour(NORMANDIE, 1)))
    expect(lire().get(1)!.bonus).toBeUndefined()
    expect(restaurerBonus(1, lire().get(1))).toBeUndefined()
  })

  it('passé après une réponse, il est fini avec son score partiel, et compte dans les résultats', () => {
    enregistrer(1, gagnee())
    enregistrerBonus(1, passer(repondu(['76', '76'])))
    const bonus = restaurerBonus(1, lire().get(1))!
    expect(bonus.etat).toBe('passe')
    expect(resultats(lire()).get(1)).toEqual({ etat: 'gagnee', essais: 1, bonus: { score: 1, total: 5 } })
  })

  it('un bonus en cours ne compte pas encore dans les résultats', () => {
    enregistrer(1, gagnee())
    enregistrerBonus(1, repondu(['76', '76']))
    expect(resultats(lire()).get(1)).toEqual({ etat: 'gagnee', essais: 1 })
  })

  it('réenregistrer la partie garde le bonus', () => {
    enregistrer(1, gagnee())
    enregistrerBonus(1, repondu(['76', '76']))
    enregistrer(1, gagnee())
    expect(lire().get(1)!.bonus?.paires).toEqual([['76', '76']])
  })

  it('une sauvegarde d’avant web.7 (sans bonus) reste lisible ; un bonus abîmé rend la partie illisible', () => {
    localStorage.setItem(
      CLE,
      JSON.stringify({
        1: { regions: ['normandie'], etat: 'gagnee' },
        2: { regions: ['corse'], etat: 'gagnee', bonus: { reponses: 'non', etat: 'termine' } },
        3: { regions: ['corse'], etat: 'gagnee', bonus: { paires: [['2A']], etat: 'termine' } },
      }),
    )
    expect([...lire().keys()]).toEqual([1])
  })
})
