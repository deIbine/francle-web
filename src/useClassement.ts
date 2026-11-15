/*
Un classement demandé au serveur (web.9.3.2), pour la ligue et le classement public : redemandé quand la clé change
(le mois, et ce qui peut changer le classement, comme les membres de la ligue).

Le « chargement » n'est pas un état qu'on pose au début de la demande (un setState au début d'un effet relance un
affichage pour rien) : on garde la clé de la dernière réponse reçue, et tant qu'elle n'est pas la clé demandée, c'est
qu'on attend. useEffectEvent (React 19.2) donne à l'effet la dernière version de demander sans le relancer quand
demander change (une nouvelle fonction à chaque affichage).
 */
import { useEffect, useEffectEvent, useState } from 'react'
import type { Classement } from './domaine/classement.ts'

export function useClassement(
  demander: () => Promise<Classement | undefined>,
  cle: string,
): Classement | undefined | 'chargement' {
  const [recu, setRecu] = useState<{ cle: string; classement: Classement | undefined }>()
  const demanderMaintenant = useEffectEvent(demander)
  useEffect(() => {
    // « annule » : une réponse arrivée après un changement de clé (ou la fenêtre fermée) est ignorée
    let annule = false
    void demanderMaintenant().then((classement) => {
      if (!annule) {
        setRecu({ cle, classement })
      }
    })
    return () => {
      annule = true
    }
  }, [cle])
  return recu?.cle === cle ? recu.classement : 'chargement'
}
