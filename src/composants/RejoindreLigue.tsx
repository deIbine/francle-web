/*
La fenêtre qui s'ouvre avec un lien d'invitation (« …/#ligue=ABC234 », web.9.3.2) : le nom de la ligue et sa taille,
puis « Rejoindre la ligue ». Sans profil, on le crée ici même (le même bloc que dans les réglages), sans perdre
l'invitation. Déjà dans une autre ligue, on prévient qu'on la quittera (une seule ligue à la fois, décision 7).
 */
import { useEffect, useState } from 'react'
import { apercuLigue, maLigue, rejoindreLigue, type ErreurLigue, type InfosLigue } from '../ligue.ts'
import { estProfil, useProfil } from '../profil.ts'
import { useTextes } from '../textes.ts'
import { BOUTON } from './Classements.tsx'
import { ProfilReglages } from './ProfilReglages.tsx'

type Apercu = { nom: string; membres: number } | null | undefined | 'chargement'

export function RejoindreLigue({ code }: { code: string }) {
  const textes = useTextes()
  const [etat] = useProfil()
  const profil = estProfil(etat) ? etat : undefined
  const [apercu, setApercu] = useState<Apercu>('chargement')
  // la ligue actuelle du joueur (pour le prévenir qu'il la quittera), ou null
  const [actuelle, setActuelle] = useState<InfosLigue | null>()
  const [rejointe, setRejointe] = useState<InfosLigue>()
  const [erreur, setErreur] = useState<ErreurLigue>()
  // sans profil à l'ouverture, le bloc du profil reste affiché après la création : il montre le code de secours, qui
  // n'est montré qu'une fois (vu à web.9.3.4 : le bloc disparaissait aussitôt le profil créé, et le code avec lui)
  const [profilCreeIci] = useState(() => profil === undefined)

  useEffect(() => {
    let annule = false
    void apercuLigue(code).then((recu) => !annule && setApercu(recu))
    return () => {
      annule = true
    }
  }, [code])

  useEffect(() => {
    let annule = false
    if (profil !== undefined) {
      void maLigue(profil).then((ligue) => !annule && setActuelle(ligue ?? null))
    }
    return () => {
      annule = true
    }
  }, [profil])

  async function rejoindre() {
    if (profil === undefined) {
      return
    }
    const resultat = await rejoindreLigue(profil, code)
    if ('erreur' in resultat) {
      setErreur(resultat.erreur)
    } else {
      setRejointe(resultat)
    }
  }

  if (apercu === 'chargement') {
    return <p className="text-sm text-discret">{textes.ligue.chargement}</p>
  }
  if (apercu === undefined) {
    return <p className="text-sm">{textes.ligue.injoignable}</p>
  }
  if (apercu === null) {
    return <p className="text-sm">{textes.ligue.invitation.inconnue}</p>
  }
  const deja = actuelle !== undefined && actuelle !== null && actuelle.code === code
  return (
    <div className="flex flex-col gap-3 text-left">
      <p className="text-lg font-semibold break-words">{textes.ligue.invitation.apercu(apercu.nom, apercu.membres)}</p>
      {profilCreeIci && (
        <>
          {profil === undefined && <p className="text-sm">{textes.ligue.invitation.creerProfil}</p>}
          <ProfilReglages />
        </>
      )}
      {profil === undefined ? null : rejointe !== undefined ? (
        // à la place du bouton, et non de toute la fenêtre : le code de secours, s'il est affiché, le reste
        <p role="status" className="font-semibold">
          {textes.ligue.invitation.bienvenue(rejointe.nom)}
        </p>
      ) : deja ? (
        <p className="text-sm">{textes.ligue.invitation.deja}</p>
      ) : (
        <>
          {actuelle !== undefined && actuelle !== null && (
            <p className="text-sm">{textes.ligue.invitation.quitteras(actuelle.nom)}</p>
          )}
          <button type="button" className={`${BOUTON} self-start`} onClick={() => void rejoindre()}>
            {textes.ligue.invitation.rejoindre}
          </button>
        </>
      )}
      {erreur !== undefined && (
        <p role="alert" className="text-sm text-danger">
          {textes.ligue.erreurs[erreur]}
        </p>
      )}
    </div>
  )
}
