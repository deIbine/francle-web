import { describe, expect, it } from 'vitest'
import { carres, textePartage } from './partage.ts'
import { abandonner, nouvellePartie, proposer, type Partie } from './partie.ts'
import { parId } from './regions.ts'

function jouer(cible: string, ...propositions: string[]): Partie {
  let partie = nouvellePartie(parId(cible), 'nouvelles')
  for (const proposition of propositions) {
    partie = proposer(partie, proposition) ?? partie
  }
  return partie
}

describe('Le partage', () => {
  it('le score du bonus des départements, une fois fini, après les carrés', () => {
    const partie = jouer('bretagne', 'Normandie', 'Bretagne')
    const lignes = textePartage(partie, 12, undefined, 'fr', { score: 3, total: 4 }).split('\n')
    expect(lignes.slice(-2)).toEqual(['🗺️ 3/4', 'https://deibine.github.io/francle-web/'])
    expect(textePartage(partie, 12)).not.toContain('🗺️')
  })

  it.each([
    [100, '🟩🟩🟩🟩🟩'],
    [99, '🟩🟩🟩🟩🟨'],
    [87, '🟩🟩🟩🟩⬜'],
    [90, '🟩🟩🟩🟩🟨'],
    [42, '🟩🟩⬜⬜⬜'],
    [10, '🟨⬜⬜⬜⬜'],
    [9, '⬜⬜⬜⬜⬜'],
    [0, '⬜⬜⬜⬜⬜'],
  ])('%i %% donne %s', (proximite, attendu) => {
    expect(carres(proximite)).toBe(attendu)
  })

  it('une partie gagnée : le score, une ligne par essai, l’adresse du site', () => {
    const partie = jouer('bretagne', 'Normandie', 'Pays de la Loire', 'Bretagne')
    const lignes = textePartage(partie, 12).split('\n')
    expect(lignes[0]).toBe('#Francle n° 12 3/6')
    expect(lignes).toHaveLength(5)
    expect(lignes[3]).toBe('🟩🟩🟩🟩🟩🎉')
    expect(lignes[4]).toBe('https://deibine.github.io/francle-web/')
    // chaque ligne d'essai : cinq carrés et une flèche
    for (const [index, essai] of partie.essais.entries()) {
      expect(lignes[index + 1].startsWith(carres(essai.proximite))).toBe(true)
    }
  })

  it('le texte ne dévoile ni la réponse ni les régions proposées', () => {
    const texte = textePartage(jouer('bretagne', 'Normandie', 'Bretagne'), 1)
    expect(texte).not.toMatch(/Bretagne|Normandie/)
  })

  it('une partie perdue ou abandonnée a pour score X/6', () => {
    const perdue = jouer('bretagne', 'Corse', 'Normandie', 'Occitanie', 'Grand Est', 'Guyane', 'Mayotte')
    expect(textePartage(perdue, 3).split('\n')[0]).toBe('#Francle n° 3 X/6')
    const abandonnee = abandonner(jouer('bretagne', 'Corse'))
    expect(textePartage(abandonnee, 4)).toMatch(/^#Francle n° 4 X\/6\n[🟩🟨⬜]+/u)
  })
})
