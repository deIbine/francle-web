/*
Un classement du mois en tableau (web.9.3.2) : le rang, le joueur, le total des points, la moyenne et le nombre de
parties. La ligne du joueur est mise en avant, et dite « (toi) » pour un lecteur d'écran comme pour les yeux. Servira
aussi au classement public (web.9.3.3).

Un vrai <table> plutôt que des <div> : un lecteur d'écran annonce la colonne de chaque nombre (« Points, 23 »), et
permet de se déplacer de case en case.
 */
import { moyenne, type LigneClassement } from '../domaine/classement.ts'
import { useLangue, useTextes } from '../textes.ts'

interface Props {
  lignes: readonly LigneClassement[]
  // la ligne du joueur, si elle n'est pas parmi les lignes (classement public : seuls les premiers sont envoyés)
  moi?: LigneClassement
  // l'identifiant du profil du joueur, pour mettre sa ligne en avant
  monId: string
  // le nom du tableau, pour les lecteurs d'écran (« Classement de « La famille », octobre 2026 »)
  titre: string
  // ce qui s'ajoute au bout de chaque ligne (le bouton « Signaler » du classement public, web.9.3.3)
  enPlus?: (ligne: LigneClassement) => React.ReactNode
}

export function TableauClassement({ lignes, moi, monId, titre, enPlus }: Props) {
  const textes = useTextes()
  const langue = useLangue()
  const ligne = (l: LigneClassement, separee = false) => {
    const cEstMoi = l.id === monId
    return (
      <tr
        key={l.id}
        className={`${cEstMoi ? 'bg-francle-fonce/15 font-semibold' : ''} ${separee ? 'border-t-2 border-dashed border-bord' : ''}`}
      >
        <td className="px-2 py-1 text-right align-top tabular-nums">{l.rang}</td>
        {/* text-left : la fenêtre centre son texte, la colonne des pseudos suit son titre, à gauche. La moyenne et les
            parties sous le pseudo, en petit (depuis web.9.3.4) : dans leur propre colonne, à 375 pixels et avec le
            drapeau « Signaler », il ne restait au pseudo qu'une colonne étroite, coupée au milieu des mots.
            break-words : un pseudo trop long passe à la ligne entre deux mots, ou au pire dans un mot très long */}
        <td className="px-2 py-1 text-left break-words">
          {l.pseudo}
          {cEstMoi && <span className="font-normal text-discret"> {textes.ligue.toi}</span>}
          <span className="block text-xs font-normal text-discret tabular-nums">
            {textes.ligue.detail(moyenne(l).toLocaleString(langue), l.parties)}
          </span>
        </td>
        <td className="px-2 py-1 text-right align-top tabular-nums">{l.total}</td>
        {enPlus && <td className="px-1 py-1 text-right align-top">{enPlus(l)}</td>}
      </tr>
    )
  }
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{titre}</caption>
      <thead>
        <tr className="border-b border-bord text-xs text-discret">
          <th scope="col" className="px-2 py-1 text-right font-normal">
            {textes.ligue.rang}
          </th>
          <th scope="col" className="px-2 py-1 text-left font-normal">
            {textes.ligue.joueur}
          </th>
          <th scope="col" className="px-2 py-1 text-right font-normal">
            {textes.ligue.points}
          </th>
          {/* depuis web.9.4.2 : un vrai titre de colonne, lu seulement par les lecteurs d'écran (une case vide n'était
              pas annoncée, et la colonne des drapeaux restait sans nom) */}
          {enPlus && (
            <th scope="col" className="px-1 py-1 font-normal">
              <span className="sr-only">{textes.public.colonneSignaler}</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {lignes.map((l) => ligne(l))}
        {moi !== undefined && ligne(moi, true)}
      </tbody>
    </table>
  )
}
