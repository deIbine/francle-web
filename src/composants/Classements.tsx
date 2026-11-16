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
  classementPublic,
  creerLigue,
  lienInvitation,
  maLigue,
  quitterLigue,
  rejoindreLigue,
  retirerMembre,
  signaler,
  type ErreurLigue,
  type InfosLigue,
  type Membre,
} from '../ligue.ts'
import { estProfil, useProfil, type Profil } from '../profil.ts'
import { ouvrirProfil } from '../reglages.ts'
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

// depuis web.9.3.3, deux vues : « Ma ligue » et « Public ». Deux boutons dont l'un est enfoncé (aria-pressed) : un
// lecteur d'écran dit lequel est choisi
export function Classements({ aujourdhui }: Props) {
  const textes = useTextes()
  const [etat] = useProfil()
  const profil = estProfil(etat) ? etat : undefined
  const [vue, setVue] = useState<'ligue' | 'public'>('ligue')
  const bouton = (nom: 'ligue' | 'public', libelle: string) => (
    <button
      type="button"
      aria-pressed={vue === nom}
      onClick={() => setVue(nom)}
      className="flex-1 rounded-md px-3 py-1 text-sm text-discret aria-pressed:bg-francle-fonce aria-pressed:font-semibold aria-pressed:text-white"
    >
      {libelle}
    </button>
  )
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={textes.public.vues} className="flex rounded-lg bg-surface p-0.5">
        {bouton('ligue', textes.public.maLigue)}
        {bouton('public', textes.public.public)}
      </div>
      {vue === 'public' ? (
        <ClassementPublic profil={profil} aujourdhui={aujourdhui} />
      ) : profil === undefined ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">{textes.ligue.sansProfil}</p>
          <BoutonCreerProfil />
        </div>
      ) : (
        // key : un autre profil (après une suppression et une création) repart d'une vue neuve
        <MaLigue key={profil.id} profil={profil} aujourdhui={aujourdhui} />
      )}
    </div>
  )
}

// « Créer mon profil » (depuis web.9.4.3) : ferme les statistiques et ouvre les réglages sur le bloc du profil. Avant, un
// texte renvoyait aux « réglages (⚙️) », alors que le bouton des réglages montre des curseurs, pas un engrenage
function BoutonCreerProfil() {
  const textes = useTextes()
  return (
    <button type="button" className={BOUTON} onClick={ouvrirProfil}>
      {textes.ligue.creerProfil}
    </button>
  )
}

// une action à confirmer sur place (depuis web.9.4.3 pour retirer un membre, changer le code et signaler ; avant, pour
// quitter la ligue seulement) : la question, « Oui, … » et « Non ». Dans la fenêtre même, plutôt qu'une seconde
// fenêtre par-dessus (deux fenêtres l'une sur l'autre se ferment dans le désordre, voir web.7.18)
function Confirmer(props: { question: string; oui: string; non: string; onOui: () => void; onNon: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">{props.question}</p>
      <div className="flex gap-2">
        <button type="button" className={`${BOUTON} bg-danger`} onClick={props.onOui}>
          {props.oui}
        </button>
        <button type="button" className={BOUTON} onClick={props.onNon}>
          {props.non}
        </button>
      </div>
    </div>
  )
}

// les mois qu'on peut consulter : de celui de la première partie du jeu à celui d'aujourd'hui
function moisPossibles(aujourdhui: number): [number, number] {
  const dernier = moisDuNumero(aujourdhui)
  return [Math.min(moisDuNumero(1), dernier), dernier]
}

