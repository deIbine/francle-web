/*
Les contours des départements de chaque région, pour le bonus (src/images/departements/<région>.json, produits par
outils/generer_images.py). 35 fichiers, 656 Ko en tout : on ne les met pas dans le site chargé au départ, on ne
télécharge que celui de la région trouvée, au moment où le bonus commence.

import.meta.glob, sans « eager » (voir images.ts) : Vite fait de chaque fichier un morceau à part du site, et donne
pour chacun une fonction qui le télécharge et renvoie une promesse (une Promise, l'équivalent d'un
CompletableFuture Java : une valeur qui arrivera plus tard).
 */
import { useEffect, useState } from 'react'

export interface Contours {
  // la taille de la carte, en unités SVG (2000 sur le plus grand côté)
  readonly largeur: number
  readonly hauteur: number
  // Île-de-France seulement : le cadre (x, y, largeur, hauteur) de Paris et de la petite couronne, à agrandir
  readonly zoom?: readonly number[]
  // chaque département : son numéro, et l'attribut « d » de son tracé SVG
  readonly departements: readonly { readonly code: string; readonly d: string }[]
}

const FICHIERS = import.meta.glob<Contours>('./images/departements/*.json', { import: 'default' })

// les contours déjà arrivés : un fichier n'est téléchargé qu'une fois, et s'affiche ensuite tout de suite
const CHARGES = new Map<string, Contours>()

export async function contoursDe(region: string): Promise<Contours> {
  const deja = CHARGES.get(region)
  if (deja !== undefined) {
    return deja
  }
  const charger = FICHIERS[`./images/departements/${region}.json`]
  if (charger === undefined) {
    throw new Error(`Pas de contours pour : ${region}`)
  }
  const contours = await charger()
  CHARGES.set(region, contours)
  return contours
}

// les contours de la région, dans un composant : undefined le temps du téléchargement, puis les contours.
// useEffect lance le téléchargement après l'affichage ; à l'arrivée, setCharges fait réafficher le composant.
// « actif » ignore une réponse arrivée trop tard, si la région a changé entre-temps (ou si le composant a disparu)
export function useContours(region: string): Contours | undefined {
  const [charges, setCharges] = useState(() => ({ region, contours: CHARGES.get(region) }))
  useEffect(() => {
    let actif = true
    contoursDe(region).then((contours) => {
      if (actif) {
        setCharges({ region, contours })
      }
    })
    return () => {
      actif = false
    }
  }, [region])
  return charges.region === region ? charges.contours : CHARGES.get(region)
}

// le centre du rectangle qui entoure un tracé. Le tracé est écrit par le script sous la forme « M x y l dx dy dx dy…
// z », répétée pour chaque morceau (îles, trous) : le premier point est absolu, les suivants relatifs au précédent
export function centre(d: string): { x: number; y: number } {
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity
  for (const morceau of d.split('M').slice(1)) {
    const [debut, suite = ''] = morceau.replace('z', '').split('l')
    let [x, y] = debut.trim().split(' ').map(Number)
    const ecarts = suite.trim() === '' ? [] : suite.trim().split(' ').map(Number)
    for (let i = -2; i < ecarts.length; i += 2) {
      if (i >= 0) {
        x += ecarts[i]
        y += ecarts[i + 1]
      }
      xMin = Math.min(xMin, x)
      xMax = Math.max(xMax, x)
      yMin = Math.min(yMin, y)
      yMax = Math.max(yMax, y)
    }
  }
  return { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 }
}
