/*
La partie du jour : la même région pour tout le monde, sauvegardée, comptée dans les statistiques et partageable.

Le plateau (silhouette, saisie, tableau, indices) est commun avec la partie libre (composants/Plateau.tsx). Ce
composant ajoute ce qui est propre au jour : la sauvegarde après chaque changement (sauvegarde.ts), et la fenêtre
des résultats et des statistiques.
 */
import { useState } from 'react'
import { CompteARebours } from './composants/CompteARebours.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { Partager } from './composants/Partager.tsx'
import { Plateau } from './composants/Plateau.tsx'
import { Statistiques } from './composants/Statistiques.tsx'
import { enCours, nouvellePartie, type Partie } from './domaine/partie.ts'
import { textePartage, type ModesDifficiles } from './domaine/partage.ts'
import { angleDuJour, MODE_DU_JOUR, numero as numeroDuJour, regionDuJour } from './domaine/regionDuJour.ts'
import { statistiques } from './domaine/statistiques.ts'
import { minuitSuivant } from './domaine/temps.ts'
import { modesReglages, uniteAffichee, type Reglages } from './reglages.ts'
import { enregistrer, lire, modesSauves, restaurer, resultats } from './sauvegarde.ts'
import { textes } from './textes.ts'

interface Props {
  // le jour de la partie
  jour: Date
  // appelé à minuit, quand une nouvelle région est disponible
  onJourSuivant: () => void
  reglages: Reglages
  // augmente de 1 à chaque clic sur 📊 (dans l'en-tête, qui appartient à App) : la fenêtre s'ouvre alors
  demandeStats: number
}

export function PartieDuJour({ jour, onJourSuivant, reglages, demandeStats }: Props) {
  const numero = numeroDuJour(jour)
  // toutes les parties sauvées, lues une fois à l'ouverture, puis tenues à jour à chaque changement
  const [parties, setParties] = useState(() => lire())
  const sauvee = parties.get(numero)
  // la partie du jour : celle qu'on avait commencée (rejouée depuis la sauvegarde), sinon une nouvelle
  const [partie, setPartie] = useState(() => {
    const cible = regionDuJour(jour)
    return sauvee === undefined ? nouvellePartie(cible, MODE_DU_JOUR) : restaurer(sauvee, cible, MODE_DU_JOUR)
  })
  // les modes difficiles, fixés au premier essai. Avant, la partie suit les réglages du moment
  const [modesFixes, setModesFixes] = useState<ModesDifficiles | undefined>(() =>
    sauvee !== undefined && (sauvee.regions.length > 0 || sauvee.etat !== 'en-cours') ? modesSauves(sauvee) : undefined,
  )
  const modes = modesFixes ?? modesReglages(reglages)
  // la fenêtre des résultats : ouverte d'emblée si on revient sur une partie déjà finie
  const [fenetre, setFenetre] = useState(() => !enCours(partie))

  // 📊 a été cliqué : on ouvre la fenêtre. On compare à la dernière demande vue PENDANT l'affichage, plutôt que
  // dans un useEffect : React le recommande pour « ajuster un état quand une prop change », sans affichage de trop
  const [demandeVue, setDemandeVue] = useState(demandeStats)
  if (demandeVue !== demandeStats) {
    setDemandeVue(demandeStats)
    setFenetre(true)
  }

  // la seule façon de changer la partie : on la remplace, on fixe ses modes, on la sauvegarde, et on ouvre les
  // résultats si elle vient de se terminer. Sauvegarder ici, et non après coup, garantit que les statistiques
  // affichées dans la fenêtre comptent déjà cette partie
  function changer(suite: Partie) {
    setPartie(suite)
    setModesFixes(modes)
    enregistrer(numero, suite, modes)
    setParties(lire())
    if (!enCours(suite)) {
      setFenetre(true)
    }
  }

  const stats = statistiques(resultats(parties), numero)

  return (
    <>
      <Plateau
        partie={partie}
        onChanger={changer}
        modes={modes}
        angle={angleDuJour(jour)}
        unite={uniteAffichee(reglages)}
        fin={
          <div className="flex flex-col items-center gap-2">
            <p className="font-semibold">
              {textes.fin(partie)} {textes.reponse} {partie.cible.nom.fr}
            </p>
            <button
              type="button"
              onClick={() => setFenetre(true)}
              className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              {textes.voirResultats}
            </button>
          </div>
        }
      />

      <Fenetre
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        titre={enCours(partie) ? textes.stats.titre : textes.resultats}
      >
        {!enCours(partie) && (
          <FinDePartie partie={partie} message={textes.fin(partie)}>
            {/* grid-cols-2 : le compte à rebours et le bouton de partage côte à côte */}
            <div className="grid grid-cols-2 items-center gap-2">
              <CompteARebours minuit={minuitSuivant(jour)} onMinuit={onJourSuivant} />
              <Partager texte={textePartage(partie, numero, modes)} />
            </div>
          </FinDePartie>
        )}
        <Statistiques stats={stats} dernier={partie.etat === 'gagnee' ? partie.essais.length : undefined} />
      </Fenetre>
    </>
  )
}
