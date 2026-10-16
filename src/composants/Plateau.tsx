/*
Le plateau de jeu, commun à la partie du jour et à la partie libre : la silhouette, la saisie, le tableau des
essais, les indices et le bouton « Abandonner ».

Le plateau ne garde pas la partie : il la reçoit, et demande à son parent de la remplacer (onChanger) quand le
joueur propose ou abandonne. C'est le parent qui sait quoi faire ensuite (sauvegarder pour la partie du jour, rien
pour la partie libre) : le même plateau sert aux deux.
 */
import { useState, type ReactNode } from 'react'
import { abandonner, enCours, indicesReveles, proposer, type Partie } from '../domaine/partie.ts'
import type { ModesDifficiles } from '../domaine/partage.ts'
import { deviner } from '../domaine/recherche.ts'
import type { Unite } from '../reglages.ts'
import { useLangue, useTextes } from '../textes.ts'
import { Indices } from './Indices.tsx'
import { Saisie } from './Saisie.tsx'
import { Silhouette } from './Silhouette.tsx'
import { TableauEssais } from './TableauEssais.tsx'

interface Props {
  partie: Partie
  onChanger: (suite: Partie) => void
  // les modes de cette partie, et l'angle de la silhouette en mode rotation
  modes: ModesDifficiles
  angle: number
  unite: Unite
  // ce qui s'affiche à la place de la saisie quand la partie est finie
  fin: ReactNode
}

export function Plateau({ partie, onChanger, modes, angle, unite, fin }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  // le message sous la saisie (« région inconnue »…), vide s'il n'y a rien à dire
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState(false)

  function jouer(saisie: string): boolean {
    // le nom tapé, ou la seule région qu'il évoque (« bret » -> Bretagne). Un refus ne coûte jamais d'essai
    const region = deviner(saisie, partie.mode)
    if (region === 'plusieurs') {
      setMessage(textes.plusieurs)
      return false
    }
    // une région déjà proposée ne coûte pas d'essai : le joueur s'est sûrement trompé de ligne
    if (region !== undefined && partie.essais.some((essai) => essai.region === region)) {
      setMessage(textes.dejaProposee(region.nom[langue]))
      return false
    }
    const suite = region === undefined ? undefined : proposer(partie, region.nom.fr)
    if (suite === undefined) {
      setMessage(textes.inconnue)
      return false
    }
    onChanger(suite)
    setMessage('')
    return true
  }

  return (
    <>
      <Silhouette region={partie.cible} angle={modes.rotation ? angle : 0} cachee={modes.cachee} />

      {enCours(partie) ? (
        <>
          <Saisie mode={partie.mode} onProposer={jouer} />
          {/* aria-live : un lecteur d'écran lit le message dès qu'il change ; min-h garde la place réservée */}
          <p aria-live="polite" className="min-h-5 text-sm text-erreur">
            {message}
          </p>
        </>
      ) : (
        fin
      )}

      <TableauEssais essais={partie.essais} unite={unite} />
      <Indices cible={partie.cible} reveles={indicesReveles(partie)} />

      {enCours(partie) &&
        (confirmation ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>{textes.confirmerAbandon}</span>
            <button
              type="button"
              onClick={() => {
                setConfirmation(false)
                onChanger(abandonner(partie))
              }}
              className="rounded bg-red-700 px-3 py-1 text-white"
            >
              {textes.oui}
            </button>
            <button type="button" onClick={() => setConfirmation(false)} className="rounded border px-3 py-1">
              {textes.non}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            className="self-center text-sm text-discret underline hover:text-texte"
          >
            {textes.abandonner}
          </button>
        ))}
    </>
  )
}
