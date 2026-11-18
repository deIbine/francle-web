/*
La ligue (web.9.3.2) : l'onglet « Classement » des statistiques, et la fenêtre d'un lien d'invitation. fetch est
branché sur le VRAI serveur, avec sa base SQLite en mémoire. L'horloge des tests est arrêtée au 14 octobre 2026 (la
partie n° 2).
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baseDeTest } from '../serveur/src/base-de-test.ts'
import { traiter } from '../serveur/src/serveur.ts'
import App from './App.tsx'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import { codeDuFragment, lienInvitation } from './ligue.ts'
import { CLE_PROFIL, lireProfil } from './profil.ts'
import { CLE } from './sauvegarde.ts'

let base: ReturnType<typeof baseDeTest>

beforeEach(() => {
  base = baseDeTest()
  vi.spyOn(globalThis, 'fetch').mockImplementation((entree, options) =>
    traiter(new Request(entree as string, options), base, new Date()),
  )
})
afterEach(() => window.history.replaceState(null, '', '/'))

// un profil créé sur le serveur ; garde : le ranger aussi dans ce navigateur (le joueur du test)
async function profil(pseudo: string, garde = false): Promise<{ id: string; code: string }> {
  const reponse = await traiter(
    new Request('https://serveur/profils', { method: 'POST', body: JSON.stringify({ pseudo }) }),
    base,
    new Date(),
  )
  const cree = (await reponse.json()) as { id: string; pseudo: string; code: string }
  if (garde) {
    localStorage.setItem(CLE_PROFIL, JSON.stringify({ id: cree.id, pseudo: cree.pseudo, code: cree.code }))
  }
  return cree
}

// une demande au serveur pour un autre joueur que celui du test
async function pour(code: string, chemin: string, corps: unknown) {
  const reponse = await traiter(
    new Request(`https://serveur${chemin}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${code}` },
      body: JSON.stringify(corps),
    }),
    base,
    new Date(),
  )
  return (await reponse.json()) as { code: string }
}

async function ongletClassement() {
  const joueur = userEvent.setup()
  render(<App />)
  await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
  const fenetre = screen.getByRole('dialog', { name: 'Statistiques' })
  await joueur.click(within(fenetre).getByRole('tab', { name: 'Classement' }))
  return { joueur, onglet: within(fenetre).getByRole('tabpanel') }
}

describe('L’onglet Classement', () => {
  // web.9.4.3 : un bouton qui ouvre les réglages sur le profil (avant, un texte renvoyait aux « réglages (⚙️) »)
  it('sans profil, il dit d’en créer un, et son bouton ouvre les réglages sur le champ du pseudo', async () => {
    const { joueur, onglet } = await ongletClassement()
    expect(within(onglet).getByText(/Crée ton profil pour jouer en ligue/)).toBeDefined()
    await joueur.click(within(onglet).getByRole('button', { name: 'Créer mon profil' }))
    const reglages = await screen.findByRole('dialog', { name: 'Réglages' })
    expect(screen.queryByRole('dialog', { name: 'Statistiques' })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(within(reglages).getByLabelText('Ton pseudo')))
  })

  it('créer une ligue : son classement du mois, son code et ses membres', async () => {
    await profil('Zoé', true)
    // une partie gagnée hier en 1 essai : 6 points, envoyée au profil à l'ouverture de la page
    localStorage.setItem(CLE, JSON.stringify({ 1: { regions: [regionDuNumero(1).id], etat: 'gagnee' } }))
    const { joueur, onglet } = await ongletClassement()
    await joueur.type(await within(onglet).findByLabelText('Nom de la ligue'), 'La famille')
    await joueur.click(within(onglet).getByRole('button', { name: 'Créer la ligue' }))

    expect(await within(onglet).findByRole('heading', { name: 'La famille' })).toBeDefined()
    // le mois s'écrit en minuscules ; sa majuscule vient seulement du CSS (first-letter:uppercase)
    expect(within(onglet).getByRole('heading', { name: 'octobre 2026' })).toBeDefined()
    const tableau = await within(onglet).findByRole('table', { name: /^Classement de «.La famille.», octobre 2026$/ })
    const [, ligne] = within(tableau).getAllByRole('row')
    // rang 1, Zoé (toi), sa moyenne et ses parties dessous, puis 6 points (\s : l'espace insécable, gardé dans
    // textContent)
    expect(ligne.textContent).toMatch(/^1Zoé \(toi\)moyenne 6 · 1\spartie6$/)
    expect(within(onglet).getByText(/^Code\s: [A-Z2-9]{6}$/)).toBeDefined()
    expect(within(onglet).getByRole('button', { name: 'Envoyer le lien 🔗' })).toBeDefined()
    // et axe n'y trouve rien qui gêne un lecteur d'écran ou le clavier (voir Accessibilite.test.tsx)
    const { violations } = await axe.run(document.body)
    expect(violations.map((violation) => violation.id)).toEqual([])
  })

  it('rejoindre par le code, puis quitter après confirmation', async () => {
    const zoe = await profil('Zoé')
    const { code } = await pour(zoe.code, '/ligues', { nom: 'Le bureau' })
    await profil('Tom', true)
    const { joueur, onglet } = await ongletClassement()
    await joueur.type(await within(onglet).findByLabelText('Code de la ligue'), code.toLowerCase())
    await joueur.click(within(onglet).getByRole('button', { name: 'Rejoindre' }))
    expect(await within(onglet).findByRole('heading', { name: 'Le bureau' })).toBeDefined()
    expect(within(onglet).getAllByText('Zoé')).toHaveLength(2) // dans le classement et parmi les membres
    // Tom n'est pas le créateur : il ne peut ni retirer Zoé, ni changer le code
    expect(within(onglet).queryByRole('button', { name: 'Retirer Zoé' })).toBeNull()
    expect(within(onglet).queryByRole('button', { name: 'Changer le code' })).toBeNull()

    await joueur.click(within(onglet).getByRole('button', { name: 'Quitter la ligue' }))
    await joueur.click(within(onglet).getByRole('button', { name: 'Oui, quitter' }))
    expect(await within(onglet).findByText(/Tu n’es dans aucune ligue/)).toBeDefined()
  })

  it('un code inconnu : le message le dit', async () => {
    await profil('Tom', true)
    const { joueur, onglet } = await ongletClassement()
    await joueur.type(await within(onglet).findByLabelText('Code de la ligue'), 'ZZZZZZ')
    await joueur.click(within(onglet).getByRole('button', { name: 'Rejoindre' }))
    expect((await within(onglet).findByRole('alert')).textContent).toBe('Aucune ligue n’a ce code.')
  })

  it('le créateur retire un membre', async () => {
    const zoe = await profil('Zoé', true)
    const { code } = await pour(zoe.code, '/ligues', { nom: 'La famille' })
    const tom = await profil('Tom')
    await pour(tom.code, '/ligue/rejoindre', { code })
    const { joueur, onglet } = await ongletClassement()
    // web.9.4.3 : une confirmation d'abord ; « Non » ne retire personne
    await joueur.click(await within(onglet).findByRole('button', { name: 'Retirer Tom' }))
    await joueur.click(within(onglet).getByRole('button', { name: 'Non' }))
    expect(within(onglet).getAllByText('Tom').length).toBeGreaterThan(0)
    await joueur.click(within(onglet).getByRole('button', { name: 'Retirer Tom' }))
    expect(within(onglet).getByText(/Retirer Tom de la ligue/)).toBeDefined()
    await joueur.click(within(onglet).getByRole('button', { name: 'Oui, retirer' }))
    await waitFor(() => expect(within(onglet).queryByText('Tom')).toBeNull())
  })

  it('changer le code demande une confirmation', async () => {
    const zoe = await profil('Zoé', true)
    const { code } = await pour(zoe.code, '/ligues', { nom: 'La famille' })
    const { joueur, onglet } = await ongletClassement()
    await joueur.click(await within(onglet).findByRole('button', { name: 'Changer le code' }))
    await joueur.click(within(onglet).getByRole('button', { name: 'Non' }))
    expect(within(onglet).getByText(new RegExp(code))).toBeDefined()
    await joueur.click(within(onglet).getByRole('button', { name: 'Changer le code' }))
    await joueur.click(within(onglet).getByRole('button', { name: 'Oui, changer' }))
    await waitFor(() => expect(within(onglet).queryByText(new RegExp(code))).toBeNull())
  })
})

describe('Le lien d’invitation', () => {
  it('se code et se relit', () => {
    expect(lienInvitation('ABC234')).toBe('https://deibine.github.io/francle-web/#ligue=ABC234')
    expect(codeDuFragment('#ligue=abc234')).toBe('ABC234')
    expect(codeDuFragment('#ligue=trop-long-pour-un-code')).toBeUndefined()
    expect(codeDuFragment('#bilan=1')).toBeUndefined()
  })

  it('ouvre la fenêtre de la ligue ; sans profil, on le crée sur place, puis on rejoint', async () => {
    const zoe = await profil('Zoé')
    const { code } = await pour(zoe.code, '/ligues', { nom: 'La famille' })
    window.history.replaceState(null, '', `/#ligue=${code}`)
    const joueur = userEvent.setup()
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Rejoindre une ligue' })
    expect(await within(fenetre).findByText('« La famille », 1 membre')).toBeDefined()
    await joueur.type(within(fenetre).getByLabelText('Ton pseudo'), 'Tom')
    await joueur.click(within(fenetre).getByRole('button', { name: 'Créer mon profil' }))
    await joueur.click(await within(fenetre).findByRole('button', { name: 'Rejoindre la ligue' }))
    expect(await within(fenetre).findByText(/Bienvenue dans « La famille »/)).toBeDefined()
    expect(lireProfil()).toMatchObject({ pseudo: 'Tom' })
    // le code de secours, montré une seule fois, est toujours là (web.9.3.4 : il disparaissait avec le bloc du profil)
    expect(within(fenetre).getByText(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)).toBeDefined()

    // fermer la fenêtre retire le code de l'adresse
    await joueur.click(within(fenetre).getByRole('button', { name: 'Fermer' }))
    expect(window.location.hash).toBe('')
  })

  // web.9.5.4 : avant, un texte renvoyait aux « statistiques (📊) », alors que le bouton montre des barres dessinées
  it('« Voir le classement » ferme l’invitation et ouvre le classement de la ligue', async () => {
    const zoe = await profil('Zoé')
    const { code } = await pour(zoe.code, '/ligues', { nom: 'La famille' })
    await profil('Tom', true)
    const joueur = userEvent.setup()
    render(<App />)
    // les statistiques laissées sur le classement public : le bouton doit ramener à « Ma ligue »
    await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
    const stats = screen.getByRole('dialog', { name: 'Statistiques' })
    await joueur.click(within(stats).getByRole('tab', { name: 'Classement' }))
    await joueur.click(within(stats).getByRole('button', { name: 'Public' }))
    await joueur.click(within(stats).getByRole('tab', { name: 'Résumé' }))
    await joueur.click(within(stats).getByRole('button', { name: 'Fermer' }))
    // le lien d'invitation, collé dans l'onglet déjà ouvert sur le jeu
    window.location.hash = `#ligue=${code}`
    const fenetre = await screen.findByRole('dialog', { name: 'Rejoindre une ligue' })
    await joueur.click(await within(fenetre).findByRole('button', { name: 'Rejoindre la ligue' }))
    await joueur.click(await within(fenetre).findByRole('button', { name: 'Voir le classement' }))

    expect(screen.queryByRole('dialog', { name: 'Rejoindre une ligue' })).toBeNull()
    const ouverte = screen.getByRole('dialog', { name: 'Statistiques' })
    expect(within(ouverte).getByRole('tab', { name: 'Classement' }).getAttribute('aria-selected')).toBe('true')
    expect(within(ouverte).getByRole('button', { name: 'Ma ligue' }).getAttribute('aria-pressed')).toBe('true')
    expect(await within(ouverte).findByRole('heading', { name: 'La famille' })).toBeDefined()
  })

  it('déjà dans une autre ligue : la fenêtre prévient qu’on la quittera', async () => {
    const zoe = await profil('Zoé')
    const { code } = await pour(zoe.code, '/ligues', { nom: 'La famille' })
    const tom = await profil('Tom', true)
    await pour(tom.code, '/ligues', { nom: 'Le bureau' })
    window.history.replaceState(null, '', `/#ligue=${code}`)
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Rejoindre une ligue' })
    expect(await within(fenetre).findByText(/Tu quitteras ta ligue actuelle, « Le bureau »/)).toBeDefined()
    // web.9.4.3 : le bouton le redit
    expect(within(fenetre).getByRole('button', { name: /^Quitter.+Le bureau.+et rejoindre$/ })).toBeDefined()
  })

  // web.9.4.3 : avant, un serveur muet sur la ligue actuelle était pris pour « pas de ligue », et « Rejoindre »
  // s'affichait sans l'avertissement
  it('sans réponse sur la ligue actuelle : pas de bouton « Rejoindre »', async () => {
    const zoe = await profil('Zoé')
    const { code } = await pour(zoe.code, '/ligues', { nom: 'La famille' })
    await profil('Tom', true)
    const avant = vi.mocked(fetch).getMockImplementation()!
    vi.mocked(fetch).mockImplementation((entree, options) =>
      new URL(entree as string).pathname === '/profil' ? Promise.reject(new TypeError('réseau')) : avant(entree, options),
    )
    window.history.replaceState(null, '', `/#ligue=${code}`)
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Rejoindre une ligue' })
    expect(await within(fenetre).findByText(/Le serveur ne répond pas/)).toBeDefined()
    expect(within(fenetre).queryByRole('button', { name: /rejoindre/i })).toBeNull()
  })
})
