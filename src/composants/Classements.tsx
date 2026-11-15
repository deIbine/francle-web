/*
L'onglet « Classement » des statistiques (web.9.3.2) : la ligue du joueur. Sans profil, il dit comment en créer un ;
sans ligue, il propose d'en créer une ou d'en rejoindre une par son code ; avec une ligue, il montre son classement du
mois (et des mois passés, décision 10 de web.9.3), le lien d'invitation, les membres et, pour le créateur, de quoi
retirer un membre ou changer le code.

Tout vient du serveur : chaque partie de l'onglet affiche « Chargement… » puis le résultat, ou « le serveur ne répond
pas » ; le reste du jeu n'attend jamais.
 */
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useClassement } from '../useClassement.ts'
import { dateDuMois } from '../domaine/calendrier.ts'
import { moisDuNumero } from '../domaine/regionDuJour.ts'
import {
  changerCode,
  classementLigue,
  creerLigue,
  lienInvitation,
  maLigue,
  quitterLigue,
  rejoindreLigue,
  retirerMembre,
  type ErreurLigue,
  type InfosLigue,
} from '../ligue.ts'
import { estProfil, useProfil, type Profil } from '../profil.ts'
import { useLangue, useTextes } from '../textes.ts'
import { Partager } from './Partager.tsx'
import { TableauClassement } from './TableauClassement.tsx'

export const BOUTON =
  'rounded bg-francle-fonce px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
export const BOUTON_DISCRET = 'text-sm underline hover:text-texte disabled:opacity-50'
export const CHAMP = 'w-full rounded border border-bord bg-fond px-2 py-1.5'

interface Props {
  // le numéro de la partie du jour : le mois en cours en découle
  aujourdhui: number
}

export function Classements({ aujourdhui }: Props) {
  const textes = useTextes()
  const [etat] = useProfil()
  if (!estProfil(etat)) {
    return <p className="text-sm">{textes.ligue.sansProfil}</p>
  }
  // key : un autre profil (après une suppression et une création) repart d'un onglet neuf
  return <MaLigue key={etat.id} profil={etat} aujourdhui={aujourdhui} />
}

function MaLigue({ profil, aujourdhui }: { profil: Profil; aujourdhui: number }) {
  const textes = useTextes()
  // 'chargement', les infos, null (pas de ligue) ou undefined (le serveur ne répond pas)
  const [ligue, setLigue] = useState<InfosLigue | null | undefined | 'chargement'>('chargement')

  useEffect(() => {
    // « annule » : l'onglet fermé avant la réponse, on ne touche plus à un composant disparu
    let annule = false
    void maLigue(profil).then((infos) => {
      if (!annule) {
        setLigue(infos)
      }
    })
    return () => {
      annule = true
    }
  }, [profil])

  if (ligue === 'chargement') {
    return <p className="text-sm text-discret">{textes.ligue.chargement}</p>
  }
  if (ligue === undefined) {
    return <p className="text-sm">{textes.ligue.injoignable}</p>
  }
  if (ligue === null) {
    return <SansLigue profil={profil} onLigue={setLigue} />
  }
  return <AvecLigue profil={profil} ligue={ligue} aujourdhui={aujourdhui} onLigue={setLigue} />
}

// un petit formulaire : un champ, un bouton, et le message d'erreur
function Formulaire(props: {
  libelle: string
  bouton: string
  maximum: number
  onEnvoyer: (saisie: string) => Promise<ErreurLigue | undefined>
}) {
  const textes = useTextes()
  const champ = useId()
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState<ErreurLigue>()
  const [patience, setPatience] = useState(false)
  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault()
    setPatience(true)
    setErreur(await props.onEnvoyer(saisie))
    setPatience(false)
  }
  return (
    <form onSubmit={(evenement) => void envoyer(evenement)} className="flex flex-col gap-1.5">
      <label htmlFor={champ} className="text-sm font-semibold">
        {props.libelle}
      </label>
      <div className="flex gap-2">
        <input
          id={champ}
          value={saisie}
          maxLength={props.maximum}
          autoComplete="off"
          onChange={(evenement) => setSaisie(evenement.target.value)}
          className={CHAMP}
        />
        <button type="submit" className={`${BOUTON} shrink-0`} disabled={patience || saisie.trim() === ''}>
          {props.bouton}
        </button>
      </div>
      {erreur !== undefined && (
        <p role="alert" className="text-sm text-danger">
          {textes.ligue.erreurs[erreur]}
        </p>
      )}
    </form>
  )
}

function SansLigue({ profil, onLigue }: { profil: Profil; onLigue: (ligue: InfosLigue) => void }) {
  const textes = useTextes()
  // une demande qui rend la ligue, ou une erreur à afficher
  const apres = async (resultat: InfosLigue | { erreur: ErreurLigue }) => {
    if ('erreur' in resultat) {
      return resultat.erreur
    }
    onLigue(resultat)
    return undefined
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{textes.ligue.sansLigue}</p>
      <Formulaire
        libelle={textes.ligue.nom}
        bouton={textes.ligue.creer}
        maximum={30}
        onEnvoyer={async (nom) => apres(await creerLigue(profil, nom))}
      />
      <Formulaire
        libelle={textes.ligue.code}
        bouton={textes.ligue.rejoindre}
        maximum={12}
        onEnvoyer={async (code) => apres(await rejoindreLigue(profil, code))}
      />
    </div>
  )
}

