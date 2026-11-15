import { useTextes } from '../textes.ts'

// les adresses citées en bas de page. La licence ouverte Etalab demande de citer la source des contours
const LIENS = {
  contours: 'https://github.com/gregoiredavid/france-geojson',
  licence: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
  worldle: 'https://worldle.teuteuf.fr/',
  code: 'https://github.com/deIbine/francle-web',
}

// le bas de page : les sources, l'inspiration, le code, ce que le jeu fait des données, et la page de confidentialité
// (depuis web.9.2.3 : « aucune donnée collectée » n'est plus vrai quand le joueur accepte l'envoi)
export function Credits({ onConfidentialite }: { onConfidentialite: () => void }) {
  const textes = useTextes()
  const lien = 'underline hover:text-texte'
  return (
    // <footer> : le pied de page, une « région » que les lecteurs d'écran savent trouver
    // mt-auto : poussé en bas de l'écran quand la page est courte
    <footer className="mt-auto flex flex-col gap-1 border-t border-bord pt-3 text-xs text-discret">
      <p>
        <a className={lien} href={LIENS.contours}>
          {textes.credits.contours}
        </a>{' '}
        (
        <a className={lien} href={LIENS.licence}>
          {textes.credits.licence}
        </a>
        ) ·{' '}
        <a className={lien} href={LIENS.worldle}>
          {textes.credits.inspiration}
        </a>{' '}
        ·{' '}
        <a className={lien} href={LIENS.code}>
          {textes.credits.code}
        </a>
      </p>
      <p>
        {textes.credits.vie}{' '}
        {/* un bouton qui a l'air d'un lien : il ouvre une fenêtre, il ne mène pas à une autre page */}
        <button type="button" onClick={onConfidentialite} className={lien}>
          {textes.credits.confidentialite}
        </button>
      </p>
    </footer>
  )
}
