/*
Le bonus des départements, à la place de la silhouette : la question, la carte, la réponse précédente (juste ou
fausse), le bouton « Passer », puis le score une fois fini.

Comme le plateau pour la partie, ce composant ne garde pas le bonus : il le reçoit, et demande à son parent de le
remplacer (onChanger). Le parent sait quoi en faire : le sauvegarder (partie du jour) ou non (partie libre).

Pas de minuterie entre deux questions, contrairement au Java : la question suivante arrive tout de suite, et la
réponse reste visible (en couleur sur la carte, et en toutes lettres sous la carte). Un joueur lent ne perd rien, et
un lecteur d'écran lit la réponse puis la nouvelle question.

En mode C (celui des joueurs), le joueur choisit un département sur la carte, puis écrit son nom dans la saisie, qui
reste grisée tant qu'aucun département n'est choisi. Le département choisi est un état d'affichage, gardé ici, et non
dans le bonus : il ne compte pour rien tant que le joueur n'a pas répondu.
 */
import { useEffect, useId, useRef, useState } from 'react'
import {
  bonusEnCours,
  demande,
  juste,
  passer,
  rang,
  repondre,
  repondreChoix,
  repondreSaisie,
  restants,
  total,
  type Bonus,
} from '../domaine/bonus.ts'
import {
  chercherDepartement,
  DEPARTEMENTS,
  departementsDe,
  suggestionsDepartements,
  type Departement,
} from '../domaine/departements.ts'
import { finDuBonus, useLangue, useTextes } from '../textes.ts'
import { CarteDepartements } from './CarteDepartements.tsx'
import { Saisie } from './Saisie.tsx'

interface Props {
  bonus: Bonus
  onChanger: (suite: Bonus) => void
  // vrai quand le joueur vient de lancer le bonus (victoire ou bouton) : le focus du clavier va sur le titre. Ce qu'il
  // venait d'utiliser (la saisie de la région, le bouton) a disparu, et sans cela le focus retomberait sur la page
  focaliser?: boolean
}

