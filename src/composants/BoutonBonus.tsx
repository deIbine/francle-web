import { useTextes } from '../textes.ts'

// le bouton qui lance le bonus des départements quand il n'a pas commencé tout seul : on revient sur une partie déjà
// gagnée, ou on l'a passé avant toute réponse
export function BoutonBonus({ onJouer }: { onJouer: () => void }) {
  const textes = useTextes()
  return (
    <button
      type="button"
      onClick={onJouer}
      className="rounded border border-francle-fonce px-4 py-2 font-semibold text-francle-fonce hover:bg-surface dark:border-francle-clair dark:text-francle-clair"
    >
      {textes.bonus.jouer}
    </button>
  )
}
