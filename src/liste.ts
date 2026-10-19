/*
Le bouton 📃 de l'en-tête ouvre la liste des régions, ou celle des départements pendant le bonus (depuis web.7.12).

Le bouton appartient à App, mais c'est chaque partie (du jour, libre) qui sait si son bonus est affiché. Elle prévient
donc App à chaque changement, pour le nom du bouton : c'est « remonter l'état » vers le parent, comme un écouteur
qu'un composant Swing appellerait sur sa fenêtre.
 */
import { useEffect, useEffectEvent } from 'react'

export type Liste = 'regions' | 'departements'

// appelle onListe à l'affichage, puis chaque fois que la liste change
export function useSignalerListe(listeAuBonus: boolean, onListe: ((liste: Liste) => void) | undefined): void {
  // useEffectEvent (voir onglets.ts) : App peut passer une nouvelle fonction à chaque affichage sans relancer l'effet
  const prevenir = useEffectEvent((liste: Liste) => onListe?.(liste))
  useEffect(() => {
    prevenir(listeAuBonus ? 'departements' : 'regions')
  }, [listeAuBonus])
}
