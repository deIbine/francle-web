/*
Les tests de la liste des départements (web.7.12) : pendant le bonus, le bouton 📃 ouvre les 101 départements, et un
clic sur un nom répond pour le département choisi sur la carte. À l'écran, comme un joueur (voir Bonus.test.tsx pour
les façons de faire : clic sur la carte par le numéro du département, Math.random truqué en partie libre).
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { departementsDe, type Departement } from './domaine/departements.ts'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { parId, tirables } from './domaine/regions.ts'
import { CLE_REGLAGES } from './reglages.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts)
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const DEPS = departementsDe(CIBLE)

type Joueur = ReturnType<typeof userEvent.setup>

const panneau = () => screen.getByRole('tabpanel')
const nom = (departement: Departement) => `${departement.nom} (${departement.code})`

function demarrer() {
  const joueur = userEvent.setup()
  render(<App />)
  return joueur
}

async function proposer(joueur: Joueur, region: string) {
  await joueur.type(within(panneau()).getByRole('combobox', { name: 'Ta proposition' }), `${region}{Escape}{Enter}`)
}

const carte = () =>
  within(panneau()).findByRole('group', { name: 'Carte des départements de la région' }, { timeout: 5000 })

async function cliquer(joueur: Joueur, code: string) {
  const trace = (await carte()).querySelector(`[data-code="${code}"]`)
  if (trace === null) throw new Error(`Pas de tracé pour ${code}`)
  await joueur.click(trace)
}

// la fenêtre ouverte par 📃, si elle l'est (une fenêtre fermée est cachée, donc ignorée par queryByRole)
const listeDepartements = () => screen.queryByRole('dialog', { name: 'Liste des départements' })
const listeRegions = () => screen.queryByRole('dialog', { name: 'Liste des régions' })

async function ouvrirDepartements(joueur: Joueur) {
  await joueur.click(screen.getByRole('button', { name: 'Voir la liste des départements' }))
  return listeDepartements()!
}

// les boutons des noms, sans le ✕ de la fenêtre
const noms = (liste: HTMLElement) =>
  within(liste)
    .getAllByRole('button')
    .filter((bouton) => bouton.textContent !== '✕') as HTMLButtonElement[]

describe('La liste des départements, partie du jour', () => {
  it('pendant le bonus, 📃 ouvre les 101 départements par ordre alphabétique, grisés tant que rien n’est choisi', async () => {
    const joueur = demarrer()
    await proposer(joueur, CIBLE.nom.fr)
    await carte()
    expect(screen.queryByRole('button', { name: 'Voir la liste des régions' })).toBeNull()

    const liste = await ouvrirDepartements(joueur)
    const boutons = noms(liste)
    expect(boutons).toHaveLength(101)
    expect(boutons[0].textContent).toBe('Ain (01)')
    expect(boutons.at(-1)!.textContent).toBe('Yvelines (78)')
    expect(boutons.every((bouton) => bouton.disabled)).toBe(true)
    expect(within(liste).getByText('Clique d’abord sur un département de la carte.')).toBeDefined()
  })

  it('un département choisi : un clic sur son nom répond juste, et il est ensuite barré', async () => {
    const joueur = demarrer()
    await proposer(joueur, CIBLE.nom.fr)
    await cliquer(joueur, DEPS[0].code)
    const liste = await ouvrirDepartements(joueur)
    expect(within(liste).getByText('Clique sur le nom du département choisi sur la carte.')).toBeDefined()
    await joueur.click(within(liste).getByRole('button', { name: nom(DEPS[0]) }))

    expect(listeDepartements()).toBeNull()
    expect(within(panneau()).getByText(`Juste : ${nom(DEPS[0])}.`)).toBeDefined()
    expect(within(panneau()).getByText(`1 réponse sur ${DEPS.length}`)).toBeDefined()

    await cliquer(joueur, DEPS[1].code)
    const ensuite = await ouvrirDepartements(joueur)
    const barre = within(ensuite).getByRole('button', { name: `${nom(DEPS[0])}, déjà répondu` }) as HTMLButtonElement
    expect(barre.disabled).toBe(true)
    expect(barre.className).toContain('line-through')
    expect((within(ensuite).getByRole('button', { name: nom(DEPS[1]) }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('une réponse fausse : le département manqué est barré, pas le nom donné', async () => {
    const joueur = demarrer()
    await proposer(joueur, CIBLE.nom.fr)
    await cliquer(joueur, DEPS[0].code)
    await joueur.click(within(await ouvrirDepartements(joueur)).getByRole('button', { name: nom(DEPS[1]) }))
    expect(within(panneau()).getByText(/^Raté/)).toBeDefined()

    await cliquer(joueur, DEPS[1].code)
    const liste = await ouvrirDepartements(joueur)
    expect(within(liste).getByRole('button', { name: `${nom(DEPS[0])}, déjà répondu` })).toBeDefined()
    expect((within(liste).getByRole('button', { name: nom(DEPS[1]) }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('le bonus fini reste affiché : la liste le dit, et tout est grisé', async () => {
    const joueur = demarrer()
    await proposer(joueur, CIBLE.nom.fr)
    await cliquer(joueur, DEPS[0].code)
    await joueur.click(within(await ouvrirDepartements(joueur)).getByRole('button', { name: nom(DEPS[0]) }))
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    await joueur.click(within(screen.getByRole('dialog', { name: 'Résultats' })).getByRole('button', { name: 'Fermer' }))

    const liste = await ouvrirDepartements(joueur)
    expect(within(liste).getByText('Le bonus est fini.')).toBeDefined()
    expect(noms(liste).every((bouton) => bouton.disabled)).toBe(true)
  })

  it('passé avant toute réponse : 📃 redevient la liste des régions, sans s’ouvrir tout seul', async () => {
    const joueur = demarrer()
    await proposer(joueur, CIBLE.nom.fr)
    await carte()
    // une demande pendant le bonus, que le plateau ne doit pas garder pour plus tard
    await ouvrirDepartements(joueur)
    await joueur.click(within(listeDepartements()!).getByRole('button', { name: 'Fermer' }))
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    await joueur.click(within(screen.getByRole('dialog', { name: 'Résultats' })).getByRole('button', { name: 'Fermer' }))

    expect(within(panneau()).getByRole('img', { name: /silhouette/ })).toBeDefined()
    expect(listeRegions()).toBeNull()
    await joueur.click(screen.getByRole('button', { name: 'Voir la liste des régions' }))
    expect(listeRegions()).not.toBeNull()
  })

  it('en anglais aussi', async () => {
    localStorage.setItem(CLE_REGLAGES, JSON.stringify({ langue: 'en' }))
    const joueur = demarrer()
    await joueur.type(within(panneau()).getByRole('combobox'), `${CIBLE.nom.en}{Escape}{Enter}`)
    await within(panneau()).findByRole('group', { name: 'Map of the region’s departments' }, { timeout: 5000 })
    await joueur.click(screen.getByRole('button', { name: 'See the list of departments' }))
    const liste = screen.getByRole('dialog', { name: 'List of departments' })
    expect(within(liste).getByText('First click a department on the map.')).toBeDefined()
  })
})

describe('La liste des départements, partie libre', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // gagne une partie libre dont la région est tirée d'avance (Math.random truqué, voir Bonus.test.tsx)
  async function gagnerLibre(id: string, anciennes = false) {
    const regions = tirables(anciennes ? 'anciennes' : 'nouvelles')
    const cible = parId(id)
    vi.spyOn(Math, 'random').mockReturnValue((regions.indexOf(cible) + 0.5) / regions.length)
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    if (anciennes) {
      await joueur.click(screen.getByRole('radio', { name: 'Anciennes régions (avant 2016)' }))
    }
    await proposer(joueur, cible.nom.fr)
    vi.restoreAllMocks()
    return { joueur, cible }
  }

  it('anciennes régions : les mêmes 101 départements, et un clic répond', async () => {
    const { joueur, cible } = await gagnerLibre('alsace', true)
    const deps = departementsDe(cible)
    await cliquer(joueur, deps[0].code)
    const liste = await ouvrirDepartements(joueur)
    expect(noms(liste)).toHaveLength(101)
    await joueur.click(within(liste).getByRole('button', { name: nom(deps[0]) }))
    expect(within(panneau()).getByText(`Juste : ${nom(deps[0])}.`)).toBeDefined()
  })

  it('« Nouvelle partie » pendant le bonus : retour à la liste des régions, sans fenêtre ouverte toute seule', async () => {
    const { joueur } = await gagnerLibre('bretagne')
    await carte()
    await ouvrirDepartements(joueur)
    await joueur.click(within(listeDepartements()!).getByRole('button', { name: 'Fermer' }))
    await joueur.click(within(panneau()).getByRole('button', { name: 'Nouvelle partie' }))

    expect(listeRegions()).toBeNull()
    expect(screen.getByRole('button', { name: 'Voir la liste des régions' })).toBeDefined()
  })

  it('outre-mer : la question du numéro garde la liste des régions, qui donnerait sinon la réponse', async () => {
    const { joueur } = await gagnerLibre('guadeloupe')
    expect(await within(panneau()).findByText(/numéro de la Guadeloupe/, {}, { timeout: 5000 })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Voir la liste des départements' })).toBeNull()
    await joueur.click(screen.getByRole('button', { name: 'Voir la liste des régions' }))
    expect(listeRegions()).not.toBeNull()
    expect(listeDepartements()).toBeNull()
  })
})
