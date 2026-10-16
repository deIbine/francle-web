import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Saisie } from './Saisie.tsx'

// vi.fn() : une fausse fonction qui retient ses appels (comme un mock Mockito) ; elle accepte toute saisie
function afficher() {
  const onProposer = vi.fn(() => true)
  render(<Saisie mode="nouvelles" onProposer={onProposer} />)
  return { joueur: userEvent.setup(), onProposer, champ: screen.getByRole('combobox') }
}

const options = () => screen.queryAllByRole('option').map((option) => option.textContent)

describe('La saisie', () => {
  it('propose des suggestions pendant la frappe, en français comme en anglais', async () => {
    const { joueur, champ } = afficher()
    await joueur.type(champ, 'nor')
    expect(options()).toEqual(['Normandie'])
    expect(champ.getAttribute('aria-expanded')).toBe('true')

    await joueur.clear(champ)
    await joueur.type(champ, 'bri')
    expect(options()).toEqual(['Bretagne'])
  })

  it('↓ puis Entrée propose la suggestion surlignée', async () => {
    const { joueur, champ, onProposer } = afficher()
    await joueur.type(champ, 'loire')
    expect(options()).toEqual(['Centre-Val de Loire', 'Pays de la Loire'])

    await joueur.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('option', { selected: true }).textContent).toBe('Pays de la Loire')
    await joueur.keyboard('{Enter}')
    expect(onProposer).toHaveBeenCalledWith('Pays de la Loire')
    expect((champ as HTMLInputElement).value).toBe('')
    expect(options()).toEqual([])
  })

  it('↑ depuis le début revient à la dernière suggestion', async () => {
    const { joueur, champ } = afficher()
    await joueur.type(champ, 'loire{ArrowUp}')
    expect(screen.getByRole('option', { selected: true }).textContent).toBe('Pays de la Loire')
  })

  it('un clic sur une suggestion la propose', async () => {
    const { joueur, champ, onProposer } = afficher()
    await joueur.type(champ, 'cor')
    await joueur.click(screen.getByRole('option', { name: 'Corse' }))
    expect(onProposer).toHaveBeenCalledWith('Corse')
  })

  it('Échap ferme la liste, et Entrée envoie alors le texte tapé', async () => {
    const { joueur, champ, onProposer } = afficher()
    await joueur.type(champ, 'nor{Escape}')
    expect(options()).toEqual([])
    await joueur.keyboard('{Enter}')
    expect(onProposer).toHaveBeenCalledWith('nor')
  })

  it('aria-controls désigne la liste même fermée : elle reste dans la page, cachée', async () => {
    const { joueur, champ } = afficher()
    const liste = () => document.getElementById(champ.getAttribute('aria-controls')!)
    expect(liste()?.getAttribute('role')).toBe('listbox')
    expect(liste()?.hidden).toBe(true)
    expect(champ.getAttribute('aria-expanded')).toBe('false')

    await joueur.type(champ, 'nor')
    expect(liste()?.hidden).toBe(false)
  })

  it('une saisie refusée reste dans le champ, pour être corrigée', async () => {
    const onProposer = vi.fn(() => false)
    render(<Saisie mode="nouvelles" onProposer={onProposer} />)
    const champ = screen.getByRole('combobox') as HTMLInputElement
    await userEvent.setup().type(champ, 'Atlantide{Enter}')
    expect(champ.value).toBe('Atlantide')
  })
})
