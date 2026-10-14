import { describe, expect, it } from 'vitest'
import { CLE_REGLAGES, enregistrerReglages, lireReglages, PAR_DEFAUT, uniteAffichee } from './reglages.ts'
import { TEXTES } from './textes.ts'

describe('Les réglages', () => {
  it('sans rien d’enregistré : thème automatique, unité de la langue, aucun mode difficile', () => {
    expect(lireReglages()).toEqual(PAR_DEFAUT)
    expect(uniteAffichee(PAR_DEFAUT)).toBe('km')
  })

  it('se retrouvent tels qu’enregistrés', () => {
    const reglages = { langue: 'en', theme: 'sombre', unite: 'mi', rotation: true, cachee: false } as const
    enregistrerReglages(reglages)
    expect(lireReglages()).toEqual(reglages)
  })

  it('une valeur abîmée ou inconnue reprend sa valeur par défaut, sans toucher aux autres', () => {
    localStorage.setItem(CLE_REGLAGES, JSON.stringify({ theme: 'violet', unite: 'lieues', rotation: true }))
    expect(lireReglages()).toEqual({ ...PAR_DEFAUT, rotation: true })
    localStorage.setItem(CLE_REGLAGES, 'pas du JSON')
    expect(lireReglages()).toEqual(PAR_DEFAUT)
  })

  it('les distances en kilomètres ou en miles, arrondies', () => {
    // le séparateur des milliers en français est une espace fine insécable : on laisse toLocaleString l'écrire
    expect(TEXTES.fr.distance(1024.6, 'km')).toBe(`${(1025).toLocaleString('fr-FR')}\u00a0km`)
    expect(TEXTES.fr.distance(160.9344, 'mi')).toBe('100\u00a0mi')
    expect(TEXTES.fr.distance(0, 'mi')).toBe('0\u00a0mi')
  })
})
