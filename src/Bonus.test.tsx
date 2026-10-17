/*
Les tests de web.7 à l'écran : le bonus des départements, après une victoire, en partie du jour et en partie libre.

On clique sur un département par son numéro (data-code), que le joueur ne voit pas : un lecteur d'écran n'y lit que
« Zone 3 sur 12 », pour ne pas donner la réponse.
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { ordreDuJour } from './domaine/bonus.ts'
import { departementsDe } from './domaine/departements.ts'
import { numero, regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'
import { PAUSE_FIN_BONUS } from './pause.ts'
import { lire } from './sauvegarde.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts) : la partie n° 2
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
// les départements dans l'ordre des questions du jour
const ORDRE = ordreDuJour(CIBLE, numero(DATE))
const TOTAL = ORDRE.length

type Joueur = ReturnType<typeof userEvent.setup>

// le panneau de l'onglet affiché (l'autre est caché, donc ignoré par getByRole)
const panneau = () => screen.getByRole('tabpanel')

function demarrer() {
  const joueur = userEvent.setup()
  render(<App />)
  return joueur
}

async function proposer(joueur: Joueur, nom: string) {
  const champ = within(panneau()).getByRole('combobox')
  await joueur.clear(champ)
  await joueur.type(champ, `${nom}{Escape}{Enter}`)
}

// gagne la partie affichée : le bonus commence tout de suite (depuis web.7.5)
async function gagner(joueur: Joueur, nom = CIBLE.nom.fr) {
  await proposer(joueur, nom)
}

// la fenêtre des résultats, si elle est ouverte (une fenêtre fermée est cachée, donc ignorée par queryByRole)
const resultats = () => screen.queryByRole('dialog', { name: 'Résultats' })

// la carte du bonus, une fois ses contours téléchargés (findBy… attend qu'elle apparaisse ; le premier fichier
// chargé dans un fichier de tests peut prendre plus d'une seconde, le délai par défaut)
const carte = () =>
  within(panneau()).findByRole('group', { name: 'Carte des départements de la région' }, { timeout: 5000 })

async function cliquer(joueur: Joueur, code: string) {
  const trace = (await carte()).querySelector(`[data-code="${code}"]`)
  if (trace === null) throw new Error(`Pas de tracé pour ${code}`)
  await joueur.click(trace)
}

describe('Le bonus des départements, partie du jour', () => {
  it('commence dès la victoire, à la place de la silhouette, sans ouvrir les résultats', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    expect(await carte()).toBeDefined()
    expect(resultats()).toBeNull()
    const titre = within(panneau()).getByRole('heading', { name: 'Bonus\u00a0: les départements' })
    // la saisie de la région a disparu : le focus du clavier est sur le titre du bonus
    expect(document.activeElement).toBe(titre)
    // le message de victoire reste sous le bonus
    expect(within(panneau()).getByRole('button', { name: 'Voir les résultats' })).toBeDefined()
    expect(within(panneau()).getByText(`Département 1 sur ${TOTAL}`)).toBeDefined()
    expect(within(panneau()).getByText(`Clique sur : ${ORDRE[0].nom}`)).toBeDefined()
    expect(within(panneau()).queryByRole('img', { name: /silhouette/ })).toBeNull()
  })

  it('une réponse juste ou fausse passe au département suivant, et la dit', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await cliquer(joueur, ORDRE[0].code)
    expect(within(panneau()).getByText(`Juste : ${ORDRE[0].nom} (${ORDRE[0].code}).`)).toBeDefined()
    expect(within(panneau()).getByText(`Département 2 sur ${TOTAL}`)).toBeDefined()
    await cliquer(joueur, ORDRE[0].code)
    expect(within(panneau()).getByText(new RegExp(`^Raté : c’était ${ORDRE[1].nom}`))).toBeDefined()
  })

  it('les zones ne disent pas leur nom pendant le bonus, et se jouent au clavier', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    const zones = within(await carte()).getAllByRole('button')
    expect(zones).toHaveLength(TOTAL)
    expect(zones.map((zone) => zone.getAttribute('aria-label'))).toEqual(
      zones.map((_, index) => `Zone ${index + 1} sur ${TOTAL}`),
    )
    const bonne = zones.find((zone) => zone.getAttribute('data-code') === ORDRE[0].code)!
    bonne.focus()
    await joueur.keyboard('{Enter}')
    expect(within(panneau()).getByText(/^Juste/)).toBeDefined()
  })

  it('« Passer » avant toute réponse : les résultats s’ouvrent, la silhouette revient, le bonus reste à jouer', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await carte()
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    await joueur.click(within(resultats()!).getByRole('button', { name: 'Fermer' }))
    expect(within(panneau()).getByRole('img', { name: /silhouette/ })).toBeDefined()
    expect(lire().get(2)?.bonus).toBeUndefined()
    await joueur.click(within(panneau()).getByRole('button', { name: '🗺️ Jouer le bonus' }))
    expect(within(panneau()).getByText(`Département 1 sur ${TOTAL}`)).toBeDefined()
  })

  it('« Passer » après une réponse : le bonus est fini, les résultats s’ouvrent avec son score, partagé et compté', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await cliquer(joueur, ORDRE[0].code)
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    expect(within(panneau()).getByText(`Bonus arrêté : 1 département trouvé sur ${TOTAL}.`)).toBeDefined()
    expect(within(panneau()).queryByRole('button', { name: '🗺️ Jouer le bonus' })).toBeNull()

    // le joueur a choisi d'arrêter : les résultats s'ouvrent sans pause
    const fenetre = resultats()!
    expect(within(fenetre).getByText('Bonus joués').nextElementSibling?.textContent).toBe('1')
    expect(within(fenetre).getByText('Score moyen').nextElementSibling?.textContent).toBe(
      `${Math.round(100 / TOTAL)}\u00a0%`,
    )
    await joueur.click(within(fenetre).getByRole('button', { name: /Partager/ }))
    expect((await navigator.clipboard.readText()).split('\n').at(-2)).toBe(`🗺️ 1/${TOTAL}`)
  })

  it('fini, les résultats s’ouvrent après une pause ; chaque département dit son nom et son résultat', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    for (const departement of ORDRE) {
      await cliquer(joueur, departement.code)
    }
    expect(within(panneau()).getByText(`Bonus terminé : ${TOTAL} départements trouvés sur ${TOTAL}.`)).toBeDefined()
    // pas tout de suite : le joueur voit d'abord sa dernière réponse sur la carte
    expect(resultats()).toBeNull()
    const fenetre = await screen.findByRole('dialog', { name: 'Résultats' }, { timeout: 3000 })
    await joueur.click(within(fenetre).getByRole('button', { name: /Partager/ }))
    expect((await navigator.clipboard.readText()).split('\n').at(-2)).toBe(`🗺️ ${TOTAL}/${TOTAL}`)
    await joueur.click(within(fenetre).getByRole('button', { name: 'Fermer' }))
    const zone = within(await carte()).getByRole('img', { name: `${ORDRE[0].nom} (${ORDRE[0].code}), trouvé` })
    await joueur.hover(zone)
    expect(within(panneau()).getByText(`${ORDRE[0].nom} (${ORDRE[0].code}), trouvé`, { selector: 'p' })).toBeDefined()
  })

  it('commencé puis quitté, il reprend là où il en était', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await cliquer(joueur, ORDRE[0].code)
    cleanup()
    render(<App />)
    // le bonus en cours reprend à la question 2, sans les résultats par-dessus
    await carte()
    expect(resultats()).toBeNull()
    expect(within(panneau()).getByText(`Département 2 sur ${TOTAL}`)).toBeDefined()
    expect(within(panneau()).getByText(`Juste : ${ORDRE[0].nom} (${ORDRE[0].code}).`)).toBeDefined()
  })

  it('pas commencé, il ne repart pas tout seul au retour : un bouton attend le joueur', async () => {
    const joueur = userEvent.setup()
    render(<App />)
    await proposer(joueur, CIBLE.nom.fr)
    cleanup()
    render(<App />)
    await joueur.click(within(screen.getByRole('dialog', { name: 'Résultats' })).getByRole('button', { name: 'Fermer' }))
    expect(within(panneau()).getByRole('img', { name: /silhouette/ })).toBeDefined()
    expect(within(panneau()).getByRole('button', { name: '🗺️ Jouer le bonus' })).toBeDefined()
  })

  it('pas de bonus après une défaite', async () => {
    const joueur = demarrer()
    const autres = tirables('nouvelles').filter((region) => region !== CIBLE)
    for (const region of autres.slice(0, 6)) {
      await proposer(joueur, region.nom.fr)
    }
    await joueur.click(within(screen.getByRole('dialog', { name: 'Résultats' })).getByRole('button', { name: 'Fermer' }))
    expect(within(panneau()).getByRole('img', { name: /silhouette/ })).toBeDefined()
    expect(within(panneau()).queryByRole('button', { name: '🗺️ Jouer le bonus' })).toBeNull()
  })
})

describe('Le bonus des départements, partie libre', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('commence aussi après une victoire, avec les départements de l’époque jouée, sans rien sauver', async () => {
    // Math.random truqué : 0 tire la première région de l'époque. Rendu avant le téléchargement des contours : le
    // chargement des fichiers par Vitest se sert lui aussi du hasard, et resterait bloqué
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const cible = tirables('anciennes')[0]
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    await joueur.click(screen.getByRole('radio', { name: 'Anciennes régions (avant 2016)' }))
    await proposer(joueur, cible.nom.fr)
    vi.restoreAllMocks()
    const zones = within(await carte()).getAllByRole('button')
    expect(zones).toHaveLength(departementsDe(cible).length)
    await joueur.click(zones[0])
    expect(lire().size).toBe(0)
    // une nouvelle partie remet la silhouette
    await joueur.click(within(panneau()).getByRole('button', { name: 'Nouvelle partie' }))
    expect(within(panneau()).getByRole('img', { name: /silhouette/ })).toBeDefined()
  })

  it('une nouvelle partie pendant la pause de fin : les résultats d’avant ne s’ouvrent pas', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const cible = tirables('nouvelles')[0]
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    await proposer(joueur, cible.nom.fr)
    vi.restoreAllMocks()
    for (const zone of within(await carte()).getAllByRole('button')) {
      await joueur.click(zone)
    }
    await joueur.click(within(panneau()).getByRole('button', { name: 'Nouvelle partie' }))
    // on attend plus que la pause : la fenêtre reste fermée
    await new Promise((fin) => setTimeout(fin, PAUSE_FIN_BONUS + 300))
    expect(resultats()).toBeNull()
  })
})
