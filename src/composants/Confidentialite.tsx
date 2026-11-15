/*
La page de confidentialité (web.9.2.3) : ce qui est envoyé, pourquoi, où, combien de temps, comment refuser, et à
qui écrire. Dans une fenêtre, comme « Comment jouer », ouverte par le bas de page, par les réglages, ou par l'adresse
…/#confidentialite (un lien qu'on peut donner).

Pour demander la suppression de ses parties, le joueur doit pouvoir les désigner : rien ne les relie à lui, sauf les
numéros tirés gardés dans son navigateur. On les montre donc ici, à recopier dans le ticket.
 */
import { dateDuNumero } from '../domaine/regionDuJour.ts'
import { lire } from '../sauvegarde.ts'
import { useLangue, useTextes } from '../textes.ts'

// les tickets du dépôt (décision 9 de web.9.2) : publics, sans compte à créer chez nous
const TICKETS = 'https://github.com/deIbine/francle-web/issues/new'

export function Confidentialite() {
  const textes = useTextes()
  const langue = useLangue()
  // les parties déjà envoyées au moins une fois, avec leur numéro tiré, de la plus récente à la plus ancienne
  const envoyees = [...lire()]
    .filter(([, partie]) => partie.tirage !== undefined && partie.envoyee !== undefined)
    .sort(([a], [b]) => b - a)
  return (
    <div className="flex flex-col gap-4 text-left text-sm">
      {textes.confidentialite.parties.map((partie) => (
        <section key={partie.titre} className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold">{partie.titre}</h3>
          {partie.textes.map((texte) => (
            <p key={texte}>{texte}</p>
          ))}
        </section>
      ))}
      <a
        href={TICKETS}
        target="_blank"
        rel="noreferrer"
        className="self-start font-semibold text-francle-fonce underline dark:text-francle-clair"
      >
        {textes.confidentialite.ticket}
      </a>
      {/* <details> : un bloc replié, que le navigateur sait ouvrir et fermer tout seul (au clic et au clavier) */}
      <details className="rounded bg-surface p-2">
        <summary className="cursor-pointer font-semibold">{textes.confidentialite.numeros}</summary>
        {envoyees.length === 0 ? (
          <p className="mt-2 text-discret">{textes.confidentialite.aucunNumero}</p>
        ) : (
          // select-all : un clic sélectionne toute la ligne, prête à copier ; break-all : les 32 chiffres passent à la
          // ligne sur téléphone plutôt que de dépasser
          <ul className="mt-2 flex flex-col gap-1 font-mono text-xs break-all">
            {envoyees.map(([jour, partie]) => (
              <li key={jour} className="select-all">
                {textes.confidentialite.numero(dateDuNumero(jour).toLocaleDateString(langue), partie.tirage!)}
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  )
}
