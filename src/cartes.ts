/*
Les deux cartes de fin (src/images/cartes/<époque>.json, produites par outils/generer_images.py), chargées à la demande
(depuis web.7.22).

Avant, CarteFrance.tsx les importait toutes les deux en haut du fichier : elles étaient dans le code chargé à
l'ouverture du site (environ 15 Ko compressés sur 115), alors qu'on ne les voit qu'à la fin d'une partie, et une seule
à la fois. Un import() écrit dans une fonction (un « import dynamique ») fait de chacune un morceau à part, que le
navigateur ne télécharge que quand on appelle la fonction : comme les contours des départements (contours.ts).

Pour que la carte soit là quand la partie finit, le plateau la demande dès le début de la partie (precharger) : le
téléchargement se fait pendant que le joueur réfléchit, et ne retarde plus l'ouverture de la page.
 */
import { useEffect, useState } from 'react'
import type { Mode } from './domaine/regions.ts'

export interface Carte {
  readonly largeur: number
  readonly hauteur: number
  // les encadrés de l'outre-mer : un carré par région, en bas à gauche
  readonly encadres: readonly { readonly x: number; readonly y: number; readonly cote: number }[]
  // chaque région : l'attribut « d » de son tracé SVG
  readonly regions: Readonly<Record<string, string>>
}

// le rayon des pastilles numérotées, en unités de la carte (1000 de large) : environ 17 pixels de diamètre à l'écran
export const RAYON = 26

// la loupe (depuis web.7.22) : une réponse d'outre-mer, dessinée en grand dans la Manche, en haut à gauche de la carte,
// où il n'y a que la mer : la Bretagne commence 247 unités plus bas, la Normandie 247 unités plus à droite (mesuré avec
// getBBox dans le navigateur ; un test le vérifie sur les deux cartes). Dans son encadré, elle ne faisait qu'une
// vingtaine de pixels sur téléphone
export const LOUPE = { x: 12, y: 12, cote: 220 }

// les chemins écrits en entier : Vite doit les voir tels quels pour faire un morceau de chaque fichier
const FICHIERS: Record<Mode, () => Promise<Carte>> = {
  anciennes: () => import('./images/cartes/anciennes.json').then((module) => module.default),
  nouvelles: () => import('./images/cartes/nouvelles.json').then((module) => module.default),
}

// les cartes arrivées, et celles en route : une carte n'est demandée qu'une fois, même par deux composants à la fois.
// Une demande échouée est oubliée, pour qu'un nouvel affichage la relance
const ARRIVEES = new Map<Mode, Carte>()
const EN_ROUTE = new Map<Mode, Promise<Carte>>()

export function chargerCarte(mode: Mode): Promise<Carte> {
  const arrivee = ARRIVEES.get(mode)
  if (arrivee !== undefined) {
    return Promise.resolve(arrivee)
  }
  let demande = EN_ROUTE.get(mode)
  if (demande === undefined) {
    demande = FICHIERS[mode]().then(
      (carte) => {
        ARRIVEES.set(mode, carte)
        return carte
      },
      (erreur: unknown) => {
        EN_ROUTE.delete(mode)
        throw erreur
      },
    )
    EN_ROUTE.set(mode, demande)
  }
  return demande
}

// la carte demandée à l'avance : un échec ne dit rien ici, la carte sera redemandée en fin de partie
export function prechargerCarte(mode: Mode): void {
  chargerCarte(mode).catch(() => {})
}

// la carte de l'époque, dans un composant : tout de suite si elle est déjà arrivée, sinon undefined, puis la carte à
// son arrivée. Si le téléchargement échoue, elle reste undefined : la carte n'est qu'un plus, le texte des résultats
// dit déjà tout (comme le nom donné aux lecteurs d'écran)
export function useCarte(mode: Mode): Carte | undefined {
  const [etat, setEtat] = useState(() => ({ mode, carte: ARRIVEES.get(mode) }))
  useEffect(() => {
    if (ARRIVEES.has(mode)) {
      return
    }
    let actif = true
    chargerCarte(mode).then(
      (carte) => {
        if (actif) {
          setEtat({ mode, carte })
        }
      },
      () => {},
    )
    return () => {
      actif = false
    }
  }, [mode])
  // une carte d'une autre époque ne compte plus ; celle de l'époque, si elle est arrivée entre-temps
  return etat.mode === mode && etat.carte !== undefined ? etat.carte : ARRIVEES.get(mode)
}
