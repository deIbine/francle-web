/*
L'écran du jeu : la partie du jour, de la première proposition à la carte de fin.

Toutes les règles sont dans src/domaine/ (web.1) : ce composant ne fait que garder la partie en cours, la passer aux
composants d'affichage, et la remplacer par la nouvelle partie que renvoie proposer() ou abandonner().
 */
import { useState } from 'react'
import { FinDePartie } from './composants/FinDePartie.tsx'
import { Indices } from './composants/Indices.tsx'
import { Saisie } from './composants/Saisie.tsx'
import { Silhouette } from './composants/Silhouette.tsx'
import { TableauEssais } from './composants/TableauEssais.tsx'
import { chercher } from './domaine/recherche.ts'
import { abandonner, enCours, indicesReveles, nouvellePartie, proposer } from './domaine/partie.ts'
import { MODE_DU_JOUR, numero, regionDuJour } from './domaine/regionDuJour.ts'
import { textes } from './textes.ts'

// la date est un paramètre pour les tests ; sur le site, il est absent et c'est aujourd'hui
export default function App({ date }: { date?: Date }) {
  // le jour de la partie, fixé à l'ouverture de la page : sinon, à minuit, le numéro changerait sous les yeux du
  // joueur au milieu de sa partie (web.3 s'occupera du passage au jour suivant)
  // (new Date() dans une fonction passée à useState : appelée une seule fois, et non à chaque affichage)
  const [jour] = useState(() => date ?? new Date())
  // la fonction passée à useState n'est appelée qu'au premier affichage : la région du jour est calculée une fois
  const [partie, setPartie] = useState(() => nouvellePartie(regionDuJour(jour), MODE_DU_JOUR))
  // le message sous la saisie (« région inconnue »…), vide s'il n'y a rien à dire
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState(false)

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
    setPartie(suite)
    setMessage('')
    return true
  }

  return (
    // max-w-md : 28rem au plus, centré (mx-auto) ; flex flex-col gap-4 : les blocs en colonne, espacés de 1rem
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 text-center">
      <header>
        <h1 className="text-3xl font-bold tracking-wide">
          {textes.titre} <span className="text-base font-normal text-gray-500">{textes.numero(numero(jour))}</span>
        </h1>
        <p className="text-sm text-gray-600">{textes.sousTitre}</p>
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
        <FinDePartie partie={partie} />
      )}

      <TableauEssais essais={partie.essais} />
      <Indices cible={partie.cible} reveles={indicesReveles(partie)} />

      {enCours(partie) &&
        (confirmation ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>{textes.confirmerAbandon}</span>
            <button
              type="button"
              onClick={() => setPartie(abandonner(partie))}
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
    </main>
  )
}
