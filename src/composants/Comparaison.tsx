/*
Le lien de comparaison (web.9.1.3), ses deux côtés :
    EnvoyerBilan   dans le résumé des statistiques : le bouton qui partage le lien (menu de partage du téléphone,
                   copie ailleurs, comme le partage du résultat)
    Comparaison    dans la fenêtre qui s'ouvre quand on arrive par ce lien : les deux bilans côte à côte, le meilleur
                   des deux mis en avant, puis le face-à-face des jours joués par les deux

Le bilan de l'ami vient d'une adresse que n'importe qui peut écrire : il est lu par lien.ts, qui vérifie tout, et un
lien abîmé s'affiche comme tel au lieu de casser la page.
 */
import { adresseDuBilan, faceAFace } from '../domaine/comparaison.ts'
import { lire as lireBilan } from '../domaine/lien.ts'
import { details } from '../domaine/details.ts'
import { dateDuNumero } from '../domaine/regionDuJour.ts'
import { cumul, cumulDuMois } from '../domaine/score.ts'
import { statistiques, type Resultat } from '../domaine/statistiques.ts'
import { lire, resultats } from '../sauvegarde.ts'
import { useLangue, useTextes } from '../textes.ts'
import { Partager } from './Partager.tsx'

interface PropsBilan {
  historique: ReadonlyMap<number, Resultat>
  aujourdhui: number
}

// le bouton d'envoi, avec deux lignes pour dire ce qu'il fait et ce que contient le lien
export function EnvoyerBilan({ historique, aujourdhui }: PropsBilan) {
  const textes = useTextes()
  return (
    <div className="flex flex-col items-center gap-2 border-t border-bord pt-4">
      <h3 className="font-semibold">{textes.comparaison.envoyerTitre}</h3>
      <p className="text-xs text-discret">{textes.comparaison.envoyerAide}</p>
      <BoutonEnvoi historique={historique} aujourdhui={aujourdhui} />
    </div>
  )
}

function BoutonEnvoi({ historique, aujourdhui }: PropsBilan) {
  const textes = useTextes()
  return (
    <Partager
      texte={textes.comparaison.message(adresseDuBilan(historique, aujourdhui))}
      libelle={textes.comparaison.envoyer}
      copie={textes.comparaison.copie}
    />
  )
}

// une ligne du tableau : son nom, les deux valeurs, et dans quel sens on fait mieux (aucun pour le nombre de parties,
// qui n'est ni bien ni mal). undefined : pas de valeur (une moyenne sans partie), affichée « – » et jamais meilleure
interface Ligne {
  readonly nom: string
  readonly toi: number | undefined
  readonly ami: number | undefined
  readonly mieux?: 'plus' | 'moins'
  // un pourcentage (« 81 % ») plutôt qu'un nombre
  readonly pourcent?: boolean
}

// qui fait mieux sur une ligne : 'toi', 'ami', ou personne (égalité, valeur manquante, ligne sans sens)
function meilleur(ligne: Ligne): 'toi' | 'ami' | undefined {
  const { toi, ami, mieux } = ligne
  if (mieux === undefined || toi === undefined || ami === undefined || toi === ami) {
    return undefined
  }
  return (toi > ami) === (mieux === 'plus') ? 'toi' : 'ami'
}

// les chiffres d'un joueur, pour le tableau
function chiffres(historique: ReadonlyMap<number, Resultat>, aujourdhui: number, jourDesStats: number) {
  const stats = statistiques(historique, jourDesStats)
  const mois = cumulDuMois(historique, aujourdhui)
  const toujours = cumul(historique)
  return {
    pointsMois: mois.points,
    moyenneMois: mois.parties === 0 ? undefined : mois.moyenne,
    pointsToujours: toujours.points,
    moyenneToujours: toujours.parties === 0 ? undefined : toujours.moyenne,
    jouees: stats.jouees,
    pourcentage: stats.jouees === 0 ? undefined : stats.pourcentage,
    serie: stats.serie,
    meilleureSerie: stats.meilleureSerie,
    essais: details(historique).essaisMoyens,
    bonus: stats.bonusJoues === 0 ? undefined : stats.scoreMoyenBonus,
  }
}

