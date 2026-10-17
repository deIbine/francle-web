/*
Les tests de la liste des régions (bouton 📃 de l'en-tête), à l'écran comme un joueur.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts)
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const AUTRE = tirables('nouvelles').find((region) => region !== CIBLE)!

function demarrer() {
  const joueur = userEvent.setup()
  render(<App />)
  return joueur
}

async function ouvrirListe(joueur: ReturnType<typeof userEvent.setup>) {
  await joueur.click(screen.getByRole('button', { name: 'Voir la liste des régions' }))
  return screen.getByRole('dialog', { name: 'Liste des régions' })
}

// les lignes du tableau des essais de l'onglet affiché
const lignes = () =>
  within(screen.getByRole('tabpanel'))
    .queryAllByRole('row')
    .filter((ligne) => ligne.closest('tbody') !== null)

describe('La liste des régions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('montre les 18 régions de la partie du jour, par ordre alphabétique', async () => {
    const liste = await ouvrirListe(demarrer())
    const noms = within(liste)
      .getAllByRole('button')
      .map((bouton) => bouton.textContent)
      .filter((nom) => nom !== '✕')
    expect(noms).toHaveLength(18)
    expect(noms[0]).toBe('Auvergne-Rhône-Alpes')
    expect(noms).not.toContain('Picardie')
  })

  it('un clic sur un nom le propose, et la région est ensuite barrée', async () => {
    const joueur = demarrer()
    await joueur.click(within(await ouvrirListe(joueur)).getByRole('button', { name: AUTRE.nom.fr }))
    expect(screen.queryByRole('dialog', { name: 'Liste des régions' })).toBeNull()
    expect(lignes()).toHaveLength(1)
    expect(lignes()[0].textContent).toContain(AUTRE.nom.fr)

    const liste = await ouvrirListe(joueur)
    const proposee = within(liste).getByRole('button', { name: `${AUTRE.nom.fr}, déjà proposée` }) as HTMLButtonElement
    expect(proposee.disabled).toBe(true)
  })

  it('trouver la région depuis la liste lance le bonus ; ensuite plus rien ne se propose', async () => {
    const joueur = demarrer()
    await joueur.click(within(await ouvrirListe(joueur)).getByRole('button', { name: CIBLE.nom.fr }))
    expect(screen.getByRole('heading', { name: /^Bonus/ })).toBeDefined()

    const liste = await ouvrirListe(joueur)
    expect(within(liste).getByText('La partie est finie.')).toBeDefined()
    expect((within(liste).getByRole('button', { name: AUTRE.nom.fr }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('en partie libre, les régions de l’époque choisie', async () => {
    // Math.random truqué : la partie libre tire toujours la première région de l'époque
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    await joueur.click(screen.getByRole('radio', { name: 'Anciennes régions (avant 2016)' }))
    const liste = await ouvrirListe(joueur)
    expect(within(liste).getByRole('button', { name: 'Picardie' })).toBeDefined()
    expect(within(liste).queryByRole('button', { name: 'Hauts-de-France' })).toBeNull()
    expect(within(liste).getAllByRole('button')).toHaveLength(tirables('anciennes').length + 1) // + ✕

    // le clic joue dans la partie libre, pas dans la partie du jour
    const premiere = tirables('anciennes')[0]
    const autre = tirables('anciennes').find((region) => region !== premiere)!
    await joueur.click(within(liste).getByRole('button', { name: autre.nom.fr }))
    expect(lignes()).toHaveLength(1)
    await joueur.click(screen.getByRole('tab', { name: 'Partie du jour' }))
    expect(lignes()).toHaveLength(0)
  })

  it('un réglage masque le bouton 📃', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
    const reglages = screen.getByRole('dialog', { name: 'Réglages' })
    await joueur.click(within(reglages).getByLabelText('Bouton 📃', { exact: false }))
    expect(screen.queryByRole('button', { name: 'Voir la liste des régions' })).toBeNull()
  })
})
