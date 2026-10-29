/*
La carte des départements de la région trouvée, pour le bonus : chaque département est un <path> SVG, coloré selon
la réponse (vert : trouvé, rouge : manqué) et cliquable : en mode A, un clic répond ; en mode C, un clic choisit le
département (en bleu foncé), que le joueur nomme ensuite dans la saisie. En mode C, un département déjà répondu ne se
choisit plus.

Le Java dessinait lui-même (Path2D) et testait « ce clic est-il dans cette forme ? » (Shape.contains). Ici, le
navigateur le fait : un <path> reçoit le clic s'il tombe dans sa forme, trous compris (fill-rule evenodd : l'enclave
des Papes, du Vaucluse, n'appartient pas à la Drôme qui l'entoure).

Accessibilité : chaque département est atteignable au clavier (Tab, puis Entrée ou Espace). Pendant le bonus, un
lecteur d'écran ne lit pas son nom, ce serait donner la réponse : seulement « Zone 3 sur 12 », les zones étant
numérotées du haut vers le bas de la carte, et non dans l'ordre des numéros (qui serait un indice). Un département
déjà répondu (mode C), ou tous une fois le bonus fini, dit son nom et s'il a été trouvé ; une fois le bonus fini, le
nom s'affiche aussi au clic, au survol ou au clavier. Au clic surtout : le doigt n'a pas de survol, et Safari sur
iPhone n'imite la souris que sur ce qui se clique.

Les contours sont téléchargés au premier affichage (useContours, dans contours.ts) : en attendant, un message.
 */
import { useMemo, useState, type KeyboardEvent } from 'react'
import { bonusEnCours, demande, juste, tentativeDe, type Bonus } from '../domaine/bonus.ts'
import { parCode, type Departement } from '../domaine/departements.ts'
import { centre, useContours, type Contours } from '../contours.ts'
import { useTextes } from '../textes.ts'

interface Props {
  bonus: Bonus
  // le département cliqué, en mode A
  onRepondre: (departement: Departement) => void
  // mode C : le département choisi (en bleu foncé), et le clic qui en choisit un
  choisi?: Departement
  onChoisir?: (departement: Departement) => void
}

export function CarteDepartements(props: Props) {
  const textes = useTextes()
  const { contours, echec, reessayer } = useContours(props.bonus.region.id)
  // h-64 : la hauteur de la carte qui va venir (max-h-64), pour que la page ne saute pas à son arrivée (depuis
  // web.7.18 ; avant, h-56 : 32 pixels de moins)
  if (echec) {
    // le bonus reste là : « Passer » marche toujours, et rien n'est perdu
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p>{textes.bonus.echec}</p>
        <button
          type="button"
          onClick={reessayer}
          className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          {textes.bonus.reessayer}
        </button>
      </div>
    )
  }
  if (contours === undefined) {
    return <p className="flex h-64 items-center justify-center">{textes.bonus.chargement}</p>
  }
  return <Carte {...props} contours={contours} />
}

