/*
La région du jour : la même pour tout le monde, calculée dans le navigateur à partir de la seule date, sans serveur.
Deux navigateurs qui ne se parlent pas doivent trouver la même réponse : le calcul ne dépend que de la date et des
noms des régions, jamais de l'ordre du tableau REGIONS ni de l'heure.

Le même calcul que RegionDuJour.java, au bit près : le site et le jeu Java donnent la même région le même jour.

Les jours sont groupés en cycles de N jours (N = nombre de régions) : à chaque cycle, les régions sont mélangées avec
le numéro du cycle pour graine, et le jour k du cycle reçoit la k-ième. Chaque région revient donc exactement une fois
par cycle, et jamais deux jours de suite.

Le jour change à minuit chez le joueur (comme Wordle et Worldle) : c'est la date de SON calendrier qui compte.
 */
import { HasardJava } from './hasardJava.ts'
import { simplifier } from './recherche.ts'
import { tirables, type Mode, type Region } from './regions.ts'

// la partie du jour se joue toujours avec les nouvelles régions, quels que soient les réglages : la même pour tous
export const MODE_DU_JOUR: Mode = 'nouvelles'

// le jour de la partie n° 1 : le 13 octobre 2026, comme le jeu Java
const PREMIER_JOUR = Date.UTC(2026, 9, 13) // les mois de JavaScript commencent à 0 : 9 = octobre

const UN_JOUR = 24 * 60 * 60 * 1000 // en millisecondes

// le numéro de la partie, à la Wordle : 1 le premier jour, 2 le lendemain… (0 ou négatif avant le premier jour).
// On lit la date du calendrier local (getFullYear, getMonth, getDate), puis on compte les jours en temps universel :
// en heure locale, le jour du passage à l'heure d'été ne dure que 23 heures et fausserait la division
export function numero(date: Date = new Date()): number {
  const jour = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((jour - PREMIER_JOUR) / UN_JOUR) + 1
}

// ajouté à la graine : les octets ASCII de « Francle ». Trop grand pour un number exact (56 bits) : un BigInt
const SEL = 0x4672616e636c65n
// les octets ASCII de « Angle » : un autre sel, pour que l'angle et le mélange ne viennent pas de la même suite
const SEL_ANGLE = 0x416e676c65n

// les régions de la partie du jour, dans un ordre qui ne dépend que de leurs noms (comme en Java : le nom français
// simplifié, comparé caractère par caractère)
const REGIONS_DU_JOUR: readonly Region[] = tirables(MODE_DU_JOUR).sort((a, b) => {
  const cleA = simplifier(a.nom.fr)
  const cleB = simplifier(b.nom.fr)
  return cleA < cleB ? -1 : cleA > cleB ? 1 : 0
})

export function regionDuJour(date: Date = new Date()): Region {
  return regionDuNumero(numero(date))
}

// la région de la partie n° numeroDuJour : sert aux statistiques, qui retrouvent la région de chaque jour sauvé
// pour compter les départements de son bonus
export function regionDuNumero(numeroDuJour: number): Region {
  const jour = numeroDuJour - 1 // 0 le premier jour
  const taille = REGIONS_DU_JOUR.length
  // Math.floor et un modulo corrigé, et non / et % seuls : avant le premier jour, jour est négatif, et -1 % 18 vaut
  // -1 en JavaScript comme en Java (un index invalide), alors qu'on veut 17 (le dernier jour du cycle précédent)
  const cycle = Math.floor(jour / taille)
  const position = ((jour % taille) + taille) % taille
  return ordre(cycle)[position]
}

// l'angle (0 à 359 degrés) de la silhouette tournée, pour la partie du jour : le même pour tout le monde
export function angleDuJour(date: Date = new Date()): number {
  return new HasardJava(SEL_ANGLE + BigInt(numero(date))).entier(360)
}

// l'ordre des régions pendant un cycle
function ordre(cycle: number): Region[] {
  const ordre = melange(cycle)
  // le dernier jour du cycle précédent et le premier de celui-ci ne doivent pas tomber sur la même région :
  // on échange alors les deux premières. (Cet échange ne touche jamais la DERNIÈRE région d'un cycle : il suffit
  // donc de regarder le mélange brut du cycle précédent, sans remonter plus loin.)
  const precedent = melange(cycle - 1)
  if (ordre[0] === precedent[precedent.length - 1]) {
    ;[ordre[0], ordre[1]] = [ordre[1], ordre[0]]
  }
  return ordre
}

function melange(cycle: number): Region[] {
  return new HasardJava(SEL + BigInt(cycle)).melanger(REGIONS_DU_JOUR)
}
