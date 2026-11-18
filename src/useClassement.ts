/*
Un classement demandé au serveur (web.9.3.2), pour la ligue et le classement public : redemandé quand la clé change
(le mois, et ce qui peut changer le classement, comme les membres de la ligue).

Le « chargement » n'est pas un état qu'on pose au début de la demande (un setState au début d'un effet relance un
affichage pour rien) : on garde la clé de la dernière réponse reçue, et tant qu'elle n'est pas la clé demandée, c'est
qu'on attend. useEffectEvent (React 19.2) donne à l'effet la dernière version de demander sans le relancer quand
demander change (une nouvelle fonction à chaque affichage).

Depuis web.9.5.1, la fraîcheur (voir useFraicheur) : un nombre qui augmente quand le classement a pu changer sans que
la clé change (la fenêtre rouverte, une partie arrivée au serveur). Le classement est alors redemandé, mais l'ancien
reste affiché jusqu'à la réponse : pas de « Chargement… » qui ferait sauter le tableau sous les yeux du joueur.
 */
import { useEffect, useEffectEvent, useState } from 'react'
import type { Classement } from './domaine/classement.ts'
import { PARTIES_RECUES } from './envoi.ts'

export function useClassement(
  demander: () => Promise<Classement | undefined>,
  cle: string,
  fraicheur = 0,
): Classement | undefined | 'chargement' {
  const [recu, setRecu] = useState<{ cle: string; classement: Classement | undefined }>()
  const demanderMaintenant = useEffectEvent(demander)
  useEffect(() => {
    // « annule » : une réponse arrivée après un changement de clé ou de fraîcheur (ou la fenêtre fermée) est ignorée
    let annule = false
    void demanderMaintenant().then((classement) => {
      if (!annule) {
        setRecu({ cle, classement })
      }
    })
    return () => {
      annule = true
    }
  }, [cle, fraicheur])
  return recu?.cle === cle ? recu.classement : 'chargement'
}

// la fraîcheur d'un classement affiché dans la fenêtre des statistiques (depuis web.9.5.1). Une fenêtre <dialog> fermée
// n'est pas retirée de la page : le classement y restait tel qu'à sa première demande, même après une partie jouée (vu
// le 18 novembre 2026 : « Aucun joueur classé » alors que le serveur classait le joueur premier). Elle augmente donc :
// - à chaque ouverture de la fenêtre (ouverte passe de faux à vrai) ;
// - quand des parties arrivent au profil, sur le serveur (l'évènement PARTIES_RECUES, envoi.ts) : la partie qui vient
//   de finir part juste après, et une demande faite à l'ouverture des résultats ne la contiendrait pas encore
export function useFraicheur(ouverte: boolean): number {
  const [ouvertures, setOuvertures] = useState(0)
  // l'ouverture d'avant, comparée PENDANT l'affichage (le modèle de React pour « ajuster un état quand une prop change »)
  const [avant, setAvant] = useState(ouverte)
  if (avant !== ouverte) {
    setAvant(ouverte)
    if (ouverte) {
      setOuvertures((n) => n + 1)
    }
  }
  const [receptions, setReceptions] = useState(0)
  useEffect(() => {
    const recues = () => setReceptions((n) => n + 1)
    window.addEventListener(PARTIES_RECUES, recues)
    return () => window.removeEventListener(PARTIES_RECUES, recues)
  }, [])
  // deux compteurs qui ne font qu'augmenter : leur somme aussi, et elle change dès que l'un change
  return ouvertures + receptions
}
