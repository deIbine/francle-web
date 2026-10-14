/*
La partie libre : une région tirée au hasard, dans l'époque choisie, autant de fois qu'on veut. C'est de
l'entraînement : rien n'est sauvegardé, compté ni partagé.
 */
import { useId, useState } from 'react'
import { Fenetre } from './composants/Fenetre.tsx'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { Plateau } from './composants/Plateau.tsx'
import { enCours, nouvellePartie, type Partie } from './domaine/partie.ts'
import type { ModesDifficiles } from './domaine/partage.ts'
import { tirer, type Mode } from './domaine/regions.ts'
import { modesReglages, uniteAffichee, type Reglages } from './reglages.ts'
import { textes } from './textes.ts'

// une nouvelle partie libre : une région de l'époque et un angle de rotation, tous deux au hasard.
// numero compte les parties : il sert de clé au plateau (voir plus bas)
function tirage(mode: Mode, numero: number): { partie: Partie; angle: number; numero: number } {
  return { partie: nouvellePartie(tirer(mode), mode), angle: Math.floor(Math.random() * 360), numero }
}

export function PartieLibre({ reglages }: { reglages: Reglages }) {
  const [mode, setMode] = useState<Mode>('nouvelles')
  const [{ partie, angle, numero }, setTirage] = useState(() => tirage('nouvelles', 1))
  // les modes difficiles, fixés au premier essai comme pour la partie du jour
  const [modesFixes, setModesFixes] = useState<ModesDifficiles | undefined>(undefined)
  const modes = modesFixes ?? modesReglages(reglages)
  const [fenetre, setFenetre] = useState(false)
  const nomGroupe = useId()

  function changer(suite: Partie) {
    setTirage({ partie: suite, angle, numero })
    setModesFixes(modes)
    if (!enCours(suite)) {
      setFenetre(true)
    }
  }

  // une nouvelle partie, dans l'époque donnée : les modes ne sont plus fixés, la fenêtre se ferme
  function recommencer(nouveauMode: Mode) {
    setMode(nouveauMode)
    setTirage(tirage(nouveauMode, numero + 1))
    setModesFixes(undefined)
    setFenetre(false)
  }

  return (
    <>
      {/* fieldset + legend : un groupe de choix avec son titre, que les lecteurs d'écran annoncent ensemble.
          Changer d'époque commence une nouvelle partie */}
      <fieldset className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        <legend className="sr-only">{textes.epoque}</legend>
        {(['nouvelles', 'anciennes'] as const).map((choix) => (
          <label key={choix} className="flex items-center gap-1">
            <input
              type="radio"
              name={nomGroupe}
              checked={mode === choix}
              onChange={() => recommencer(choix)}
              className="accent-francle-fonce"
            />
            {textes.epoques[choix]}
          </label>
        ))}
      </fieldset>

      <Plateau
        // key : une nouvelle partie remet le plateau à zéro (message, confirmation d'abandon)
        key={numero}
        partie={partie}
        onChanger={changer}
        modes={modes}
        angle={angle}
        unite={uniteAffichee(reglages)}
        fin={
          <div className="flex flex-col items-center gap-2">
            <p className="font-semibold">
              {textes.fin(partie, true)} {textes.reponse} {partie.cible.nom.fr}
            </p>
            <button
              type="button"
              onClick={() => recommencer(mode)}
              className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              {textes.nouvellePartie}
            </button>
          </div>
        }
      />

      <Fenetre ouverte={fenetre} onFermer={() => setFenetre(false)} titre={textes.resultats}>
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
