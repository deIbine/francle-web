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

export interface Point {
  readonly x: number
  readonly y: number
}

// les morceaux d'un tracé (îles, trous), chacun en points absolus. Le tracé est écrit par le script sous la forme
// « M x y l dx dy dx dy… z », répétée pour chaque morceau : le premier point est absolu, les suivants relatifs au
// précédent
export function morceaux(d: string): Point[][] {
  return d
    .split('M')
    .slice(1)
    .map((morceau) => {
      const [debut, suite = ''] = morceau.replace('z', '').split('l')
      let [x, y] = debut.trim().split(' ').map(Number)
      const ecarts = suite.trim() === '' ? [] : suite.trim().split(' ').map(Number)
      const points = [{ x, y }]
      for (let i = 0; i < ecarts.length; i += 2) {
        x += ecarts[i]
        y += ecarts[i + 1]
        points.push({ x, y })
      }
      return points
    })
}

// le centre du rectangle qui entoure un tracé
export function centre(d: string): Point {
  const points = morceaux(d).flat()
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
}

// l'aire d'un morceau (formule du lacet : la somme des produits en croix de ses côtés), positive ou négative selon
// le sens où il est parcouru
function aire(points: readonly Point[]): number {
  let somme = 0
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length]
    somme += a.x * b.y - b.x * a.y
  })
  return somme / 2
}

// le centre de gravité du plus grand morceau, où poser une étiquette : le rectangle qui entoure une région compte
// aussi ses îles, et son centre tombe mal sur une forme biscornue. Vérifié dans les tests : pour chaque région des
// deux époques, ce point est bien dans la région
export function centreDeGravite(d: string): Point {
  const plusGrand = morceaux(d).reduce((a, b) => (Math.abs(aire(b)) > Math.abs(aire(a)) ? b : a))
  const a = aire(plusGrand)
  let x = 0
  let y = 0
  plusGrand.forEach((p, i) => {
    const q = plusGrand[(i + 1) % plusGrand.length]
    const croix = p.x * q.y - q.x * p.y
    x += (p.x + q.x) * croix
    y += (p.y + q.y) * croix
  })
  return { x: x / (6 * a), y: y / (6 * a) }
}
