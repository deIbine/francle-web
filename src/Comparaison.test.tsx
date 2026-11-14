/*
Le lien de comparaison (web.9.1.3) : l'envoyer depuis les statistiques, et arriver par lui. L'horloge des tests est
arrêtée au 14 octobre 2026 (la partie n° 2, voir preparationTests.ts).
 */
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { bilanDuFragment } from './domaine/comparaison.ts'
import { coder, lire as lireBilan } from './domaine/lien.ts'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import type { Resultat } from './domaine/statistiques.ts'
import { CLE } from './sauvegarde.ts'

// la veille (n° 1) : trouvée du premier coup, silhouette tournée -> 7 points
function avecUnePartieHier() {
  localStorage.setItem(
    CLE,
    JSON.stringify({ 1: { regions: [regionDuNumero(1).id], etat: 'gagnee', modes: { rotation: true, cachee: false } } }),
  )
}

// le lien d'un ami qui a trouvé la région de la veille en 3 essais (4 points), envoyé ce jour (n° 2)
const AMI = new Map<number, Resultat>([[1, { etat: 'gagnee', essais: 3, modes: { rotation: false, cachee: false } }]])
const FRAGMENT = '#bilan=' + coder(AMI, 2)

// remet l'adresse sans fragment entre deux tests (jsdom garde l'adresse d'un test à l'autre)
afterEach(() => window.history.replaceState(null, '', '/'))

// la ligne du tableau qui porte ce nom : [toi, ton ami]
function ligne(fenetre: HTMLElement, nom: string): string[] {
  const entete = within(fenetre).getByRole('rowheader', { name: nom })
  return within(entete.closest('tr')!)
    .getAllByRole('cell')
    .map((cellule) => cellule.textContent ?? '')
}

describe('Envoyer son bilan', () => {
  it('le bouton du résumé copie un lien qui contient les parties finies', async () => {
    avecUnePartieHier()
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
    const fenetre = screen.getByRole('dialog', { name: 'Statistiques' })
    await joueur.click(within(fenetre).getByRole('button', { name: 'Envoyer mon bilan 🤝' }))
    // une espace ordinaire : getByText normalise les espaces du texte affiché (l'espace insécable comprise), pas celles
    // du texte cherché
    expect(within(fenetre).getByText('Lien copié : il n’y a plus qu’à le coller.')).toBeDefined()
    const texte = await navigator.clipboard.readText()
    expect(texte.startsWith('Compare ton Francle au mien : https://deibine.github.io/francle-web/#bilan=')).toBe(
      true,
    )
    const bilan = lireBilan(bilanDuFragment(new URL(texte.split(' ').at(-1)!).hash)!)
    expect(bilan?.jourDuLien).toBe(2)
    expect(bilan?.parties.get(1)).toMatchObject({ etat: 'gagnee', essais: 1, modes: { rotation: true } })
  })

  it('sans partie finie, rien à envoyer : pas de bouton', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
    expect(screen.queryByRole('button', { name: 'Envoyer mon bilan 🤝' })).toBeNull()
  })
})

describe('Arriver par le lien d’un ami', () => {
  it('les deux bilans côte à côte, le meilleur mis en avant, puis le face-à-face', () => {
    avecUnePartieHier()
    window.history.replaceState(null, '', '/' + FRAGMENT)
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Comparaison' })
    expect(within(fenetre).getByText('Le bilan de ton ami, envoyé le 14 octobre 2026.')).toBeDefined()
    expect(ligne(fenetre, 'Points depuis toujours')).toEqual(['7 ★ (meilleur)', '4'])
    // moins d'essais, c'est mieux
    expect(ligne(fenetre, 'Essais par victoire')).toEqual(['1 ★ (meilleur)', '3'])
    // le nombre de parties n'est ni bien ni mal
    expect(ligne(fenetre, 'Parties')).toEqual(['1', '1'])
    expect(within(fenetre).getByText(/Sur le jour joué par vous deux/).textContent).toBe(
      'Sur le jour joué par vous deux : 1 pour toi, 0 pour ton ami, 0 égalité.',
    )
  })

  it('fermer la fenêtre retire le lien de l’adresse', async () => {
    window.history.replaceState(null, '', '/' + FRAGMENT)
    const joueur = userEvent.setup()
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Comparaison' })
    await joueur.click(within(fenetre).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('un lien abîmé le dit, sans casser la page', () => {
    window.history.replaceState(null, '', '/#bilan=1.2.1.E')
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Comparaison' })
    expect(within(fenetre).getByText(/Ce lien de comparaison est illisible/)).toBeDefined()
  })

  it('un lien collé dans un onglet déjà ouvert sur le jeu ouvre la comparaison, sans recharger', async () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await act(async () => {
      window.history.replaceState(null, '', '/' + FRAGMENT)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('dialog', { name: 'Comparaison' })).toBeDefined()
  })

  it('la partie du jour déjà finie : ses résultats ne s’ouvrent pas par-dessus la comparaison', () => {
    localStorage.setItem(CLE, JSON.stringify({ 2: { regions: [regionDuNumero(2).id], etat: 'gagnee' } }))
    window.history.replaceState(null, '', '/' + FRAGMENT)
    render(<App />)
    // une seule fenêtre ouverte (une fenêtre fermée est cachée : getAllByRole ne la trouve pas)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog', { name: 'Comparaison' })).toBeDefined()
  })

  it('à la première visite, « Comment jouer » d’abord, la comparaison ensuite', async () => {
    localStorage.removeItem('francle.aide-vue.v1')
    window.history.replaceState(null, '', '/' + FRAGMENT)
    const joueur = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('dialog', { name: 'Comparaison' })).toBeNull()
    await joueur.click(within(screen.getByRole('dialog', { name: 'Comment jouer' })).getByRole('button', { name: 'Fermer' }))
    expect(screen.getByRole('dialog', { name: 'Comparaison' })).toBeDefined()
  })
})
