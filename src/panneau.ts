/*
Le panneau de l'onglet (partie du jour, partie libre) est-il affiché ? Les deux parties restent dans la page, l'une
cachée (attribut hidden, voir App.tsx). Une fenêtre <dialog> ouverte par showModal() dans un panneau caché ne
s'affiche pas, mais rend quand même tout le reste de la page inactif : plus aucun clic ne marche (bug relevé à
web.7.19, quand la pause du bonus ouvrait les résultats juste après un changement d'onglet).

App donne la réponse à chaque panneau par ce contexte, et Fenetre attend que son panneau soit affiché pour s'ouvrir.
Un contexte plutôt qu'une prop : les fenêtres sont à plusieurs niveaux sous les parties (plateau, bonus), et il
faudrait la faire passer par chacun. C'est le même principe que LangueContext (textes.ts).
 */
import { createContext } from 'react'

// vrai par défaut : une fenêtre hors des panneaux (aide, réglages) est toujours dans la partie affichée de la page
export const PanneauVisible = createContext(true)
