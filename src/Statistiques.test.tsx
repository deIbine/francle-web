/*
La fenêtre des statistiques en onglets (web.9.1.2) : le score Francle dans le résumé, les détails, le calendrier.
L'horloge des tests est arrêtée au 14 octobre 2026 (la partie n° 2, voir preparationTests.ts).
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import { CLE } from './sauvegarde.ts'

// la veille (n° 1, le 13 octobre) : trouvée du premier coup, silhouette tournée -> 6 + 1 = 7 points
function avecUnePartieHier() {
  localStorage.setItem(
    CLE,
    JSON.stringify({ 1: { regions: [regionDuNumero(1).id], etat: 'gagnee', modes: { rotation: true, cachee: false } } }),
  )
}

async function ouvrir() {
  const joueur = userEvent.setup()
  render(<App />)
  await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
  return { joueur, fenetre: screen.getByRole('dialog', { name: 'Statistiques' }) }
}

describe('La fenêtre des statistiques', () => {
  it('le résumé montre le score Francle, ce mois-ci et depuis toujours', async () => {
    avecUnePartieHier()
    const { fenetre } = await ouvrir()
    expect(within(fenetre).getByRole('tab', { name: 'Résumé' }).getAttribute('aria-selected')).toBe('true')
    expect(within(fenetre).getByText('Ce mois-ci').nextElementSibling?.textContent).toBe('7 points')
    expect(within(fenetre).getByText('Depuis toujours').parentElement?.textContent).toContain(
      'moyenne 7 sur 1 partie',
    )
  })

  it('les onglets : un clic ou les flèches du clavier changent de panneau', async () => {
    avecUnePartieHier()
    const { joueur, fenetre } = await ouvrir()
    await joueur.click(within(fenetre).getByRole('tab', { name: 'Détails' }))
    expect(within(fenetre).getByText('Essais par victoire').nextElementSibling?.textContent).toBe('1')
    expect(within(fenetre).getByText('Les régions les mieux trouvées')).toBeDefined()
    expect(within(fenetre).getByText('🌀 Silhouette tournée').nextElementSibling?.textContent).toBe(
      '1 victoire sur 1',
    )
    // → depuis « Détails » : le calendrier, et le focus suit
    await joueur.keyboard('{ArrowRight}')
    const calendrier = within(fenetre).getByRole('tab', { name: 'Calendrier' })
    expect(calendrier.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(calendrier)
    // → depuis le dernier : retour au premier
    await joueur.keyboard('{ArrowRight}')
    expect(within(fenetre).getByRole('tab', { name: 'Résumé' }).getAttribute('aria-selected')).toBe('true')
  })

  it('le calendrier montre chaque jour du mois, sans aller avant le premier jour du jeu ni après aujourd’hui', async () => {
    avecUnePartieHier()
    const { joueur, fenetre } = await ouvrir()
    await joueur.click(within(fenetre).getByRole('tab', { name: 'Calendrier' }))
    expect(within(fenetre).getByRole('heading', { name: 'octobre 2026' })).toBeDefined()
    expect(
      within(fenetre).getByRole('img', { name: '13 octobre : trouvée en 1 essai, 7 points' }),
    ).toBeDefined()
    expect(within(fenetre).getByRole('img', { name: '14 octobre : pas jouée' })).toBeDefined()
    expect(within(fenetre).getByRole('button', { name: 'Mois précédent' })).toHaveProperty('disabled', true)
    expect(within(fenetre).getByRole('button', { name: 'Mois suivant' })).toHaveProperty('disabled', true)
  })

  it('sans partie finie, les détails le disent', async () => {
    const { joueur, fenetre } = await ouvrir()
    await joueur.click(within(fenetre).getByRole('tab', { name: 'Détails' }))
    expect(within(fenetre).getByText('Aucune partie finie pour l’instant.')).toBeDefined()
  })
})
