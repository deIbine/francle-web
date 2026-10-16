/*
Les tests de web.6 : « Comment jouer », le bas de page, et une vérification automatique de l'accessibilité avec axe
(la bibliothèque d'accessibilité la plus utilisée, aussi dans les outils de développement des navigateurs).

axe parcourt la page et signale ce qui gêne un lecteur d'écran ou une navigation au clavier : image sans texte
alternatif, bouton sans nom, champ sans étiquette, identifiant en double, rôle ARIA mal employé… Le contraste des
couleurs, lui, ne peut pas être mesuré dans jsdom (il ne dessine rien) : il se vérifie dans un vrai navigateur.
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'
import { CLE_AIDE } from './reglages.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts)
const DATE = new Date(2026, 9, 14, 12)

// les problèmes trouvés par axe dans la page, résumés : « règle : élément fautif »
async function problemes(): Promise<string[]> {
  const resultat = await axe.run(document.body)
  return resultat.violations.flatMap((violation) =>
    violation.nodes.map((noeud) => `${violation.id} : ${noeud.html.slice(0, 120)}`),
  )
}

describe('Comment jouer', () => {
  it('s’ouvre à la première visite, puis plus jamais tout seul', async () => {
    localStorage.removeItem(CLE_AIDE)
    const joueur = userEvent.setup()
    render(<App />)
    const aide = screen.getByRole('dialog', { name: 'Comment jouer' })
    // l'exemple est un vrai essai : la Normandie proposée pour la Bretagne
    expect(within(aide).getByText(/Normandie · .*\skm · .* · \d+\s%/)).toBeDefined()
    await joueur.click(within(aide).getByRole('button', { name: 'Jouer' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    cleanup()
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('se rouvre avec le bouton ❓', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Comment jouer' }))
    expect(screen.getByRole('dialog', { name: 'Comment jouer' })).toBeDefined()
  })
})

describe('Le bas de page', () => {
  it('cite les sources et le code, et dit qu’aucune donnée n’est collectée', () => {
    render(<App />)
    const pied = screen.getByRole('contentinfo')
    expect(within(pied).getByRole('link', { name: /^Contours des régions\s:\sIGN et INSEE$/ })).toBeDefined()
    expect(within(pied).getByRole('link', { name: 'licence ouverte Etalab' })).toBeDefined()
    expect(within(pied).getByRole('link', { name: 'Inspiré de Worldle' })).toBeDefined()
    expect(within(pied).getByRole('link', { name: 'Code source' }).getAttribute('href')).toBe(
      'https://github.com/deIbine/francle-web',
    )
    expect(within(pied).getByText(/Aucune donnée collectée/)).toBeDefined()
  })
})

describe('L’accessibilité (axe)', () => {
  // un test qui ne trouve jamais rien est suspect : on vérifie d'abord qu'axe signale bien un vrai problème
  it('axe repère une image sans texte alternatif et un bouton sans nom', async () => {
    render(
      <main>
        <img src="x.svg" />
        <button type="button"></button>
      </main>,
    )
    const trouves = await problemes()
    expect(trouves.some((probleme) => probleme.startsWith('image-alt'))).toBe(true)
    expect(trouves.some((probleme) => probleme.startsWith('button-name'))).toBe(true)
  })

  it('la page de départ', async () => {
    render(<App />)
    expect(await problemes()).toEqual([])
  })

  it('« Comment jouer » ouvert', async () => {
    localStorage.removeItem(CLE_AIDE)
    render(<App />)
    expect(await problemes()).toEqual([])
  })

  it('les réglages ouverts', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
    expect(await problemes()).toEqual([])
  })

  it('une partie en cours, avec ses suggestions ouvertes', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    const champ = screen.getByRole('combobox')
    await joueur.type(champ, 'Normandie{Escape}{Enter}')
    await joueur.type(champ, 'lo{ArrowDown}')
    expect(await problemes()).toEqual([])
  })

  it('la liste des régions ouverte, avec une région déjà proposée', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    const autre = tirables('nouvelles').find((region) => region !== regionDuJour(DATE))!
    await joueur.type(screen.getByRole('combobox'), `${autre.nom.fr}{Escape}{Enter}`)
    await joueur.click(screen.getByRole('button', { name: 'Voir la liste des régions' }))
    expect(screen.getByRole('dialog', { name: 'Liste des régions' })).toBeDefined()
    expect(await problemes()).toEqual([])
  })

  it('la fenêtre de résultats, avec la carte et les statistiques', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.type(screen.getByRole('combobox'), `${regionDuJour(DATE).nom.fr}{Escape}{Enter}`)
    expect(screen.getByRole('dialog', { name: 'Résultats' })).toBeDefined()
    expect(await problemes()).toEqual([])
  })

  it('la partie libre, en anglais', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await joueur.click(screen.getByRole('button', { name: 'Switch to English' }))
    await joueur.click(screen.getByRole('tab', { name: 'Free play' }))
    expect(await problemes()).toEqual([])
  })
})
