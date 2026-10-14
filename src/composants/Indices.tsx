import type { Indice } from '../domaine/partie.ts'
import type { Region } from '../domaine/regions.ts'
import { textes } from '../textes.ts'

// la valeur d'un indice pour une région, prête à afficher
function valeur(region: Region, indice: Indice): string {
  // switch sur un type union : TypeScript vérifie que chaque cas est traité, comme un switch sur un enum Java
  switch (indice) {
    case 'superficie':
      return textes.kilometresCarres(region.superficie)
    case 'capitale':
      return region.capitale
    default:
      // specialite, personnalite, monument : des textes dans les deux langues
      return region[indice].fr
  }
}

// les indices déjà révélés, dans l'ordre
export function Indices({ cible, reveles }: { cible: Region; reveles: readonly Indice[] }) {
  return (
    <section aria-labelledby="titre-indices" className="text-left">
      <h2 id="titre-indices" className="mb-1 font-semibold">
        {textes.indices}
      </h2>
      {reveles.length === 0 ? (
        <p className="text-sm text-gray-500">{textes.aucunIndice}</p>
      ) : (
        // dl / dt / dd : une liste de définitions (un nom, sa valeur), la balise HTML faite pour ça
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {reveles.map((indice) => (
            // HTML permet de grouper chaque paire dt + dd dans un div ; « contents » (display: contents) fait comme
            // si ce div n'existait pas pour la grille : dt et dd restent ses deux colonnes
            <div key={indice} className="contents">
              <dt className="text-gray-500">{textes.nomsIndices[indice]}</dt>
              <dd>{valeur(cible, indice)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
