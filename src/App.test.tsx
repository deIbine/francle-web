/*
Les tests de l'écran : on affiche le jeu dans un faux navigateur (jsdom), puis on joue comme un joueur, avec
user-event qui tape au clavier et clique comme une vraie personne (touche par touche, focus compris).

On cherche les éléments comme un joueur ou un lecteur d'écran les trouve : par leur rôle (« combobox », « button »)
et leur texte, jamais par une classe CSS. Le test ne casse donc pas si on change l'apparence.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'

// le 14 octobre 2026 : la partie n° 2
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const AUTRES = tirables('nouvelles').filter((region) => region !== CIBLE)

function demarrer() {
  const joueur = userEvent.setup()
  render(<App date={DATE} />)
  return joueur
}

async function proposer(joueur: ReturnType<typeof userEvent.setup>, nom: string) {
  const champ = screen.getByRole('combobox', { name: 'Ta proposition' })
  await joueur.clear(champ)
  // {Escape} ferme les suggestions, {Enter} envoie le texte tapé
  await joueur.type(champ, `${nom}{Escape}{Enter}`)
}

// les lignes du tableau des essais déjà jouées (les lignes vides sont cachées aux lecteurs d'écran)
function lignes() {
  const tableau = screen.getByRole('table', { name: 'Tes essais' })
  return within(tableau).queryAllByRole('row').filter((ligne) => ligne.closest('tbody') !== null)
}

describe('Le jeu', () => {
  it('affiche le titre, le numéro de la partie et la silhouette', () => {
    demarrer()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Francle n° 2')
    expect(screen.getByRole('img', { name: 'La silhouette de la région à deviner' })).toBeDefined()
    expect(lignes()).toHaveLength(0)
  })

  it('un essai raté ajoute une ligne et révèle le premier indice', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    expect(lignes()).toHaveLength(1)
    expect(lignes()[0].textContent).toContain(AUTRES[0].nom.fr)
    expect(lignes()[0].textContent).toMatch(/km.*%/)
    expect(screen.getByText('Superficie')).toBeDefined()
    expect(screen.queryByText('Spécialité')).toBeNull()
    // le champ est vidé, prêt pour l'essai suivant
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('')
  })

  it('une région inconnue ne coûte pas d’essai', async () => {
    const joueur = demarrer()
    await proposer(joueur, 'Atlantide')
    expect(screen.getByText('Cette région n’existe pas, ou n’est pas dans le jeu.')).toBeDefined()
    expect(lignes()).toHaveLength(0)
  })

  it('une ancienne région n’est pas acceptée dans la partie du jour', async () => {
    const joueur = demarrer()
    await proposer(joueur, 'Picardie')
    expect(lignes()).toHaveLength(0)
  })

  it('une région déjà proposée ne coûte pas d’essai', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, AUTRES[0].nom.en)
    expect(screen.getByText(`${AUTRES[0].nom.fr} : déjà proposée.`)).toBeDefined()
    expect(lignes()).toHaveLength(1)
  })

  it('trouver la région termine la partie, avec la carte', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, CIBLE.nom.fr)
    expect(screen.getByText('Bravo, trouvé en 2 essais !')).toBeDefined()
    expect(screen.getByRole('img', { name: `Carte de France, la région ${CIBLE.nom.fr} en bleu` })).toBeDefined()
    expect(lignes()[1].textContent).toContain('100 %')
    // plus de saisie ni de bouton « Abandonner » une fois la partie finie
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Abandonner' })).toBeNull()
  })

  it('six essais ratés : la partie est perdue, et les cinq indices ont été révélés', async () => {
    const joueur = demarrer()
    for (const region of AUTRES.slice(0, 6)) {
      await proposer(joueur, region.nom.fr)
    }
    expect(screen.getByText('Perdu, ce sera pour demain.')).toBeDefined()
    expect(screen.getByText(CIBLE.nom.fr, { selector: 'strong' })).toBeDefined()
    for (const indice of ['Superficie', 'Spécialité', 'Personnalité', 'Capitale', 'Monument']) {
      expect(screen.getByText(indice)).toBeDefined()
    }
  })

  it('abandonner demande une confirmation', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Abandonner' }))
    await joueur.click(screen.getByRole('button', { name: 'Non' }))
    expect(screen.getByRole('combobox')).toBeDefined()

    await joueur.click(screen.getByRole('button', { name: 'Abandonner' }))
    await joueur.click(screen.getByRole('button', { name: 'Oui' }))
    expect(screen.getByText('Partie abandonnée.')).toBeDefined()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