// le classement public du mois (web.9.3.3), lisible sans profil. Avec un profil, la ligne du joueur (même au-delà des
// 100 premiers) et un bouton « Signaler » à côté des autres pseudos
function ClassementPublic({ profil, aujourdhui }: { profil: Profil | undefined; aujourdhui: number }) {
  const textes = useTextes()
  const langue = useLangue()
  const [premier, dernier] = moisPossibles(aujourdhui)
  const [mois, setMois] = useState(dernier)
  const classement = useClassement(() => classementPublic(profil, mois), `${mois}:${profil?.id ?? ''}`)
  const [signales, setSignales] = useState<ReadonlySet<string>>(new Set())
  // le joueur dont le signalement attend sa confirmation (depuis web.9.4.3 : avant, ⚑ signalait en un toucher)
  const [aSignaler, setASignaler] = useState<string>()
  const nomDuMois = dateDuMois(mois).toLocaleDateString(langue, { month: 'long', year: 'numeric' })

  async function signalerPseudo(id: string) {
    setASignaler(undefined)
    if (profil !== undefined && (await signaler(profil, id))) {
      setSignales((avant) => new Set([...avant, id]))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-discret">{textes.public.aide}</p>
      <ChoixMois mois={mois} premier={premier} dernier={dernier} onChoisir={setMois} />
      {/* depuis web.9.4.2 : sans profil, le joueur qui vient de jouer ne s'y trouve pas ; on lui dit pourquoi */}
      {profil === undefined && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">{textes.public.horsClassement}</p>
          <BoutonCreerProfil />
        </div>
      )}
      {classement === 'chargement' ? (
        <p className="text-sm text-discret">{textes.ligue.chargement}</p>
      ) : classement === undefined ? (
        <p className="text-sm">{textes.ligue.injoignable}</p>
      ) : classement.lignes.length === 0 ? (
        <p className="text-sm">{textes.public.personne}</p>
      ) : (
        <>
          <p className="text-sm text-discret">{textes.public.joueurs(classement.joueurs ?? classement.lignes.length)}</p>
          <TableauClassement
            lignes={classement.lignes}
            moi={classement.moi}
            monId={profil?.id ?? ''}
            titre={textes.public.tableau(nomDuMois)}
            enPlus={
              profil === undefined
                ? undefined
                : (ligne) =>
                    ligne.id !== profil.id &&
                    (signales.has(ligne.id) ? (
                      <span className="text-xs text-discret">{textes.public.signale}</span>
                    ) : (
                      <button
                        type="button"
                        aria-label={textes.public.signaler(ligne.pseudo)}
                        title={textes.public.signaler(ligne.pseudo)}
                        aria-expanded={aSignaler === ligne.id}
                        onClick={() => setASignaler(aSignaler === ligne.id ? undefined : ligne.id)}
                        className="rounded px-1 text-discret hover:bg-surface hover:text-texte"
                      >
                        ⚑
                      </button>
                    ))
            }
            sousLigne={(ligne) =>
              aSignaler === ligne.id && (
                <Confirmer
                  question={textes.public.confirmerSignaler(ligne.pseudo)}
                  oui={textes.public.ouiSignaler}
                  non={textes.public.non}
                  onOui={() => void signalerPseudo(ligne.id)}
                  onNon={() => setASignaler(undefined)}
                />
              )
            }
          />
        </>
      )}
    </div>
  )
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
  const [premier, dernier] = moisPossibles(aujourdhui)
  const [mois, setMois] = useState(dernier)
  // la clé : le mois, et les membres (un départ ou un retrait change le classement)
  const membres = ligue.membres.map((membre) => membre.id).join(',')
  const classement = useClassement(() => classementLigue(profil, mois), `${mois}:${membres}`)
  // l'action qui attend sa confirmation, s'il y en a une (depuis web.9.4.3 : retirer et changer le code aussi)
  const [aConfirmer, setAConfirmer] = useState<'quitter' | 'code' | Membre>()
  const [erreur, setErreur] = useState(false)
  const nomDuMois = dateDuMois(mois).toLocaleDateString(langue, { month: 'long', year: 'numeric' })

  // une action du créateur, qui rend la ligue à jour
  async function agir(action: Promise<InfosLigue | { erreur: ErreurLigue }>) {
    setAConfirmer(undefined)
    const resultat = await action
    setErreur('erreur' in resultat)
    if (!('erreur' in resultat)) {
      onLigue(resultat)
    }
  }

  async function quitter() {
    setAConfirmer(undefined)
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
            <li key={membre.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="break-all">
                  {membre.pseudo}
                  {membre.createur && <span className="text-discret"> {textes.ligue.createur}</span>}
                </span>
                {ligue.createur && membre.id !== profil.id && (
                  <button
                    type="button"
                    className={BOUTON_DISCRET}
                    aria-expanded={aConfirmer === membre}
                    onClick={() => setAConfirmer(aConfirmer === membre ? undefined : membre)}
                  >
                    {textes.ligue.retirer(membre.pseudo)}
                  </button>
                )}
              </div>
              {aConfirmer === membre && (
                <Confirmer
                  question={textes.ligue.confirmerRetirer(membre.pseudo)}
                  oui={textes.ligue.ouiRetirer}
                  non={textes.ligue.non}
                  onOui={() => void agir(retirerMembre(profil, membre.id))}
                  onNon={() => setAConfirmer(undefined)}
                />
              )}
            </li>
          ))}
        </ul>
        {ligue.createur &&
          (aConfirmer === 'code' ? (
            <Confirmer
              question={textes.ligue.confirmerCode}
              oui={textes.ligue.ouiCode}
              non={textes.ligue.non}
              onOui={() => void agir(changerCode(profil))}
              onNon={() => setAConfirmer(undefined)}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <button type="button" className={`${BOUTON_DISCRET} self-start`} onClick={() => setAConfirmer('code')}>
                {textes.ligue.changerCode}
              </button>
              <p className="text-xs text-discret">{textes.ligue.changerCodeAide}</p>
            </div>
          ))}
        {aConfirmer === 'quitter' ? (
          <Confirmer
            question={textes.ligue.confirmerQuitter(ligue.nom)}
            oui={textes.ligue.oui}
            non={textes.ligue.non}
            onOui={() => void quitter()}
            onNon={() => setAConfirmer(undefined)}
          />
        ) : (
          <button type="button" className={`${BOUTON_DISCRET} self-start`} onClick={() => setAConfirmer('quitter')}>
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