// le mois choisi, et des flèches pour changer de mois, comme le calendrier des statistiques
export function ChoixMois(props: { mois: number; premier: number; dernier: number; onChoisir: (mois: number) => void }) {
  const textes = useTextes()
  const langue = useLangue()
  const bouton = 'rounded px-3 py-1 text-lg hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        className={bouton}
        aria-label={textes.stats.moisPrecedent}
        onClick={() => props.onChoisir(props.mois - 1)}
        disabled={props.mois <= props.premier}
      >
        ‹
      </button>
      <h3 aria-live="polite" className="font-semibold first-letter:uppercase">
        {dateDuMois(props.mois).toLocaleDateString(langue, { month: 'long', year: 'numeric' })}
      </h3>
      <button
        type="button"
        className={bouton}
        aria-label={textes.stats.moisSuivant}
        onClick={() => props.onChoisir(props.mois + 1)}
        disabled={props.mois >= props.dernier}
      >
        ›
      </button>
    </div>
  )
}

function AvecLigue(props: {
  profil: Profil
  ligue: InfosLigue
  aujourdhui: number
  onLigue: (ligue: InfosLigue | null) => void
}) {
  const { profil, ligue, aujourdhui, onLigue } = props
  const textes = useTextes()
  const langue = useLangue()
  const dernier = moisDuNumero(aujourdhui)
  // le premier mois : celui de la première partie du jeu
  const premier = Math.min(moisDuNumero(1), dernier)
  const [mois, setMois] = useState(dernier)
  // la clé : le mois, et les membres (un départ ou un retrait change le classement)
  const membres = ligue.membres.map((membre) => membre.id).join(',')
  const classement = useClassement(() => classementLigue(profil, mois), `${mois}:${membres}`)
  const [confirmation, setConfirmation] = useState(false)
  const [erreur, setErreur] = useState(false)
  const nomDuMois = dateDuMois(mois).toLocaleDateString(langue, { month: 'long', year: 'numeric' })

  // une action du créateur, qui rend la ligue à jour
  async function agir(action: Promise<InfosLigue | { erreur: ErreurLigue }>) {
    const resultat = await action
    setErreur('erreur' in resultat)
    if (!('erreur' in resultat)) {
      onLigue(resultat)
    }
  }

  async function quitter() {
    const fait = await quitterLigue(profil)
    setErreur(!fait)
    if (fait) {
      onLigue(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-center text-lg font-semibold break-words">{ligue.nom}</h3>
      <ChoixMois mois={mois} premier={premier} dernier={dernier} onChoisir={setMois} />
      {classement === 'chargement' ? (
        <p className="text-sm text-discret">{textes.ligue.chargement}</p>
      ) : classement === undefined ? (
        <p className="text-sm">{textes.ligue.injoignable}</p>
      ) : (
        <TableauClassement lignes={classement.lignes} monId={profil.id} titre={textes.ligue.tableau(ligue.nom, nomDuMois)} />
      )}

      <section className="flex flex-col gap-2 border-t border-bord pt-3">
        <h3 className="font-semibold">{textes.ligue.inviter}</h3>
        <p className="font-mono tracking-wider select-all">{textes.ligue.codeLigue(ligue.code)}</p>
        <Partager
          texte={textes.ligue.invitationTexte(ligue.nom, lienInvitation(ligue.code))}
          libelle={textes.ligue.envoyerLien}
          copie={textes.ligue.lienCopie}
        />
      </section>

      <section className="flex flex-col gap-2 border-t border-bord pt-3">
        <h3 className="font-semibold">{textes.ligue.membres}</h3>
        <ul className="flex flex-col gap-1 text-sm">
          {ligue.membres.map((membre) => (
            <li key={membre.id} className="flex items-center justify-between gap-2">
              <span className="break-all">
                {membre.pseudo}
                {membre.createur && <span className="text-discret"> {textes.ligue.createur}</span>}
              </span>
              {ligue.createur && membre.id !== profil.id && (
                <button
                  type="button"
                  className={BOUTON_DISCRET}
                  onClick={() => void agir(retirerMembre(profil, membre.id))}
                >
                  {textes.ligue.retirer(membre.pseudo)}
                </button>
              )}
            </li>
          ))}
        </ul>
        {ligue.createur && (
          <div className="flex flex-col gap-1">
            <button type="button" className={`${BOUTON_DISCRET} self-start`} onClick={() => void agir(changerCode(profil))}>
              {textes.ligue.changerCode}
            </button>
            <p className="text-xs text-discret">{textes.ligue.changerCodeAide}</p>
          </div>
        )}
        {confirmation ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">{textes.ligue.confirmerQuitter(ligue.nom)}</p>
            <div className="flex gap-2">
              <button type="button" className={`${BOUTON} bg-danger`} onClick={() => void quitter()}>
                {textes.ligue.oui}
              </button>
              <button type="button" className={BOUTON} onClick={() => setConfirmation(false)}>
                {textes.ligue.non}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={`${BOUTON_DISCRET} self-start`} onClick={() => setConfirmation(true)}>
            {textes.ligue.quitter}
          </button>
        )}
        {erreur && (
          <p role="alert" className="text-sm text-danger">
            {textes.ligue.injoignable}
          </p>
        )}
      </section>
    </div>
  )
}
