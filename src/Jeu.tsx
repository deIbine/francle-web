/*
La partie du jour : de la première proposition à la fenêtre de résultats.

Toutes les règles sont dans src/domaine/ : ce composant garde la partie en cours, la sauvegarde après chaque
changement (sauvegarde.ts), et la passe aux composants d'affichage.
 */
import { useState } from 'react'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { Indices } from './composants/Indices.tsx'
import { Saisie } from './composants/Saisie.tsx'
import { Silhouette } from './composants/Silhouette.tsx'
import { Statistiques } from './composants/Statistiques.tsx'
import { TableauEssais } from './composants/TableauEssais.tsx'
import { abandonner, enCours, indicesReveles, nouvellePartie, proposer, type Partie } from './domaine/partie.ts'
import { chercher } from './domaine/recherche.ts'
import { MODE_DU_JOUR, numero as numeroDuJour, regionDuJour } from './domaine/regionDuJour.ts'
import { statistiques } from './domaine/statistiques.ts'
import { minuitSuivant } from './domaine/temps.ts'
import { enregistrer, lire, restaurer, resultats } from './sauvegarde.ts'
import { textes } from './textes.ts'

interface Props {
  // le jour de la partie
  jour: Date
  // appelé à minuit, quand une nouvelle région est disponible
  onJourSuivant: () => void
}

export function Jeu({ jour, onJourSuivant }: Props) {
  const numero = numeroDuJour(jour)
  // toutes les parties sauvées, lues une fois à l'ouverture, puis tenues à jour à chaque changement
  const [parties, setParties] = useState(() => lire())
  // la partie du jour : celle qu'on avait commencée (rejouée depuis la sauvegarde), sinon une nouvelle
  const [partie, setPartie] = useState(() => {
    const sauvee = parties.get(numero)
    const cible = regionDuJour(jour)
    return sauvee === undefined ? nouvellePartie(cible, MODE_DU_JOUR) : restaurer(sauvee, cible, MODE_DU_JOUR)
  })
  // la fenêtre des résultats : ouverte d'emblée si on revient sur une partie déjà finie
  const [fenetre, setFenetre] = useState(() => !enCours(partie))
  // le message sous la saisie (« région inconnue »…), vide s'il n'y a rien à dire
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState(false)

  // la seule façon de changer la partie : on la remplace, on la sauvegarde, et on ouvre les résultats si elle
  // vient de se terminer. Sauvegarder ici, et non après coup, garantit que les statistiques affichées dans la
  // fenêtre comptent déjà cette partie
  function changer(suite: Partie) {
    setPartie(suite)
    enregistrer(numero, suite)
    setParties(lire())
    if (!enCours(suite)) {
      setFenetre(true)
    }
  }

  function jouer(saisie: string): boolean {
    // une région déjà proposée ne coûte pas d'essai : le joueur s'est sûrement trompé de ligne
    const region = chercher(saisie, partie.mode)
    if (region !== undefined && partie.essais.some((essai) => essai.region === region)) {
      setMessage(textes.dejaProposee(region.nom.fr))
      return false
    }
    const suite = proposer(partie, saisie)
    if (suite === undefined) {
      setMessage(textes.inconnue)
      return false
    }
    changer(suite)
    setMessage('')
    return true
  }

  const stats = statistiques(resultats(parties), numero)

  return (
    // max-w-md : 28rem au plus, centré (mx-auto) ; flex flex-col gap-4 : les blocs en colonne, espacés de 1rem
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 text-center">
      {/* grid à trois colonnes (1fr auto 1fr) : le titre reste centré, le bouton des statistiques à droite */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center">
        <h1 className="col-start-2 text-3xl font-bold tracking-wide">
          {textes.titre} <span className="text-base font-normal text-gray-500">{textes.numero(numero)}</span>
        </h1>
        <button
          type="button"
          onClick={() => setFenetre(true)}
          aria-label={textes.stats.ouvrir}
          className="justify-self-end rounded px-2 text-2xl hover:bg-gray-100"
        >
          📊
        </button>
        <p className="col-span-3 text-sm text-gray-600">{textes.sousTitre}</p>
      </header>

      <Silhouette region={partie.cible} />

      {enCours(partie) ? (
        <>
          <Saisie mode={partie.mode} onProposer={jouer} />
          {/* aria-live : un lecteur d'écran lit le message dès qu'il change ; min-h garde la place réservée */}
          <p aria-live="polite" className="min-h-5 text-sm text-red-700">
            {message}
          </p>
        </>
      ) : (
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
      )}

      <TableauEssais essais={partie.essais} />
      <Indices cible={partie.cible} reveles={indicesReveles(partie)} />

      {enCours(partie) &&
        (confirmation ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>{textes.confirmerAbandon}</span>
            <button
              type="button"
              onClick={() => changer(abandonner(partie))}
              className="rounded bg-red-700 px-3 py-1 text-white"
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
            className="self-center text-sm text-gray-500 underline hover:text-gray-800"
          >
            {textes.abandonner}
          </button>
        ))}

      <Fenetre
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        titre={enCours(partie) ? textes.stats.titre : textes.resultats}
      >
        {!enCours(partie) && (
          <FinDePartie partie={partie} numero={numero} minuit={minuitSuivant(jour)} onMinuit={onJourSuivant} />
        )}
        <Statistiques stats={stats} dernier={partie.etat === 'gagnee' ? partie.essais.length : undefined} />
      </Fenetre>
    </main>
  )
}
