import type { ReactNode } from 'react'
import { bonusEnCours, type Bonus } from '../domaine/bonus.ts'
import type { Partie } from '../domaine/partie.ts'
import { finDuBonus, useLangue, useTextes } from '../textes.ts'
import { CarteFrance } from './CarteFrance.tsx'

interface Props {
  partie: Partie
  message: string
  // le bonus des départements, s'il a été joué : sa phrase de fin s'affiche sous le résultat, une fois fini
  bonus?: Bonus
  // le bas de la fenêtre : compte à rebours et partage pour la partie du jour, « Nouvelle partie » pour la libre.
  // children : ce qu'on écrit entre <FinDePartie> et </FinDePartie>
  children: ReactNode
}

// le haut de la fenêtre de résultats, une fois la partie terminée : le résultat, celui du bonus, la réponse et la carte
export function FinDePartie({ partie, message, bonus, children }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  return (
    <section className="flex flex-col gap-3">
      <p className="text-lg font-semibold">{message}</p>
      {bonus !== undefined && !bonusEnCours(bonus) && <p>{finDuBonus(bonus, textes)}</p>}
      <p>
        {textes.reponse} <strong>{partie.cible.nom[langue]}</strong>
      </p>
      <CarteFrance partie={partie} />
      <div className="border-t border-bord pt-3">{children}</div>
    </section>
  )
}
