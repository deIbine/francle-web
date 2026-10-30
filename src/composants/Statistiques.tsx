import type { Statistiques as Stats } from '../domaine/statistiques.ts'
import { useTextes } from '../textes.ts'

// les statistiques : quatre nombres, la répartition des victoires par nombre d'essais, en barres, puis le bonus des
// départements (combien de bonus finis, et leur score moyen).
// « dernier » : le nombre d'essais de la victoire du jour, dont la barre est mise en avant (comme Wordle)
export function Statistiques({ stats, dernier }: { stats: Stats; dernier?: number }) {
  const textes = useTextes()
  const chiffres = [
    [textes.stats.jouees, stats.jouees],
    [textes.stats.victoires, textes.stats.pourcentage(stats.pourcentage)],
    [textes.stats.serie, stats.serie],
    [textes.stats.meilleureSerie, stats.meilleureSerie],
  ] as const
  // la plus grande barre prend toute la largeur ; Math.max(1, …) évite une division par zéro sans victoire
  const plusGrande = Math.max(1, ...stats.repartition)
  return (
    <section aria-label={textes.stats.titre} className="flex flex-col gap-4">
      {/* grid-cols-4 : quatre colonnes de même largeur */}
      <dl className="grid grid-cols-4 gap-2">
        {chiffres.map(([nom, valeur]) => (
          // flex-col-reverse : la valeur (dd) au-dessus de son nom (dt), tout en gardant l'ordre dt puis dd du HTML.
          // justify-end : dans une colonne inversée, la « fin » est en haut. Les valeurs restent ainsi alignées en haut
          // même quand un nom prend deux lignes (« Série en cours » sur téléphone) ; sans cela, elles montaient
          <div key={nom} className="flex flex-col-reverse justify-end">
            <dt className="text-xs text-discret">{nom}</dt>
            <dd className="text-2xl font-bold tabular-nums">{valeur}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-2 font-semibold">{textes.stats.repartition}</h3>
        <ol className="flex flex-col gap-1 text-sm">
          {stats.repartition.map((nombre, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-3 tabular-nums">{index + 1}</span>
              {/* role="img" : un aria-label n'est sûr d'être lu que sur un élément qui a un rôle ; un <span> n'en a pas,
                  et certains lecteurs d'écran l'ignoraient (web.7.19). La barre est une petite image, et son nom la
                  décrit en entier */}
              <span
                role="img"
                aria-label={textes.stats.barre(index + 1, nombre)}
                // la largeur dépend des données : un style calculé, que Tailwind ne peut pas connaître d'avance
                style={{ width: `${Math.max(8, (nombre * 100) / plusGrande)}%` }}
                className={`rounded px-2 text-right font-semibold text-white tabular-nums ${
                  dernier === index + 1 ? 'bg-francle-fonce' : 'bg-gray-500'
                }`}
              >
                {nombre}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">{textes.stats.bonus}</h3>
        <dl className="grid grid-cols-2 gap-2">
          {(
            [
              [textes.stats.bonusJoues, stats.bonusJoues],
              [
                textes.stats.scoreMoyenBonus,
                stats.bonusJoues === 0 ? textes.stats.aucunScore : textes.stats.pourcentage(stats.scoreMoyenBonus),
              ],
            ] as const
          ).map(([nom, valeur]) => (
            <div key={nom} className="flex flex-col-reverse justify-end">
              <dt className="text-xs text-discret">{nom}</dt>
              <dd className="text-2xl font-bold tabular-nums">{valeur}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
