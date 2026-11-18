/*
Le classement public et la modération (web.9.3.3). fetch est branché sur le VRAI serveur, avec sa base SQLite en
mémoire et une clé de modération de test. L'horloge des tests est arrêtée au 14 octobre 2026 (la partie n° 2).
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baseDeTest } from '../serveur/src/base-de-test.ts'
import { traiter } from '../serveur/src/serveur.ts'
import App from './App.tsx'
import { MODE_DU_JOUR, regionDuNumero } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'
import { CLE_PROFIL } from './profil.ts'
import { nouvellePartie, proposer } from './domaine/partie.ts'
import { synchroniser } from './envoi.ts'
import { enregistrer } from './sauvegarde.ts'

const CLE_MODERATION = 'cle-de-moderation-de-test'
let base: ReturnType<typeof baseDeTest>

beforeEach(() => {
  base = baseDeTest()
  vi.spyOn(globalThis, 'fetch').mockImplementation((entree, options) =>
    traiter(new Request(entree as string, options), base, new Date(), CLE_MODERATION),
  )
})
afterEach(() => {
  window.history.replaceState(null, '', '/')
  sessionStorage.clear()
})

async function serveur(chemin: string, corps: unknown, code?: string) {
  const reponse = await traiter(
    new Request(`https://serveur${chemin}`, {
      method: 'POST',
      headers: code === undefined ? {} : { Authorization: `Bearer ${code}` },
      body: JSON.stringify(corps),
    }),
    base,
    new Date(),
    CLE_MODERATION,
  )
  return (await reponse.json()) as { id: string; pseudo: string; code: string }
}

// un joueur qui a gagné la partie du jour en essais coups ; garde : c'est le joueur du test (ce navigateur)
async function joueur(pseudo: string, essais: number, garde = false) {
  const cree = await serveur('/profils', { pseudo })
  const cible = regionDuNumero(2)
  const autres = tirables(MODE_DU_JOUR).filter((region) => region !== cible)
  const regions = [...autres.slice(0, essais - 1), cible].map((region) => region.id)
  await serveur(
    '/profil/parties',
    { v: 1, parties: [{ jour: 2, regions, etat: 'gagnee', modes: { rotation: false, cachee: false } }] },
    cree.code,
  )
  if (garde) {
    localStorage.setItem(CLE_PROFIL, JSON.stringify({ id: cree.id, pseudo: cree.pseudo, code: cree.code }))
  }
  return cree
}

async function vuePublique() {
  const joueur = userEvent.setup()
  render(<App />)
  await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
  const fenetre = screen.getByRole('dialog', { name: 'Statistiques' })
  await joueur.click(within(fenetre).getByRole('tab', { name: 'Classement' }))
  await joueur.click(within(fenetre).getByRole('button', { name: 'Public' }))
  return { joueur, onglet: within(fenetre).getByRole('tabpanel') }
}

describe('Le classement public', () => {
  it('se lit sans profil : les joueurs du mois, sans bouton « Signaler »', async () => {
    await joueur('Zoé', 1)
    await joueur('Tom', 3)
    const { onglet } = await vuePublique()
    const tableau = await within(onglet).findByRole('table', { name: 'Classement public, octobre 2026' })
    expect(within(tableau).getAllByRole('row').slice(1).map((ligne) => ligne.textContent?.slice(0, 4))).toEqual([
      '1Zoé',
      '2Tom',
    ])
    expect(within(onglet).getByText(/^2\sjoueurs classés$/)).toBeDefined()
    expect(within(onglet).queryByRole('button', { name: /^Signaler/ })).toBeNull()
    // web.9.4.2 : sans profil, on dit pourquoi on n'y est pas
    expect(within(onglet).getByText(/Seules les parties jouées avec un profil comptent/)).toBeDefined()
  })

  // web.9.4.2 : le navigateur ne doit jamais rendre une copie gardée (elle pouvait dater d'avant le profil)
  it('est toujours redemandé au serveur, sans copie gardée par le navigateur', async () => {
    await joueur('Zoé', 1)
    const { onglet } = await vuePublique()
    await within(onglet).findByRole('table')
    const demandes = vi.mocked(fetch).mock.calls.filter(([adresse]) => String(adresse).includes('/classement?'))
    expect(demandes.length).toBeGreaterThan(0)
    expect(demandes.every(([, options]) => options?.cache === 'no-store')).toBe(true)
  })

  // web.9.5.1 : la fenêtre fermée reste dans la page ; rouverte, elle montrait le classement de sa première demande
  it('est redemandé à chaque ouverture de la fenêtre', async () => {
    const { joueur: clavier, onglet } = await vuePublique()
    expect(await within(onglet).findByText('Aucun joueur classé ce mois-ci.')).toBeDefined()
    await clavier.click(within(screen.getByRole('dialog', { name: 'Statistiques' })).getByRole('button', { name: 'Fermer' }))
    // pendant ce temps, Zoé joue
    await joueur('Zoé', 1)
    await clavier.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
    const fenetre = screen.getByRole('dialog', { name: 'Statistiques' })
    // le même onglet, toujours là (il n'a pas été refait), mais à jour
    expect(await within(fenetre).findByRole('table', { name: 'Classement public, octobre 2026' })).toBeDefined()
    expect(within(fenetre).getByText('Zoé')).toBeDefined()
  })

  // web.9.5.1 : les résultats s'ouvraient sur le dernier onglet choisi, et le classement n'avait pas la partie du jour
  it('après une partie : les résultats sur le Résumé, et le classement avec la partie, une fois arrivée', async () => {
    const moi = await serveur('/profils', { pseudo: 'Moi' })
    localStorage.setItem(CLE_PROFIL, JSON.stringify({ id: moi.id, pseudo: moi.pseudo, code: moi.code }))
    const { joueur: clavier, onglet } = await vuePublique()
    expect(await within(onglet).findByText('Aucun joueur classé ce mois-ci.')).toBeDefined()
    await clavier.click(within(screen.getByRole('dialog', { name: 'Statistiques' })).getByRole('button', { name: 'Fermer' }))

    const champ = screen.getByRole('combobox', { name: 'Ta proposition' })
    await clavier.type(champ, `${regionDuNumero(2).nom.fr}{Escape}{Enter}`)
    await clavier.click(screen.getByRole('button', { name: 'Passer' }))
    const resultats = screen.getByRole('dialog', { name: 'Résultats' })
    expect(within(resultats).getByRole('tab', { name: 'Résumé' }).getAttribute('aria-selected')).toBe('true')

    await clavier.click(within(resultats).getByRole('tab', { name: 'Classement' }))
    await clavier.click(within(resultats).getByRole('button', { name: 'Public' }))
    expect(await within(resultats).findByText('Moi')).toBeDefined()
  })

  // web.9.5.1 : des parties arrivées au profil pendant que la fenêtre est ouverte (l'évènement PARTIES_RECUES)
  it('se redemande quand des parties arrivent au serveur, sans « Chargement… » entre-temps', async () => {
    const moi = await serveur('/profils', { pseudo: 'Moi' })
    localStorage.setItem(CLE_PROFIL, JSON.stringify({ id: moi.id, pseudo: moi.pseudo, code: moi.code }))
    const { onglet } = await vuePublique()
    expect(await within(onglet).findByText('Aucun joueur classé ce mois-ci.')).toBeDefined()
    // une partie gagnée, sauvée puis envoyée (comme le ferait un autre onglet)
    const cible = regionDuNumero(2)
    enregistrer(2, proposer(nouvellePartie(cible, MODE_DU_JOUR), cible.nom.fr)!)
    await synchroniser()
    // l'évènement est parti, la nouvelle demande est en route : l'ancien classement reste affiché en attendant
    expect(within(onglet).queryByText('Chargement…')).toBeNull()
    expect(await within(onglet).findByText('Moi')).toBeDefined()
  })

  it('avec un profil : sa ligne mise en avant, et « Signaler » à côté des autres', async () => {
    const zoe = await joueur('Zoé', 1)
    await joueur('Tom', 3, true)
    const { joueur: clavier, onglet } = await vuePublique()
    await within(onglet).findByRole('table')
    expect(within(onglet).getByText('(toi)')).toBeDefined()
    expect(within(onglet).queryByRole('button', { name: 'Signaler Tom' })).toBeNull()
    // web.9.4.3 : une confirmation d'abord ; « Non » ne signale rien
    await clavier.click(within(onglet).getByRole('button', { name: 'Signaler Zoé' }))
    await clavier.click(within(onglet).getByRole('button', { name: 'Non' }))
    expect(base.sql('SELECT profil FROM signalements')).toEqual([])
    await clavier.click(within(onglet).getByRole('button', { name: 'Signaler Zoé' }))
    const { violations: avant } = await axe.run(document.body)
    expect(avant.map((violation) => violation.id)).toEqual([])
    await clavier.click(within(onglet).getByRole('button', { name: 'Oui, signaler' }))
    expect(await within(onglet).findByText('Signalé')).toBeDefined()
    expect(base.sql('SELECT profil FROM signalements')).toEqual([{ profil: zoe.id }])
    const { violations } = await axe.run(document.body)
    expect(violations.map((violation) => violation.id)).toEqual([])
  })

  // web.9.5.2 : avant, la confirmation disparaissait sans un mot
  it('un signalement qui n’aboutit pas le dit, sous la ligne du pseudo', async () => {
    await joueur('Zoé', 1)
    await joueur('Tom', 3, true)
    const { joueur: clavier, onglet } = await vuePublique()
    await within(onglet).findByRole('table')
    // le serveur ne répond plus aux signalements
    vi.mocked(fetch).mockImplementation((entree, options) =>
      String(entree).endsWith('/signaler')
        ? Promise.reject(new TypeError('Failed to fetch'))
        : traiter(new Request(entree as string, options), base, new Date(), CLE_MODERATION),
    )
    await clavier.click(within(onglet).getByRole('button', { name: 'Signaler Zoé' }))
    await clavier.click(within(onglet).getByRole('button', { name: 'Oui, signaler' }))
    expect((await within(onglet).findByRole('alert')).textContent).toBe('Le serveur ne répond pas. Réessaie plus tard.')
    expect(within(onglet).queryByText('Signalé')).toBeNull()
    // on peut réessayer : le message s'efface
    await clavier.click(within(onglet).getByRole('button', { name: 'Signaler Zoé' }))
    expect(within(onglet).queryByRole('alert')).toBeNull()
  })

  it('un pseudo retiré par la modération : le joueur le lit dans ses réglages', async () => {
    const zoe = await joueur('Zoé', 1, true)
    await serveur('/moderation/masquer', { profil: zoe.id, masque: true }, CLE_MODERATION)
    const clavier = userEvent.setup()
    render(<App />)
    await clavier.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
    const reglages = screen.getByRole('dialog', { name: 'Réglages' })
    expect(await within(reglages).findByText(/La modération a retiré ton pseudo du classement public/)).toBeDefined()
  })
})

describe('La modération', () => {
  it('s’ouvre par …/#moderation ; avec la clé, elle retire un pseudo signalé du public', async () => {
    const zoe = await joueur('Zoé', 1)
    const tom = await joueur('Tom', 3)
    await serveur('/signaler', { profil: zoe.id }, tom.code)
    window.history.replaceState(null, '', '/#moderation')
    const clavier = userEvent.setup()
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Modération' })

    await clavier.type(within(fenetre).getByLabelText('Clé de modération'), 'mauvaise')
    await clavier.click(within(fenetre).getByRole('button', { name: 'Ouvrir' }))
    expect((await within(fenetre).findByRole('alert')).textContent).toBe('Cette clé n’est pas la bonne.')

    await clavier.clear(within(fenetre).getByLabelText('Clé de modération'))
    await clavier.type(within(fenetre).getByLabelText('Clé de modération'), CLE_MODERATION)
    await clavier.click(within(fenetre).getByRole('button', { name: 'Ouvrir' }))
    await clavier.click(await within(fenetre).findByRole('button', { name: 'Retirer Zoé du public' }))
    expect(await within(fenetre).findByRole('button', { name: 'Remettre Zoé' })).toBeDefined()
    await waitFor(() => expect(base.sql('SELECT masque FROM profils WHERE id = ' + `'${zoe.id}'`)).toEqual([{ masque: 1 }]))
  })
})
