/*
Les réglages du joueur, gardés dans le navigateur comme les parties (voir sauvegarde.ts), sous leur propre clé.
 */
import { useEffect, useState } from 'react'
import type { ModesDifficiles } from './domaine/partage.ts'
import type { Langue } from './domaine/regions.ts'

export type Theme = 'auto' | 'clair' | 'sombre'
export type Unite = 'km' | 'mi'

export interface Reglages {
  // undefined : le joueur n'a pas choisi, c'est la langue de son navigateur
  readonly langue: Langue | undefined
  readonly theme: Theme
  // undefined : le joueur n'a pas choisi, l'unité suit la langue (km en français, miles en anglais). Dès qu'il
  // choisit, son choix l'emporte, même s'il change ensuite de langue
  readonly unite: Unite | undefined
  // les modes difficiles : la silhouette tournée (🌀), ou pas de silhouette du tout (🙈)
  readonly rotation: boolean
  readonly cachee: boolean
}

export const PAR_DEFAUT: Reglages = { langue: undefined, theme: 'auto', unite: undefined, rotation: false, cachee: false }

export const CLE_REGLAGES = 'francle.reglages.v1'

// les réglages enregistrés, complétés par les valeurs par défaut : un réglage ajouté plus tard (ou une valeur
// abîmée) prend sa valeur par défaut
export function lireReglages(stockage: Storage = localStorage): Reglages {
  try {
    const lu: Partial<Reglages> = JSON.parse(stockage.getItem(CLE_REGLAGES) ?? '{}')
    return {
      langue: lu.langue === 'fr' || lu.langue === 'en' ? lu.langue : undefined,
      theme: ['auto', 'clair', 'sombre'].includes(lu.theme as string) ? (lu.theme as Theme) : PAR_DEFAUT.theme,
      unite: lu.unite === 'km' || lu.unite === 'mi' ? lu.unite : undefined,
      rotation: lu.rotation === true,
      cachee: lu.cachee === true,
    }
  } catch {
    return PAR_DEFAUT
  }
}

export function enregistrerReglages(reglages: Reglages, stockage: Storage = localStorage): void {
  try {
    stockage.setItem(CLE_REGLAGES, JSON.stringify(reglages))
  } catch {
    // stockage refusé : les réglages valent pour cette visite seulement
  }
}

// la langue du navigateur : le français si la première langue préférée du joueur est le français (fr, fr-FR,
// fr-BE, fr-CA…), l'anglais sinon. navigator.languages est la liste réglée dans le navigateur, par ordre de préférence
export function langueNavigateur(): Langue {
  const preferee = navigator.languages?.[0] ?? navigator.language ?? 'fr'
  return preferee.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

// la langue à afficher : celle choisie par le joueur, sinon celle de son navigateur
export function langueAffichee(reglages: Reglages): Langue {
  return reglages.langue ?? langueNavigateur()
}

// l'unité à afficher : celle choisie par le joueur, sinon celle de la langue (miles en anglais, km en français)
export function uniteAffichee(reglages: Reglages): Unite {
  return reglages.unite ?? (langueAffichee(reglages) === 'en' ? 'mi' : 'km')
}

// les modes difficiles choisis dans les réglages
export function modesReglages(reglages: Reglages): ModesDifficiles {
  return { rotation: reglages.rotation, cachee: reglages.cachee }
}

// un « hook » maison : une fonction qui utilise useState et useEffect, réutilisable comme un seul bloc. Il donne les
// réglages et une fonction pour en changer une partie ; chaque changement est enregistré
export function useReglages(): [Reglages, (changement: Partial<Reglages>) => void] {
  const [reglages, setReglages] = useState(() => lireReglages())
  useEffect(() => enregistrerReglages(reglages), [reglages])
  return [reglages, (changement) => setReglages((avant) => ({ ...avant, ...changement }))]
}

// le thème sombre est-il à appliquer ? « auto » suit le réglage du système (ordinateur ou téléphone)
export function estSombre(theme: Theme): boolean {
  if (theme !== 'auto') {
    return theme === 'sombre'
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}

// applique le thème à la page : la classe « dark » sur <html> active toutes les classes dark: de Tailwind.
// En mode « auto », on suit aussi les changements du système pendant la partie (passage au mode nuit)
export function useTheme(theme: Theme): void {
  useEffect(() => {
    const appliquer = () => document.documentElement.classList.toggle('dark', estSombre(theme))
    appliquer()
    const systeme = window.matchMedia?.('(prefers-color-scheme: dark)')
    systeme?.addEventListener('change', appliquer)
    return () => systeme?.removeEventListener('change', appliquer)
  }, [theme])
}
