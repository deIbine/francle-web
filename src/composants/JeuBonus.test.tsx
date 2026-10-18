/*
Le composant du bonus, seul : les questions écrites, que le jeu en ligne ne montre pas toutes. Le mode B (nommer le
département colorié) n'est choisi que par la constante MODE_BONUS ; la question du numéro ne sert qu'à l'outre-mer.
Un petit parent garde le bonus, comme le font PartieDuJour et PartieLibre.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { nouveauBonus, type Bonus } from '../domaine/bonus.ts'
import { departementsDe } from '../domaine/departements.ts'
import { parId } from '../domaine/regions.ts'
import { JeuBonus } from './JeuBonus.tsx'

function Parent({ depart, focaliser }: { depart: Bonus; focaliser?: boolean }) {
  const [bonus, setBonus] = useState(depart)
  return <JeuBonus bonus={bonus} onChanger={setBonus} focaliser={focaliser} />
}

// focaliser : comme quand le joueur vient de lancer le bonus
function afficher(bonus: Bonus, focaliser = false) {
  render(<Parent depart={bonus} focaliser={focaliser} />)
  return userEvent.setup()
}

describe('Le mode B : nommer le département colorié', () => {
  // la Bretagne dans l'ordre de ses numéros : 22, 29, 35, 56
  const bretagne = parId('bretagne')
  const bonusB = () => nouveauBonus(bretagne, departementsDe(bretagne), 'nom')

  it('pose la question, propose les départements de la région, accepte le nom ou le numéro', async () => {
    const joueur = afficher(bonusB())
    expect(screen.getByText('Quel est ce département, en bleu foncé ?')).toBeDefined()
    const champ = screen.getByRole('combobox', { name: 'Ta réponse' })
    await joueur.type(champ, 'cot')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(["Côtes-d'Armor (22)"])
    await joueur.type(champ, '{Escape}{Enter}')
    expect(screen.getByText("Juste : Côtes-d'Armor (22).")).toBeDefined()
    await joueur.type(champ, '35{Enter}')
    expect(screen.getByText(/^Raté : c’était Finistère \(29\)/)).toBeDefined()
    expect(screen.getByText('Département 3 sur 4')).toBeDefined()
  })

  it('une saisie qui n’est pas un département ne coûte rien', async () => {
    const joueur = afficher(bonusB())
    await joueur.type(screen.getByRole('combobox'), 'Brest{Escape}{Enter}')
    expect(screen.getByText('Ce n’est pas un département.')).toBeDefined()
    expect(screen.getByText('Département 1 sur 4')).toBeDefined()
  })

  it('un début de nom qui évoque plusieurs départements demande de choisir, sans rien coûter', async () => {
    const joueur = afficher(nouveauBonus(parId('corse'), departementsDe(parId('corse')), 'nom'))
    await joueur.type(screen.getByRole('combobox'), 'corse{Escape}{Enter}')
    expect(screen.getByText('Plusieurs départements possibles : choisis dans la liste.')).toBeDefined()
    expect(screen.getByText('Département 1 sur 2')).toBeDefined()
  })
})

describe('L’outre-mer : le numéro', () => {
  const guadeloupe = parId('guadeloupe')
  const bonus = () => nouveauBonus(guadeloupe, departementsDe(guadeloupe), 'carte')

  it('demande le numéro, pas un clic, et refuse le nom', async () => {
    const joueur = afficher(bonus())
    expect(screen.getByText('Quel est le numéro de la Guadeloupe ?')).toBeDefined()
    const champ = screen.getByRole('combobox', { name: 'Ta réponse' })
    await joueur.type(champ, 'Guadeloupe{Enter}')
    expect(screen.getByText('Écris un numéro de département, par exemple 971.')).toBeDefined()
    await joueur.clear(champ)
    await joueur.type(champ, '971{Enter}')
    expect(screen.getByText('Bonus terminé : 1 département trouvé sur 1.')).toBeDefined()
  })

  it('lancé par le joueur, le focus va dans la saisie : le numéro se tape tout de suite', () => {
    afficher(bonus(), true)
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Ta réponse' }))
  })

  it('chaque département d’outre-mer a son article', () => {
    const question = (id: string) => {
      const region = parId(id)
      render(<Parent depart={nouveauBonus(region, departementsDe(region), 'carte')} />)
      return screen.getByText(/^Quel est le numéro/).textContent
    }
    expect(question('la-reunion')).toBe('Quel est le numéro de La Réunion\u00a0?')
  })
})
