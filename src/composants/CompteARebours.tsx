import { useEffect, useState } from 'react'
import { duree } from '../domaine/temps.ts'
import { useTextes } from '../textes.ts'

// le temps qui reste avant la région suivante (à « minuit », le minuit qui suit le jour de la partie), mis à jour
// chaque seconde. Il ne fait qu'afficher : c'est App qui passe à la région suivante (useJour dans App.tsx), que la
// partie soit finie ou non
export function CompteARebours({ minuit }: { minuit: Date }) {
  const textes = useTextes()
  const [maintenant, setMaintenant] = useState(() => new Date())
  const reste = minuit.getTime() - maintenant.getTime()

  useEffect(() => {
    // setInterval : appelle la fonction toutes les 1000 ms, comme un javax.swing.Timer
    const minuterie = setInterval(() => setMaintenant(new Date()), 1000)
    // la fonction renvoyée est appelée quand le composant disparaît : on arrête la minuterie, sinon elle
    // continuerait de tourner pour rien
    return () => clearInterval(minuterie)
  }, [])

  return (
    <p className="text-sm">
      {textes.prochaine}{' '}
      <time className="block text-2xl font-bold tabular-nums" aria-live="off">
        {duree(reste)}
      </time>
    </p>
  )
}
