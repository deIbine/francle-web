/*
Les tests de web.5 : le jeu en anglais, la langue du navigateur, le bouton FR / EN, et l'unité qui suit la langue.
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { REGIONS, tirables } from './domaine/regions.ts'

const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const AUTRE = tirables('nouvelles').find((region) => region !== CIBLE)!

type Joueur = ReturnType<typeof userEvent.setup>

// fait croire au faux navigateur que son utilisateur préfère cette langue
function navigateurEn(langue: string) {
  Object.defineProperty(navigator, 'languages', { value: [langue], configurable: true })
  Object.defineProperty(navigator, 'language', { value: langue, configurable: true })
}

function demarrer() {
  const joueur = userEvent.setup()
  render(<App date={DATE} />)
  return joueur
}

const panneau = () => screen.getByRole('tabpanel')

async function proposer(joueur: Joueur, nom: string) {
  const champ = within(panneau()).getByRole('combobox')
  await joueur.clear(champ)
  await joueur.type(champ, `${nom}{Escape}{Enter}`)
}

describe('Le jeu en anglais', () => {
  afterEach(() => navigateurEn('fr-FR'))

  it('s’affiche en anglais pour un navigateur en anglais', () => {
    navigateurEn('en-US')
    demarrer()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Francle #2')
    expect(screen.getByRole('tab', { name: 'Daily game' })).toBeDefined()
    expect(screen.getByRole('combobox', { name: 'Your guess' })).toBeDefined()
    expect(document.documentElement.lang).toBe('en')
  })

  it('reste en français pour un navigateur en français (de France, de Belgique, du Canada…)', () => {
    navigateurEn('fr-CA')
    demarrer()
    expect(screen.getByRole('tab', { name: 'Partie du jour' })).toBeDefined()
    expect(document.documentElement.lang).toBe('fr')
  })

  it('le bouton FR / EN change de langue, et le choix est gardé', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Switch to English' }))
    expect(screen.getByRole('tab', { name: 'Daily game' })).toBeDefined()
    cleanup()
    const joueur2 = demarrer()
    expect(screen.getByRole('tab', { name: 'Daily game' })).toBeDefined()
    await joueur2.click(screen.getByRole('button', { name: 'Passer en français' }))
    expect(screen.getByRole('tab', { name: 'Partie du jour' })).toBeDefined()
  })

  it('suggestions, noms, indices et partage en anglais ; les noms français restent acceptés', async () => {
    navigateurEn('en-GB')
    const joueur = demarrer()
    const champ = within(panneau()).getByRole('combobox')
    await joueur.type(champ, 'bri')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Brittany'])
    await joueur.keyboard('{Escape}')

    // un nom français, tapé dans le jeu en anglais
    await proposer(joueur, AUTRE.nom.fr)
    expect(within(panneau()).getByRole('table').textContent).toContain(AUTRE.nom.en)
    expect(within(panneau()).getByText('Area')).toBeDefined()

    await proposer(joueur, CIBLE.nom.en)
    const resultats = screen.getByRole('dialog', { name: 'Results' })
    expect(within(resultats).getByText('Well done, found in 2 tries!')).toBeDefined()
    await joueur.click(within(resultats).getByRole('button', { name: /Share/ }))
    expect((await navigator.clipboard.readText()).split('\n')[0]).toBe('#Francle #2 2/6')
  })
})

describe('L’unité suit la langue, tant que le joueur ne l’a pas choisie', () => {
  afterEach(() => navigateurEn('fr-FR'))

  async function distanceAffichee(joueur: Joueur) {
    await proposer(joueur, AUTRE.nom.fr)
    return within(panneau()).getByRole('table').textContent
  }

  it('miles en anglais, kilomètres en français', async () => {
    navigateurEn('en-US')
    expect(await distanceAffichee(demarrer())).toMatch(/\d\smi/)
    cleanup()
    navigateurEn('fr-FR')
    localStorage.clear()
    expect(await distanceAffichee(demarrer())).toMatch(/\d\skm/)
  })

  it('une unité choisie l’emporte, même après un changement de langue', async () => {
    navigateurEn('en-US')
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Open settings' }))
    const reglages = screen.getByRole('dialog', { name: 'Settings' })
    await joueur.click(within(reglages).getByLabelText('Kilometres'))
    await joueur.click(within(reglages).getByRole('button', { name: 'Close' }))
    await joueur.click(screen.getByRole('button', { name: 'Passer en français' }))
    await joueur.click(screen.getByRole('button', { name: 'Switch to English' }))
    expect(await distanceAffichee(joueur)).toMatch(/\d\skm/)
  })
})

describe('Les données en anglais', () => {
  it('pas d’explication entre parenthèses dans les indices anglais', () => {
    for (const region of REGIONS) {
      for (const texte of [region.specialite, region.personnalite, region.monument]) {
        expect(texte.en, region.id).not.toMatch(/[()]/)
      }
    }
  })
})
