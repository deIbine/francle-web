/*
La carte de France de fin de partie : la réponse en bleu, et chaque région proposée en couleur, selon sa proximité,
avec le numéro de l'essai. On voit d'un coup d'œil le chemin suivi jusqu'à la réponse.

Le jeu Java avait une image par région (35 cartes). Ici, un seul fichier par époque, produit par
outils/generer_images.py, donne le contour de chaque région : le composant les dessine tous en SVG, et colore la
réponse et les essais. C'est l'avantage d'un SVG écrit dans la page : chaque région est un élément qu'on peut styler.
 */
import { centreDeGravite } from '../contours.ts'
import { couleurProximite } from '../domaine/partage.ts'
import type { Partie } from '../domaine/partie.ts'
import type { Mode } from '../domaine/regions.ts'
import { useLangue, useTextes } from '../textes.ts'
import anciennes from '../images/cartes/anciennes.json'
import nouvelles from '../images/cartes/nouvelles.json'

interface Carte {
  largeur: number
  hauteur: number
  encadres: { x: number; y: number; cote: number }[]
  regions: Record<string, string>
}

const CARTES: Record<Mode, Carte> = { anciennes, nouvelles }

// le rayon des pastilles numérotées, en unités de la carte (1000 de large) : environ 17 pixels de diamètre à l'écran
const RAYON = 26

// les couleurs de la légende : quelques étapes du dégradé suffisent, le navigateur fond les couleurs entre elles
const DEGRADE = `linear-gradient(to right, ${[0, 25, 50, 75, 100].map(couleurProximite).join(', ')})`

// où poser la pastille d'une région : en son centre ; mais une région d'outre-mer est trop petite et la pastille la
// cacherait, elle va donc dans le coin en haut à droite de son encadré
function placePastille(carte: Carte, d: string): { x: number; y: number } {
  const centre = centreDeGravite(d)
  const encadre = carte.encadres.find(
    ({ x, y, cote }) => centre.x >= x && centre.x <= x + cote && centre.y >= y && centre.y <= y + cote,
  )
  return encadre === undefined ? centre : { x: encadre.x + encadre.cote - RAYON, y: encadre.y + RAYON }
}

export function CarteFrance({ partie }: { partie: Partie }) {
  const textes = useTextes()
  const langue = useLangue()
  const carte = CARTES[partie.mode]
  const cible = partie.cible.id
  // chaque région proposée : son numéro d'essai et sa couleur (la réponse, si elle a été trouvée, reste en bleu)
  const essais = new Map(
    partie.essais
      .filter((essai) => essai.region.id in carte.regions)
      .map((essai, i) => [essai.region.id, { numero: i + 1, nom: essai.region.nom[langue], proximite: essai.proximite }]),
  )
  // l'ordre de dessin : en SVG, le dernier dessiné passe devant. Les régions neutres d'abord, puis les essais, et la
  // réponse en dernier, pour que leurs traits blancs ne soient pas recouverts
  const rang = (id: string) => (id === cible ? 2 : essais.has(id) ? 1 : 0)
  const ids = Object.keys(carte.regions).sort((a, b) => rang(a) - rang(b))
  const autresEssais = [...essais.keys()].some((id) => id !== cible)
  return (
    <figure className="mx-auto flex w-full max-w-xs flex-col gap-2">
      <svg
        viewBox={`0 0 ${carte.largeur} ${carte.hauteur}`}
        role="img"
        aria-label={textes.carte(partie.cible.nom[langue], [...essais.values()])}
        className="h-auto w-full"
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
        {ids.map((id) => {
          const essai = essais.get(id)
          return (
            <path
              key={id}
              d={carte.regions[id]}
              // vectorEffect : le trait garde la même épaisseur quelle que soit la taille de la carte
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              // la couleur d'un essai est calculée : elle passe par style, qui l'emporte sur la classe
              style={id !== cible && essai !== undefined ? { fill: couleurProximite(essai.proximite) } : undefined}
              className={
                id === cible
                  ? 'fill-francle-fonce stroke-white stroke-[1.5]'
                  : essai !== undefined
                    ? 'stroke-fond stroke-[1.5]'
                    : 'fill-carte-fond stroke-carte-trait'
              }
            >
              {/* le nom au survol de la souris, pour la réponse et les essais */}
              {(id === cible || essai !== undefined) && <title>{id === cible ? partie.cible.nom[langue] : essai?.nom}</title>}
            </path>
          )
        })}
        {[...essais].map(([id, { numero }]) => {
          const { x, y } = placePastille(carte, carte.regions[id])
          return (
            // pointer-events-none : la souris passe à travers la pastille, et le nom de la région s'affiche quand même
            <g key={id} className="pointer-events-none">
              <circle
                cx={x}
                cy={y}
                r={RAYON}
                vectorEffect="non-scaling-stroke"
                className={id === cible ? 'fill-fond stroke-francle-fonce stroke-2' : 'fill-fond stroke-texte'}
              />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={32} fontWeight={700} className="fill-texte">
                {numero}
              </text>
            </g>
          )
        })}
      </svg>
      {/* la légende : seulement s'il y a des essais à expliquer. Un lecteur d'écran a déjà tout dans le texte de la
          carte (aria-label), d'où aria-hidden */}
      {autresEssais && (
        <figcaption aria-hidden="true" className="flex items-center gap-2 text-xs text-discret">
          <span>{textes.legende.proximite}</span>
          <span>{textes.pourcentage(0)}</span>
          <span className="h-2.5 flex-1 rounded-sm" style={{ background: DEGRADE }} />
          <span>{textes.pourcentage(99)}</span>
          <span className="ml-1 size-2.5 rounded-sm bg-francle-fonce" />
          <span>{textes.legende.reponse}</span>
        </figcaption>
      )}
    </figure>
  )
}
