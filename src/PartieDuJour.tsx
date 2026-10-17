/*
La partie du jour : la même région pour tout le monde, sauvegardée, comptée dans les statistiques et partageable.

Le plateau (silhouette, saisie, tableau, indices) est commun avec la partie libre (composants/Plateau.tsx). Ce
composant ajoute ce qui est propre au jour : la sauvegarde après chaque changement (sauvegarde.ts), et la fenêtre
des résultats et des statistiques.

Après une victoire, le bonus des départements commence à la fermeture de la fenêtre des résultats. Il est sauvé à
chaque réponse : commencé puis quitté (page fermée), il reprend là où il en était. Passé avant toute réponse, ou pas
encore lancé quand on revient sur la page, il reste à jouer jusqu'à minuit, par le bouton « 🗺️ Jouer le bonus ».
 */
import { useState } from 'react'
import { BoutonBonus } from './composants/BoutonBonus.tsx'
import { CompteARebours } from './composants/CompteARebours.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { JeuBonus } from './composants/JeuBonus.tsx'
import { Partager } from './composants/Partager.tsx'
import { Plateau } from './composants/Plateau.tsx'
import { Statistiques } from './composants/Statistiques.tsx'
import { bonusDuJour, bonusEnCours, commence, score, total, type Bonus } from './domaine/bonus.ts'
import { enCours, nouvellePartie, type Partie } from './domaine/partie.ts'
import { textePartage, type ModesDifficiles } from './domaine/partage.ts'
import { angleDuJour, MODE_DU_JOUR, numero as numeroDuJour, regionDuJour } from './domaine/regionDuJour.ts'
import { statistiques } from './domaine/statistiques.ts'
import { minuitSuivant } from './domaine/temps.ts'
import { modesReglages, uniteAffichee, type Reglages } from './reglages.ts'
import { useChangementAilleurs } from './onglets.ts'
import {
  CLE,
  enregistrer,
  enregistrerBonus,
  lire,
  modesSauves,
  restaurer,
  restaurerBonus,
  resultats,
  type PartieSauvee,
} from './sauvegarde.ts'
import { useLangue, useTextes } from './textes.ts'

// la partie du jour : celle qu'on avait commencée (rejouée depuis la sauvegarde), sinon une nouvelle
function partieDuJour(sauvee: PartieSauvee | undefined, jour: Date): Partie {
  const cible = regionDuJour(jour)
  return sauvee === undefined ? nouvellePartie(cible, MODE_DU_JOUR) : restaurer(sauvee, cible, MODE_DU_JOUR)
}

// les modes difficiles, fixés au premier essai (undefined tant que la partie n'est pas commencée)
function modesFixesDe(sauvee: PartieSauvee | undefined): ModesDifficiles | undefined {
  const commencee = sauvee !== undefined && (sauvee.regions.length > 0 || sauvee.etat !== 'en-cours')
  return commencee ? modesSauves(sauvee) : undefined
}

interface Props {
  // le jour de la partie
  jour: Date
  reglages: Reglages
  // augmente de 1 à chaque clic sur 📊 (dans l'en-tête, qui appartient à App) : la fenêtre s'ouvre alors
  demandeStats: number
  // de même pour 📃, la liste des régions (gardée par le plateau)
  demandeListe: number
}

