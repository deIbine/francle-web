/*
Le bouton de partage. Sur téléphone, il ouvre le menu de partage du système (Messages, WhatsApp…) grâce à
navigator.share ; ailleurs, il copie le texte dans le presse-papiers avec navigator.clipboard.

Sur ordinateur, certains navigateurs ont aussi navigator.share (le menu de partage de Windows, par exemple), peu
pratique pour coller un résultat dans une discussion : on ne l'utilise que sur un écran tactile, où « pointer:
coarse » (un pointeur imprécis, le doigt) est vrai.
 */
import { useEffect, useState } from 'react'
import { useTextes } from '../textes.ts'

// le temps que reste affiché « Résultat copié », en millisecondes
export const DUREE_MESSAGE = 3000

function surTelephone(): boolean {
  return typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches === true
}

export function Partager({ texte }: { texte: string }) {
  const textes = useTextes()
  const [message, setMessage] = useState('')

  // le message s'efface tout seul (depuis web.7.18) : resté affiché, il ne disait plus rien au clic suivant, qui
  // copiait pourtant à nouveau. Un message neuf relance la minuterie ; la fonction rendue l'arrête
  useEffect(() => {
    if (message === '') {
      return
    }
    const minuterie = setTimeout(() => setMessage(''), DUREE_MESSAGE)
    return () => clearTimeout(minuterie)
  }, [message])

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
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={partager}
        className="rounded bg-succes px-6 py-2 font-semibold text-white hover:opacity-90"
      >
        {textes.partager} 📋
      </button>
      {/* le message ne prend de place que quand il y en a un (depuis web.7.18) : sa ligne réservée laissait un vide
          sous les boutons du bilan. Le paragraphe reste dans la page, vide : un lecteur d'écran ne lit (aria-live) que
          ce qui change dans une zone qu'il connaît déjà */}
      <p aria-live="polite" className={message === '' ? 'text-sm' : 'mt-1 text-sm text-discret'}>
        {message}
      </p>
    </div>
  )
}
