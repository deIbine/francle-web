/*
La page de confidentialité (web.9.2.3) : ouverte par le bas de page, par les réglages ou par l'adresse
…/#confidentialite ; elle montre les numéros tirés des parties envoyées, pour en demander la suppression.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { CLE } from './sauvegarde.ts'

afterEach(() => window.history.replaceState(null, '', '/'))

describe('La page de confidentialité', () => {
  it('s’ouvre par le bas de page, et dit ce qui est envoyé, gardé, et comment refuser', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Confidentialité' }))
    const page = screen.getByRole('dialog', { name: 'Confidentialité' })
    for (const titre of ['Ce qui est envoyé', 'Ce qui est gardé, et où', 'Combien de temps', 'Refuser']) {
      expect(within(page).getByRole('heading', { name: titre })).toBeDefined()
    }
    expect(within(page).getByText(/dans l’Union européenne/)).toBeDefined()
    expect(within(page).getByRole('link', { name: 'Ouvrir un ticket sur GitHub' }).getAttribute('href')).toBe(
      'https://github.com/deIbine/francle-web/issues/new',
    )
  })

  it('s’ouvre par l’adresse …/#confidentialite, et la fermer nettoie l’adresse', async () => {
    window.history.replaceState(null, '', '/#confidentialite')
    const joueur = userEvent.setup()
    render(<App />)
    const page = screen.getByRole('dialog', { name: 'Confidentialité' })
    await joueur.click(within(page).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('par l’adresse, avec une partie du jour finie : les résultats ne s’ouvrent pas par-dessus', () => {
    localStorage.setItem(CLE, JSON.stringify({ 2: { regions: [], etat: 'abandonnee' } }))
    window.history.replaceState(null, '', '/#confidentialite')
    render(<App />)
    expect(screen.getByRole('dialog', { name: 'Confidentialité' })).toBeDefined()
    expect(screen.queryByRole('dialog', { name: 'Résultats' })).toBeNull()
  })

  it('s’ouvre aussi quand le lien arrive dans un onglet déjà sur le jeu (le fragment seul change)', async () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
    window.location.hash = '#confidentialite'
    expect(await screen.findByRole('dialog', { name: 'Confidentialité' })).toBeDefined()
  })

  it('s’ouvre depuis les réglages, qui se ferment (une fenêtre à la fois)', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
    await joueur.click(screen.getByRole('button', { name: 'Ce qui est envoyé, et pourquoi' }))
    expect(screen.queryByRole('dialog', { name: 'Réglages' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Confidentialité' })).toBeDefined()
  })

  it('montre les numéros tirés des seules parties envoyées, la plus récente d’abord', async () => {
    localStorage.setItem(
      CLE,
      JSON.stringify({
        1: { regions: [], etat: 'abandonnee', tirage: 'a'.repeat(32), envoyee: 'abandonnee.0.-.0' },
        2: { regions: [], etat: 'abandonnee', tirage: 'b'.repeat(32), envoyee: 'abandonnee.0.-.0' },
        // tirée, mais pas encore reçue par le serveur : rien à supprimer chez lui
        3: { regions: [], etat: 'abandonnee', tirage: 'c'.repeat(32) },
      }),
    )
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Confidentialité' }))
    const page = screen.getByRole('dialog', { name: 'Confidentialité' })
    await joueur.click(within(page).getByText('Mes numéros tirés'))
    const lignes = within(page).getAllByRole('listitem').map((ligne) => ligne.textContent)
    expect(lignes).toEqual([`14/10/2026 : ${'b'.repeat(32)}`, `13/10/2026 : ${'a'.repeat(32)}`])
  })

  it('en anglais aussi', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'EN' }))
    await joueur.click(screen.getByRole('button', { name: 'Privacy' }))
    expect(screen.getByRole('dialog', { name: 'Privacy' })).toBeDefined()
    expect(screen.getByText('No game sent yet.', { exact: false })).toBeDefined()
  })
})
