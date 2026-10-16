/*
Plusieurs onglets ouverts sur le jeu. Chacun a sa propre copie de la partie et des réglages en mémoire : sans rien
faire, on pourrait jouer la partie du jour deux fois, et chaque onglet écraserait la sauvegarde de l'autre.

Le navigateur prévient : quand un onglet écrit dans localStorage, les AUTRES onglets du même site reçoivent
l'évènement « storage » (pas celui qui écrit, qui sait déjà ce qu'il a fait). Il suffit alors de relire la sauvegarde.
 */
import { useEffect, useEffectEvent } from 'react'

// appelle quandChange chaque fois qu'un autre onglet modifie la clé donnée de localStorage
export function useChangementAilleurs(cle: string, quandChange: () => void): void {
  // useEffectEvent : une fonction qui voit toujours les dernières valeurs du composant (le jour, la partie…), sans
  // devoir réinstaller l'écoute à chaque affichage
  const prevenir = useEffectEvent(quandChange)
  useEffect(() => {
    const ecouter = (evenement: StorageEvent) => {
      // key vaut null quand l'autre onglet a tout effacé (localStorage.clear())
      if (evenement.key === cle || evenement.key === null) {
        prevenir()
      }
    }
    window.addEventListener('storage', ecouter)
    return () => window.removeEventListener('storage', ecouter)
  }, [cle])
}
