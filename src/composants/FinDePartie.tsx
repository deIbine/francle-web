import type { ReactNode } from 'react'
import { bonusEnCours, type Bonus } from '../domaine/bonus.ts'
import type { Partie } from '../domaine/partie.ts'
import { finDuBonus, useLangue, useTextes } from '../textes.ts'
import { CarteFrance } from './CarteFrance.tsx'

interface Props {
  partie: Partie
  // partie libre : « Perdu ! » plutôt que « ce sera pour demain »
  libre?: boolean
  // le bonus des départements, s'il a été joué : sa phrase de fin s'affiche sous le résultat, une fois fini
  bonus?: Bonus
  // le bas de la fenêtre : compte à rebours et partage pour la partie du jour, « Nouvelle partie » pour la libre.
  // children : ce qu'on écrit entre <FinDePartie> et </FinDePartie>
  children: ReactNode
}

// le haut de la fenêtre de résultats, une fois la partie terminée : le résultat (la même phrase que dans le bilan sous
// le plateau, depuis web.7.19 : elle donne aussi la réponse), celui du bonus, et la carte
export function FinDePartie({ partie, libre = false, bonus, children }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  return (
    <section className="flex flex-col gap-3">
      <p className="text-lg font-semibold">{textes.resultat(partie, partie.cible.nom[langue], libre)}</p>
      {bonus !== undefined && !bonusEnCours(bonus) && <p>{finDuBonus(bonus, textes)}</p>}
      <CarteFrance partie={partie} />
      <div className="border-t border-bord pt-3">{children}</div>
    </section>
  )
}
