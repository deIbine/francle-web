/*
La liste des régions, reprise du jeu Java (menu Jeu, « Liste des régions ») : toutes les régions de la partie
(les nouvelles en partie du jour, l'époque choisie en partie libre), par ordre alphabétique. Un clic sur un nom le
propose, comme si on l'avait tapé.

Chaque nom est un vrai bouton (<button>) : il se choisit au clavier (Tab, Entrée) et un lecteur d'écran l'annonce
comme un bouton. Une région déjà proposée, ou toutes quand la partie est finie, sont des boutons désactivés.
 */
import { enCours, type Partie } from '../domaine/partie.ts'
import { tirables } from '../domaine/regions.ts'
import { useLangue, useTextes } from '../textes.ts'

interface Props {
  partie: Partie
  onProposer: (nom: string) => void
}

export function ListeRegions({ partie, onProposer }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  // l'ordre alphabétique de la langue du joueur, comme pour les suggestions (voir recherche.ts)
  const ordre = new Intl.Collator(langue, { ignorePunctuation: true })
  const regions = tirables(partie.mode).sort((a, b) => ordre.compare(a.nom[langue], b.nom[langue]))
  // par identifiant plutôt que par objet : plus solide (le rechargement à chaud de Vite recrée les objets régions)
  const proposees = new Set(partie.essais.map((essai) => essai.region.id))
  const finie = !enCours(partie)

  return (
    <>
      <p className="text-sm text-discret">{finie ? textes.liste.finie : textes.liste.aide}</p>
      {/* deux colonnes : 18 ou 26 noms tiennent sans trop défiler, même sur un téléphone */}
      <ul className="grid grid-cols-2 gap-1 text-left text-sm">
        {regions.map((region) => {
          const dejaProposee = proposees.has(region.id)
          return (
            <li key={region.id}>
              <button
                type="button"
                disabled={finie || dejaProposee}
                onClick={() => onProposer(region.nom[langue])}
                // une région déjà proposée est barrée ; le lecteur d'écran l'entend dans le nom du bouton
                aria-label={dejaProposee ? `${region.nom[langue]}, ${textes.liste.dejaProposee}` : undefined}
                className={`w-full rounded px-2 py-1 text-left enabled:hover:bg-surface disabled:text-discret ${
                  dejaProposee ? 'line-through' : ''
                }`}
              >
                {region.nom[langue]}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
