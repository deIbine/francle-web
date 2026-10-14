/*
La carte de France de fin de partie, la réponse en bleu.

Le jeu Java avait une image par région (35 cartes). Ici, un seul fichier par époque, produit par
outils/generer_images.py, donne le contour de chaque région : le composant les dessine tous en SVG, et colore la
réponse. C'est l'avantage d'un SVG écrit dans la page : chaque région est un élément qu'on peut styler.
 */
import type { Mode } from '../domaine/regions.ts'
import { textes } from '../textes.ts'
import anciennes from '../images/cartes/anciennes.json'
import nouvelles from '../images/cartes/nouvelles.json'

interface Carte {
  largeur: number
  hauteur: number
  encadres: { x: number; y: number; cote: number }[]
  regions: Record<string, string>
}

const CARTES: Record<Mode, Carte> = { anciennes, nouvelles }

export function CarteFrance({ mode, cible, nom }: { mode: Mode; cible: string; nom: string }) {
  const carte = CARTES[mode]
  // la réponse en dernier : en SVG, le dernier dessiné passe devant, et son trait blanc ne sera pas recouvert
  const ids = Object.keys(carte.regions).sort((a, b) => Number(a === cible) - Number(b === cible))
  return (
    <svg
      viewBox={`0 0 ${carte.largeur} ${carte.hauteur}`}
      role="img"
      aria-label={textes.carte(nom)}
      className="mx-auto h-auto w-full max-w-xs"
    >
      {carte.encadres.map(({ x, y, cote }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={cote}
          height={cote}
          vectorEffect="non-scaling-stroke"
          className="fill-none stroke-carte-trait"
        />
      ))}
      {ids.map((id) => (
        <path
          key={id}
          d={carte.regions[id]}
          // vectorEffect : le trait garde la même épaisseur quelle que soit la taille de la carte
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          className={id === cible ? 'fill-francle-fonce stroke-white stroke-[1.5]' : 'fill-carte-fond stroke-carte-trait'}
        />
      ))}
    </svg>
  )
}
