/*
Le bonus des départements, après chaque victoire (partie du jour ou partie libre) : retrouver tous les départements de
la région trouvée, un par un. Une seule réponse par département : juste ou fausse, on passe au suivant.
Comme partie.ts, sans aucun affichage, et un bonus ne se modifie jamais : repondre() et passer() renvoient un
NOUVEAU bonus.

Repris de Bonus.java (deIbine/francle, phase 9). L'ordre de la partie du jour est le même que celui du Java, au bit
près (vérifié par reference-java.test.ts).

Quatre sortes de questions :
    carte   « Où est le Finistère ? » : le joueur clique sur la carte (mode A, caché)
    nom     « Quel est ce département ? » : un département est colorié, le joueur écrit son nom ou son numéro (mode B,
            caché)
    choix   le joueur choisit lui-même un département sur la carte, puis écrit son nom ou son numéro (mode C, celui des
            joueurs depuis web.7.7) : pas de question imposée, ni d'ordre
    numero  « Quel est le numéro de : Guadeloupe ? » : pour une région d'un seul département, où cliquer sur le seul
            département de la carte serait gratuit, comme le choisir puis recopier le nom de la région
 */
import { chercherDepartement, departementsDe, numero, parCode, type Departement } from './departements.ts'
import { HasardJava } from './hasardJava.ts'
import type { Region } from './regions.ts'

export type Question = 'carte' | 'nom' | 'choix' | 'numero'

// A, B ou C : choisi de notre côté, dans le code, sans le montrer aux joueurs (comme Bonus.MODE en Java).
// Mettre 'nom' pour essayer le mode B, 'choix' pour le mode C
export const MODE_BONUS: Exclude<Question, 'numero'> = 'choix'

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
  // les départements de la région, dans l'ordre des questions (en mode C, le joueur choisit son ordre : celui-ci ne
  // sert plus qu'à relire les sauvegardes d'avant web.7.6)
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

// le département de la question en cours. En mode C, il n'y en a pas : c'est le joueur qui choisit
export function demande(bonus: Bonus): Departement {
  verifierEnCours(bonus)
  if (bonus.question === 'choix') {
    throw new Error('Pas de question imposée en mode C : le joueur choisit le département')
  }
  return bonus.ordre[bonus.tentatives.length]
}

// la réponse du joueur : le département cliqué (carte), ou celui qu'il a nommé
export function repondre(bonus: Bonus, donne: Departement): Bonus {
  return ajouter(bonus, demande(bonus), donne)
}

// une réponse de plus, et le bonus se termine quand chaque département a la sienne
function ajouter(bonus: Bonus, demande: Departement, donne: Departement): Bonus {
  const tentatives = [...bonus.tentatives, { demande, donne }]
  return { ...bonus, tentatives, etat: tentatives.length === bonus.ordre.length ? 'termine' : 'en-cours' }
}

// les départements qui n'ont pas encore de réponse : ceux que le joueur peut encore choisir en mode C
export function restants(bonus: Bonus): Departement[] {
  return bonus.ordre.filter((departement) => tentativeDe(bonus, departement) === undefined)
}

// vrai si ce département a déjà été trouvé (donné au bon endroit)
export function trouve(bonus: Bonus, departement: Departement): boolean {
  return bonus.tentatives.some((tentative) => juste(tentative) && tentative.donne === departement)
}

// mode C : le joueur a choisi un département sur la carte, et donne un nom. Un département déjà trouvé ailleurs est
// refusé sans coûter de réponse (le joueur s'est sûrement trompé de département sur la carte), comme une région déjà
// proposée dans la partie ; un nom déjà donné à tort, lui, reste possible. Un département d'une autre région est une
// réponse fausse, qui compte
export function repondreChoix(bonus: Bonus, choisi: Departement, donne: Departement): Bonus | 'deja-trouve' {
  verifierEnCours(bonus)
  if (bonus.question !== 'choix') {
    throw new Error(`Pas de choix libre pour la question ${bonus.question}`)
  }
  // choisir un département hors de la région, ou déjà répondu, est une erreur de programmation : la carte ne le
  // permet pas
  if (!restants(bonus).includes(choisi)) {
    throw new Error(`${choisi.code} ne peut pas être choisi`)
  }
  return trouve(bonus, donne) ? 'deja-trouve' : ajouter(bonus, choisi, donne)
}

// mode C, la réponse écrite : le nom ou le numéro d'un des 101 départements. Une saisie qui n'en est pas un est
// refusée sans rien coûter
export function repondreSaisieChoix(
  bonus: Bonus,
  choisi: Departement,
  saisie: string,
): Bonus | 'inconnu' | 'deja-trouve' {
  const departement = chercherDepartement(saisie)
  return departement === undefined ? 'inconnu' : repondreChoix(bonus, choisi, departement)
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

// rejoue des réponses sauvegardées avant web.7.6 : les numéros donnés, dans l'ordre des questions (l'ordre du jour
// du mode A), comme la partie du jour rejoue ses propositions. Les réponses sont reprises telles quelles, quel que
// soit le mode du bonus donné : un bonus du mode A commencé avant la mise en ligne du mode C continue ainsi en mode C,
// avec ses réponses. Un numéro inconnu (sauvegarde abîmée) arrête la relecture : on garde ce qui a pu être rejoué
export function rejouer(bonus: Bonus, codes: readonly string[]): Bonus {
  let resultat = bonus
  for (const code of codes) {
    const departement = parCode(code)
    if (departement === undefined || !bonusEnCours(resultat)) {
      break
    }
    resultat = ajouter(resultat, resultat.ordre[resultat.tentatives.length], departement)
  }
  return resultat
}

// rejoue des réponses sauvegardées depuis web.7.6 : des paires [département demandé, département donné], dans l'ordre
// des réponses. Une paire inconnue ou impossible (sauvegarde abîmée : un département hors de la région, ou déjà
// répondu) arrête la relecture
export function rejouerPaires(bonus: Bonus, paires: readonly (readonly [string, string])[]): Bonus {
  let resultat = bonus
  for (const [codeDemande, codeDonne] of paires) {
    const demande = parCode(codeDemande)
    const donne = parCode(codeDonne)
    if (demande === undefined || donne === undefined || !bonusEnCours(resultat)) {
      break
    }
    if (!restants(resultat).includes(demande)) {
      break
    }
    resultat = ajouter(resultat, demande, donne)
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

// le rang de la question en cours, à partir de 1 (« 3/12 ») ; en mode C, le nombre de réponses déjà données plus un
export function rang(bonus: Bonus): number {
  return bonus.tentatives.length + 1
}

// la réponse donnée quand ce département était demandé, s'il l'a déjà été
export function tentativeDe(bonus: Bonus, departement: Departement): Tentative | undefined {
  return bonus.tentatives.find((tentative) => tentative.demande === departement)
}