interface Props {
  // le bilan codé, tel qu'il est dans l'adresse après « #bilan= »
  texte: string
  aujourdhui: number
}

export function Comparaison({ texte, aujourdhui }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  const bilan = lireBilan(texte)
  if (bilan === undefined) {
    return <p>{textes.comparaison.illisible}</p>
  }
  const miennes = resultats(lire())
  // « ce mois-ci » : le même mois pour les deux, celui d'aujourd'hui. La série de l'ami se calcule au jour du lien
  // (après, il a peut-être joué sans renvoyer de lien) ; la tienne, aujourd'hui
  const toi = chiffres(miennes, aujourdhui, aujourdhui)
  const ami = chiffres(bilan.parties, aujourdhui, bilan.jourDuLien)
  const c = textes.comparaison
  const s = textes.stats
  const lignes: Ligne[] = [
    { nom: c.pointsMois, toi: toi.pointsMois, ami: ami.pointsMois, mieux: 'plus' },
    { nom: c.moyenneMois, toi: toi.moyenneMois, ami: ami.moyenneMois, mieux: 'plus' },
    { nom: c.pointsToujours, toi: toi.pointsToujours, ami: ami.pointsToujours, mieux: 'plus' },
    { nom: c.moyenneToujours, toi: toi.moyenneToujours, ami: ami.moyenneToujours, mieux: 'plus' },
    { nom: s.jouees, toi: toi.jouees, ami: ami.jouees },
    { nom: s.victoires, toi: toi.pourcentage, ami: ami.pourcentage, mieux: 'plus', pourcent: true },
    { nom: s.serie, toi: toi.serie, ami: ami.serie, mieux: 'plus' },
    { nom: s.meilleureSerie, toi: toi.meilleureSerie, ami: ami.meilleureSerie, mieux: 'plus' },
    { nom: s.essaisMoyens, toi: toi.essais, ami: ami.essais, mieux: 'moins' },
    { nom: c.bonus, toi: toi.bonus, ami: ami.bonus, mieux: 'plus', pourcent: true },
  ]
  const ecrire = (ligne: Ligne, valeur: number | undefined) =>
    valeur === undefined
      ? s.aucunScore
      : ligne.pourcent
        ? s.pourcentage(valeur)
        : valeur.toLocaleString(langue)
  const duel = faceAFace(miennes, bilan.parties)
  const date = dateDuNumero(bilan.jourDuLien).toLocaleDateString(langue, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-discret">{c.duLien(date)}</p>
      <table className="w-full text-sm">
        <caption className="sr-only">{c.tableau}</caption>
        <thead>
          <tr className="border-b border-bord">
            <th scope="col" className="py-1 text-left font-normal text-discret">
              <span className="sr-only">{c.statistique}</span>
            </th>
            <th scope="col" className="w-20 py-1 font-semibold">
              {c.toi}
            </th>
            <th scope="col" className="w-20 py-1 font-semibold">
              {c.ami}
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => {
            const gagnant = meilleur(ligne)
            // le vert du meilleur : green-700 sur fond clair, green-400 sur fond sombre, où green-700 se lisait mal
            const cellule = (qui: 'toi' | 'ami') => (
              <td className={`py-1 tabular-nums ${gagnant === qui ? 'font-bold text-succes dark:text-green-400' : ''}`}>
                {ecrire(ligne, ligne[qui])}
                {gagnant === qui && (
                  <>
                    {/* l'étoile se voit ; le mot s'entend. La couleur seule ne dirait rien à un lecteur d'écran */}
                    <span aria-hidden="true"> ★</span>
                    <span className="sr-only"> {c.meilleur}</span>
                  </>
                )}
              </td>
            )
            return (
              <tr key={ligne.nom} className="border-b border-bord last:border-b-0">
                <th scope="row" className="py-1 text-left font-normal">
                  {ligne.nom}
                </th>
                {cellule('toi')}
                {cellule('ami')}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-sm">{c.faceAFace(duel.jours, duel.moi, duel.ami, duel.egalites)}</p>
      <div className="flex flex-col items-center gap-2 border-t border-bord pt-4">
        <p className="text-sm">{c.retour}</p>
        <BoutonEnvoi historique={miennes} aujourdhui={aujourdhui} />
      </div>
    </div>
  )
}
