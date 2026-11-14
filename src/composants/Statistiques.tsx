/*
Les statistiques de la partie du jour, en trois onglets (depuis web.9.1.2) :
    Résumé       les quatre nombres d'avant, le score Francle (ce mois-ci et depuis toujours), la répartition des
                 victoires et le bonus des départements
    Détails      les essais moyens, les records, les régions les mieux et les moins bien trouvées, les modes difficiles
    Calendrier   un mois, une case par jour, et des flèches pour changer de mois

Des onglets plutôt qu'une longue fenêtre : à 375 pixels, tout l'un sous l'autre défilerait sur trois écrans. Le
premier onglet reste ce que le joueur connaît déjà ; le reste est à un clic.

Les onglets suivent le modèle du W3C (role="tablist", "tab", "tabpanel"), comme ceux de l'en-tête (App.tsx) : ← et →
passent d'un onglet à l'autre, et seul l'onglet choisi est dans l'ordre du clavier (tabIndex). Seul son panneau est
affiché : les deux autres ne sont même pas construits, ce qui ne coûte rien et garde la page légère.
 */
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { dateDuMois, semaines, type Case } from '../domaine/calendrier.ts'
import { details, type BilanRegion } from '../domaine/details.ts'
import { moisDuNumero } from '../domaine/regionDuJour.ts'
import { cumul, cumulDuMois, points, type Cumul } from '../domaine/score.ts'
import { statistiques, type Resultat } from '../domaine/statistiques.ts'
import { useLangue, useTextes } from '../textes.ts'

type Onglet = 'resume' | 'details' | 'calendrier'
const ONGLETS: readonly Onglet[] = ['resume', 'details', 'calendrier']

interface Props {
  // toutes les parties du jour du joueur (numéro -> résumé), et le numéro d'aujourd'hui
  historique: ReadonlyMap<number, Resultat>
  aujourdhui: number
  // le nombre d'essais de la victoire du jour, dont la barre est mise en avant (comme Wordle)
  dernier?: number
  // ce qui s'ajoute au bas du résumé (le lien de comparaison, web.9.1.3)
  enPlus?: ReactNode
}

export function Statistiques({ historique, aujourdhui, dernier, enPlus }: Props) {
  const textes = useTextes()
  const [onglet, setOnglet] = useState<Onglet>('resume')
  const id = useId()

  // ← et → : l'onglet d'avant ou d'après, en boucle ; Début et Fin : le premier ou le dernier
  function touche(evenement: KeyboardEvent) {
    const index = ONGLETS.indexOf(onglet)
    const suivant = {
      ArrowRight: ONGLETS[(index + 1) % ONGLETS.length],
      ArrowLeft: ONGLETS[(index + ONGLETS.length - 1) % ONGLETS.length],
      Home: ONGLETS[0],
      End: ONGLETS[ONGLETS.length - 1],
    }[evenement.key]
    if (suivant !== undefined) {
      evenement.preventDefault()
      setOnglet(suivant)
      document.getElementById(`${id}-${suivant}`)?.focus()
    }
  }

  return (
    <section aria-label={textes.stats.titre} className="flex flex-col gap-4">
      <div role="tablist" aria-label={textes.stats.onglets} onKeyDown={touche} className="flex border-b border-bord">
        {ONGLETS.map((nom) => (
          <button
            key={nom}
            id={`${id}-${nom}`}
            type="button"
            role="tab"
            aria-selected={onglet === nom}
            aria-controls={`${id}-panneau`}
            tabIndex={onglet === nom ? 0 : -1}
            onClick={() => setOnglet(nom)}
            // -mb-px : la bordure de l'onglet choisi recouvre celle de la liste, comme une languette
            className={`-mb-px flex-1 border-b-2 px-2 py-1.5 text-sm font-semibold ${
              onglet === nom ? 'border-francle-fonce text-texte' : 'border-transparent text-discret hover:text-texte'
            }`}
          >
            {textes.stats[nom]}
          </button>
        ))}
      </div>
      <div id={`${id}-panneau`} role="tabpanel" aria-labelledby={`${id}-${onglet}`} className="flex flex-col gap-4">
        {onglet === 'resume' && (
          <Resume historique={historique} aujourdhui={aujourdhui} dernier={dernier} enPlus={enPlus} />
        )}
        {onglet === 'details' && <Details historique={historique} />}
        {onglet === 'calendrier' && <Calendrier historique={historique} aujourdhui={aujourdhui} />}
      </div>
    </section>
  )
}

