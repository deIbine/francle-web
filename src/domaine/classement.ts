/*
Les classements (web.9.3.2) : la ligue, et le classement public depuis web.9.3.3. Le classement d'un mois se fait au
total des points, la moyenne par partie à côté (décision 2 du 14 novembre) ; on consulte aussi les mois passés
(décision 10 de web.9.3). Écrit ici, pour le site et le serveur : les jours d'un mois, les lignes reçues et leur lecture.

À total égal, celui qui a joué le moins de parties passe devant : il a la meilleure moyenne. À total et parties
égaux, les deux ont le même rang (« 1, 2, 2, 4 »), comme aux Jeux olympiques ; c'est le RANK() de SQL.
 */
import { moisDuNumero, numero } from './regionDuJour.ts'

// le premier et le dernier numéro de jour du mois (année × 12 + mois, voir moisDuNumero)
export function joursDuMois(mois: number): [number, number] {
  const annee = Math.floor(mois / 12)
  const indice = mois % 12
  // le jour 0 du mois suivant est le dernier jour de celui-ci (Date le comprend ainsi)
  return [numero(new Date(annee, indice, 1)), numero(new Date(annee, indice + 1, 0))]
}

// le mois d'aujourd'hui
export function moisActuel(maintenant: Date = new Date()): number {
  return moisDuNumero(numero(maintenant))
}

export interface LigneClassement {
  readonly id: string
  readonly pseudo: string
  readonly rang: number
  readonly total: number
  readonly parties: number
}

export interface Classement {
  readonly mois: number
  readonly lignes: readonly LigneClassement[]
  // la ligne du joueur, s'il n'est pas déjà parmi les lignes (classement public : seuls les premiers sont envoyés)
  readonly moi?: LigneClassement
  // le nombre de joueurs classés (classement public, où toutes les lignes ne sont pas envoyées)
  readonly joueurs?: number
}

// la moyenne par partie, arrondie au dixième (0 sans partie), comme le score des statistiques (score.ts)
export function moyenne(ligne: LigneClassement): number {
  return ligne.parties === 0 ? 0 : Math.round((ligne.total * 10) / ligne.parties) / 10
}

function estLigne(valeur: unknown): valeur is LigneClassement {
  const ligne = valeur as LigneClassement
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    typeof ligne.id === 'string' &&
    typeof ligne.pseudo === 'string' &&
    [ligne.rang, ligne.total, ligne.parties].every((n) => Number.isSafeInteger(n) && n >= 0)
  )
}

// lit un classement reçu du serveur, côté site : undefined s'il n'a pas la forme attendue
export function lireClassement(valeur: unknown): Classement | undefined {
  const classement = valeur as Classement
  if (
    typeof valeur !== 'object' ||
    valeur === null ||
    !Number.isSafeInteger(classement.mois) ||
    !Array.isArray(classement.lignes) ||
    !classement.lignes.every(estLigne) ||
    (classement.moi !== undefined && !estLigne(classement.moi)) ||
    (classement.joueurs !== undefined && !Number.isSafeInteger(classement.joueurs))
  ) {
    return undefined
  }
  return classement
}
