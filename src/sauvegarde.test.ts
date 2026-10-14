import { describe, expect, it } from 'vitest'
import { abandonner, nouvellePartie, proposer, type Partie } from './domaine/partie.ts'
import { parId } from './domaine/regions.ts'
import { CLE, enregistrer, lire, restaurer, resultats } from './sauvegarde.ts'

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
    expect(sauvee).toEqual({ regions: ['normandie', 'bretagne'], etat: 'gagnee' })
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
