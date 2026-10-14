import { EMOJIS } from '../domaine/geographie.ts'
import { nouvellePartie, proposer } from '../domaine/partie.ts'
import { parId } from '../domaine/regions.ts'
import { useLangue, useTextes } from '../textes.ts'

// un vrai essai, calculé par les règles du jeu plutôt qu'écrit à la main : l'exemple reste juste si une règle change.
// La Normandie proposée quand il fallait trouver la Bretagne
const EXEMPLE = proposer(nouvellePartie(parId('bretagne'), 'nouvelles'), 'Normandie')!.essais[0]

// « Comment jouer » : ouvert à la première visite, puis par le bouton ❓
export function Aide({ onJouer }: { onJouer: () => void }) {
  const textes = useTextes()
  const langue = useLangue()
  return (
    <div className="flex flex-col gap-3 text-left">
      <p>{textes.aide.but}</p>
      <div>
        <p>{textes.aide.apres}</p>
        {/* list-disc : des puces ; pl-5 : la place pour elles, à gauche */}
        <ul className="list-disc pl-5">
          <li>{textes.aide.distance}</li>
          <li>{textes.aide.direction}</li>
          <li>{textes.aide.proximite}</li>
        </ul>
      </div>
      <p className="rounded bg-surface p-2 text-sm">
        {textes.aide.exemple(
          EXEMPLE.region.nom[langue],
          // la distance en km dans l'exemple, quelle que soit l'unité choisie : c'est une explication, pas un essai
          textes.distance(EXEMPLE.distance, 'km'),
          EMOJIS[EXEMPLE.direction],
          textes.pourcentage(EXEMPLE.proximite),
        )}
      </p>
      <p>{textes.aide.indices}</p>
      <p>{textes.aide.jour}</p>
      <p>{textes.aide.libre}</p>
      <p>{textes.aide.modes}</p>
      <button
        type="button"
        onClick={onJouer}
        className="self-center rounded bg-francle-fonce px-6 py-2 font-semibold text-white hover:opacity-90"
      >
        {textes.aide.jouer}
      </button>
    </div>
  )
}
