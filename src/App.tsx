/*
L'application : elle ne garde que le jour, et affiche le jeu de ce jour.

key={numero} : quand le jour change (à minuit, page ouverte), la clé change, et React jette l'ancien Jeu pour en
créer un neuf. Tout son état (partie, messages, fenêtre) repart de zéro pour la nouvelle région, sans avoir à le
remettre à zéro champ par champ.
 */
import { useState } from 'react'
import { numero } from './domaine/regionDuJour.ts'
import { Jeu } from './Jeu.tsx'

// la date est un paramètre pour les tests ; sur le site, il est absent et c'est aujourd'hui
export default function App({ date }: { date?: Date }) {
  // new Date() dans une fonction passée à useState : appelée une seule fois, et non à chaque affichage
  const [jour, setJour] = useState(() => date ?? new Date())
  return <Jeu key={numero(jour)} jour={jour} onJourSuivant={() => setJour(new Date())} />
}
