/*
Les valeurs du Francle Java, toutes comparées : distances, directions et pourcentages pour chaque paire de régions,
région et angle du jour pour 1501 jours passés, suggestions pour 944 saisies dans chaque mode.
Le fichier reference-java.json est produit par outils/ReferenceJava.java (voir son en-tête).
 */
import { describe, expect, it } from 'vitest'
import { azimut, direction, distance, proximite } from './geographie.ts'
import { suggestions } from './recherche.ts'
import { angleDuJour, numero, regionDuJour } from './regionDuJour.ts'
import { parId, type Mode } from './regions.ts'
import reference from './reference-java.json'

// « 2026-10-12 » -> minuit, heure locale, ce jour-là : la date telle que la voit le joueur
function dateLocale(texte: string): Date {
  const [annee, mois, jour] = texte.split('-').map(Number)
  return new Date(annee, mois - 1, jour)
}

// SUD_OUEST (Java) -> sud-ouest
function directionWeb(java: string): string {
  return java.toLowerCase().replace('_', '-')
}

describe('Comparaison avec le Francle Java', () => {
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

  it('mêmes suggestions, en ne cherchant que les noms français (le Java ne connaît pas les noms anglais)', () => {
    for (const cas of reference.suggestions) {
      const mode = cas.mode.toLowerCase() as Mode
      const ids = suggestions(cas.saisie, mode, 'fr', ['fr']).map((region) => region.id)
      expect(ids, `« ${cas.saisie} » en mode ${mode}`).toEqual(cas.regions)
    }
  })
})
