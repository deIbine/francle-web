/*
Les tests des corrections relevées le 29 octobre 2026 (web.7.18, voir docs/plan.md) : un test par point qui se
vérifie dans le faux navigateur (jsdom). Les points de pure mise en page (la place du chargement de la carte, les noms
longs du tableau) se vérifient à l'œil, dans un vrai navigateur.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { DUREE_MESSAGE, Partager } from './composants/Partager.tsx'
import { regionDuJour } from './domaine/regionDuJour.ts'
import { tirables } from './domaine/regions.ts'
import { CLE_AIDE } from './reglages.ts'
import { TEXTES } from './textes.ts'

// le jour où l'horloge des tests est arrêtée (voir preparationTests.ts)
const DATE = new Date(2026, 9, 14, 12)
const CIBLE = regionDuJour(DATE)
const AUTRES = tirables('nouvelles').filter((region) => region !== CIBLE)

type Joueur = ReturnType<typeof userEvent.setup>

function demarrer() {
  const joueur = userEvent.setup()
  render(<App />)
  return joueur
}

// le panneau de l'onglet affiché (l'autre est caché, donc ignoré par getByRole)
const panneau = () => screen.getByRole('tabpanel')

async function proposer(joueur: Joueur, nom: string) {
  const champ = within(panneau()).getByRole('combobox')
  await joueur.clear(champ)
  await joueur.type(champ, `${nom}{Escape}{Enter}`)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('(1) Changer d’époque pendant le bonus de la partie libre', () => {
  it('demande confirmation, et « Non » garde le bonus', async () => {
    // Math.random truqué : 0 tire la première région de l'époque
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const cible = tirables('nouvelles')[0]
    const joueur = demarrer()
    await joueur.click(screen.getByRole('tab', { name: 'Partie libre' }))
    await proposer(joueur, cible.nom.fr)
    const bonus = () => within(panneau()).queryByRole('heading', { name: /^Bonus/ })
    expect(bonus()).not.toBeNull()

    const anciennes = () => screen.getByRole('radio', { name: 'Anciennes régions (avant 2016)' }) as HTMLInputElement
    // getByText remplace les espaces, insécables comprises, par des espaces simples
    const question = 'Changer d’époque ? Le bonus en cours sera perdu.'
    await joueur.click(anciennes())
    expect(anciennes().checked).toBe(false)
    expect(within(panneau()).getByText(question)).toBeDefined()
    await joueur.click(within(panneau()).getByRole('button', { name: 'Non' }))
    expect(bonus()).not.toBeNull()

    // « Oui » : une nouvelle partie, dans l'autre époque
    await joueur.click(anciennes())
    await joueur.click(within(panneau()).getByRole('button', { name: 'Oui' }))
    expect(anciennes().checked).toBe(true)
    expect(bonus()).toBeNull()
  })
})

describe('(3, 4) La fenêtre', () => {
  // une fenêtre, un bouton de repli, et de quoi l'ouvrir ou la fermer
  function Essai({ onFermer }: { onFermer?: () => void }) {
    const [ouverte, setOuverte] = useState(true)
    const repli = useRef<HTMLButtonElement>(null)
    return (
      <>
        <button ref={repli} type="button">
          Repli
        </button>
        <button type="button" onClick={() => setOuverte(false)}>
          Fermer de dehors
        </button>
        <Fenetre
          ouverte={ouverte}
          onFermer={() => {
            onFermer?.()
            setOuverte(false)
          }}
          titre="Essai"
          repli={repli}
        >
          <p>Le contenu</p>
        </Fenetre>
      </>
    )
  }

  it('rend le focus au repli quand il est retombé sur la page', () => {
    render(<Essai />)
    // ce qui avait le focus à l'ouverture a disparu : le navigateur le laisse sur <body>
    ;(document.activeElement as HTMLElement | null)?.blur()
    expect(document.activeElement).toBe(document.body)
    fireEvent.click(screen.getByRole('button', { name: 'Fermer de dehors' }))
    // le clic de fireEvent ne donne pas le focus : il est toujours sur <body> quand la fenêtre se ferme
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Repli' }))
  })

  it('rend aussi le focus au repli quand il est encore dans la fenêtre qui se ferme', () => {
    // le cas vu dans un vrai navigateur : à l'évènement « close », le focus est encore sur ✕, puis tombe sur <body>
    render(<Essai />)
    const croix = screen.getByRole('button', { name: 'Fermer' })
    croix.focus()
    fireEvent.click(croix)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Repli' }))
  })

  it('laisse le focus là où il est, s’il est ailleurs que sur la page', () => {
    render(<Essai />)
    const dehors = screen.getByRole('button', { name: 'Fermer de dehors' })
    dehors.focus()
    fireEvent.click(dehors)
    expect(document.activeElement).toBe(dehors)
  })

  it('ne se ferme pas quand une sélection commencée dedans finit sur le fond grisé', () => {
    const onFermer = vi.fn()
    render(<Essai onFermer={onFermer} />)
    const fenetre = screen.getByRole('dialog', { name: 'Essai' })
    // le bouton enfoncé sur le texte, relâché sur le fond : le « click » va au <dialog>, leur ancêtre commun
    fireEvent.mouseDown(screen.getByText('Le contenu'))
    fireEvent.click(fenetre)
    expect(onFermer).not.toHaveBeenCalled()
    // un vrai clic sur le fond la ferme toujours (onFermer est appelé par le clic, puis par l'évènement close)
    fireEvent.mouseDown(fenetre)
    fireEvent.click(fenetre)
    expect(onFermer).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('(5) La première visite, une partie du jour déjà finie', () => {
  it('n’ouvre que « Comment jouer », pas les résultats par-dessus', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Abandonner' }))
    await joueur.click(screen.getByRole('button', { name: 'Oui' }))
    expect(screen.getByRole('dialog', { name: 'Résultats' })).toBeDefined()

    cleanup()
    localStorage.removeItem(CLE_AIDE)
    render(<App />)
    // une fenêtre fermée est cachée, donc ignorée par getAllByRole
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog', { name: 'Comment jouer' })).toBeDefined()
  })
})

describe('(7) Les suggestions', () => {
  it('ne proposent plus une région déjà jouée', async () => {
    const joueur = demarrer()
    const deja = AUTRES[0]
    await proposer(joueur, deja.nom.fr)
    await joueur.type(within(panneau()).getByRole('combobox'), deja.nom.fr.slice(0, 4))
    expect(screen.queryAllByRole('option').map((option) => option.textContent)).not.toContain(deja.nom.fr)
  })
})

describe('(8, 9) Le message du partage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('n’apparaît qu’après un clic, puis s’efface tout seul', async () => {
    // les minuteries aussi sont truquées ici, pour avancer de 3 secondes sans attendre
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const ecrire = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: ecrire }, configurable: true })
    render(<Partager texte="#Francle n° 2 3/6" />)
    const message = () => screen.getByRole('button', { name: /Partager/ }).nextElementSibling!
    expect(message().textContent).toBe('')
    // vide, il ne prend pas de place : pas de marge (mt-1) sous le bouton
    expect(message().className).not.toContain('mt-1')

    // act : attendre que React ait fini (ici, la promesse de la copie, puis l'affichage)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Partager/ }))
    })
    expect(ecrire).toHaveBeenCalledWith('#Francle n° 2 3/6')
    expect(message().textContent).toBe(TEXTES.fr.copie)

    act(() => {
      vi.advanceTimersByTime(DUREE_MESSAGE)
    })
    expect(message().textContent).toBe('')
  })
})

describe('(10, 12) Les textes', () => {
  it('le nombre d’essais reste collé à « essais »', () => {
    expect(TEXTES.fr.bilan.gagnee('Bretagne', 3)).toBe('🎉 Bretagne, trouvée en 3 essais')
    expect(TEXTES.en.bilan.gagnee('Brittany', 3)).toBe('🎉 Brittany, found in 3 tries')
  })

  it('la superficie suit l’unité des distances', () => {
    // 84 060 km² / 1,609344² = 32 456,1 mi²
    expect(TEXTES.en.superficie(84060, 'mi')).toBe('32,456 mi²')
    expect(TEXTES.en.superficie(84060, 'km')).toBe('84,060 km²')
    expect(TEXTES.fr.superficie(84060, 'mi')).toBe(`${(32456).toLocaleString('fr-FR')} mi²`)
  })

  it('en miles, l’indice « Superficie » est en mi²', async () => {
    const joueur = demarrer()
    await joueur.click(screen.getByRole('button', { name: 'Ouvrir les réglages' }))
    const reglages = screen.getByRole('dialog', { name: 'Réglages' })
    await joueur.click(within(reglages).getByLabelText('Miles', { exact: false }))
    await joueur.click(within(reglages).getByRole('button', { name: 'Fermer' }))
    await proposer(joueur, AUTRES[0].nom.fr)
    expect(within(panneau()).getByText('Superficie').nextElementSibling?.textContent).toMatch(/\d\smi²$/)
  })
})
