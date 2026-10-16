/*
Les tests de web.4 à l'écran : les réglages (thème, unité, modes difficiles) et la partie libre.
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { angleDuJour, regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts)
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const AUTRES = tirables('nouvelles').filter((region) => region !== CIBLE)

type Joueur = ReturnType<typeof userEvent.setup>

function demarrer() {
  const joueur = userEvent.setup()
  render(<App />)
  return joueur
}

// le panneau de l'onglet affiché (l'autre est caché, donc ignoré par getByRole)
const panneau = () => screen.getByRole('tabpanel')

async function proposer(joueur: Joueur, nom: string) {
  const champ = within(panneau()).getByRole('combobox')
  await joueur.clear(champ)
  await joueur.type(champ, `${nom}{Escape}{Enter}`)
}

async function regler(joueur: Joueur, ...libelles: string[]) {
  await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
  const fenetre = screen.getByRole('dialog', { name: 'Réglages' })
  for (const libelle of libelles) {
    await joueur.click(within(fenetre).getByLabelText(libelle, { exact: false }))
  }
  await joueur.click(within(fenetre).getByRole('button', { name: 'Fermer' }))
}

const silhouette = () => within(panneau()).getAllByRole('img')[0]

describe('Les réglages', () => {
  it('le thème sombre pose la classe « dark » sur la page, et reste choisi au retour', async () => {
    const joueur = demarrer()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    await regler(joueur, 'Sombre')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    cleanup()
    render(<App />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    await regler(userEvent.setup(), 'Clair')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('les distances en miles', async () => {
    const joueur = demarrer()
    await regler(joueur, 'Miles')
    await proposer(joueur, AUTRES[0].nom.fr)
    expect(within(panneau()).getByRole('table').textContent).toMatch(/\d\smi/)
  })

  it('la rotation 🌀 tourne la silhouette de l’angle du jour', async () => {
    const joueur = demarrer()
    await regler(joueur, 'Rotation')
    expect(silhouette().getAttribute('alt')).toBe('La silhouette de la région à deviner, tournée')
    expect(silhouette().style.transform).toContain(`rotate(${angleDuJour(DATE)}deg)`)
  })

  it('l’image cachée 🙈 remplace la silhouette', async () => {
    const joueur = demarrer()
    await regler(joueur, 'Image cachée')
    expect(silhouette().getAttribute('alt')).toMatch(/^Silhouette cachée/)
  })

  it('les modes sont fixés au premier essai : un changement ensuite ne compte pas', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await regler(joueur, 'Image cachée')
    expect(silhouette().getAttribute('alt')).toBe('La silhouette de la région à deviner')
    await proposer(joueur, CIBLE.nom.fr)
    await joueur.click(screen.getByRole('button', { name: /Partager/ }))
    expect((await navigator.clipboard.readText()).split('\n')[0]).toBe('#Francle n° 2 2/6')
  })

  it('une partie jouée en mode difficile le montre dans le partage, et le garde au retour', async () => {
    const joueur = demarrer()
    await regler(joueur, 'Rotation', 'Image cachée')
    await proposer(joueur, AUTRES[0].nom.fr)
    // on revient avec les modes désactivés : la partie commencée garde les siens
    await regler(joueur, 'Rotation', 'Image cachée')
    cleanup()
    const joueur2 = demarrer()
    expect(silhouette().getAttribute('alt')).toMatch(/^Silhouette cachée/)
    await proposer(joueur2, CIBLE.nom.fr)
    await joueur2.click(screen.getByRole('button', { name: /Partager/ }))
    expect((await navigator.clipboard.readText()).split('\n')[0]).toBe('#Francle n° 2 2/6 🌀🙈')
  })
})

describe('La partie libre', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Math.random truqué : 0 tire la première région de l'époque, et un angle de 0°
  function premiereRegion(mode: 'nouvelles' | 'anciennes') {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    return tirables(mode)[0]
  }

  it('se joue dans son onglet, sans toucher à la partie du jour', async () => {
    const cible = premiereRegion('nouvelles')
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)

    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Francle')
    expect(within(panneau()).queryAllByRole('row').filter((ligne) => ligne.closest('tbody'))).toHaveLength(0)
    await proposer(joueur, cible.nom.fr)
    const resultats = screen.getByRole('dialog', { name: 'Résultats' })
    expect(within(resultats).getByText('Bravo, trouvé du premier coup !')).toBeDefined()
    // ni partage ni compte à rebours en partie libre
    expect(within(resultats).queryByRole('button', { name: /Partager/ })).toBeNull()
    await joueur.click(within(resultats).getByRole('button', { name: 'Nouvelle partie' }))
    expect(within(panneau()).getByRole('combobox')).toBeDefined()

    // la partie du jour a gardé son essai, et la partie libre ne compte pas dans les statistiques
    await joueur.click(screen.getByRole('tab', { name: 'Partie du jour' }))
    expect(within(panneau()).getByRole('table').textContent).toContain(AUTRES[0].nom.fr)
    await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
    const stats = screen.getByRole('dialog', { name: 'Statistiques' })
    expect(within(stats).getByText('Parties').nextElementSibling?.textContent).toBe('0')
  })

  it('les anciennes régions se jouent quand on choisit leur époque', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    // Picardie n'existe pas dans les régions actuelles : refusée
    await proposer(joueur, 'Picardie')
    expect(within(panneau()).getByText('Cette région n’existe pas, ou n’est pas dans le jeu.')).toBeDefined()

    const cible = premiereRegion('anciennes')
    await joueur.click(screen.getByRole('radio', { name: 'Anciennes régions (avant 2016)' }))
    await proposer(joueur, cible.nom.fr)
    expect(within(screen.getByRole('dialog', { name: 'Résultats' })).getByText(cible.nom.fr)).toBeDefined()
  })

  it('perdre une partie libre ne renvoie pas à demain', async () => {
    const cible = premiereRegion('nouvelles')
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    for (const region of tirables('nouvelles').filter((r) => r !== cible).slice(0, 6)) {
      await proposer(joueur, region.nom.fr)
    }
    expect(within(screen.getByRole('dialog', { name: 'Résultats' })).getByText('Perdu !')).toBeDefined()
  })

  it('les onglets se parcourent au clavier avec les flèches', async () => {
    const joueur = demarrer()
    screen.getByRole('tab', { name: 'Partie du jour' }).focus()
    await joueur.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Partie libre' }).getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Partie libre' }))
  })
})
