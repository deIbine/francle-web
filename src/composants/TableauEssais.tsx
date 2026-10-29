import { EMOJIS } from '../domaine/geographie.ts'
import { ESSAIS_MAX, type Essai } from '../domaine/partie.ts'
import type { Unite } from '../reglages.ts'
import { useLangue, useTextes } from '../textes.ts'

// le tableau des essais : une ligne par essai joué, et des lignes vides pour ceux qui restent, comme Worldle
// (on voit d'un coup d'œil combien d'essais il reste)
export function TableauEssais({ essais, unite }: { essais: readonly Essai[]; unite: Unite }) {
  const textes = useTextes()
  const langue = useLangue()
  // Array.from({ length: n }) : un tableau de n cases vides, pour dessiner les lignes restantes
  const restants = Array.from({ length: ESSAIS_MAX - essais.length })
  return (
    <table className="w-full border-separate border-spacing-y-1 text-sm">
      {/* sr-only : invisible à l'écran, mais lu par les lecteurs d'écran */}
      <caption className="sr-only">{textes.tableau}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{textes.colonnes.region}</th>
          <th scope="col">{textes.colonnes.distance}</th>
          <th scope="col">{textes.colonnes.direction}</th>
          <th scope="col">{textes.colonnes.proximite}</th>
        </tr>
      </thead>
      {/* px-1.5 sur téléphone (sm:px-2 au-delà) : 4 pixels de plus pour le nom, et « Provence-Alpes-Côte d’Azur » tient
          sur une ligne à 375 pixels, même à côté de « 100 % » (depuis web.7.18) */}
      <tbody>
        {essais.map((essai, index) => (
          <tr key={index} className="bg-surface">
            <td className="rounded-l px-1.5 py-1.5 sm:px-2 text-left font-medium">{essai.region.nom[langue]}</td>
            <td className="px-1.5 py-1.5 sm:px-2 text-right tabular-nums">{textes.distance(essai.distance, unite)}</td>
            <td className="px-1.5 py-1.5 sm:px-2 text-center">
              <span role="img" aria-label={textes.directions[essai.direction]}>
                {EMOJIS[essai.direction]}
              </span>
            </td>
            <td className="rounded-r px-1.5 py-1.5 sm:px-2 text-right tabular-nums">{textes.pourcentage(essai.proximite)}</td>
          </tr>
        ))}
        {restants.map((_, index) => (
          // aria-hidden : ces lignes vides ne sont qu'un dessin, un lecteur d'écran n'a rien à en dire
          <tr key={`vide-${index}`} aria-hidden="true">
            <td colSpan={4} className="h-8 rounded border border-dashed border-bord" />
          </tr>
        ))}
      </tbody>
    </table>
  )
}
