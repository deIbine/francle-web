/*
Les réglages du joueur, gardés dans le navigateur comme les parties (voir sauvegarde.ts), sous leur propre clé.
 */
import { useEffect, useState } from 'react'
import type { ModesDifficiles } from './domaine/partage.ts'

export type Theme = 'auto' | 'clair' | 'sombre'
export type Unite = 'km' | 'mi'

export interface Reglages {
  readonly theme: Theme
  // undefined : le joueur n'a pas choisi, l'unité suit la langue (km en français ; les miles viendront avec
  // l'anglais, à web.5). Dès qu'il choisit, son choix l'emporte
  readonly unite: Unite | undefined
  // les modes difficiles : la silhouette tournée (🌀), ou pas de silhouette du tout (🙈)
  readonly rotation: boolean
  readonly cachee: boolean
}

export const PAR_DEFAUT: Reglages = { theme: 'auto', unite: undefined, rotation: false, cachee: false }

export const CLE_REGLAGES = 'francle.reglages.v1'

// les réglages enregistrés, complétés par les valeurs par défaut : un réglage ajouté plus tard (ou une valeur
// abîmée) prend sa valeur par défaut
export function lireReglages(stockage: Storage = localStorage): Reglages {
  try {
    const lu: Partial<Reglages> = JSON.parse(stockage.getItem(CLE_REGLAGES) ?? '{}')
    return {
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

// l'unité à afficher : celle choisie par le joueur, sinon celle de la langue
export function uniteAffichee(reglages: Reglages): Unite {
  return reglages.unite ?? 'km'
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