// des nombres côte à côte, chacun au-dessus de son nom
function Chiffres({ chiffres, colonnes }: { chiffres: readonly (readonly [string, ReactNode])[]; colonnes: string }) {
  return (
    <dl className={`grid gap-2 ${colonnes}`}>
      {chiffres.map(([nom, valeur]) => (
        // flex-col-reverse : la valeur (dd) au-dessus de son nom (dt), tout en gardant l'ordre dt puis dd du HTML.
        // justify-end : dans une colonne inversée, la « fin » est en haut. Les valeurs restent ainsi alignées en haut
        // même quand un nom prend deux lignes (« Série en cours » sur téléphone) ; sans cela, elles montaient
        <div key={nom} className="flex flex-col-reverse justify-end">
          <dt className="text-xs text-discret">{nom}</dt>
          <dd className="text-2xl font-bold tabular-nums">{valeur}</dd>
        </div>
      ))}
    </dl>
  )
}

// un nombre à la façon de la langue : « 4,5 » en français, « 4.5 » en anglais
function useNombre(): (nombre: number) => string {
  const langue = useLangue()
  return (nombre) => nombre.toLocaleString(langue)
}

function Resume({ historique, aujourdhui, dernier, enPlus }: Props) {
  const textes = useTextes()
  const stats = statistiques(historique, aujourdhui)
  // la plus grande barre prend toute la largeur ; Math.max(1, …) évite une division par zéro sans victoire
  const plusGrande = Math.max(1, ...stats.repartition)
  const duJour = historique.get(aujourdhui)
  return (
    <>
      <Chiffres
        colonnes="grid-cols-4"
        chiffres={[
          [textes.stats.jouees, stats.jouees],
          [textes.stats.victoires, textes.stats.pourcentage(stats.pourcentage)],
          [textes.stats.serie, stats.serie],
          [textes.stats.meilleureSerie, stats.meilleureSerie],
        ]}
      />
      <div>
        <h3 className="font-semibold">{textes.stats.score}</h3>
        <p className="mb-2 text-xs text-discret">{textes.stats.scoreAide}</p>
        <div className="grid grid-cols-2 gap-2">
          <Score nom={textes.stats.moisEnCours} cumul={cumulDuMois(historique, aujourdhui)} />
          <Score nom={textes.stats.depuisToujours} cumul={cumul(historique)} />
        </div>
        {duJour !== undefined && duJour.etat !== 'en-cours' && (
          <p className="mt-2 text-sm">{textes.stats.scoreDuJour(points(duJour))}</p>
        )}
      </div>
      <div>
        <h3 className="mb-2 font-semibold">{textes.stats.repartition}</h3>
        <ol className="flex flex-col gap-1 text-sm">
          {stats.repartition.map((nombre, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-3 tabular-nums">{index + 1}</span>
              {/* role="img" : un aria-label n'est sûr d'être lu que sur un élément qui a un rôle ; un <span> n'en a pas,
                  et certains lecteurs d'écran l'ignoraient (web.7.19). La barre est une petite image, et son nom la
                  décrit en entier */}
              <span
                role="img"
                aria-label={textes.stats.barre(index + 1, nombre)}
                // la largeur dépend des données : un style calculé, que Tailwind ne peut pas connaître d'avance
                style={{ width: `${Math.max(8, (nombre * 100) / plusGrande)}%` }}
                className={`rounded px-2 text-right font-semibold text-white tabular-nums ${
                  dernier === index + 1 ? 'bg-francle-fonce' : 'bg-gray-500'
                }`}
              >
                {nombre}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">{textes.stats.bonus}</h3>
        <Chiffres
          colonnes="grid-cols-2"
          chiffres={[
            [textes.stats.bonusJoues, stats.bonusJoues],
            [
              textes.stats.scoreMoyenBonus,
              stats.bonusJoues === 0 ? textes.stats.aucunScore : textes.stats.pourcentage(stats.scoreMoyenBonus),
            ],
          ]}
        />
      </div>
      {enPlus}
    </>
  )
}

// le score d'une période : le total en grand, la moyenne et le nombre de parties dessous
function Score({ nom, cumul }: { nom: string; cumul: Cumul }) {
  const textes = useTextes()
  const nombre = useNombre()
  return (
    <div className="rounded bg-surface p-2">
      <p className="text-xs text-discret">{nom}</p>
      <p className="text-2xl font-bold tabular-nums">{textes.stats.points(cumul.points)}</p>
      <p className="text-xs text-discret">
        {cumul.parties === 0 ? textes.stats.aucunScore : textes.stats.moyenne(nombre(cumul.moyenne), cumul.parties)}
      </p>
    </div>
  )
}

function Details({ historique }: { historique: ReadonlyMap<number, Resultat> }) {
  const textes = useTextes()
  const langue = useLangue()
  const nombre = useNombre()
  const d = details(historique)
  if (d.meilleurMois === undefined) {
    return <p className="text-discret">{textes.stats.aucunePartie}</p>
  }
  const nomDuMois = dateDuMois(d.meilleurMois.mois).toLocaleDateString(langue, { month: 'long', year: 'numeric' })
  return (
    <>
      <div>
        <h3 className="mb-2 font-semibold">{textes.stats.records}</h3>
        <Chiffres
          colonnes="grid-cols-3"
          chiffres={[
            [textes.stats.essaisMoyens, d.essaisMoyens === undefined ? textes.stats.aucunScore : nombre(d.essaisMoyens)],
            [
              textes.stats.meilleurMois,
              <>
                {d.meilleurMois.points}
                <span className="block text-xs font-normal text-discret">{nomDuMois}</span>
              </>,
            ],
            [textes.stats.journeesParfaites, d.journeesParfaites],
          ]}
        />
      </div>
      <ListeRegions titre={textes.stats.mieuxTrouvees} regions={d.mieuxTrouvees} />
      {d.moinsBienTrouvees.length > 0 && (
        <ListeRegions titre={textes.stats.moinsBienTrouvees} regions={d.moinsBienTrouvees} />
      )}
      <div>
        <h3 className="mb-2 font-semibold">{textes.stats.modes}</h3>
        <dl className="flex flex-col gap-1 text-sm">
          {(
            [
              [textes.stats.rotation, d.rotation],
              [textes.stats.cachee, d.cachee],
            ] as const
          ).map(([nom, mode]) => (
            <div key={nom} className="flex justify-between gap-2">
              <dt>{nom}</dt>
              <dd className="tabular-nums text-discret">{textes.stats.bilanMode(mode.victoires, mode.jouees)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

// une liste de régions, chacune avec ses victoires sur ses parties et ses essais moyens
function ListeRegions({ titre, regions }: { titre: string; regions: readonly BilanRegion[] }) {
  const textes = useTextes()
  const langue = useLangue()
  const nombre = useNombre()
  return (
    <div>
      <h3 className="mb-2 font-semibold">{titre}</h3>
      <ol className="flex flex-col gap-1 text-sm">
        {regions.map((bilan) => (
          <li key={bilan.region.id} className="flex justify-between gap-2 text-left">
            <span>{bilan.region.nom[langue]}</span>
            <span className="shrink-0 tabular-nums text-discret">
              {textes.stats.bilanRegion(
                bilan.victoires,
                bilan.parties,
                bilan.essaisMoyens,
                nombre(bilan.essaisMoyens ?? 0),
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// les couleurs d'une case, selon sa partie (les mêmes que la répartition : vert trouvé, gris manqué)
const COULEURS: Record<Case['etat'], string> = {
  gagnee: 'bg-succes text-white',
  manquee: 'bg-gray-500 text-white',
  'en-cours': 'border-2 border-francle-fonce',
  absente: 'bg-surface text-discret',
}

// un lundi connu (le 1er janvier 2024), pour les noms des jours de la semaine dans la langue choisie
const UN_LUNDI = new Date(2024, 0, 1)

function Calendrier({ historique, aujourdhui }: { historique: ReadonlyMap<number, Resultat>; aujourdhui: number }) {
  const textes = useTextes()
  const langue = useLangue()
  const dernierMois = moisDuNumero(aujourdhui)
  // le premier mois montré : celui de la première partie du jeu (n° 1), ou d'une partie plus ancienne si l'horloge
  // du joueur a un jour été fausse
  const premierMois = moisDuNumero(Math.min(1, ...historique.keys()))
  const [mois, setMois] = useState(dernierMois)
  const nomDuMois = dateDuMois(mois).toLocaleDateString(langue, { month: 'long', year: 'numeric' })
  const jours = Array.from({ length: 7 }, (_, i) => new Date(UN_LUNDI.getFullYear(), 0, 1 + i))
  const bouton = 'rounded px-3 py-1 text-lg hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className={bouton}
          onClick={() => setMois(mois - 1)}
          disabled={mois <= premierMois}
          aria-label={textes.stats.moisPrecedent}
        >
          ‹
        </button>
        {/* aria-live : un lecteur d'écran annonce le nouveau mois quand une flèche le change */}
        <h3 aria-live="polite" className="font-semibold first-letter:uppercase">
          {nomDuMois}
        </h3>
        <button
          type="button"
          className={bouton}
          onClick={() => setMois(mois + 1)}
          disabled={mois >= dernierMois}
          aria-label={textes.stats.moisSuivant}
        >
          ›
        </button>
      </div>
      {/* un vrai tableau : un lecteur d'écran sait alors lire la colonne (le jour de la semaine) de chaque case */}
      <table className="w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">{nomDuMois}</caption>
        <thead>
          <tr>
            {jours.map((jour) => (
              <th key={jour.getDay()} scope="col" className="text-xs font-normal text-discret">
                <abbr title={jour.toLocaleDateString(langue, { weekday: 'long' })} className="no-underline">
                  {jour.toLocaleDateString(langue, { weekday: 'narrow' })}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semaines(historique, mois).map((semaine, i) => (
            <tr key={i}>
              {semaine.map((jour, j) => (
                <td key={j} className="p-0">
                  {jour !== null && (
                    <span
                      role="img"
                      aria-label={textes.stats.caseCalendrier(
                        jour.date.toLocaleDateString(langue, { day: 'numeric', month: 'long' }),
                        jour.etat,
                        jour.essais,
                        jour.points,
                      )}
                      className={`flex aspect-square flex-col items-center justify-center rounded text-xs leading-none ${
                        COULEURS[jour.etat]
                      } ${jour.numero === aujourdhui ? 'ring-2 ring-texte ring-offset-1 ring-offset-fond' : ''}`}
                    >
                      <span className="opacity-80">{jour.date.getDate()}</span>
                      {jour.etat === 'gagnee' && <span className="text-sm font-bold">{jour.essais}</span>}
                      {jour.etat === 'manquee' && <span className="text-sm font-bold">✕</span>}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-discret">
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="inline-block size-3 rounded bg-succes" /> {textes.stats.legendeGagnee}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="inline-block size-3 rounded bg-gray-500" /> {textes.stats.legendePerdue}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="inline-block size-3 rounded bg-surface ring-1 ring-bord" />{' '}
          {textes.stats.legendeAbsente}
        </li>
      </ul>
    </div>
  )
}
