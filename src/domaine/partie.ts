/*
Les règles d'une partie, sans aucun affichage : la partie reçoit les saisies du joueur et dit ce qui s'est passé.

Différence avec Partie.java : une partie ne se modifie jamais. proposer() et abandonner() renvoient une NOUVELLE
partie, et l'ancienne reste telle quelle (comme un record Java avec des méthodes « avec…() »). C'est ce qu'attend
React : pour savoir s'il doit redessiner, il compare l'ancienne valeur et la nouvelle.
 */
import { direction, distance, proximite, type Direction } from './geographie.ts'
import { chercher } from './recherche.ts'
import type { Mode, Region } from './regions.ts'

export const ESSAIS_MAX = 6

export type Etat = 'en-cours' | 'gagnee' | 'perdue' | 'abandonnee'

// une proposition jouée : la région proposée, sa distance à la cible (km), le pourcentage de proximité
// et la direction à suivre pour aller vers la cible
export interface Essai {
  readonly region: Region
  readonly distance: number
  readonly proximite: number
  readonly direction: Direction
}

export interface Partie {
  readonly cible: Region
  readonly mode: Mode
  readonly essais: readonly Essai[]
  readonly etat: Etat
}

// les indices, dans l'ordre où ils sont révélés : un après chacun des cinq premiers essais ratés
// (un sixième essai raté termine la partie : il n'y a pas d'indice après lui)
export const INDICES = ['superficie', 'specialite', 'personnalite', 'capitale', 'monument'] as const

// 'superficie' | 'specialite' | … : le type se déduit du tableau, on n'écrit la liste qu'une fois
export type Indice = (typeof INDICES)[number]

export function nouvellePartie(cible: Region, mode: Mode): Partie {
  return { cible, mode, essais: [], etat: 'en-cours' }
}

export function enCours(partie: Partie): boolean {
  return partie.etat === 'en-cours'
}

// joue la saisie du joueur : renvoie la partie après cet essai, ou undefined si la saisie n'est pas reconnue
// (une saisie non reconnue ne coûte pas d'essai)
export function proposer(partie: Partie, saisie: string): Partie | undefined {
  verifierEnCours(partie)
  const region = chercher(saisie, partie.mode)
  if (region === undefined) {
    return undefined
  }
  const km = distance(partie.cible, region)
  const essai: Essai = {
    region,
    distance: km,
    proximite: proximite(partie.cible, km),
    direction: direction(region, partie.cible),
  }
  const essais = [...partie.essais, essai]
  let etat: Etat = 'en-cours'
  if (region === partie.cible) {
    etat = 'gagnee'
  } else if (essais.length === ESSAIS_MAX) {
    etat = 'perdue'
  }
  return { ...partie, essais, etat }
}

export function abandonner(partie: Partie): Partie {
  verifierEnCours(partie)
  return { ...partie, etat: 'abandonnee' }
}

// jouer dans une partie terminée est une erreur de programmation, pas une saisie du joueur
function verifierEnCours(partie: Partie): void {
  if (!enCours(partie)) {
    throw new Error(`La partie est terminée : ${partie.etat}`)
  }
}

// l'indice révélé après l'essai raté numéro « numero » (0 = le premier), rien après le cinquième
export function indiceApresEssai(numero: number): Indice | undefined {
  return INDICES[numero]
}

// les indices révélés jusqu'ici : un par essai raté, dans l'ordre (un essai gagnant n'en révèle pas)
export function indicesReveles(partie: Partie): Indice[] {
  const indices: Indice[] = []
  partie.essais.forEach((essai, numero) => {
    const indice = indiceApresEssai(numero)
    if (essai.region !== partie.cible && indice !== undefined) {
      indices.push(indice)
    }
  })
  return indices
}

// les indices à montrer : ceux révélés pendant la partie, puis tous une fois la partie finie (gagnée, perdue ou
// abandonnée), pour apprendre la capitale ou le monument qu'on n'a pas eu besoin de voir. Les règles, elles, ne
// changent pas : indicesReveles() dit toujours ce que la partie a révélé
export function indicesAffiches(partie: Partie): Indice[] {
  return enCours(partie) ? indicesReveles(partie) : [...INDICES]
}
