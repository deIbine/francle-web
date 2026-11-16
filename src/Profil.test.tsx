/*
Le profil dans les réglages (web.9.3.1) : le créer, noter son code de secours, le retrouver, le supprimer ; les parties
qui partent au profil. fetch est branché sur le VRAI serveur, avec sa base SQLite en mémoire (comme
ChiffresDeTous.test.tsx). L'horloge des tests est arrêtée au 14 octobre 2026 (la partie n° 2).
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { baseDeTest } from '../serveur/src/base-de-test.ts'
import { traiter } from '../serveur/src/serveur.ts'
import App from './App.tsx'
import { regionDuNumero } from './domaine/regionDuJour.ts'
import { synchroniser } from './envoi.ts'
import { CLE_PROFIL, lireProfil } from './profil.ts'
import { CLE_REGLAGES } from './reglages.ts'
import { CLE } from './sauvegarde.ts'

let base: ReturnType<typeof baseDeTest>

beforeEach(() => {
  base = baseDeTest()
  vi.spyOn(globalThis, 'fetch').mockImplementation((entree, options) =>
    traiter(new Request(entree as string, options), base, new Date()),
  )
})

// deux parties finies, hier et aujourd'hui
function deuxParties() {
  localStorage.setItem(
    CLE,
    JSON.stringify({
      1: { regions: [regionDuNumero(1).id], etat: 'gagnee' },
      2: { regions: [], etat: 'abandonnee' },
    }),
  )
}

async function ouvrirReglages() {
  const joueur = userEvent.setup()
  render(<App />)
  // la fenêtre des résultats s'ouvre d'elle-même quand la partie du jour est finie : on la ferme d'abord
  const resultats = screen.queryByRole('dialog', { name: 'Résultats' })
  if (resultats !== null) {
    await joueur.click(within(resultats).getByRole('button', { name: 'Fermer' }))
  }
  await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
  return { joueur, reglages: screen.getByRole('dialog', { name: 'Réglages' }) }
}

async function creerProfil(pseudo: string) {
  const { joueur, reglages } = await ouvrirReglages()
  await joueur.type(within(reglages).getByLabelText('Ton pseudo'), pseudo)
  await joueur.click(within(reglages).getByRole('button', { name: 'Créer mon profil' }))
  return { joueur, reglages }
}

describe('Créer un profil', () => {
  it('prévient que le pseudo sera public, montre le code de secours une fois, puis envoie tout l’historique', async () => {
    deuxParties()
    const { joueur, reglages } = await ouvrirReglages()
    expect(within(reglages).getByText('Ton pseudo sera visible par tous, dans le classement public.')).toBeDefined()
    await joueur.type(within(reglages).getByLabelText('Ton pseudo'), 'Loutre')
    await joueur.click(within(reglages).getByRole('button', { name: 'Créer mon profil' }))

    const secours = await within(reglages).findByRole('status')
    expect(within(secours).getByText(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)).toBeDefined()
    expect(within(reglages).getByText('Ton pseudo : Loutre')).toBeDefined()
    // le profil est gardé dans le navigateur, avec son code secret
    expect(lireProfil()).toMatchObject({ pseudo: 'Loutre', code: expect.stringMatching(/^[0-9a-f]{32}$/) })
    // les deux parties sont parties au profil
    await waitFor(() => expect(base.sql('SELECT jour FROM parties_profil ORDER BY jour')).toEqual([{ jour: 1 }, { jour: 2 }]))

    await joueur.click(within(reglages).getByRole('button', { name: 'C’est noté' }))
    expect(within(reglages).queryByRole('status')).toBeNull()
  })

  it('un pseudo déjà pris ou refusé : le message le dit, et rien n’est créé ici', async () => {
    base.sql(
      `INSERT INTO profils (id, pseudo, cle_pseudo, empreinte_code, empreinte_secours, dernier_jour)
       VALUES ('x', 'Zoé', 'zoe', 'a', 'b', 2)`,
    )
    const { joueur, reglages } = await creerProfil('zoe')
    expect(await within(reglages).findByRole('alert')).toHaveProperty('textContent', 'Ce pseudo est déjà pris.')
    await joueur.clear(within(reglages).getByLabelText('Ton pseudo'))
    await joueur.type(within(reglages).getByLabelText('Ton pseudo'), 'moi@ici')
    await joueur.click(within(reglages).getByRole('button', { name: 'Créer mon profil' }))
    await waitFor(() =>
      expect(within(reglages).getByRole('alert').textContent).toMatch(/^Seulement des lettres/),
    )
    expect(lireProfil()).toBeUndefined()
  })
})

describe('Le code de secours', () => {
  it('retrouve le profil après un navigateur effacé', async () => {
    const { reglages } = await creerProfil('Loutre')
    const secours = within(await within(reglages).findByRole('status')).getByText(/^[A-Z2-9]{4}-/).textContent!
    const ancien = lireProfil()
    // le navigateur est effacé
    localStorage.removeItem(CLE_PROFIL)
    document.body.innerHTML = ''

    const { joueur, reglages: neufs } = await ouvrirReglages()
    await joueur.click(within(neufs).getByRole('button', { name: 'J’ai un code de secours' }))
    await joueur.type(within(neufs).getByLabelText('Code de secours'), secours.toLowerCase())
    await joueur.click(within(neufs).getByRole('button', { name: 'Retrouver mon profil' }))
    expect(await within(neufs).findByText('Ton pseudo : Loutre')).toBeDefined()
    // un nouveau code secret, pour le même profil
    expect(lireProfil()).toMatchObject({ pseudo: 'Loutre' })
    expect(lireProfil()).not.toEqual(ancien)
  })
})

describe('Supprimer son profil', () => {
  it('après confirmation, le profil et ses parties sont effacés du serveur et du navigateur', async () => {
    deuxParties()
    const { joueur, reglages } = await creerProfil('Loutre')
    await waitFor(() => expect(base.sql('SELECT * FROM parties_profil')).toHaveLength(2))
    // findBy (qui attend) et non getBy : les parties peuvent arriver au serveur AVANT que React ait redessiné les
    // réglages avec le profil. Vu en CI à web.9.4.3 (une machine plus lente), jamais sur le PC
    await joueur.click(await within(reglages).findByRole('button', { name: 'Supprimer mon profil' }))
    expect(within(reglages).getByText(/C’est définitif/)).toBeDefined()
    await joueur.click(within(reglages).getByRole('button', { name: 'Oui, supprimer' }))
    expect(await within(reglages).findByRole('button', { name: 'Créer mon profil' })).toBeDefined()
    expect(base.sql('SELECT * FROM profils')).toEqual([])
    expect(base.sql('SELECT * FROM parties_profil')).toEqual([])
    expect(lireProfil()).toBeUndefined()
  })
})

describe('Les envois au profil', () => {
  it('partent même si l’envoi anonyme est refusé, et rien d’anonyme ne part', async () => {
    localStorage.setItem(CLE_REGLAGES, JSON.stringify({ envoi: false }))
    deuxParties()
    await creerProfil('Loutre')
    await waitFor(() => expect(base.sql('SELECT * FROM parties_profil')).toHaveLength(2))
    expect(base.lignes()).toEqual([])
  })

  it('un profil que le serveur ne reconnaît plus est oublié, et les réglages le disent', async () => {
    localStorage.setItem(CLE_PROFIL, JSON.stringify({ id: 'x', pseudo: 'Fantôme', code: 'f'.repeat(32) }))
    deuxParties()
    await synchroniser()
    expect(lireProfil()).toEqual({ perdu: 'Fantôme' })
    const { reglages } = await ouvrirReglages()
    expect(within(reglages).getByText(/Ton profil « Fantôme » n’est plus reconnu/)).toBeDefined()
  })
})
