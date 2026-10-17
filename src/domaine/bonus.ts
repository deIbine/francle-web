/*
Le bonus des départements, après chaque victoire (partie du jour ou partie libre) : retrouver tous les départements de
la région trouvée, un par un. Une seule réponse par département : juste ou fausse, on passe au suivant.
Comme partie.ts, sans aucun affichage, et un bonus ne se modifie jamais : repondre() et passer() renvoient un
NOUVEAU bonus.

Repris de Bonus.java (deIbine/francle, phase 9). L'ordre de la partie du jour est le même que celui du Java, au bit
près (vérifié par reference-java.test.ts).

Trois sortes de questions :
    carte   « Où est le Finistère ? » : le joueur clique sur la carte (mode A, celui des joueurs)
    nom     « Quel est ce département ? » : un département est colorié, le joueur écrit son nom ou son numéro (mode B)
    numero  « Quel est le numéro de : Guadeloupe ? » : pour une région d'un seul département, où cliquer sur le seul
            département de la carte serait gratuit
 */
import { chercherDepartement, departementsDe, numero, parCode, type Departement } from './departements.ts'
import { HasardJava } from './hasardJava.ts'
import type { Region } from './regions.ts'

export type Question = 'carte' | 'nom' | 'numero'

// A ou B : choisi de notre côté, dans le code, sans le montrer aux joueurs (comme Bonus.MODE en Java).
// Mettre 'nom' pour essayer le mode B
export const MODE_BONUS: Exclude<Question, 'numero'> = 'carte'

// termine : tous les départements ont eu leur réponse ; passe : le joueur a arrêté avant (bouton « Passer »).
// Les deux comptent dans les statistiques, avec les réponses données
export type EtatBonus = 'en-cours' | 'termine' | 'passe'

// une réponse : le département demandé, et celui que le joueur a donné (cliqué ou nommé)
export interface Tentative {
  readonly demande: Departement
  readonly donne: Departement
}

export interface Bonus {
  readonly region: Region
  readonly question: Question
  // les départements de la région, dans l'ordre des questions
  readonly ordre: readonly Departement[]
  readonly tentatives: readonly Tentative[]
  readonly etat: EtatBonus
}

// mode : carte ou nom, remplacé par numero pour une région d'un seul département
export function nouveauBonus(region: Region, ordre: readonly Departement[], mode: Question = MODE_BONUS): Bonus {
  const attendus = departementsDe(region)
  if (ordre.length !== attendus.length || !attendus.every((departement) => ordre.includes(departement))) {
    throw new Error(`L'ordre doit contenir chaque département de ${region.id} une fois`)
  }
  if (mode === 'numero') {
    throw new Error("numero n'est pas un mode : il est choisi d'après la région")
  }
  return { region, question: ordre.length === 1 ? 'numero' : mode, ordre, tentatives: [], etat: 'en-cours' }
}

// les octets ASCII de « Bonus » : un sel à lui, sinon le mélange viendrait de la même suite de nombres que l'angle
// de la silhouette (angleDuJour). Comme SEL dans Bonus.java
const SEL = 0x426f6e7573n

// les départements de la partie du jour n° numeroDuJour, mélangés avec une graine tirée de ce numéro : le même ordre
// pour tout le monde, et le même après une fermeture de la page. Collections.shuffle(liste, new Random(SEL + numéro))
// en Java, reproduit par HasardJava
export function ordreDuJour(region: Region, numeroDuJour: number): Departement[] {
  return new HasardJava(SEL + BigInt(numeroDuJour)).melanger(departementsDe(region))
}

export function bonusDuJour(region: Region, numeroDuJour: number): Bonus {
  return nouveauBonus(region, ordreDuJour(region, numeroDuJour))
}

// le bonus d'une partie libre : un ordre au hasard, à chaque fois différent (rien n'est sauvegardé). Le mélange de
// Fisher-Yates, comme dans HasardJava, avec Math.random. Le hasard est un paramètre, comme pour tirer() : un test peut
// en donner un fixe
export function bonusAuHasard(region: Region, hasard: () => number = Math.random): Bonus {
  const ordre = [...departementsDe(region)]
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[ordre[i], ordre[j]] = [ordre[j], ordre[i]]
  }
  return nouveauBonus(region, ordre)
}

export function bonusEnCours(bonus: Bonus): boolean {
  return bonus.etat === 'en-cours'
}

// commencé : au moins une réponse. Un bonus passé avant toute réponse n'a pas commencé : il reste à jouer
export function commence(bonus: Bonus): boolean {
  return bonus.tentatives.length > 0
}

// le département de la question en cours
export function demande(bonus: Bonus): Departement {
  verifierEnCours(bonus)
  return bonus.ordre[bonus.tentatives.length]
}

// la réponse du joueur : le département cliqué (carte), ou celui qu'il a nommé
export function repondre(bonus: Bonus, donne: Departement): Bonus {
  const tentatives = [...bonus.tentatives, { demande: demande(bonus), donne }]
  return { ...bonus, tentatives, etat: tentatives.length === bonus.ordre.length ? 'termine' : 'en-cours' }
}

// la réponse écrite par le joueur. nom : le nom ou le numéro d'un département ; numero : un numéro seulement
// (« Guadeloupe » à la question « Quel est le numéro de : Guadeloupe ? » ne répond à rien). Une saisie qui n'est
// pas un département renvoie undefined et ne coûte rien, comme une région inconnue dans la partie
export function repondreSaisie(bonus: Bonus, saisie: string): Bonus | undefined {
  verifierEnCours(bonus)
  const departement = bonus.question === 'numero' ? parCode(numero(saisie)) : chercherDepartement(saisie)
  return departement === undefined ? undefined : repondre(bonus, departement)
}

// le joueur arrête là : les départements sans réponse sont comptés comme non trouvés
export function passer(bonus: Bonus): Bonus {
  verifierEnCours(bonus)
  return { ...bonus, etat: 'passe' }
}

// rejoue des réponses sauvegardées (les numéros donnés, dans l'ordre), comme la partie du jour rejoue ses
// propositions. Un numéro inconnu (sauvegarde abîmée) arrête la relecture : on garde ce qui a pu être rejoué
export function rejouer(bonus: Bonus, codes: readonly string[]): Bonus {
  let resultat = bonus
  for (const code of codes) {
    const departement = parCode(code)
    if (departement === undefined || !bonusEnCours(resultat)) {
      break
    }
    resultat = repondre(resultat, departement)
  }
  return resultat
}

// jouer dans un bonus terminé est une erreur de programmation, pas une action du joueur
function verifierEnCours(bonus: Bonus): void {
  if (!bonusEnCours(bonus)) {
    throw new Error(`Le bonus est terminé : ${bonus.etat}`)
  }
}

export function juste(tentative: Tentative): boolean {
  return tentative.demande === tentative.donne
}

// le nombre de départements trouvés
export function score(bonus: Bonus): number {
  return bonus.tentatives.filter(juste).length
}

// le nombre de départements à trouver
export function total(bonus: Bonus): number {
  return bonus.ordre.length
}

// le rang de la question en cours, à partir de 1 (« 3/12 »)
export function rang(bonus: Bonus): number {
  return bonus.tentatives.length + 1
}

// la réponse donnée quand ce département était demandé, s'il l'a déjà été
export function tentativeDe(bonus: Bonus, departement: Departement): Tentative | undefined {
  return bonus.tentatives.find((tentative) => tentative.demande === departement)
}
