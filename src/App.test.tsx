/*
Les tests de l'écran : on affiche le jeu dans un faux navigateur (jsdom), puis on joue comme un joueur, avec
user-event qui tape au clavier et clique comme une vraie personne (touche par touche, focus compris).

On cherche les éléments comme un joueur ou un lecteur d'écran les trouve : par leur rôle (« combobox », « button »)
et leur texte, jamais par une classe CSS. Le test ne casse donc pas si on change l'apparence.
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'

// le 14 octobre 2026 : la partie n° 2
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const AUTRES = tirables('nouvelles').filter((region) => region !== CIBLE)

function demarrer() {
  const joueur = userEvent.setup()
  render(<App date={DATE} />)
  return joueur
}

async function proposer(joueur: ReturnType<typeof userEvent.setup>, nom: string) {
  const champ = screen.getByRole('combobox', { name: 'Ta proposition' })
  await joueur.clear(champ)
  // {Escape} ferme les suggestions, {Enter} envoie le texte tapé
  await joueur.type(champ, `${nom}{Escape}{Enter}`)
}

// les lignes du tableau des essais déjà jouées (les lignes vides sont cachées aux lecteurs d'écran)
function lignes() {
  const tableau = screen.getByRole('table', { name: 'Tes essais' })
  return within(tableau).queryAllByRole('row').filter((ligne) => ligne.closest('tbody') !== null)
}

describe('Le jeu', () => {
  it('affiche le titre, le numéro de la partie et la silhouette', () => {
    demarrer()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Francle n°\u00a02')
    expect(screen.getByRole('img', { name: 'La silhouette de la région à deviner' })).toBeDefined()
    expect(lignes()).toHaveLength(0)
  })

  it('un essai raté ajoute une ligne et révèle le premier indice', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    expect(lignes()).toHaveLength(1)
    expect(lignes()[0].textContent).toContain(AUTRES[0].nom.fr)
    expect(lignes()[0].textContent).toMatch(/km.*%/)
    expect(screen.getByText('Superficie')).toBeDefined()
    expect(screen.queryByText('Spécialité')).toBeNull()
    // le champ est vidé, prêt pour l'essai suivant
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('')
  })

  it('une région inconnue ne coûte pas d’essai', async () => {
    const joueur = demarrer()
    await proposer(joueur, 'Atlantide')
    expect(screen.getByText('Cette région n’existe pas, ou n’est pas dans le jeu.')).toBeDefined()
    expect(lignes()).toHaveLength(0)
  })

  it('une ancienne région n’est pas acceptée dans la partie du jour', async () => {
    const joueur = demarrer()
    await proposer(joueur, 'Picardie')
    expect(lignes()).toHaveLength(0)
  })

  it('une région déjà proposée ne coûte pas d’essai', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, AUTRES[0].nom.en)
    expect(screen.getByText(`${AUTRES[0].nom.fr} : déjà proposée.`)).toBeDefined()
    expect(lignes()).toHaveLength(1)
  })

  it('trouver la région termine la partie, et ouvre les résultats avec la carte', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, CIBLE.nom.fr)
    const resultats = screen.getByRole('dialog', { name: 'Résultats' })
    expect(within(resultats).getByText('Bravo, trouvé en 2 essais !')).toBeDefined()
    expect(within(resultats).getByRole('img', { name: `Carte de France, la région ${CIBLE.nom.fr} en bleu` })).toBeDefined()
    expect(lignes()[1].textContent).toContain('100\u00a0%')
    // plus de saisie ni de bouton « Abandonner » une fois la partie finie
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Abandonner' })).toBeNull()
  })

  it('six essais ratés : la partie est perdue, et les cinq indices ont été révélés', async () => {
    const joueur = demarrer()
    for (const region of AUTRES.slice(0, 6)) {
      await proposer(joueur, region.nom.fr)
    }
    const resultats = screen.getByRole('dialog', { name: 'Résultats' })
    expect(within(resultats).getByText('Perdu, ce sera pour demain.')).toBeDefined()
    expect(within(resultats).getByText(CIBLE.nom.fr, { selector: 'strong' })).toBeDefined()
    for (const indice of ['Superficie', 'Spécialité', 'Personnalité', 'Capitale', 'Monument']) {
      expect(screen.getByText(indice)).toBeDefined()
    }
  })

  it('abandonner demande une confirmation', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Abandonner' }))
    await joueur.click(screen.getByRole('button', { name: 'Non' }))
    expect(screen.getByRole('combobox')).toBeDefined()

    await joueur.click(screen.getByRole('button', { name: 'Abandonner' }))
    await joueur.click(screen.getByRole('button', { name: 'Oui' }))
    expect(within(screen.getByRole('dialog')).getByText('Partie abandonnée.')).toBeDefined()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('la partie est retrouvée après fermeture de la page', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, AUTRES[1].nom.fr)
    // on ferme la page (le composant disparaît)… puis on revient
    cleanup()
    render(<App date={DATE} />)
    expect(lignes()).toHaveLength(2)
    expect(lignes()[1].textContent).toContain(AUTRES[1].nom.fr)
    expect(screen.getByText('Spécialité')).toBeDefined()
  })

  it('une partie finie est retrouvée finie, résultats ouverts', async () => {
    const joueur = demarrer()
    await proposer(joueur, CIBLE.nom.fr)
    cleanup()
    render(<App date={DATE} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Résultats' })).toBeDefined()
  })

  it('les résultats comptent la partie qui vient de finir', async () => {
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, CIBLE.nom.fr)
    const resultats = screen.getByRole('dialog', { name: 'Résultats' })
    const chiffre = (nom: string) => within(resultats).getByText(nom).nextElementSibling?.textContent
    // dt puis dd dans le HTML : la valeur suit son nom
    expect(chiffre('Parties')).toBe('1')
    expect(chiffre('Victoires')).toBe('100 %')
    expect(chiffre('Série en cours')).toBe('1')
    expect(within(resultats).getByLabelText('1 victoire en 2 essais')).toBeDefined()
  })

  it('le bouton 📊 ouvre les statistiques pendant la partie, ✕ les ferme', async () => {
    const joueur = demarrer()
    expect(screen.queryByRole('dialog')).toBeNull()
    await joueur.click(screen.getByRole('button', { name: 'Voir les statistiques' }))
    const fenetre = screen.getByRole('dialog', { name: 'Statistiques' })
    expect(within(fenetre).queryByRole('button', { name: /Partager/ })).toBeNull()
    await joueur.click(within(fenetre).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('« Partager » copie le résultat dans le presse-papiers', async () => {
    // userEvent.setup() remplace le presse-papiers du faux navigateur par une imitation qu'on peut relire
    const joueur = demarrer()
    await proposer(joueur, AUTRES[0].nom.fr)
    await proposer(joueur, CIBLE.nom.fr)
    await joueur.click(screen.getByRole('button', { name: /Partager/ }))
    const copie = await navigator.clipboard.readText()
    expect(copie.split('\n')[0]).toBe('#Francle n° 2 2/6')
    expect(copie).not.toContain(CIBLE.nom.fr)
    expect(screen.getByText('Résultat copié : il n’y a plus qu’à le coller.')).toBeDefined()
  })

  describe('à minuit', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('la partie finie laisse place à la région du lendemain', async () => {
      // seule l'horloge (Date) est truquée : les minuteries restent réelles, le compte à rebours tourne vraiment
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2026, 9, 14, 23, 59, 58))
      const joueur = demarrer()
      await proposer(joueur, CIBLE.nom.fr)
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Francle n°\u00a02')

      vi.setSystemTime(new Date(2026, 9, 15, 0, 0, 1))
      // la minuterie du compte à rebours passe chaque seconde : on attend qu'elle voie minuit
      expect(await screen.findByRole('heading', { name: /^Francle n°\s3$/ }, { timeout: 2000 })).toBeDefined()
      expect(screen.getByRole('combobox')).toBeDefined()
      expect(lignes()).toHaveLength(0)
    })
  })
})
