/*
Le champ de saisie et sa liste de suggestions.

Worldle utilisait la bibliothèque react-autosuggest, abandonnée depuis. On suit ici le modèle « combobox » décrit par
le W3C (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) : un champ de texte, une liste d'options, et des
attributs aria-* qui disent aux lecteurs d'écran ce qui est ouvert et ce qui est choisi. Au clavier : ↓ et ↑ pour
parcourir les suggestions, Entrée pour proposer, Échap pour fermer la liste.

Le même champ sert aux régions (la partie) et aux départements (les modes B et C du bonus) : il ne sait pas ce qu'il
propose, c'est la fonction « suggerer » qui le lui dit. Comme une interface Java passée en paramètre.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTextes } from '../textes.ts'

// une suggestion : une clé (unique dans la liste, pour React), le nom qui sera proposé, et ce qu'affiche la liste
// s'il diffère du nom (« Finistère (29) » pour le département Finistère)
export interface Suggestion {
  readonly cle: string
  readonly nom: string
  readonly libelle?: string
}

interface Props {
  // les suggestions pour le texte tapé
  suggerer: (texte: string) => Suggestion[]
  // joue la saisie ; renvoie true si elle a été acceptée (le champ se vide alors)
  onProposer: (saisie: string) => boolean
  // le nom du champ (lu par les lecteurs d'écran), l'exemple écrit dedans et le texte du bouton : ceux de la partie
  // par défaut
  etiquette?: string
  exemple?: string
  bouton?: string
  // grisé : on ne peut rien écrire (mode C du bonus, tant qu'aucun département n'est choisi)
  desactive?: boolean
  // augmente de 1 chaque fois que le champ doit prendre le focus du clavier (un département vient d'être choisi)
  demandeFocus?: number
}

export function Saisie({ suggerer, onProposer, etiquette, exemple, bouton, desactive = false, demandeFocus = 0 }: Props) {
  const textes = useTextes()
  // useState : une valeur que React garde d'un affichage à l'autre. Quand on la change avec la fonction set…,
  // React rappelle le composant et met l'écran à jour
  const [texte, setTexte] = useState('')
  const [ouverte, setOuverte] = useState(false)
  // la suggestion surlignée au clavier, -1 si aucune
  const [choisie, setChoisie] = useState(-1)
  // useId : un identifiant unique dans la page, pour relier le champ à sa liste (aria-controls)
  const idListe = useId()
  const champ = useRef<HTMLInputElement>(null)

  // une demande de focus : on le donne au champ (useEffect, car le champ vient peut-être juste de cesser d'être grisé,
  // et un champ grisé ne peut pas le recevoir). 0 : aucune demande encore
  useEffect(() => {
    if (demandeFocus > 0) {
      champ.current?.focus()
    }
  }, [demandeFocus])

  // recalculée à chaque affichage : 35 régions ou 13 départements au plus, c'est instantané
  const liste = ouverte ? suggerer(texte) : []

  function proposer(saisie: string) {
    // une saisie vide (ou faite d'espaces) : rien ne se passe, sans message
    if (saisie.trim() === '') {
      return
    }
    const acceptee = onProposer(saisie)
    if (acceptee) {
      setTexte('')
    }
    // refusée (« Plusieurs régions possibles », « déjà proposée »…) : la liste reste ouverte sur ce qui a été tapé,
    // pour choisir sans retaper. Rien n'y est surligné : une seconde Entrée ne joue pas une suggestion au hasard
    setOuverte(!acceptee)
    setChoisie(-1)
  }

  function envoyer(evenement: FormEvent) {
    // sans cela, le navigateur enverrait le formulaire à un serveur et rechargerait la page
    evenement.preventDefault()
    proposer(choisie >= 0 && choisie < liste.length ? liste[choisie].nom : texte)
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
        ref={champ}
        type="text"
        role="combobox"
        aria-label={etiquette ?? textes.saisie}
        aria-autocomplete="list"
        aria-expanded={liste.length > 0}
        aria-controls={idListe}
        aria-activedescendant={choisie >= 0 && choisie < liste.length ? idOption(choisie) : undefined}
        placeholder={exemple ?? textes.saisieExemple}
        autoComplete="off"
        disabled={desactive}
        value={texte}
        onChange={(evenement) => {
          setTexte(evenement.target.value)
          setOuverte(true)
          setChoisie(-1)
        }}
        onKeyDown={touche}
        // la liste se ferme quand on quitte le champ (un clic sur une suggestion arrive avant, voir onMouseDown)
        onBlur={() => setOuverte(false)}
        // disabled: : l'apparence du champ grisé
        className="min-w-0 flex-1 rounded border border-bord px-3 py-2 focus:border-francle-fonce focus:outline-none disabled:bg-surface disabled:text-discret"
      />
      <button
        type="submit"
        disabled={desactive}
        className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {bouton ?? textes.proposer}
      </button>
      {/* la liste reste toujours dans la page, cachée (hidden) quand elle est vide : aria-controls du champ doit
          désigner un élément qui existe, comme dans le modèle du W3C */}
      <ul
        id={idListe}
        role="listbox"
        aria-label={etiquette ?? textes.saisie}
        hidden={liste.length === 0}
        // top-full : juste sous le formulaire ; z-10 : au-dessus du tableau
        className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded border border-bord bg-fond text-left shadow-lg"
      >
        {liste.map((suggestion, index) => (
          <li
            // key : l'identifiant que React utilise pour reconnaître chaque élément d'une liste d'un affichage à l'autre
            key={suggestion.cle}
            id={idOption(index)}
            role="option"
            aria-selected={index === choisie}
            // onMouseDown plutôt que onClick : il arrive AVANT que le champ perde le focus (onBlur fermerait la
            // liste, et le clic tomberait dans le vide). preventDefault garde le focus dans le champ
            onMouseDown={(evenement) => {
              evenement.preventDefault()
              proposer(suggestion.nom)
            }}
            className={`cursor-pointer px-3 py-2 ${index === choisie ? 'bg-francle-clair text-gray-900' : 'hover:bg-surface'}`}
          >
            {suggestion.libelle ?? suggestion.nom}
          </li>
        ))}
      </ul>
    </form>
  )
}