export function PartieDuJour({ jour, reglages, demandeStats, demandeListe }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  const numero = numeroDuJour(jour)
  // toutes les parties sauvées, lues une fois à l'ouverture, puis tenues à jour à chaque changement
  const [parties, setParties] = useState(() => lire())
  const sauvee = parties.get(numero)
  const [partie, setPartie] = useState(() => partieDuJour(sauvee, jour))
  // les modes difficiles, fixés au premier essai. Avant, la partie suit les réglages du moment
  const [modesFixes, setModesFixes] = useState(() => modesFixesDe(sauvee))
  const modes = modesFixes ?? modesReglages(reglages)
  // la fenêtre des résultats : ouverte d'emblée si on revient sur une partie déjà finie
  const [fenetre, setFenetre] = useState(() => !enCours(partie))
  // le bonus des départements : celui qu'on avait commencé (rejoué depuis la sauvegarde), sinon aucun
  const [bonus, setBonus] = useState<Bonus | undefined>(() => restaurerBonus(numero, sauvee))
  // vrai entre une victoire obtenue ici et la fermeture de la fenêtre des résultats, qui lance alors le bonus. Pas en
  // revenant sur une partie déjà gagnée : le bonus ne surprend pas le joueur, il attend son bouton
  const [bonusAVenir, setBonusAVenir] = useState(false)

  // un autre onglet a joué : on reprend sa sauvegarde, la dernière écrite fait foi. Les deux onglets montrent ainsi
  // la même partie, et aucun n'écrase les essais de l'autre
  useChangementAilleurs(CLE, () => {
    const toutes = lire()
    setParties(toutes)
    setPartie(partieDuJour(toutes.get(numero), jour))
    setModesFixes(modesFixesDe(toutes.get(numero)))
    // le bonus de l'autre onglet, s'il a commencé ; sinon on garde celui d'ici (peut-être lancé, sans réponse)
    setBonus((avant) => restaurerBonus(numero, toutes.get(numero)) ?? avant)
  })

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
    if (suite.etat === 'gagnee') {
      setBonusAVenir(true)
    }
  }

  // la fenêtre se ferme (bouton ✕, Échap, clic à côté) : juste après une victoire, le bonus commence
  function fermerFenetre() {
    setFenetre(false)
    if (bonusAVenir) {
      setBonusAVenir(false)
      setBonus(bonusDuJour(partie.cible, numero))
    }
  }

  // la seule façon de changer le bonus, comme changer() pour la partie
  function changerBonus(suite: Bonus) {
    // passé avant toute réponse : il n'a pas commencé, on revient à la silhouette et il reste à jouer
    if (!commence(suite)) {
      setBonus(undefined)
      return
    }
    setBonus(suite)
    enregistrerBonus(numero, suite)
    setParties(lire())
  }

  // le score du bonus, pour le partage, une fois le bonus fini
  const scoreBonus = bonus === undefined || bonusEnCours(bonus) ? undefined : { score: score(bonus), total: total(bonus) }
  const stats = statistiques(resultats(parties), numero)

  return (
    <>
      <Plateau
        partie={partie}
        onChanger={changer}
        modes={modes}
        angle={angleDuJour(jour)}
        unite={uniteAffichee(reglages)}
        demandeListe={demandeListe}
        bonus={bonus && <JeuBonus bonus={bonus} onChanger={changerBonus} />}
        fin={
          <div className="flex flex-col items-center gap-2">
            <p className="font-semibold">
              {textes.fin(partie)} {textes.reponse} {partie.cible.nom[langue]}
            </p>
            <button
              type="button"
              onClick={() => setFenetre(true)}
              className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              {textes.voirResultats}
            </button>
            {partie.etat === 'gagnee' && bonus === undefined && (
              <BoutonBonus onJouer={() => setBonus(bonusDuJour(partie.cible, numero))} />
            )}
          </div>
        }
      />

      <Fenetre
        ouverte={fenetre}
        onFermer={fermerFenetre}
        titre={enCours(partie) ? textes.stats.titre : textes.resultats}
      >
        {!enCours(partie) && (
          <FinDePartie partie={partie} message={textes.fin(partie)}>
            {/* grid-cols-2 : le compte à rebours et le bouton de partage côte à côte */}
            <div className="grid grid-cols-2 items-center gap-2">
              <CompteARebours minuit={minuitSuivant(jour)} />
              <Partager texte={textePartage(partie, numero, modes, langue, scoreBonus)} />
            </div>
          </FinDePartie>
        )}
        <Statistiques stats={stats} dernier={partie.etat === 'gagnee' ? partie.essais.length : undefined} />
      </Fenetre>
    </>
  )
}
