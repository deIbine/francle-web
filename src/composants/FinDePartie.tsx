import type { ReactNode } from 'react'
import type { Partie } from '../domaine/partie.ts'
import { useLangue, useTextes } from '../textes.ts'
import { CarteFrance } from './CarteFrance.tsx'

interface Props {
  partie: Partie
  message: string
  // le bas de la fenêtre : compte à rebours et partage pour la partie du jour, « Nouvelle partie » pour la libre.
  // children : ce qu'on écrit entre <FinDePartie> et </FinDePartie>
  children: ReactNode
}

// le haut de la fenêtre de résultats, une fois la partie terminée : le résultat, la réponse et la carte
export function FinDePartie({ partie, message, children }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  return (
    <section className="flex flex-col gap-3">
      <p className="text-lg font-semibold">{message}</p>
      <p>
        {textes.reponse} <strong>{partie.cible.nom[langue]}</strong>
      </p>
      <CarteFrance mode={partie.mode} cible={partie.cible.id} nom={partie.cible.nom[langue]} />
      <div className="border-t border-bord pt-3">{children}</div>
    </section>
  )
}
