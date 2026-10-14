import { useEffect, useState } from 'react'
import { duree } from '../domaine/temps.ts'
import { textes } from '../textes.ts'

// le temps qui reste avant la région suivante (à « minuit », le minuit qui suit le jour de la partie), mis à jour
// chaque seconde. À minuit, prévient le jeu (onMinuit). Si la page est restée ouverte depuis la veille, minuit est
// déjà passé : le jeu est prévenu tout de suite, et passe à la région du jour
export function CompteARebours({ minuit, onMinuit }: { minuit: Date; onMinuit: () => void }) {
  const [maintenant, setMaintenant] = useState(() => new Date())
  const reste = minuit.getTime() - maintenant.getTime()

  useEffect(() => {
    // setInterval : appelle la fonction toutes les 1000 ms, comme un javax.swing.Timer
    const minuterie = setInterval(() => setMaintenant(new Date()), 1000)
    // la fonction renvoyée est appelée quand le composant disparaît : on arrête la minuterie, sinon elle
    // continuerait de tourner pour rien
    return () => clearInterval(minuterie)
  }, [])

  useEffect(() => {
    if (reste <= 0) {
      onMinuit()
    }
  }, [reste, onMinuit])

  return (
    <p className="text-sm">
      {textes.prochaine}{' '}
      <time className="block text-2xl font-bold tabular-nums" aria-live="off">
        {duree(reste)}
      </time>
    </p>
  )
}
