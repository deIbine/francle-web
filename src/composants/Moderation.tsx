/*
La modération (web.9.3.3), à l'adresse …/#moderation, que rien dans le jeu n'affiche : la liste des pseudos signalés
(les plus signalés d'abord) et ceux déjà retirés, avec de quoi retirer un pseudo du classement public ou l'y remettre
(décision 9 de web.9.3). Le joueur garde sa ligue.

La clé de modération est demandée ici, puis gardée pour la durée de l'onglet seulement (sessionStorage : effacée à la
fermeture de l'onglet, contrairement à localStorage). Sans la bonne clé, le serveur refuse tout : cette page n'a pas
besoin d'être cachée, elle est seulement inutile aux autres.
 */
import { useId, useState, type FormEvent } from 'react'
import { listeModeration, masquer, type Signale } from '../ligue.ts'
import { useTextes } from '../textes.ts'
import { BOUTON, BOUTON_DISCRET, CHAMP } from './Classements.tsx'

const CLE_SESSION = 'francle.moderation'

function cleGardee(): string {
  try {
    return sessionStorage.getItem(CLE_SESSION) ?? ''
  } catch {
    return ''
  }
}

export function Moderation() {
  const textes = useTextes()
  const champ = useId()
  const [cle, setCle] = useState(cleGardee)
  const [liste, setListe] = useState<Signale[] | 'refusee' | 'injoignable'>()

  async function charger(avecCle: string) {
    const recue = await listeModeration(avecCle)
    setListe(recue ?? 'injoignable')
    if (Array.isArray(recue)) {
      try {
        sessionStorage.setItem(CLE_SESSION, avecCle)
      } catch {
        // tant pis : la clé sera redemandée
      }
    }
  }

  async function ouvrir(evenement: FormEvent) {
    evenement.preventDefault()
    await charger(cle)
  }

  async function changer(signale: Signale) {
    if (await masquer(cle, signale.id, !signale.masque)) {
      await charger(cle)
    }
  }

  return (
    <div className="flex flex-col gap-3 text-left">
      {!Array.isArray(liste) && (
        <form onSubmit={(evenement) => void ouvrir(evenement)} className="flex flex-col gap-1.5">
          <label htmlFor={champ} className="text-sm font-semibold">
            {textes.moderation.cle}
          </label>
          <div className="flex gap-2">
            <input
              id={champ}
              type="password"
              autoComplete="off"
              value={cle}
              onChange={(evenement) => setCle(evenement.target.value)}
              className={CHAMP}
            />
            <button type="submit" className={`${BOUTON} shrink-0`} disabled={cle === ''}>
              {textes.moderation.ouvrir}
            </button>
          </div>
          {liste !== undefined && (
            <p role="alert" className="text-sm text-danger">
              {liste === 'refusee' ? textes.moderation.refusee : textes.ligue.injoignable}
            </p>
          )}
        </form>
      )}
      {Array.isArray(liste) &&
        (liste.length === 0 ? (
          <p className="text-sm">{textes.moderation.aucun}</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {liste.map((signale) => (
              <li key={signale.id} className="flex items-center justify-between gap-2">
                <span className="break-all">
                  <span className="font-semibold">{signale.pseudo}</span>{' '}
                  <span className="text-discret">
                    {textes.moderation.signalements(signale.signalements)}
                    {signale.masque && ` ${textes.moderation.retire}`}
                  </span>
                </span>
                <button type="button" className={BOUTON_DISCRET} onClick={() => void changer(signale)}>
                  {signale.masque ? textes.moderation.remettre(signale.pseudo) : textes.moderation.retirer(signale.pseudo)}
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
