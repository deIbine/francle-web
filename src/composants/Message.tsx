/*
Le message sous une saisie : une explication (« Alsace : une ancienne région… », « déjà proposée »), ou une vraie
erreur (« Cette région n'existe pas »). Avant web.7.16.3, tout était en rouge : une simple explication avait l'air
d'une faute du joueur. L'explication est maintenant neutre, sur un fond discret, et le rouge est gardé pour l'erreur.
 */
import type { LeMessage } from '../message.ts'

// « defaut » : ce qui s'affiche quand il n'y a pas de message (la réponse précédente, dans le bonus), en texte simple
export function Message({ message, defaut = '' }: { message: LeMessage; defaut?: string }) {
  const vide = message.texte === ''
  return (
    // aria-live : un lecteur d'écran lit le message dès qu'il change ; min-h garde la place réservée
    <p
      aria-live="polite"
      className={`min-h-5 text-sm ${
        vide ? '' : message.sorte === 'erreur' ? 'text-erreur' : 'rounded bg-surface px-3 py-1.5 text-left text-discret'
      }`}
    >
      {/* ⓘ n'est qu'un dessin : le lecteur d'écran lit le texte seul */}
      {!vide && message.sorte === 'info' && <span aria-hidden="true">ⓘ </span>}
      {vide ? defaut : message.texte}
    </p>
  )
}
