/*
Une fenêtre par-dessus le jeu, avec la balise HTML <dialog>. Ouverte par showModal(), elle sait déjà tout ce qu'une
fenêtre doit faire : griser et bloquer la page derrière, garder le focus du clavier à l'intérieur, se fermer avec
Échap, et rendre le focus là où il était. Avant cette balise, il fallait une bibliothèque pour tout cela.

React décrit l'écran, mais showModal() et close() sont des ordres à donner à l'élément : useRef donne accès à
l'élément lui-même, et useEffect donne l'ordre après chaque affichage où « ouverte » a changé.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { textes } from '../textes.ts'

interface Props {
  ouverte: boolean
  onFermer: () => void
  titre: string
  children: ReactNode
}

export function Fenetre({ ouverte, onFermer, titre, children }: Props) {
  const fenetre = useRef<HTMLDialogElement>(null)
  const idTitre = useId()

  useEffect(() => {
    const element = fenetre.current
    if (element === null) {
      return
    }
    if (ouverte && !element.open) {
      element.showModal()
    } else if (!ouverte && element.open) {
      element.close()
    }
  }, [ouverte])

  return (
    <dialog
      ref={fenetre}
      aria-labelledby={idTitre}
      // « close » arrive quelle que soit la façon de fermer (Échap, bouton) : on prévient App, qui garde l'état
      onClose={onFermer}
      // un clic sur le fond grisé tombe sur le <dialog> lui-même (le contenu est dans le div) : on ferme
      onClick={(evenement) => {
        if (evenement.target === evenement.currentTarget) {
          onFermer()
        }
      }}
      // m-auto : centrée ; backdrop: : le fond grisé derrière la fenêtre (le pseudo-élément ::backdrop)
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg bg-fond p-0 text-texte shadow-xl backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4 p-5 text-center">
        <header className="flex items-center justify-between">
          <h2 id={idTitre} className="text-xl font-bold">
            {titre}
          </h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label={textes.fermer}
            className="rounded px-2 text-xl text-discret hover:bg-surface"
          >
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
