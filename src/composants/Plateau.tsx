/*
Le plateau de jeu, commun à la partie du jour et à la partie libre : la silhouette (ou, après une victoire, le bonus
des départements), la saisie, le tableau des essais, les indices, le bouton « Abandonner » et la fenêtre de la liste
des régions.

Le plateau ne garde pas la partie : il la reçoit, et demande à son parent de la remplacer (onChanger) quand le
joueur propose ou abandonne. C'est le parent qui sait quoi faire ensuite (sauvegarder pour la partie du jour, rien
pour la partie libre) : le même plateau sert aux deux.
 */
import { useState, type ReactNode } from 'react'
import { abandonner, enCours, indicesAffiches, proposer, type Partie } from '../domaine/partie.ts'
import type { ModesDifficiles } from '../domaine/partage.ts'
import { anciennesRegionsDe, nouvelleRegionDe } from '../domaine/departements.ts'
import { autreEpoque, deviner, suggestions } from '../domaine/recherche.ts'
import type { Unite } from '../reglages.ts'
import { useLangue, useTextes } from '../textes.ts'
import { Fenetre } from './Fenetre.tsx'
import { Indices } from './Indices.tsx'
import { ListeRegions } from './ListeRegions.tsx'
import { Saisie } from './Saisie.tsx'
import { Silhouette } from './Silhouette.tsx'
import { TableauEssais } from './TableauEssais.tsx'

interface Props {
  partie: Partie
  onChanger: (suite: Partie) => void
  // les modes de cette partie, et l'angle de la silhouette en mode rotation
  modes: ModesDifficiles
  angle: number
  unite: Unite
  // ce qui s'affiche à la place de la saisie quand la partie est finie
  fin: ReactNode
  // augmente de 1 à chaque clic sur 📃 (dans l'en-tête, qui appartient à App) : la liste des régions s'ouvre alors
  demandeListe: number
  // le bonus des départements, affiché à la place de la silhouette quand il a commencé (rien sinon)
  bonus?: ReactNode
  // vrai quand 📃 ouvre la liste des départements, gardée par le bonus (voir JeuBonus.tsx) : le plateau n'ouvre
  // alors pas celle des régions
  listeAuBonus?: boolean
}

export function Plateau({ partie, onChanger, modes, angle, unite, fin, demandeListe, bonus, listeAuBonus = false }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  // le message sous la saisie (« région inconnue »…), vide s'il n'y a rien à dire
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [liste, setListe] = useState(false)

  // 📃 a été cliqué : on ouvre la liste (même façon de faire que pour 📊, voir PartieDuJour.tsx). Pendant le bonus,
  // c'est lui qui ouvre la sienne ; la demande est notée quand même, sinon la liste des régions s'ouvrirait toute
  // seule au retour de la silhouette (la demande vue serait restée celle d'avant)
  const [demandeVue, setDemandeVue] = useState(demandeListe)
  if (demandeVue !== demandeListe) {
    setDemandeVue(demandeListe)
    if (!listeAuBonus) {
      setListe(true)
    }
  }

  function jouer(saisie: string): boolean {
    // le nom tapé, ou la seule région qu'il évoque (« bret » -> Bretagne). Un refus ne coûte jamais d'essai
    const region = deviner(saisie, partie.mode)
    if (region === 'plusieurs') {
      setMessage(textes.plusieurs)
      return false
    }
    // une région déjà proposée ne coûte pas d'essai : le joueur s'est sûrement trompé de ligne
    if (region !== undefined && partie.essais.some((essai) => essai.region === region)) {
      setMessage(textes.dejaProposee(region.nom[langue]))
      return false
    }
    // une région de l'autre époque (« Alsace » en partie du jour) : on dit où elle est passée, sans coûter d'essai
    const autre = region === undefined ? autreEpoque(saisie, partie.mode) : undefined
    if (autre !== undefined) {
      setMessage(
        autre.epoque === 'ancienne'
          ? textes.ancienneRegion(autre.nom[langue], nouvelleRegionDe(autre).nom[langue])
          : textes.nouvelleRegion(
              autre.nom[langue],
              anciennesRegionsDe(autre).map((ancienne) => ancienne.nom[langue]),
            ),
      )
      return false
    }
    const suite = region === undefined ? undefined : proposer(partie, region.nom.fr)
    if (suite === undefined) {
      setMessage(textes.inconnue)
      return false
    }
    onChanger(suite)
    setMessage('')
    return true
  }

  return (
    <>
      {bonus ?? <Silhouette region={partie.cible} angle={modes.rotation ? angle : 0} cachee={modes.cachee} />}

      {enCours(partie) ? (
        <>
          <Saisie
            suggerer={(texte) =>
              suggestions(texte, partie.mode, langue).map((region) => ({ cle: region.id, nom: region.nom[langue] }))
            }
            onProposer={jouer}
          />
          {/* aria-live : un lecteur d'écran lit le message dès qu'il change ; min-h garde la place réservée */}
          <p aria-live="polite" className="min-h-5 text-sm text-erreur">
            {message}
          </p>
        </>
      ) : (
        fin
      )}

      <TableauEssais essais={partie.essais} unite={unite} />
      <Indices cible={partie.cible} reveles={indicesAffiches(partie)} />

      {enCours(partie) &&
        (confirmation ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>{textes.confirmerAbandon}</span>
            <button
              type="button"
              onClick={() => {
                setConfirmation(false)
                onChanger(abandonner(partie))
              }}
              className="rounded bg-danger px-3 py-1 text-white"
            >
              {textes.oui}
            </button>
            <button type="button" onClick={() => setConfirmation(false)} className="rounded border px-3 py-1">
              {textes.non}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            className="self-center text-sm text-discret underline hover:text-texte"
          >
            {textes.abandonner}
          </button>
        ))}

      <Fenetre ouverte={liste} onFermer={() => setListe(false)} titre={textes.liste.titre}>
        <ListeRegions
          partie={partie}
          onProposer={(nom) => {
            // la liste se ferme d'abord : si la partie se termine, la fenêtre des résultats s'ouvre ensuite
            setListe(false)
            jouer(nom)
          }}
        />
      </Fenetre>
    </>
  )
}
