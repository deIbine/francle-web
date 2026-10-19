/*
La liste des départements, ouverte par le bouton 📃 pendant le bonus (mode C), comme la liste des régions pendant la
partie : les 101 départements, « Finistère (29) », par ordre alphabétique. Un clic sur un nom répond pour le
département choisi sur la carte, comme si on l'avait écrit dans la saisie.

Les 101, et pas seulement ceux de la région : la liste de la région donnerait toutes les réponses, et le bonus
deviendrait un simple jeu d'association (même raison que pour les suggestions de la saisie).

Comme dans ListeRegions, chaque nom est un vrai bouton. Tout est désactivé tant qu'aucun département n'est choisi
sur la carte, et quand le bonus est fini ; les départements qui ont déjà leur réponse sont barrés.
 */
import { bonusEnCours, repondus, type Bonus } from '../domaine/bonus.ts'
import { DEPARTEMENTS, type Departement } from '../domaine/departements.ts'
import { useLangue, useTextes } from '../textes.ts'

interface Props {
  bonus: Bonus
  // le département choisi sur la carte, s'il y en a un
  choisi: Departement | undefined
  onRepondre: (donne: Departement) => void
}

export function ListeDepartements({ bonus, choisi, onRepondre }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  // l'ordre alphabétique de la langue du joueur, comme la liste des régions ; les noms, eux, restent en français
  const ordre = new Intl.Collator(langue, { ignorePunctuation: true })
  const departements = [...DEPARTEMENTS].sort((a, b) => ordre.compare(a.nom, b.nom))
  const dejaRepondus = new Set(repondus(bonus).map((departement) => departement.code))
  const fini = !bonusEnCours(bonus)
  const aide = fini
    ? textes.liste.departements.finie
    : choisi === undefined
      ? textes.liste.departements.sansChoix
      : textes.liste.departements.aide

  return (
    <>
      <p className="text-sm text-discret">{aide}</p>
      {/* deux colonnes, comme les régions : 51 lignes, qui défilent dans la fenêtre */}
      <ul className="grid grid-cols-2 gap-1 text-left text-sm">
        {departements.map((departement) => {
          const nom = textes.bonus.departement(departement.nom, departement.code)
          const dejaRepondu = dejaRepondus.has(departement.code)
          return (
            <li key={departement.code}>
              <button
                type="button"
                disabled={fini || choisi === undefined || dejaRepondu}
                onClick={() => onRepondre(departement)}
                aria-label={dejaRepondu ? `${nom}, ${textes.liste.departements.dejaRepondu}` : undefined}
                className={`w-full rounded px-2 py-1 text-left enabled:hover:bg-surface disabled:text-discret ${
                  dejaRepondu ? 'line-through' : ''
                }`}
              >
                {nom}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
