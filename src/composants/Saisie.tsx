/*
Le champ de saisie et sa liste de suggestions.

Worldle utilisait la bibliothèque react-autosuggest, abandonnée depuis. On suit ici le modèle « combobox » décrit par
le W3C (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) : un champ de texte, une liste d'options, et des
attributs aria-* qui disent aux lecteurs d'écran ce qui est ouvert et ce qui est choisi. Au clavier : ↓ et ↑ pour
parcourir les suggestions, Entrée pour proposer, Échap pour fermer la liste.
 */
import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { suggestions } from '../domaine/recherche.ts'
import type { Mode } from '../domaine/regions.ts'
import { textes } from '../textes.ts'

interface Props {
  mode: Mode
  // joue la saisie ; renvoie true si elle a été acceptée (le champ se vide alors)
  onProposer: (saisie: string) => boolean
}

export function Saisie({ mode, onProposer }: Props) {
  // useState : une valeur que React garde d'un affichage à l'autre. Quand on la change avec la fonction set…,
  // React rappelle le composant et met l'écran à jour
  const [texte, setTexte] = useState('')
  const [ouverte, setOuverte] = useState(false)
  // la suggestion surlignée au clavier, -1 si aucune
  const [choisie, setChoisie] = useState(-1)
  // useId : un identifiant unique dans la page, pour relier le champ à sa liste (aria-controls)
  const idListe = useId()

  // recalculée à chaque affichage : 35 régions, c'est instantané
  const liste = ouverte ? suggestions(texte, mode, 'fr') : []

  function proposer(saisie: string) {
    if (onProposer(saisie)) {
      setTexte('')
    }
    setOuverte(false)
    setChoisie(-1)
  }

  function envoyer(evenement: FormEvent) {
    // sans cela, le navigateur enverrait le formulaire à un serveur et rechargerait la page
    evenement.preventDefault()
    proposer(choisie >= 0 && choisie < liste.length ? liste[choisie].nom.fr : texte)
  }

  function touche(evenement: KeyboardEvent) {
    if (evenement.key === 'ArrowDown' || evenement.key === 'ArrowUp') {
      evenement.preventDefault() // sinon le curseur saute au début ou à la fin du texte
      setOuverte(true)
      const pas = evenement.key === 'ArrowDown' ? 1 : -1
      setChoisie((avant) => {
        if (liste.length === 0) {
          return -1
        }
        // rien de surligné : ↓ va à la première suggestion, ↑ à la dernière
        if (avant < 0) {
          return pas > 0 ? 0 : liste.length - 1
        }
        // on tourne en boucle : après la dernière suggestion, on revient à la première
        return (avant + pas + liste.length) % liste.length
      })
    } else if (evenement.key === 'Escape') {
      setOuverte(false)
      setChoisie(-1)
    }
  }

  const idOption = (index: number) => `${idListe}-${index}`

  return (
    // relative : la liste, en position absolute, se place par rapport à ce formulaire
    <form onSubmit={envoyer} className="relative flex gap-2">
      <input
        type="text"
        role="combobox"
        aria-label={textes.saisie}
        aria-autocomplete="list"
        aria-expanded={liste.length > 0}
        aria-controls={idListe}
        aria-activedescendant={choisie >= 0 && choisie < liste.length ? idOption(choisie) : undefined}
        placeholder={textes.saisieExemple}
        autoComplete="off"
        value={texte}
        onChange={(evenement) => {
          setTexte(evenement.target.value)
          setOuverte(true)
          setChoisie(-1)
        }}
        onKeyDown={touche}
        // la liste se ferme quand on quitte le champ (un clic sur une suggestion arrive avant, voir onMouseDown)
        onBlur={() => setOuverte(false)}
        className="min-w-0 flex-1 rounded border border-bord px-3 py-2 focus:border-francle-fonce focus:outline-none"
      />
      <button type="submit" className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90">
        {textes.proposer}
      </button>
      {liste.length > 0 && (
        <ul
          id={idListe}
          role="listbox"
          aria-label={textes.saisie}
          // top-full : juste sous le formulaire ; z-10 : au-dessus du tableau
          className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded border border-bord bg-fond text-left shadow-lg"
        >
          {liste.map((region, index) => (
            <li
              // key : l'identifiant que React utilise pour reconnaître chaque élément d'une liste d'un affichage à l'autre
              key={region.id}
              id={idOption(index)}
              role="option"
              aria-selected={index === choisie}
              // onMouseDown plutôt que onClick : il arrive AVANT que le champ perde le focus (onBlur fermerait la
              // liste, et le clic tomberait dans le vide). preventDefault garde le focus dans le champ
              onMouseDown={(evenement) => {
                evenement.preventDefault()
                proposer(region.nom.fr)
              }}
              className={`cursor-pointer px-3 py-2 ${index === choisie ? 'bg-francle-clair text-gray-900' : 'hover:bg-surface'}`}
            >
              {region.nom.fr}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
