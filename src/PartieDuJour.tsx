/*
La partie du jour : la même région pour tout le monde, sauvegardée, comptée dans les statistiques et partageable.

Le plateau (silhouette, saisie, tableau, indices) est commun avec la partie libre (composants/Plateau.tsx). Ce
composant ajoute ce qui est propre au jour : la sauvegarde après chaque changement (sauvegarde.ts), et la fenêtre
des résultats et des statistiques.

Après une victoire, le bonus des départements commence tout de suite, à la place de la silhouette ; la fenêtre des
résultats ne s'ouvre qu'à sa fin (après une courte pause, pour voir la dernière réponse), et le partage contient alors
son score. Il est sauvé à chaque réponse : commencé puis quitté (page fermée), il reprend là où il en était, sans la
fenêtre par-dessus. Passé avant toute réponse, ou pas encore lancé quand on revient sur la page, il reste à jouer
jusqu'à minuit, par le bouton « 🗺️ Jouer le bonus ».
 */
import { useState } from 'react'
import { Bilan } from './composants/Bilan.tsx'
import { BoutonBonus } from './composants/BoutonBonus.tsx'
import { CompteARebours } from './composants/CompteARebours.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { JeuBonus } from './composants/JeuBonus.tsx'
import { Partager } from './composants/Partager.tsx'
import { Plateau } from './composants/Plateau.tsx'
import { Statistiques } from './composants/Statistiques.tsx'
import { avecDifficulte, avecListe, bonusDuJour, bonusEnCours, commence, score, total, type Bonus } from './domaine/bonus.ts'
import { enCours, nouvellePartie, type Partie } from './domaine/partie.ts'
import { textePartage, type ModesDifficiles } from './domaine/partage.ts'
import { angleDuJour, MODE_DU_JOUR, numero as numeroDuJour, regionDuJour } from './domaine/regionDuJour.ts'
import { statistiques } from './domaine/statistiques.ts'
import { minuitSuivant } from './domaine/temps.ts'
import { usePause } from './pause.ts'
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
import { useSignalerListe, type Liste } from './liste.ts'

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
  // de même pour 📃 : la liste des régions (gardée par le plateau), ou des départements pendant le bonus (gardée par
  // le bonus)
  demandeListe: number
  // prévient App de la liste qu'ouvre 📃, pour le nom du bouton
  onListe?: (liste: Liste) => void
}

export function PartieDuJour({ jour, reglages, demandeStats, demandeListe, onListe }: Props) {
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
  // le bonus des départements : celui qu'on avait commencé (rejoué depuis la sauvegarde), sinon aucun
  const [bonusGarde, setBonus] = useState<Bonus | undefined>(() => restaurerBonus(numero, sauvee))
  // dans la version des réglages (simple ou difficile) tant qu'il n'a pas commencé : sa première réponse, donnée sur
  // ce bonus-là, fixe sa version, comme le premier essai fixe les modes 🌀 et 🙈
  const bonus = bonusGarde && avecDifficulte(bonusGarde, reglages.departementsDifficiles)
  // la fenêtre des résultats : ouverte d'emblée si on revient sur une partie déjà finie, sauf si un bonus est en
  // cours (on le reprend). Un bonus pas commencé, lui, ne surprend pas le joueur : la fenêtre s'ouvre, et le bonus
  // attend son bouton
  const [fenetre, setFenetre] = useState(() => !enCours(partie) && (bonus === undefined || !bonusEnCours(bonus)))
  // vrai quand le bonus vient d'être lancé par le joueur (victoire ou bouton) : le focus du clavier va alors sur son
  // titre, la saisie ou le bouton qu'il vient d'utiliser ayant disparu. Pas quand on reprend un bonus en revenant
  const [focusBonus, setFocusBonus] = useState(false)
  // la fenêtre des résultats, un peu après la dernière réponse du bonus
  const pause = usePause(() => setFenetre(true))
  const listeAuBonus = bonus !== undefined && avecListe(bonus)
  useSignalerListe(listeAuBonus, onListe)

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

  // la seule façon de changer la partie : on la remplace, on fixe ses modes, et on la sauvegarde. Une victoire lance
  // le bonus ; une défaite (ou un abandon) ouvre les résultats. Sauvegarder ici, et non après coup, garantit que les
  // statistiques affichées dans la fenêtre comptent déjà cette partie
  function changer(suite: Partie) {
    setPartie(suite)
    setModesFixes(modes)
    enregistrer(numero, suite, modes)
    setParties(lire())
    if (suite.etat === 'gagnee') {
      lancerBonus(suite)
    } else if (!enCours(suite)) {
      setFenetre(true)
    }
  }

  // le bonus de la partie gagnée, lancé par la victoire ou par le bouton « 🗺️ Jouer le bonus »
  function lancerBonus(gagnee: Partie) {
    setBonus(bonusDuJour(gagnee.cible, numero))
    setFocusBonus(true)
  }

  // la seule façon de changer le bonus, comme changer() pour la partie. Quand il n'y a plus rien à jouer, les
  // résultats s'ouvrent : tout de suite si le joueur a passé, après une pause s'il vient de donner sa dernière réponse
  function changerBonus(suite: Bonus) {
    // passé avant toute réponse : il n'a pas commencé, on revient à la silhouette et il reste à jouer
    if (!commence(suite)) {
      setBonus(undefined)
      setFenetre(true)
      return
    }
    setBonus(suite)
    enregistrerBonus(numero, suite)
    setParties(lire())
    if (suite.etat === 'termine') {
      pause.lancer()
    } else if (suite.etat === 'passe') {
      setFenetre(true)
    }
  }

  // le joueur ouvre les résultats lui-même : la pause en cours, s'il y en a une, n'a plus à les ouvrir
  function ouvrirFenetre() {
    pause.annuler()
    setFenetre(true)
  }

  // le score du bonus, pour le partage, une fois le bonus fini
  const scoreBonus =
    bonus === undefined || bonusEnCours(bonus)
      ? undefined
      : { score: score(bonus), total: total(bonus), difficile: bonus.difficile }
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
        bonus={
          bonus && (
            <JeuBonus bonus={bonus} onChanger={changerBonus} focaliser={focusBonus} demandeListe={demandeListe} />
          )
        }
        listeAuBonus={listeAuBonus}
        fin={
          <Bilan partie={partie} bonus={bonus}>
            <button
              type="button"
              onClick={ouvrirFenetre}
              className="rounded bg-francle-fonce px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              {textes.voirResultats}
            </button>
            {/* le partage, aussi sur la page (comme la maquette) ; pas pendant le bonus, dont le score manquerait */}
            {(bonus === undefined || !bonusEnCours(bonus)) && (
              <Partager texte={textePartage(partie, numero, modes, langue, scoreBonus)} />
            )}
            {partie.etat === 'gagnee' && bonus === undefined && (
              <BoutonBonus onJouer={() => lancerBonus(partie)} />
            )}
          </Bilan>
        }
      />

      <Fenetre
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        titre={enCours(partie) ? textes.stats.titre : textes.resultats}
      >
        {!enCours(partie) && (
          <FinDePartie partie={partie} message={textes.fin(partie)} bonus={bonus}>
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
