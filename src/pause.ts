/*
Une action à faire après une courte pause : la fenêtre des résultats s'ouvre ainsi un peu après la dernière réponse du
bonus, pour que le joueur voie d'abord sa couleur sur la carte.

On ne lance pas setTimeout directement dans le clic : si le composant disparaît entre-temps (minuit, nouvelle partie),
la minuterie sonnerait pour un composant qui n'existe plus. Ici, la pause est un état (« en attente ») ; un useEffect
lance la minuterie quand il passe à vrai, et React l'arrête (la fonction rendue par l'effet) si le composant disparaît
ou si la pause est annulée.
 */
import { useEffect, useRef, useState } from 'react'

// la pause entre la dernière réponse du bonus et l'ouverture des résultats, en millisecondes
export const PAUSE_FIN_BONUS = 1500

export function usePause(action: () => void, delai: number = PAUSE_FIN_BONUS) {
  const [enAttente, setEnAttente] = useState(false)
  // la dernière version de l'action, gardée à part : l'effet ne dépend ainsi que de « en attente », et la minuterie
  // ne repart pas de zéro à chaque affichage
  const derniere = useRef(action)
  useEffect(() => {
    derniere.current = action
  })

  useEffect(() => {
    if (!enAttente) {
      return
    }
    const minuterie = setTimeout(() => {
      setEnAttente(false)
      derniere.current()
    }, delai)
    return () => clearTimeout(minuterie)
  }, [enAttente, delai])

  return { lancer: () => setEnAttente(true), annuler: () => setEnAttente(false) }
}
