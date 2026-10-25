/*
La partie libre : une région tirée au hasard, dans l'époque choisie, autant de fois qu'on veut. C'est de
l'entraînement : rien n'est sauvegardé, compté ni partagé. Le bonus des départements non plus : après une victoire,
il commence tout de suite, avec les départements de l'époque jouée, dans un ordre au hasard, et la fenêtre des
résultats s'ouvre à sa fin (comme pour la partie du jour) ; passé avant toute réponse, il reste à jouer jusqu'à la
partie suivante.
 */
import { useId, useState } from 'react'
import { usePause } from './pause.ts'
import { BoutonBonus } from './composants/BoutonBonus.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { JeuBonus } from './composants/JeuBonus.tsx'
import { Plateau } from './composants/Plateau.tsx'
import { avecDifficulte, avecListe, bonusAuHasard, bonusEnCours, commence, type Bonus } from './domaine/bonus.ts'
import { enCours, nouvellePartie, type Partie } from './domaine/partie.ts'
import type { ModesDifficiles } from './domaine/partage.ts'
import { tirer, type Mode } from './domaine/regions.ts'
import { modesReglages, uniteAffichee, type Reglages } from './reglages.ts'
import { useLangue, useTextes } from './textes.ts'
import { useSignalerListe, type Liste } from './liste.ts'

// une nouvelle partie libre : une région de l'époque et un angle de rotation, tous deux au hasard.
// numero compte les parties : il sert de clé au plateau (voir plus bas)
function tirage(mode: Mode, numero: number): { partie: Partie; angle: number; numero: number } {
  return { partie: nouvellePartie(tirer(mode), mode), angle: Math.floor(Math.random() * 360), numero }
}

interface Props {
  reglages: Reglages
  // augmente de 1 à chaque clic sur 📃 dans l'en-tête, et prévient App de la liste qu'il ouvre (voir PartieDuJour.tsx)
  demandeListe: number
  onListe?: (liste: Liste) => void
}

