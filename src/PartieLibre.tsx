/*
La partie libre : une région tirée au hasard, dans l'époque choisie, autant de fois qu'on veut. C'est de
l'entraînement : rien n'est sauvegardé, compté ni partagé. Le bonus des départements non plus : après une victoire,
il commence à la fermeture de la fenêtre des résultats, avec les départements de l'époque jouée, dans un ordre au
hasard ; passé avant toute réponse, il reste à jouer jusqu'à la partie suivante.
 */
import { useId, useState } from 'react'
import { BoutonBonus } from './composants/BoutonBonus.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { JeuBonus } from './composants/JeuBonus.tsx'
import { Plateau } from './composants/Plateau.tsx'
import { bonusAuHasard, commence, type Bonus } from './domaine/bonus.ts'
import { enCours, nouvellePartie, type Partie } from './domaine/partie.ts'
import type { ModesDifficiles } from './domaine/partage.ts'
import { tirer, type Mode } from './domaine/regions.ts'
import { modesReglages, uniteAffichee, type Reglages } from './reglages.ts'
import { useLangue, useTextes } from './textes.ts'

// une nouvelle partie libre : une région de l'époque et un angle de rotation, tous deux au hasard.
// numero compte les parties : il sert de clé au plateau (voir plus bas)
function tirage(mode: Mode, numero: number): { partie: Partie; angle: number; numero: number } {
  return { partie: nouvellePartie(tirer(mode), mode), angle: Math.floor(Math.random() * 360), numero }
}

// demandeListe : augmente de 1 à chaque clic sur 📃 dans l'en-tête (voir PartieDuJour.tsx)
export function PartieLibre({ reglages, demandeListe }: { reglages: Reglages; demandeListe: number }) {
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
  // le bonus des départements, et s'il doit commencer à la fermeture de la fenêtre (voir PartieDuJour.tsx)
  const [bonus, setBonus] = useState<Bonus | undefined>(undefined)
  const [bonusAVenir, setBonusAVenir] = useState(false)

  function changer(suite: Partie) {
    setTirage({ partie: suite, angle, numero })
    setModesFixes(modes)
    if (!enCours(suite)) {
      setFenetre(true)
    }
    if (suite.etat === 'gagnee') {
      setBonusAVenir(true)
    }
  }

  function fermerFenetre() {
    setFenetre(false)
    if (bonusAVenir) {
      setBonusAVenir(false)
      setBonus(bonusAuHasard(partie.cible))
    }
  }

  // passé avant toute réponse, le bonus n'a pas commencé : on revient à la silhouette, il reste à jouer
  function changerBonus(suite: Bonus) {
    setBonus(commence(suite) ? suite : undefined)
  }

  // une nouvelle partie, dans l'époque donnée : les modes ne sont plus fixés, la fenêtre se ferme
  function recommencer(nouveauMode: Mode) {
    setEpoqueDemandee(undefined)
    setMode(nouveauMode)
    setTirage(tirage(nouveauMode, numero + 1))
    setModesFixes(undefined)
    setFenetre(false)
    setBonus(undefined)
    setBonusAVenir(false)
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
        bonus={bonus && <JeuBonus bonus={bonus} onChanger={changerBonus} />}
        fin={
          <div className="flex flex-col items-center gap-2">
            <p className="font-semibold">
              {textes.fin(partie, true)} {textes.reponse} {partie.cible.nom[langue]}
            </p>
            <button
              type="button"
              onClick={() => recommencer(mode)}
              className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              {textes.nouvellePartie}
            </button>
            {partie.etat === 'gagnee' && bonus === undefined && (
              <BoutonBonus onJouer={() => setBonus(bonusAuHasard(partie.cible))} />
            )}
          </div>
        }
      />

      <Fenetre ouverte={fenetre} onFermer={fermerFenetre} titre={textes.resultats}>
        {!enCours(partie) && (
          <FinDePartie partie={partie} message={textes.fin(partie, true)}>
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
