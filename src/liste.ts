/*
Le bouton 📃 de l'en-tête ouvre la liste des régions, ou celle des départements pendant le bonus (depuis web.7.12).

Le bouton appartient à App, mais c'est chaque partie (du jour, libre) qui sait si son bonus est affiché. Elle prévient
donc App à chaque changement, pour le nom du bouton : c'est « remonter l'état » vers le parent, comme un écouteur
qu'un composant Swing appellerait sur sa fenêtre.
 */
import { useEffect, useEffectEvent } from 'react'
import { avecListe, type Bonus } from './domaine/bonus.ts'

// « aucune » (depuis web.7.18) : un bonus est affiché, mais il n'a pas de liste (la question du numéro, en
// outre-mer, où la liste donnerait la réponse). Le bouton est alors grisé : avant, il ouvrait la liste des régions,
// toute grisée, puisque la partie est gagnée
export type Liste = 'regions' | 'departements' | 'aucune'

// la liste qu'ouvre le bouton, selon le bonus affiché (undefined : la silhouette est affichée, pas le bonus)
export function listeOuverte(bonus: Bonus | undefined): Liste {
  if (bonus === undefined) {
    return 'regions'
  }
  return avecListe(bonus) ? 'departements' : 'aucune'
}

// appelle onListe à l'affichage, puis chaque fois que la liste change
export function useSignalerListe(liste: Liste, onListe: ((liste: Liste) => void) | undefined): void {
  // useEffectEvent (voir onglets.ts) : App peut passer une nouvelle fonction à chaque affichage sans relancer l'effet
  const prevenir = useEffectEvent((liste: Liste) => onListe?.(liste))
  useEffect(() => {
    prevenir(liste)
  }, [liste])
}
