import type { ReactNode } from 'react'
import { EMOJIS } from '../domaine/geographie.ts'
import { nouvellePartie, proposer } from '../domaine/partie.ts'
import { parId } from '../domaine/regions.ts'
import { useLangue, useTextes } from '../textes.ts'
import { IconeReglages } from './Icones.tsx'

// un vrai essai, calculé par les règles du jeu plutôt qu'écrit à la main : l'exemple reste juste si une règle change.
// La Normandie proposée quand il fallait trouver la Bretagne
const EXEMPLE = proposer(nouvellePartie(parId('bretagne'), 'nouvelles'), 'Normandie')!.essais[0]

// une ligne de la liste du bas : une icône (un dessin, caché aux lecteurs d'écran), puis le texte
function Etape({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="flex w-6 shrink-0 justify-center text-lg leading-6">
        {icone}
      </span>
      <span>{children}</span>
    </li>
  )
}

// « Comment jouer » : ouvert à la première visite, puis par le bouton d'aide de l'en-tête. Depuis web.7.16.4, illustré
// comme la maquette (docs/maquettes/coup-de-neuf.png) : une vraie ligne du tableau, ce que veut dire chaque colonne,
// puis quatre lignes courtes. Un exemple vaut mieux qu'un paragraphe
export function Aide({ onJouer }: { onJouer: () => void }) {
  const textes = useTextes()
  const langue = useLangue()
  const nom = EXEMPLE.region.nom[langue]
  return (
    <div className="flex flex-col gap-3 text-left">
      <p>{textes.aide.but}</p>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-discret">{textes.aide.exemple(nom)}</p>
        {/* la même allure qu'une ligne du tableau des essais (TableauEssais.tsx) */}
        <table className="w-full border-separate border-spacing-y-1 text-sm">
          <caption className="sr-only">{textes.aide.tableauExemple}</caption>
          <tbody>
            <tr className="bg-surface">
              <td className="rounded-l px-2 py-1.5 font-medium">{nom}</td>
              {/* la distance en km, quelle que soit l'unité choisie : c'est une explication, pas un essai */}
              <td className="px-2 py-1.5 text-right tabular-nums">{textes.distance(EXEMPLE.distance, 'km')}</td>
              <td className="px-2 py-1.5 text-center">
                <span role="img" aria-label={textes.directions[EXEMPLE.direction]}>
                  {EMOJIS[EXEMPLE.direction]}
                </span>
              </td>
              <td className="rounded-r px-2 py-1.5 text-right tabular-nums">{textes.pourcentage(EXEMPLE.proximite)}</td>
            </tr>
          </tbody>
        </table>
        {/* sous les colonnes distance, direction et proximité : ce qu'elles veulent dire */}
        <ul className="grid grid-cols-3 gap-2 pl-20 text-center text-xs text-discret">
          <li>{textes.aide.colonnes.distance}</li>
          <li>{textes.aide.colonnes.direction}</li>
          <li>{textes.aide.colonnes.proximite}</li>
        </ul>
      </div>
      <ul className="flex flex-col gap-2.5 text-sm">
        <Etape icone="💡">{textes.aide.indices}</Etape>
        <Etape icone="🗺️">{textes.aide.bonus}</Etape>
        <Etape icone="📅">{textes.aide.jour}</Etape>
        <Etape icone={<IconeReglages className="size-5" />}>{textes.aide.modes}</Etape>
      </ul>
      <button
        type="button"
        onClick={onJouer}
        className="self-center rounded bg-francle-fonce px-10 py-2 font-semibold text-white hover:opacity-90"
      >
        {textes.aide.jouer}
      </button>
    </div>
  )
}
