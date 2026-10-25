/*
Les tests à l'écran du bonus des départements, après une victoire, en partie du jour et en partie libre. Depuis
web.7.7, le mode C : on clique un département, puis on écrit son nom (ou son numéro) dans la saisie du bonus.

On clique sur un département par son numéro (data-code), que le joueur ne voit pas : un lecteur d'écran n'y lit que
« Zone 3 sur 12 », pour ne pas donner la réponse.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { departementsDe, type Departement } from './domaine/departements.ts'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'
import { PAUSE_FIN_BONUS } from './pause.ts'
import { CLE_REGLAGES } from './reglages.ts'
import { lire } from './sauvegarde.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts) : la partie n° 2
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
// les départements de la région du jour (en mode C, l'ordre est celui du joueur)
const DEPS = departementsDe(CIBLE)
const TOTAL = DEPS.length

type Joueur = ReturnType<typeof userEvent.setup>

// le panneau de l'onglet affiché (l'autre est caché, donc ignoré par getByRole)
const panneau = () => screen.getByRole('tabpanel')
// le bonus lui-même, sans la fenêtre des résultats (toujours dans la page, même fermée, et qui reprend sa phrase de fin)
const zoneBonus = () => within(panneau()).getByRole('region', { name: /^Bonus/ })

function demarrer() {
  const joueur = userEvent.setup()
  render(<App />)
  return joueur
}

async function proposer(joueur: Joueur, nom: string) {
  const champ = within(panneau()).getByRole('combobox', { name: 'Ta proposition' })
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

// la saisie du bonus
const reponse = () => within(panneau()).getByRole('combobox', { name: 'Ta réponse' }) as HTMLInputElement

async function cliquer(joueur: Joueur, code: string) {
  const trace = (await carte()).querySelector(`[data-code="${code}"]`)
  if (trace === null) throw new Error(`Pas de tracé pour ${code}`)
  await joueur.click(trace)
}

// mode C : choisir le département numéro code sur la carte, puis écrire la saisie
async function repondre(joueur: Joueur, code: string, saisie: string) {
  await cliquer(joueur, code)
  await joueur.type(reponse(), `${saisie}{Escape}{Enter}`)
}

const nom = (departement: Departement) => `${departement.nom} (${departement.code})`

describe('Le bonus des départements, partie du jour', () => {
  it('commence dès la victoire, à la place de la silhouette, sans ouvrir les résultats', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    expect(await carte()).toBeDefined()
    expect(resultats()).toBeNull()
    const titre = within(panneau()).getByRole('heading', { name: /^Bonus/ })
    // la saisie de la région a disparu : le focus du clavier est sur le titre du bonus
    expect(document.activeElement).toBe(titre)
    // le message de victoire reste sous le bonus
    expect(within(panneau()).getByRole('button', { name: 'Voir les résultats' })).toBeDefined()
    expect(within(panneau()).getByText(`0 réponse sur ${TOTAL}`)).toBeDefined()
    expect(within(panneau()).getByText('Clique sur un département de la carte')).toBeDefined()
    // rien de choisi : la saisie est grisée
    expect(reponse().disabled).toBe(true)
    expect(reponse().placeholder).toBe('Clique d’abord sur la carte')
    expect(within(panneau()).queryByRole('img', { name: /silhouette/ })).toBeNull()
  })

  it('un clic choisit un département, la saisie prend le focus ; on peut changer d’avis', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await cliquer(joueur, DEPS[0].code)
    expect(within(panneau()).getByText('Quel est ce département ?')).toBeDefined()
    expect(reponse().disabled).toBe(false)
    expect(document.activeElement).toBe(reponse())
    const choisi = () => within(screen.getByRole('group', { name: /^Carte/ })).getByRole('button', { pressed: true })
    expect(choisi().getAttribute('data-code')).toBe(DEPS[0].code)
    await cliquer(joueur, DEPS[1].code)
    expect(choisi().getAttribute('data-code')).toBe(DEPS[1].code)
  })

  it('sur un écran tactile, choisir un département fait défiler la page jusqu’au haut du bonus', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    // jsdom n'a ni matchMedia ni scrollIntoView : on les fournit le temps du test, l'écran se disant tactile
    vi.stubGlobal('matchMedia', (requete: string) => ({ matches: requete === '(pointer: coarse)' }))
    const defiler = vi.fn()
    Element.prototype.scrollIntoView = defiler
    try {
      await cliquer(joueur, DEPS[0].code)
      expect(defiler).toHaveBeenCalledWith({ block: 'start' })
      expect(defiler.mock.contexts[0]).toBe(zoneBonus())
    } finally {
      vi.unstubAllGlobals()
      // @ts-expect-error : on retire ce que jsdom n'a pas
      delete Element.prototype.scrollIntoView
    }
  })

  it('une réponse juste ou fausse se dit, et le département ne se choisit plus', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    // une réponse fausse (la région du jour, la Corse, n'a que deux départements : l'autre est donné)
    await repondre(joueur, DEPS[0].code, DEPS[1].nom)
    expect(
      within(panneau()).getByText(
        `Raté : c’était ${nom(DEPS[0])}, en rouge sur la carte (ta réponse : ${nom(DEPS[1])}).`,
      ),
    ).toBeDefined()
    expect(within(panneau()).getByText(`1 réponse sur ${TOTAL}`)).toBeDefined()
    // la saisie est vidée et grisée de nouveau : au joueur de choisir le suivant
    expect(reponse().value).toBe('')
    expect(reponse().disabled).toBe(true)
    // répondu : il dit son nom et son résultat, et n'est plus un bouton
    const zone = within(await carte()).getByRole('img', { name: `${nom(DEPS[0])}, manqué` })
    expect(zone.getAttribute('data-code')).toBe(DEPS[0].code)

    // version simple (par défaut) : un département d'une autre région est refusé, sans coûter de réponse
    await repondre(joueur, DEPS[1].code, 'Gironde')
    expect(within(panneau()).getByText('Gironde (33) : ce département n’est pas dans la région.')).toBeDefined()
    expect(within(panneau()).getByText(`1 réponse sur ${TOTAL}`)).toBeDefined()
    await joueur.clear(reponse())
    await joueur.type(reponse(), `${DEPS[1].nom}{Escape}{Enter}`)
    expect(within(panneau()).getByText(`Juste : ${nom(DEPS[1])}.`)).toBeDefined()
  })

  it('un département déjà trouvé est refusé sans rien coûter ; le numéro et un début de nom sont acceptés', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await repondre(joueur, DEPS[0].code, DEPS[0].code)
    expect(within(panneau()).getByText(`Juste : ${nom(DEPS[0])}.`)).toBeDefined()
    await repondre(joueur, DEPS[1].code, DEPS[0].nom)
    expect(within(panneau()).getByText(`${nom(DEPS[0])} : déjà trouvé ailleurs sur la carte.`)).toBeDefined()
    expect(within(panneau()).getByText(`1 réponse sur ${TOTAL}`)).toBeDefined()
    // le département reste choisi : on corrige la saisie
    await joueur.clear(reponse())
    await joueur.type(reponse(), 'Atlantide{Escape}{Enter}')
    expect(within(panneau()).getByText('Ce n’est pas un département.')).toBeDefined()
    await joueur.clear(reponse())
    await joueur.type(reponse(), `${DEPS[1].nom}{Escape}{Enter}`)
    expect(within(panneau()).getByText(`Juste : ${nom(DEPS[1])}.`)).toBeDefined()
  })

  it('version simple (par défaut) : les suggestions ne viennent que de la région', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await cliquer(joueur, DEPS[0].code)
    // la région du jour est la Corse : parmi les 101, « haute » évoquerait aussi la Haute-Garonne, la Haute-Loire…
    await joueur.type(reponse(), 'haute')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Haute-Corse (2B)'])
  })

  it('version difficile (⚙️) : les 101 départements suggérés, une autre région est une réponse fausse, 💪 au partage', async () => {
    localStorage.setItem(CLE_REGLAGES, JSON.stringify({ departementsDifficiles: true }))
    const joueur = demarrer()
    await gagner(joueur)
    await cliquer(joueur, DEPS[0].code)
    await joueur.type(reponse(), 'gir')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toContain('Gironde (33)')
    await joueur.clear(reponse())
    await joueur.type(reponse(), 'Gironde{Escape}{Enter}')
    expect(
      within(panneau()).getByText(`Raté : c’était ${nom(DEPS[0])}, en rouge sur la carte (ta réponse : Gironde (33)).`),
    ).toBeDefined()
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    await joueur.click(within(resultats()!).getByRole('button', { name: /Partager/ }))
    expect((await navigator.clipboard.readText()).split('\n').at(-2)).toBe(`🗺️ 0/${TOTAL} 💪`)
  })

  it('la version est fixée à la première réponse : la changer pendant le bonus vaut pour le suivant', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await repondre(joueur, DEPS[0].code, DEPS[0].code)
    await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
    const reglages = screen.getByRole('dialog', { name: 'Réglages' })
    await joueur.click(within(reglages).getByLabelText('version difficile', { exact: false }))
    await joueur.click(within(reglages).getByRole('button', { name: 'Fermer' }))
    await cliquer(joueur, DEPS[1].code)
    await joueur.type(reponse(), 'gir')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('les zones ne disent pas leur nom pendant le bonus, et se choisissent au clavier', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    const zones = within(await carte()).getAllByRole('button')
    expect(zones).toHaveLength(TOTAL)
    expect(zones.map((zone) => zone.getAttribute('aria-label'))).toEqual(
      zones.map((_, index) => `Zone ${index + 1} sur ${TOTAL}`),
    )
    zones[0].focus()
    await joueur.keyboard('{Enter}')
    expect(zones[0].getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(reponse())
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
    expect(within(panneau()).getByText(`0 réponse sur ${TOTAL}`)).toBeDefined()
  })

  it('« Passer » après une réponse : le bonus est fini, les résultats s’ouvrent avec son score, partagé et compté', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await repondre(joueur, DEPS[0].code, DEPS[0].nom)
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    expect(within(zoneBonus()).getByText(`Bonus arrêté : 1 département trouvé sur ${TOTAL}.`)).toBeDefined()
    expect(within(panneau()).queryByRole('button', { name: '🗺️ Jouer le bonus' })).toBeNull()

    // le joueur a choisi d'arrêter : les résultats s'ouvrent sans pause
    const fenetre = resultats()!
    expect(within(fenetre).getByText(`Bonus arrêté : 1 département trouvé sur ${TOTAL}.`)).toBeDefined()
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
    // dans le désordre : le dernier d'abord
    for (const departement of [...DEPS].reverse()) {
      await repondre(joueur, departement.code, departement.code)
    }
    expect(within(zoneBonus()).getByText(`Bonus terminé : ${TOTAL} départements trouvés sur ${TOTAL}.`)).toBeDefined()
    // pas tout de suite : le joueur voit d'abord sa dernière réponse sur la carte
    expect(resultats()).toBeNull()
    const fenetre = await screen.findByRole('dialog', { name: 'Résultats' }, { timeout: 3000 })
    await joueur.click(within(fenetre).getByRole('button', { name: /Partager/ }))
    expect((await navigator.clipboard.readText()).split('\n').at(-2)).toBe(`🗺️ ${TOTAL}/${TOTAL}`)
    await joueur.click(within(fenetre).getByRole('button', { name: 'Fermer' }))
    const zone = within(await carte()).getByRole('img', { name: `${nom(DEPS[0])}, trouvé` })
    await joueur.hover(zone)
    expect(within(panneau()).getByText(`${nom(DEPS[0])}, trouvé`, { selector: 'p' })).toBeDefined()
    await joueur.unhover(zone)
    expect(within(panneau()).getByText('Clique ou passe sur un département pour voir son nom.')).toBeDefined()
    // un clic seul, sans survol (le doigt sur un téléphone) : fireEvent n'envoie que le clic, là où user-event
    // passerait d'abord la souris dessus
    fireEvent.click(within(await carte()).getByRole('img', { name: `${nom(DEPS[1])}, trouvé` }))
    expect(within(panneau()).getByText(`${nom(DEPS[1])}, trouvé`, { selector: 'p' })).toBeDefined()
  })

  it('commencé puis quitté, il reprend là où il en était', async () => {
    const joueur = demarrer()
    await gagner(joueur)
    await repondre(joueur, DEPS[1].code, DEPS[1].nom)
    cleanup()
    render(<App />)
    // le bonus en cours reprend avec sa réponse, sans les résultats par-dessus
    await carte()
    expect(resultats()).toBeNull()
    expect(within(panneau()).getByText(`1 réponse sur ${TOTAL}`)).toBeDefined()
    expect(within(panneau()).getByText(`Juste : ${nom(DEPS[1])}.`)).toBeDefined()
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

  // ouvre le jeu et gagne une partie libre dont la région est la première de l'époque. Math.random truqué dès
  // l'ouverture (la première partie libre est tirée au premier affichage) : 0 tire la première région. Rendu avant le
  // téléchargement des contours : le chargement des fichiers par Vitest se sert lui aussi du hasard, et resterait
  // bloqué
  async function gagnerLibre(anciennes = false) {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const joueur = demarrer()
    const cible = tirables(anciennes ? 'anciennes' : 'nouvelles')[0]
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    if (anciennes) {
      await joueur.click(screen.getByRole('radio', { name: 'Anciennes régions (avant 2016)' }))
    }
    await proposer(joueur, cible.nom.fr)
    vi.restoreAllMocks()
    return { joueur, cible }
  }

  it('commence aussi après une victoire, avec les départements de l’époque jouée, sans rien sauver', async () => {
    const { joueur, cible } = await gagnerLibre(true)
    const zones = within(await carte()).getAllByRole('button')
    expect(zones).toHaveLength(departementsDe(cible).length)
    // une réponse fausse : un autre département de la région
    await repondre(joueur, zones[0].getAttribute('data-code')!, zones[1].getAttribute('data-code')!)
    expect(within(panneau()).getByText(/^Raté|^Juste/)).toBeDefined()
    expect(lire().size).toBe(0)
    // pendant le bonus, pas de « Nouvelle partie » : un clic le perdrait sans prévenir
    expect(within(panneau()).queryByRole('button', { name: 'Nouvelle partie' })).toBeNull()
    // passé, il revient ; une nouvelle partie remet la silhouette
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    await joueur.click(within(resultats()!).getByRole('button', { name: 'Fermer' }))
    await joueur.click(within(panneau()).getByRole('button', { name: 'Nouvelle partie' }))
    expect(within(panneau()).getByRole('img', { name: /silhouette/ })).toBeDefined()
  })

  it('« Passer » après une réponse : les résultats donnent le score du bonus', async () => {
    const { joueur, cible } = await gagnerLibre()
    const zones = within(await carte()).getAllByRole('button')
    // une réponse fausse : un autre département de la région
    await repondre(joueur, zones[0].getAttribute('data-code')!, zones[1].getAttribute('data-code')!)
    await joueur.click(within(panneau()).getByRole('button', { name: 'Passer' }))
    const total = departementsDe(cible).length
    expect(within(resultats()!).getByText(new RegExp(`^Bonus arrêté : \\d département trouvé sur ${total}\\.$`))).toBeDefined()
  })

  it('une nouvelle partie pendant la pause de fin : les résultats d’avant ne s’ouvrent pas', async () => {
    const { joueur, cible } = await gagnerLibre()
    await carte()
    for (const departement of departementsDe(cible)) {
      await repondre(joueur, departement.code, departement.code)
    }
    await joueur.click(within(panneau()).getByRole('button', { name: 'Nouvelle partie' }))
    // on attend plus que la pause : la fenêtre reste fermée
    await new Promise((fin) => setTimeout(fin, PAUSE_FIN_BONUS + 300))
    expect(resultats()).toBeNull()
  })
})