// la carte elle-même, une fois les contours arrivés. Un composant à part : les « hooks » de React (useState,
// useMemo…) doivent être appelés à chaque affichage, dans le même ordre, donc jamais après un « return » anticipé
function Carte({ bonus, onRepondre, choisi, onChoisir, contours }: Props & { contours: Contours }) {
  const textes = useTextes()
  // le département cliqué, sous la souris ou sous le focus du clavier, pour afficher son nom une fois le bonus fini
  const [survole, setSurvole] = useState<Departement | undefined>(undefined)
  const fini = !bonusEnCours(bonus)
  const choix = !fini && bonus.question === 'choix'
  // en bleu foncé : le département choisi (mode C), ou le département demandé (mode B, et question du numéro)
  const colorie = fini || bonus.question === 'carte' ? undefined : choix ? choisi : demande(bonus)

  // un clic sur ce département fait-il quelque chose ? En mode A, partout ; en mode C, sur ceux sans réponse
  function cliquable(departement: Departement): boolean {
    return !fini && (bonus.question === 'carte' || (choix && tentativeDe(bonus, departement) === undefined))
  }

  function cliquer(departement: Departement) {
    if (bonus.question === 'carte') {
      onRepondre(departement)
    } else {
      onChoisir?.(departement)
    }
  }

  // les départements, du haut vers le bas de la carte (puis de gauche à droite) : l'ordre du clavier et des zones.
  // useMemo : calculé une fois par fichier de contours, pas à chaque affichage
  const zones = useMemo(
    () =>
      contours.departements
        .flatMap(({ code, d }) => {
          const departement = parCode(code)
          return departement === undefined ? [] : [{ departement, d, centre: centre(d) }]
        })
        .sort((a, b) => a.centre.y - b.centre.y || a.centre.x - b.centre.x),
    [contours],
  )

  const nom = (departement: Departement) => textes.bonus.departement(departement.nom, departement.code)

  // la couleur, et la main au survol quand un clic fait quelque chose : répondre, choisir, ou (bonus fini) donner le nom
  function couleur(departement: Departement): string {
    return fini ? `${teinte(departement)} cursor-pointer` : teinte(departement)
  }

  function teinte(departement: Departement): string {
    const tentative = tentativeDe(bonus, departement)
    if (tentative !== undefined) {
      return juste(tentative) ? 'fill-succes' : 'fill-danger'
    }
    if (departement === colorie) {
      return choix ? 'fill-francle-fonce cursor-pointer' : 'fill-francle-fonce'
    }
    // un département qu'on peut cliquer fonce au survol, pour montrer ce qu'on va cliquer
    return cliquable(departement) ? 'fill-francle-clair cursor-pointer hover:fill-francle-fonce' : 'fill-francle-clair'
  }

  // ce que lit un lecteur d'écran : la zone tant qu'on peut la cliquer, le nom et le résultat ensuite (bonus fini, ou
  // département déjà répondu en mode C)
  function etiquette(departement: Departement, rang: number): string {
    if (cliquable(departement)) {
      return textes.bonus.zone(rang, zones.length)
    }
    const tentative = tentativeDe(bonus, departement)
    if (tentative === undefined) {
      return nom(departement)
    }
    return `${nom(departement)}, ${juste(tentative) ? textes.bonus.trouve : textes.bonus.manque}`
  }

  function touche(evenement: KeyboardEvent, departement: Departement) {
    // Entrée ou Espace, comme sur un vrai bouton
    if (cliquable(departement) && (evenement.key === 'Enter' || evenement.key === ' ')) {
      evenement.preventDefault() // sinon Espace fait défiler la page
      cliquer(departement)
    }
  }

  // les tracés, pour la carte et pour l'agrandissement de Paris. Seule la carte principale est atteignable au clavier
  // et lue par les lecteurs d'écran : l'agrandissement n'est qu'une aide pour les yeux et la souris
  function traces(principale: boolean) {
    return zones.map(({ departement, d }, index) => {
      const bouton = cliquable(departement)
      // atteignable au clavier et lu : ce qu'on peut cliquer, et ce dont on peut dire le nom (répondu ou bonus fini)
      const actif = principale && (bouton || fini || tentativeDe(bonus, departement) !== undefined)
      return (
        <path
          key={departement.code}
          // le numéro, pour que les tests sachent où cliquer. Il n'est pas lu par les lecteurs d'écran, et qui ouvre
          // les outils du navigateur peut de toute façon lire les contours
          data-code={departement.code}
          d={d}
          fillRule="evenodd"
          // vectorEffect : le trait garde la même épaisseur quelle que soit la taille de la carte (et dans le zoom)
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          // stroke-fond : un trait de la couleur du fond sépare les départements, en clair comme en sombre
          className={`stroke-fond stroke-[1.5] ${couleur(departement)} focus:outline-none focus-visible:stroke-texte focus-visible:stroke-[3]`}
          role={actif ? (bouton ? 'button' : 'img') : undefined}
          tabIndex={actif ? 0 : undefined}
          aria-label={actif ? etiquette(departement, index + 1) : undefined}
          // mode C : le département choisi est un bouton « enfoncé »
          aria-pressed={actif && choix && bouton ? departement === choisi : undefined}
          onClick={bouton ? () => cliquer(departement) : fini ? () => setSurvole(departement) : undefined}
          onKeyDown={actif ? (evenement) => touche(evenement, departement) : undefined}
          onMouseEnter={() => setSurvole(departement)}
          onMouseLeave={() => setSurvole(undefined)}
          onFocus={() => setSurvole(departement)}
          onBlur={() => setSurvole(undefined)}
        />
      )
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-center gap-2">
        <svg
          viewBox={`0 0 ${contours.largeur} ${contours.hauteur}`}
          role="group"
          aria-label={textes.bonus.carteRegion}
          // la carte occupe la place de la silhouette (un carré de 14 rem), un peu plus large si elle l'est
          className="h-auto max-h-64 w-full max-w-sm min-w-0 flex-[3]"
        >
          {traces(true)}
        </svg>
        {contours.zoom !== undefined && (
          // aria-hidden : l'agrandissement répète la carte, un lecteur d'écran n'a pas à le lire deux fois
          <svg
            viewBox={contours.zoom.join(' ')}
            aria-hidden="true"
            className="h-auto max-h-48 w-full min-w-0 flex-[2] rounded border border-bord"
          >
            <title>{textes.bonus.zoom}</title>
            {traces(false)}
          </svg>
        )}
      </div>
      {fini && (
        <p aria-live="polite" className="min-h-5 text-center text-sm text-discret">
          {survole === undefined ? textes.bonus.survol : etiquette(survole, 0)}
        </p>
      )}
    </div>
  )
}
