/*
La fenêtre qui s'ouvre avec un lien d'invitation (« …/#ligue=ABC234 », web.9.3.2) : le nom de la ligue et sa taille,
puis « Rejoindre la ligue ». Sans profil, on le crée ici même (le même bloc que dans les réglages), sans perdre
l'invitation. Déjà dans une autre ligue, on prévient qu'on la quittera (une seule ligue à la fois, décision 7).
 */
import { useEffect, useState } from 'react'
import { apercuLigue, maLigue, rejoindreLigue, type ErreurLigue, type InfosLigue } from '../ligue.ts'
import { estProfil, useProfil } from '../profil.ts'
import { ouvrirClassement } from '../reglages.ts'
import { useTextes } from '../textes.ts'
import { BOUTON } from './Classements.tsx'
import { ProfilReglages } from './ProfilReglages.tsx'

type Apercu = { nom: string; membres: number } | null | undefined | 'chargement'

export function RejoindreLigue({ code }: { code: string }) {
  const textes = useTextes()
  const [etat] = useProfil()
  const profil = estProfil(etat) ? etat : undefined
  const [apercu, setApercu] = useState<Apercu>('chargement')
  // la ligue actuelle du joueur (pour le prévenir qu'il la quittera) : null s'il n'en a pas, 'injoignable' si le
  // serveur n'a pas répondu, undefined tant qu'on attend. Depuis web.9.4.3, ces quatre cas restent distincts : avant,
  // un serveur muet était pris pour « pas de ligue », et « Rejoindre » s'affichait avant la réponse, sans l'avertissement
  const [actuelle, setActuelle] = useState<InfosLigue | null | 'injoignable'>()
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
      void maLigue(profil).then((ligue) => !annule && setActuelle(ligue === undefined ? 'injoignable' : ligue))
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
  // la ligue que le joueur quittera en rejoignant celle-ci, s'il en a une
  const quittee = typeof actuelle === 'object' && actuelle !== null ? actuelle : undefined
  const deja = quittee?.code === code
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
        // depuis web.9.5.4, un bouton qui mène au classement, plutôt qu'un texte qui renvoyait aux « statistiques (📊) »
        <div className="flex flex-col gap-2">
          <p role="status" className="font-semibold">
            {textes.ligue.invitation.bienvenue(rejointe.nom)}
          </p>
          <button type="button" className={`${BOUTON} self-start`} onClick={ouvrirClassement}>
            {textes.ligue.invitation.voirClassement}
          </button>
        </div>
      ) : actuelle === undefined ? (
        // pas de bouton avant de savoir si le joueur quittera une ligue : il pourrait cliquer avant l'avertissement
        <p className="text-sm text-discret">{textes.ligue.chargement}</p>
      ) : actuelle === 'injoignable' ? (
        <p className="text-sm">{textes.ligue.injoignable}</p>
      ) : deja ? (
        <p className="text-sm">{textes.ligue.invitation.deja}</p>
      ) : (
        <>
          {quittee !== undefined && <p className="text-sm">{textes.ligue.invitation.quitteras(quittee.nom)}</p>}
          {/* le bouton dit lui-même qu'on quitte l'autre ligue : c'est la confirmation de la décision 7 de web.9.3 */}
          <button type="button" className={`${BOUTON} self-start`} onClick={() => void rejoindre()}>
            {quittee === undefined
              ? textes.ligue.invitation.rejoindre
              : textes.ligue.invitation.quitterEtRejoindre(quittee.nom)}
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