export function PartieLibre({ reglages, demandeListe, onListe }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  const [mode, setMode] = useState<Mode>('nouvelles')
  const [{ partie, angle, numero }, setTirage] = useState(() => tirage('nouvelles', 1))
  // les modes difficiles, fixés au premier essai comme pour la partie du jour
  const [modesFixes, setModesFixes] = useState<ModesDifficiles | undefined>(undefined)
  const modes = modesFixes ?? modesReglages(reglages)
  const [fenetre, setFenetre] = useState(false)
  // l'époque choisie pendant une partie commencée, en attente de confirmation (undefined : rien à confirmer)
  const [epoqueDemandee, setEpoqueDemandee] = useState<Mode | undefined>(undefined)
  const nomGroupe = useId()
  // le bonus des départements, le focus sur son titre quand le joueur vient de le lancer, et la pause avant les
  // résultats (voir PartieDuJour.tsx)
  const [bonusGarde, setBonus] = useState<Bonus | undefined>(undefined)
  // dans la version des réglages tant qu'il n'a pas commencé, fixée à sa première réponse (voir PartieDuJour.tsx)
  const bonus = bonusGarde && avecDifficulte(bonusGarde, reglages.departementsDifficiles)
  const [focusBonus, setFocusBonus] = useState(false)
  const pause = usePause(() => setFenetre(true))
  const listeAuBonus = bonus !== undefined && avecListe(bonus)
  useSignalerListe(listeAuBonus, onListe)

  // une victoire lance le bonus ; une défaite (ou un abandon) ouvre les résultats
  function changer(suite: Partie) {
    setTirage({ partie: suite, angle, numero })
    setModesFixes(modes)
    if (suite.etat === 'gagnee') {
      lancerBonus(suite)
    } else if (!enCours(suite)) {
      setFenetre(true)
    }
  }

  function lancerBonus(gagnee: Partie) {
    setBonus(bonusAuHasard(gagnee.cible))
    setFocusBonus(true)
  }

  // passé avant toute réponse, le bonus n'a pas commencé : on revient à la silhouette, il reste à jouer. Dans tous
  // les cas où il n'y a plus rien à jouer, les résultats s'ouvrent, après une pause pour la dernière réponse
  function changerBonus(suite: Bonus) {
    setBonus(commence(suite) ? suite : undefined)
    if (suite.etat === 'termine') {
      pause.lancer()
    } else if (!commence(suite) || suite.etat === 'passe') {
      setFenetre(true)
    }
  }

  // une nouvelle partie, dans l'époque donnée : les modes ne sont plus fixés, la fenêtre se ferme
  function recommencer(nouveauMode: Mode) {
    setEpoqueDemandee(undefined)
    setMode(nouveauMode)
    setTirage(tirage(nouveauMode, numero + 1))
    setModesFixes(undefined)
    setFenetre(false)
    setBonus(undefined)
    // une pause en cours ouvrirait les résultats de la partie d'avant
    pause.annuler()
  }

  // changer d'époque perd la partie en cours : on demande confirmation dès qu'un essai a été joué. Le bouton radio,
  // « contrôlé » par React (checked={mode === choix}), reste alors sur l'ancienne époque tant qu'on n'a pas dit oui
  function choisirEpoque(choix: Mode) {
    if (enCours(partie) && partie.essais.length > 0) {
      setEpoqueDemandee(choix)
    } else {
      recommencer(choix)
    }
  }

  return (
    <>
      {/* fieldset + legend : un groupe de choix avec son titre, que les lecteurs d'écran annoncent ensemble.
          Changer d'époque commence une nouvelle partie (après confirmation si la partie est commencée) */}
      <fieldset className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        <legend className="sr-only">{textes.epoque}</legend>
        {(['nouvelles', 'anciennes'] as const).map((choix) => (
          <label key={choix} className="flex items-center gap-1">
            <input
              type="radio"
              name={nomGroupe}
              checked={mode === choix}
              onChange={() => choisirEpoque(choix)}
              className="accent-francle-fonce"
            />
            {textes.epoques[choix]}
          </label>
        ))}
      </fieldset>
      {/* aria-live : un lecteur d'écran lit la question dès qu'elle apparaît */}
      <div aria-live="polite">
        {epoqueDemandee !== undefined && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {/* basis-full : la question sur sa propre ligne, les deux boutons ensemble en dessous */}
            <span className="basis-full text-center">{textes.confirmerEpoque}</span>
            <button
              type="button"
              onClick={() => recommencer(epoqueDemandee)}
              className="rounded bg-danger px-3 py-1 text-white"
            >
              {textes.oui}
            </button>
            <button type="button" onClick={() => setEpoqueDemandee(undefined)} className="rounded border px-3 py-1">
              {textes.non}
            </button>
          </div>
        )}
      </div>

      <Plateau
        // key : une nouvelle partie remet le plateau à zéro (message, confirmation d'abandon)
        key={numero}
        partie={partie}
        onChanger={changer}
        modes={modes}
        angle={angle}
        unite={uniteAffichee(reglages)}
        demandeListe={demandeListe}
        bonus={
          bonus && (
            <JeuBonus bonus={bonus} onChanger={changerBonus} focaliser={focusBonus} demandeListe={demandeListe} />
          )
        }
        listeAuBonus={listeAuBonus}
        fin={
          <div className="flex flex-col items-center gap-2">
            <p className="font-semibold">
              {textes.fin(partie, true)} {textes.reponse} {partie.cible.nom[langue]}
            </p>
            {/* caché pendant le bonus : un clic le perdrait sans prévenir. « Passer » sert à en sortir */}
            {(bonus === undefined || !bonusEnCours(bonus)) && (
              <button
                type="button"
                onClick={() => recommencer(mode)}
                className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
              >
                {textes.nouvellePartie}
              </button>
            )}
            {partie.etat === 'gagnee' && bonus === undefined && (
              <BoutonBonus onJouer={() => lancerBonus(partie)} />
            )}
          </div>
        }
      />

      <Fenetre ouverte={fenetre} onFermer={() => setFenetre(false)} titre={textes.resultats}>
        {!enCours(partie) && (
          <FinDePartie partie={partie} message={textes.fin(partie, true)} bonus={bonus}>
            <button
              type="button"
              onClick={() => recommencer(mode)}
              className="rounded bg-francle-fonce px-6 py-2 font-semibold text-white hover:opacity-90"
            >
              {textes.nouvellePartie}
            </button>
          </FinDePartie>
        )}
      </Fenetre>
    </>
  )
}