export function JeuBonus({ bonus, onChanger, focaliser = false }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  const idTitre = useId()
  const titre = useRef<HTMLHeadingElement>(null)
  const section = useRef<HTMLElement>(null)
  // la question du numéro (outre-mer) attend une réponse écrite tout de suite : le focus va alors dans la saisie
  // (par demandeFocus, plus bas), sinon sur le titre
  const numeroDabord = bonus.question === 'numero'
  // à l'apparition du bonus seulement : ensuite, le joueur va où il veut
  useEffect(() => {
    if (focaliser && !numeroDabord) {
      titre.current?.focus()
    }
  }, [focaliser, numeroDabord])
  // le message d'une saisie refusée (modes B et C), vide s'il n'y a rien à dire
  const [message, setMessage] = useState('')
  const enCours = bonusEnCours(bonus)
  // mode C : le département cliqué sur la carte. Seulement s'il attend encore sa réponse : un autre onglet a pu y
  // répondre entre-temps
  const [choix, setChoix] = useState<Departement | undefined>(undefined)
  const choisi = choix !== undefined && enCours && restants(bonus).includes(choix) ? choix : undefined
  // augmente à chaque choix : la saisie prend alors le focus, prête pour le nom. 1 d'emblée pour la question du
  // numéro, quand le joueur vient de lancer le bonus
  const [demandeFocus, setDemandeFocus] = useState(() => (focaliser && numeroDabord ? 1 : 0))
  const modeChoix = bonus.question === 'choix'
  const nom = (departement: Departement) => textes.bonus.departement(departement.nom, departement.code)

  // ce qui s'est passé à la dernière réponse : déduit du bonus lui-même, rien à garder à part
  const derniere = bonus.tentatives.at(-1)
  const retour =
    derniere === undefined
      ? ''
      : juste(derniere)
        ? textes.bonus.juste(nom(derniere.demande))
        : textes.bonus.faux(nom(derniere.demande), nom(derniere.donne))

  function repondreClic(departement: Departement) {
    setMessage('')
    onChanger(repondre(bonus, departement))
  }

  // mode C : un département choisi sur la carte (un autre clic change d'avis)
  function choisir(departement: Departement) {
    setChoix(departement)
    setMessage('')
    setDemandeFocus((avant) => avant + 1)
    // sur un écran tactile, le clavier va s'ouvrir et cacher le bas de la page : on fait d'abord défiler la page
    // pour mettre le haut du bonus en haut de l'écran. Pas à la souris, où la page ne bougerait que pour rien.
    // « ?. » : jsdom, le faux navigateur des tests, n'a ni matchMedia ni scrollIntoView
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      section.current?.scrollIntoView?.({ block: 'start' })
    }
  }

  // les départements que la saisie évoque : parmi les 101 en mode C (limitées à la région, les suggestions
  // donneraient la réponse), parmi ceux de la région en mode B, aucun pour la question du numéro
  const suggerer = (texte: string) =>
    bonus.question === 'numero'
      ? []
      : suggestionsDepartements(texte, modeChoix ? DEPARTEMENTS : departementsDe(bonus.region), langue)

  // mode C, la réponse écrite pour le département choisi. Comme pour les régions : un début de nom qui n'évoque qu'un
  // département le joue, plusieurs demandent de choisir, rien ne coûte de réponse ; un département déjà trouvé est
  // refusé, lui aussi sans rien coûter
  function repondreChoixTexte(choisi: Departement, saisie: string): boolean {
    const liste = suggerer(saisie)
    const donne = chercherDepartement(saisie) ?? (liste.length === 1 ? liste[0] : undefined)
    if (donne === undefined) {
      setMessage(liste.length > 1 ? textes.bonus.plusieurs : textes.bonus.inconnu)
      return false
    }
    const suite = repondreChoix(bonus, choisi, donne)
    if (suite === 'deja-trouve') {
      setMessage(textes.bonus.dejaTrouve(nom(donne)))
      return false
    }
    setMessage('')
    setChoix(undefined)
    onChanger(suite)
    return true
  }

  // la réponse écrite (mode B, ou le numéro en outre-mer) ; une saisie inconnue ne coûte rien. Comme pour les
  // régions, un début de nom qui n'évoque qu'un département le joue (« fin » -> Finistère), et s'il en évoque
  // plusieurs, on demande de choisir
  function repondreTexte(saisie: string): boolean {
    if (modeChoix) {
      // la saisie est grisée tant que rien n'est choisi : ce cas n'arrive pas
      return choisi === undefined ? false : repondreChoixTexte(choisi, saisie)
    }
    const liste = suggerer(saisie)
    const suite = repondreSaisie(bonus, saisie) ?? (liste.length === 1 ? repondre(bonus, liste[0]) : undefined)
    if (suite === undefined) {
      setMessage(
        bonus.question === 'numero'
          ? textes.bonus.pasUnNumero
          : liste.length > 1
            ? textes.bonus.plusieurs
            : textes.bonus.inconnu,
      )
      return false
    }
    setMessage('')
    onChanger(suite)
    return true
  }

  function question(): string {
    // mode C : pas de question imposée, le joueur choisit un département, puis le nomme
    if (modeChoix) {
      return choisi === undefined ? textes.bonus.choisir : textes.bonus.choix
    }
    const departement = demande(bonus)
    switch (bonus.question) {
      case 'carte':
        return textes.bonus.carte(departement.nom)
      case 'nom':
        return textes.bonus.nom
      case 'numero':
        return textes.bonus.numero(departement.nom, departement.code)
    }
  }

  return (
    <section ref={section} aria-labelledby={idTitre} className="flex flex-col gap-2 text-center">
      {/* tabIndex -1 : le titre peut recevoir le focus par le code, sans devenir une étape de Tab */}
      <h2 id={idTitre} ref={titre} tabIndex={-1} className="text-lg font-bold focus:outline-none">
        {textes.bonus.titre}
      </h2>
      {enCours && (
        // aria-live : un lecteur d'écran lit chaque nouvelle question
        <div aria-live="polite">
          <p className="text-sm text-discret">
            {modeChoix
              ? textes.bonus.reponses(bonus.tentatives.length, total(bonus))
              : textes.bonus.avancement(rang(bonus), total(bonus))}
          </p>
          <p className="font-semibold">{question()}</p>
        </div>
      )}

      <CarteDepartements bonus={bonus} onRepondre={repondreClic} choisi={choisi} onChoisir={choisir} />

      {enCours && bonus.question !== 'carte' && (
        <Saisie
          suggerer={(texte) =>
            // « Finistère (29) » dans la liste, pour apprendre les numéros en passant ; le nom seul est proposé
            suggerer(texte).map((departement) => ({ cle: departement.code, nom: departement.nom, libelle: nom(departement) }))
          }
          onProposer={repondreTexte}
          etiquette={textes.bonus.saisie}
          exemple={
            bonus.question === 'numero'
              ? textes.bonus.saisieNumero
              : modeChoix && choisi === undefined
                ? textes.bonus.cliqueDabord
                : textes.bonus.saisieExemple
          }
          bouton={textes.bonus.repondre}
          desactive={modeChoix && choisi === undefined}
          demandeFocus={demandeFocus}
        />
      )}

      <p aria-live="polite" className={`min-h-5 text-sm ${message === '' ? '' : 'text-erreur'}`}>
        {message === '' ? retour : message}
      </p>

      {enCours ? (
        <button
          type="button"
          onClick={() => onChanger(passer(bonus))}
          className="self-center text-sm text-discret underline hover:text-texte"
        >
          {textes.bonus.passer}
        </button>
      ) : (
        <p className="font-semibold">
          {finDuBonus(bonus, textes)}
        </p>
      )}
    </section>
  )
}
