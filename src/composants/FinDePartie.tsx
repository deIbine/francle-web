import { textePartage } from '../domaine/partage.ts'
import type { Partie } from '../domaine/partie.ts'
import { textes } from '../textes.ts'
import { CarteFrance } from './CarteFrance.tsx'
import { CompteARebours } from './CompteARebours.tsx'
import { Partager } from './Partager.tsx'

// le haut de la fenêtre de résultats, une fois la partie terminée : le résultat, la carte, le partage et le temps
// avant la région suivante (les statistiques viennent en dessous, voir Jeu)
interface Props {
  partie: Partie
  numero: number
  // l'heure de la région suivante, et ce qu'il faut faire quand elle arrive
  minuit: Date
  onMinuit: () => void
}

export function FinDePartie({ partie, numero, minuit, onMinuit }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-lg font-semibold">{textes.fin(partie)}</p>
      <p>
        {textes.reponse} <strong>{partie.cible.nom.fr}</strong>
      </p>
      <CarteFrance mode={partie.mode} cible={partie.cible.id} nom={partie.cible.nom.fr} />
      {/* grid-cols-2 : le compte à rebours et le bouton de partage côte à côte */}
      <div className="grid grid-cols-2 items-center gap-2 border-t border-gray-200 pt-3">
        <CompteARebours minuit={minuit} onMinuit={onMinuit} />
        <Partager texte={textePartage(partie, numero)} />
      </div>
    </section>
  )
}
