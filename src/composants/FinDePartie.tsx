import type { Partie } from '../domaine/partie.ts'
import { textes } from '../textes.ts'
import { CarteFrance } from './CarteFrance.tsx'

// ce qui s'affiche quand la partie est terminée : le résultat, la réponse et la carte.
// (À web.3, ce contenu passera dans une fenêtre, avec les statistiques et le partage.)
export function FinDePartie({ partie }: { partie: Partie }) {
  const message =
    partie.etat === 'gagnee'
      ? textes.gagnee(partie.essais.length)
      : partie.etat === 'perdue'
        ? textes.perdue
        : textes.abandonnee
  return (
    // role="status" : un lecteur d'écran annonce ce bloc dès qu'il apparaît
    <section role="status" className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <p className="text-lg font-semibold">{message}</p>
      <p>
        {textes.reponse} <strong>{partie.cible.nom.fr}</strong>
      </p>
      <CarteFrance mode={partie.mode} cible={partie.cible.id} nom={partie.cible.nom.fr} />
    </section>
  )
}
