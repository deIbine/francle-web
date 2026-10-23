/*
Les valeurs de référence du jeu, figées : distances, directions et pourcentages pour chaque paire de régions,
région, angle et ordre du bonus des départements pour 1501 jours passés, suggestions pour 472 saisies dans chaque mode.
Le fichier reference.json a été produit au départ par le Francle Java (deIbine/francle), qui a servi de modèle. Depuis
le 23 octobre 2026, les deux projets sont séparés : ces valeurs sont celles du site, et rien n'oblige plus à rester
égal au Java. Un écart voulu se corrige dans reference.json, en le disant dans la PR ; un écart non voulu est un bug.
Le plus important : la région et l'angle du jour, qui ne doivent pas changer pour les joueurs.
 */
import { describe, expect, it } from 'vitest'
import { ordreDuJour } from './bonus.ts'
import { azimut, direction, distance, proximite } from './geographie.ts'
import { suggestions } from './recherche.ts'
import { angleDuJour, numero, regionDuJour } from './regionDuJour.ts'
import { parId, type Mode } from './regions.ts'
import reference from './reference.json'

// « 2026-10-12 » -> minuit, heure locale, ce jour-là : la date telle que la voit le joueur
function dateLocale(texte: string): Date {
  const [annee, mois, jour] = texte.split('-').map(Number)
  return new Date(annee, mois - 1, jour)
}

// SUD_OUEST (écrit ainsi dans le fichier, comme les constantes Java d'origine) -> sud-ouest
function directionWeb(java: string): string {
  return java.toLowerCase().replace('_', '-')
}

describe('Les valeurs de référence', () => {
  it('a bien une valeur pour chaque paire de régions', () => {
    expect(reference.paires).toHaveLength(35 * 35)
  })

  it('même distance, même azimut, même direction et même pourcentage pour chaque paire', () => {
    for (const paire of reference.paires) {
      const cible = parId(paire.cible)
      const proposition = parId(paire.proposition)
      const nom = `${paire.proposition} → ${paire.cible}`
      // à un millionième de millimètre près : les sinus de Java et du navigateur peuvent différer sur le dernier bit
      expect(distance(cible, proposition), nom).toBeCloseTo(paire.distance, 9)
      expect(azimut(proposition, cible), nom).toBeCloseTo(paire.azimut, 9)
      expect(direction(proposition, cible), nom).toBe(directionWeb(paire.direction))
      expect(proximite(cible, distance(cible, proposition)), nom).toBe(paire.pourcentage)
    }
  })

  it('même numéro, même région et même angle du jour', () => {
    for (const jour of reference.jours) {
      const date = dateLocale(jour.date)
      expect(numero(date), jour.date).toBe(jour.numero)
      expect(regionDuJour(date).id, jour.date).toBe(jour.region)
      expect(angleDuJour(date), jour.date).toBe(jour.angle)
    }
  })

  it('même ordre des départements pour le bonus du jour', () => {
    for (const jour of reference.jours) {
      const ordre = ordreDuJour(parId(jour.region), jour.numero).map((departement) => departement.code)
      expect(ordre, jour.date).toEqual(jour.bonus)
    }
  })

  it('mêmes suggestions, noms français et anglais compris (le Java les cherche aussi depuis sa phase 8)', () => {
    for (const cas of reference.suggestions) {
      const mode = cas.mode.toLowerCase() as Mode
      const ids = suggestions(cas.saisie, mode, 'fr').map((region) => region.id)
      expect(ids, `« ${cas.saisie} » en mode ${mode}`).toEqual(cas.regions)
    }
  })
})
