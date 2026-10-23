/*
La liste des départements, ouverte par le bouton 📃 pendant le bonus (mode C), comme la liste des régions pendant la
partie : « Finistère (29) », par ordre alphabétique. Un clic sur un nom répond pour le département choisi sur la
carte, comme si on l'avait écrit dans la saisie.

Les mêmes départements que les suggestions de la saisie (proposables, dans bonus.ts) : ceux de la région dans la
version simple, les 101 dans la version difficile (depuis web.7.14 ; avant, toujours les 101).

Comme dans ListeRegions, chaque nom est un vrai bouton. Tout est désactivé tant qu'aucun département n'est choisi
sur la carte, et quand le bonus est fini ; les départements qui ont déjà leur réponse sont barrés.
 */
import { bonusEnCours, proposables, repondus, type Bonus } from '../domaine/bonus.ts'
import type { Departement } from '../domaine/departements.ts'
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
  const departements = [...proposables(bonus)].sort((a, b) => ordre.compare(a.nom, b.nom))
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
      {/* deux colonnes, comme les régions : jusqu'à 51 lignes (les 101), qui défilent dans la fenêtre */}
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
