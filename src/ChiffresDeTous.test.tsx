/*
Les chiffres de tous (web.9.2.2) : le site envoie ses parties finies et montre les chiffres du jour dans la fenêtre des
résultats. Ici, fetch est branché sur le VRAI serveur (serveur/src/serveur.ts), avec sa vraie base SQLite en mémoire :
c'est tout le trajet, du site à la base et retour, sans réseau. L'horloge des tests est arrêtée au 14 octobre 2026 (la
partie n° 2, voir preparationTests.ts).
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { baseDeTest } from '../serveur/src/base-de-test.ts'
import { traiter } from '../serveur/src/serveur.ts'
import App from './App.tsx'
import { PARTIES_PAR_ENVOI, type EnvoiAuServeur } from './domaine/chiffres.ts'
import { MODE_DU_JOUR, regionDuNumero } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'
import { synchroniser } from './envoi.ts'
import { CLE_REGLAGES } from './reglages.ts'
import { aEnvoyer, CLE, lire } from './sauvegarde.ts'

const AUJOURDHUI = regionDuNumero(2)
const AUTRES = tirables(MODE_DU_JOUR)
  .filter((region) => region !== AUJOURDHUI)
  .map((region) => region.id)

let base: ReturnType<typeof baseDeTest>
let fetch: MockInstance<typeof globalThis.fetch>

// fetch répond par le serveur, comme s'il était en ligne
beforeEach(() => {
  base = baseDeTest()
  fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((entree, options) => traiter(new Request(entree as string, options), base, new Date()))
})

// deux autres joueurs ont déjà joué aujourd'hui : l'un a trouvé du premier coup (6 points), l'autre en 3 essais (4)
async function deuxAutresJoueurs() {
  const parties = [
    { tirage: 'b'.repeat(32), regions: [AUJOURDHUI.id] },
    { tirage: 'c'.repeat(32), regions: [AUTRES[0], AUTRES[1], AUJOURDHUI.id] },
  ].map((partie) => ({ ...partie, jour: 2, etat: 'gagnee', modes: { rotation: false, cachee: false } }))
  await traiter(
    new Request('https://serveur/parties', { method: 'POST', body: JSON.stringify({ v: 1, parties }) }),
    base,
    new Date(),
  )
}

// le joueur a joué hier (trouvée) et aujourd'hui : trouvée en 2 essais (5 points)
function mesParties() {
  localStorage.setItem(
    CLE,
    JSON.stringify({
      1: { regions: [regionDuNumero(1).id], etat: 'gagnee' },
      2: { regions: [AUTRES[2], AUJOURDHUI.id], etat: 'gagnee' },
    }),
  )
}

function envois(): EnvoiAuServeur[] {
  return fetch.mock.calls
    .filter(([, options]) => options?.method === 'POST')
    .map(([, options]) => JSON.parse(options!.body as string))
}

describe('Les chiffres de tous', () => {
  it('à l’ouverture, tout l’historique part une fois, puis les chiffres du jour s’affichent', async () => {
    await deuxAutresJoueurs()
    mesParties()
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Résultats' })
    const section = await within(fenetre).findByRole('region', { name: 'Les joueurs du jour' })
    expect(within(section).getByText('3 joueurs aujourd’hui · 100 % ont trouvé')).toBeDefined()
    // 5 points : mieux que l'autre joueur à 4 points, pas que celui à 6 ; la partie du joueur n'est pas comptée deux fois
    expect(within(section).getByText('Avec 5 points, tu fais mieux que 50 % des joueurs.')).toBeDefined()
    // le nom d'une image garde l'espace insécable, contrairement au texte affiché (voir docs/lecons.md)
    expect(within(section).getByRole('img', { name: '33 % des victoires en 2 essais, comme toi' })).toBeDefined()
    expect(within(section).getByRole('img', { name: '33 % des victoires en 1 essai' })).toBeDefined()

    // les deux parties du joueur sont dans la base, chacune avec son propre tirage
    await waitFor(() => expect(base.lignes()).toHaveLength(4))
    const tirages = [...lire().values()].map((partie) => partie.tirage)
    expect(new Set(tirages).size).toBe(2)
    // rien n'est renvoyé une seconde fois : une nouvelle synchronisation n'a plus rien à envoyer
    const avant = envois().length
    await synchroniser()
    expect(envois()).toHaveLength(avant)
    expect(aEnvoyer()).toEqual([])
  })

  it('refusé dans les réglages : le site ne contacte pas du tout le serveur', async () => {
    localStorage.setItem(CLE_REGLAGES, JSON.stringify({ envoi: false }))
    mesParties()
    render(<App />)
    expect(screen.getByRole('dialog', { name: 'Résultats' })).toBeDefined()
    await synchroniser()
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: 'Les joueurs du jour' })).toBeNull()
  })

  it('le serveur ne répond pas : la fenêtre reste celle d’avant, et les parties repartiront plus tard', async () => {
    fetch.mockRejectedValue(new TypeError('pas de réseau'))
    mesParties()
    render(<App />)
    const fenetre = screen.getByRole('dialog', { name: 'Résultats' })
    await synchroniser()
    expect(within(fenetre).queryByRole('region', { name: 'Les joueurs du jour' })).toBeNull()
    expect(within(fenetre).getByRole('button', { name: /Partager/ })).toBeDefined()
    // rien n'a été noté comme envoyé : la prochaine synchronisation enverra les deux parties
    expect(aEnvoyer()).toHaveLength(2)
  })

  it('un long historique part en plusieurs morceaux', async () => {
    fetch.mockImplementation(async () => new Response('{}', { status: 200 }))
    // 120 parties abandonnées sans essai, avant le premier jour du jeu (le site ne vérifie rien, le serveur si)
    const parties = Object.fromEntries(
      Array.from({ length: 120 }, (_, index) => [-index, { regions: [], etat: 'abandonnee' }]),
    )
    localStorage.setItem(CLE, JSON.stringify(parties))
    await synchroniser()
    expect(envois().map((envoi) => envoi.parties.length)).toEqual([PARTIES_PAR_ENVOI, PARTIES_PAR_ENVOI, 20])
    expect(aEnvoyer()).toEqual([])
  })
})
