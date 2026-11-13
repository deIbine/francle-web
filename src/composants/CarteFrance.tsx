/*
La carte de France de fin de partie : la réponse en bleu, et chaque région proposée en couleur, selon sa proximité,
avec le numéro de l'essai. On voit d'un coup d'œil le chemin suivi jusqu'à la réponse.

Le jeu Java avait une image par région (35 cartes). Ici, un seul fichier par époque, produit par
outils/generer_images.py, donne le contour de chaque région : le composant les dessine tous en SVG, et colore la
réponse et les essais. C'est l'avantage d'un SVG écrit dans la page : chaque région est un élément qu'on peut styler.
 */
import { LOUPE, RAYON, useCarte, type Carte } from '../cartes.ts'
import { centreDeGravite } from '../contours.ts'
import { couleurProximite } from '../domaine/partage.ts'
import type { Partie } from '../domaine/partie.ts'
import { useLangue, useTextes } from '../textes.ts'

// les couleurs de la légende : quelques étapes du dégradé suffisent, le navigateur fond les couleurs entre elles
const ETAPES = [0, 25, 50, 75, 100]
const DEGRADE = `linear-gradient(to right, ${ETAPES.map(couleurProximite).join(', ')})`

type Encadre = Carte['encadres'][number]

// l'encadré d'outre-mer où se trouve une région, s'il y en a un
function encadreDe(carte: Carte, d: string): Encadre | undefined {
  const centre = centreDeGravite(d)
  return carte.encadres.find(
    ({ x, y, cote }) => centre.x >= x && centre.x <= x + cote && centre.y >= y && centre.y <= y + cote,
  )
}

// où poser la pastille d'une région : en son centre ; mais une région d'outre-mer est trop petite et la pastille la
// cacherait, elle va donc dans le coin en haut à droite de son encadré. La réponse, elle, a sa loupe : sa pastille
// va juste à droite de la loupe, en dehors, pour ne rien cacher (dans le coin, elle couvrait la moitié de la
// Guadeloupe)
function placePastille(carte: Carte, d: string, reponse: boolean): { x: number; y: number } {
  const encadre = encadreDe(carte, d)
  if (encadre === undefined) {
    return centreDeGravite(d)
  }
  return reponse
    ? { x: LOUPE.x + LOUPE.cote + 8 + RAYON, y: LOUPE.y + RAYON }
    : { x: encadre.x + encadre.cote - RAYON, y: encadre.y + RAYON }
}

export function CarteFrance({ partie }: { partie: Partie }) {
  const carte = useCarte(partie.mode)
  // la carte pas encore arrivée (chargée à la demande, voir cartes.ts) : sa place, vide, pour que les résultats ne
  // sautent pas à son arrivée. aspect-[1000/956] : la hauteur suit la largeur, dans les proportions de la carte
  if (carte === undefined) {
    return <div className="mx-auto aspect-[1000/956] w-full max-w-xs" />
  }
  return <Dessin partie={partie} carte={carte} />
}

// la carte elle-même, une fois arrivée. Un composant à part : React demande d'appeler les mêmes hooks à chaque
// affichage, dans le même ordre ; ceux du dessin ne peuvent donc pas venir après le « return » de l'attente
function Dessin({ partie, carte }: { partie: Partie; carte: Carte }) {
  const textes = useTextes()
  const langue = useLangue()
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
  // une réponse d'outre-mer est minuscule sur la carte : son encadré est bordé de bleu, plus épais, pour que l'œil la
  // trouve tout de suite
  const encadreReponse = cible in carte.regions ? encadreDe(carte, carte.regions[cible]) : undefined
  return (
    <figure className="mx-auto flex w-full max-w-xs flex-col gap-2">
      <svg
        viewBox={`0 0 ${carte.largeur} ${carte.hauteur}`}
        role="img"
        aria-label={textes.carte(partie.cible.nom[langue], [...essais.values()])}
        className="h-auto w-full"
      >
        {/* l'encadré de la réponse en dernier : son trait bleu passe devant ceux de ses voisins */}
        {[...carte.encadres]
          .sort((a, b) => Number(a === encadreReponse) - Number(b === encadreReponse))
          .map((encadre) => (
            <rect
              key={`${encadre.x}-${encadre.y}`}
              x={encadre.x}
              y={encadre.y}
              width={encadre.cote}
              height={encadre.cote}
              vectorEffect="non-scaling-stroke"
              data-reponse={encadre === encadreReponse ? '' : undefined}
              className={
                encadre === encadreReponse
                  ? 'fill-none stroke-francle-fonce stroke-[3] dark:stroke-francle-clair'
                  : 'fill-none stroke-carte-trait'
              }
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
        {/* la loupe : la réponse d'outre-mer en grand. transform se lit de droite à gauche : on ramène l'encadré à
            l'origine (translate négatif), on l'agrandit (scale), puis on le pose à la place de la loupe */}
        {encadreReponse !== undefined && (
          <g data-loupe="">
            <rect
              x={LOUPE.x}
              y={LOUPE.y}
              width={LOUPE.cote}
              height={LOUPE.cote}
              vectorEffect="non-scaling-stroke"
              className="fill-fond stroke-francle-fonce stroke-[3] dark:stroke-francle-clair"
            />
            <path
              d={carte.regions[cible]}
              transform={`translate(${LOUPE.x} ${LOUPE.y}) scale(${LOUPE.cote / encadreReponse.cote}) translate(${-encadreReponse.x} ${-encadreReponse.y})`}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              className="fill-francle-fonce stroke-white stroke-[1.5]"
            >
              <title>{partie.cible.nom[langue]}</title>
            </path>
          </g>
        )}
        {[...essais].map(([id, { numero }]) => {
          const { x, y } = placePastille(carte, carte.regions[id], id === cible)
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
          {/* le dégradé va de 0 à 100 % (depuis web.7.19 ; il commençait à 50 %) */}
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
