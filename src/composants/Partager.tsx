/*
Le bouton de partage. Sur téléphone, il ouvre le menu de partage du système (Messages, WhatsApp…) grâce à
navigator.share ; ailleurs, il copie le texte dans le presse-papiers avec navigator.clipboard.

Sur ordinateur, certains navigateurs ont aussi navigator.share (le menu de partage de Windows, par exemple), peu
pratique pour coller un résultat dans une discussion : on ne l'utilise que sur un écran tactile, où « pointer:
coarse » (un pointeur imprécis, le doigt) est vrai.
 */
import { useState } from 'react'
import { textes } from '../textes.ts'

function surTelephone(): boolean {
  return typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches === true
}

export function Partager({ texte }: { texte: string }) {
  const [message, setMessage] = useState('')

  async function partager() {
    if (surTelephone()) {
      try {
        await navigator.share({ text: texte })
        return
      } catch (erreur) {
        // le joueur a fermé le menu : rien à faire. Toute autre erreur : on se rabat sur la copie
        if (erreur instanceof DOMException && erreur.name === 'AbortError') {
          return
        }
      }
    }
    try {
      // await : la copie est « asynchrone » (le navigateur peut demander la permission) ; on attend son résultat
      // sans bloquer la page, un peu comme un CompletableFuture
      await navigator.clipboard.writeText(texte)
      setMessage(textes.copie)
    } catch {
      setMessage(textes.copieImpossible)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={partager}
        className="rounded bg-green-700 px-6 py-2 font-semibold text-white hover:opacity-90"
      >
        {textes.partager} 📋
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-discret">
        {message}
      </p>
    </div>
  )
}
