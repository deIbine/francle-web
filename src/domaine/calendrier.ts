/*
Le calendrier des jours joués (web.9.1.2) : un mois en semaines, du lundi au dimanche, chaque jour avec sa partie.

Le mois est un seul nombre (année × 12 + mois, voir moisDuNumero) : passer au mois suivant, c'est ajouter 1, même en
décembre. new Date(année, mois, 1) accepte un mois de 0 à 11 ; new Date(année, mois + 1, 0) donne le dernier jour du
mois (le « jour 0 » du mois suivant), donc le nombre de jours.
 */
import { numero } from './regionDuJour.ts'
import { points } from './score.ts'
import type { Resultat } from './statistiques.ts'

export type EtatCase = 'gagnee' | 'manquee' | 'en-cours' | 'absente'

export interface Case {
  // la date (minuit, calendrier du joueur) et le numéro de la partie de ce jour
  readonly date: Date
  readonly numero: number
  readonly etat: EtatCase
  readonly essais: number
  readonly points: number
}

// une semaine : sept places, vides (null) avant le 1er et après le dernier jour du mois
export type Semaine = readonly (Case | null)[]

export function etatCase(resultat: Resultat | undefined): EtatCase {
  if (resultat === undefined) {
    return 'absente'
  }
  if (resultat.etat === 'gagnee') {
    return 'gagnee'
  }
  return resultat.etat === 'en-cours' ? 'en-cours' : 'manquee'
}

export function semaines(historique: ReadonlyMap<number, Resultat>, mois: number): Semaine[] {
  const annee = Math.floor(mois / 12)
  const moisDeLAnnee = mois % 12
  const jours = new Date(annee, moisDeLAnnee + 1, 0).getDate()
  // getDay() : 0 le dimanche, 1 le lundi… ; décalé pour que la semaine commence le lundi
  const avant = (new Date(annee, moisDeLAnnee, 1).getDay() + 6) % 7
  const places: (Case | null)[] = Array.from({ length: avant }, () => null)
  for (let jour = 1; jour <= jours; jour++) {
    const date = new Date(annee, moisDeLAnnee, jour)
    const n = numero(date)
    const resultat = historique.get(n)
    places.push({ date, numero: n, etat: etatCase(resultat), essais: resultat?.essais ?? 0, points: resultat ? points(resultat) : 0 })
  }
  while (places.length % 7 !== 0) {
    places.push(null)
  }
  return Array.from({ length: places.length / 7 }, (_, i) => places.slice(i * 7, i * 7 + 7))
}

// la date d'un mois, pour l'afficher (« novembre 2026 »)
export function dateDuMois(mois: number): Date {
  return new Date(Math.floor(mois / 12), mois % 12, 1)
}
