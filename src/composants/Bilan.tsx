import type { ReactNode } from 'react'
import { bonusEnCours, type Bonus } from '../domaine/bonus.ts'
import type { Partie } from '../domaine/partie.ts'
import { finDuBonus, useLangue, useTextes } from '../textes.ts'

interface Props {
  partie: Partie
  // partie libre : « Perdu ! » plutôt que « ce sera pour demain »
  libre?: boolean
  // le bonus des départements, s'il a été joué : sa phrase de fin, une fois fini
  bonus?: Bonus
  // les boutons : « Voir les résultats » et « Partager » pour la partie du jour, « Nouvelle partie » pour la libre
  children: ReactNode
}

// le bilan sous le plateau, une fois la partie finie (depuis web.7.16.4, comme la maquette) : le résultat, celui du
// bonus, et les boutons, dans un seul bloc. Avant, la page répétait le résultat : la fin du bonus, puis « Bravo… La
// réponse : … ». <section> avec un nom : une « région » que les lecteurs d'écran (et les tests) savent trouver
export function Bilan({ partie, libre = false, bonus, children }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  const nom = partie.cible.nom[langue]
  return (
    <section aria-label={textes.bilan.titre} className="flex flex-col items-center gap-2 rounded-lg bg-surface p-3">
      <p className="text-lg font-bold">
        {partie.etat === 'gagnee'
          ? textes.bilan.gagnee(nom, partie.essais.length)
          : `${textes.fin(partie, libre)} ${textes.reponse} ${nom}`}
      </p>
      {bonus !== undefined && !bonusEnCours(bonus) && <p>{finDuBonus(bonus, textes)}</p>}
      {/* flex-wrap : les boutons côte à côte, à la ligne s'ils ne tiennent pas */}
      <div className="flex flex-wrap items-start justify-center gap-2">{children}</div>
    </section>
  )
}
