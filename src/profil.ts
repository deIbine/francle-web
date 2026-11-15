/*
Le profil du joueur côté site (web.9.3.1) : gardé dans le navigateur, sous sa propre clé, avec le code secret qui
prouve au serveur que c'est lui. Un seul appareil par profil (décision 2 de web.9.3) : si le profil est repris ailleurs
avec le code de secours, ou effacé (par le joueur, ou après 12 mois sans partie), le serveur ne reconnaît plus ce code ;
le site l'oublie alors, et le dit au joueur dans les réglages.

Ce que la clé peut contenir :
    { "id": "…", "pseudo": "Zoé", "code": "…" }   un profil
    { "perdu": "Zoé" }                             un profil que le serveur ne reconnaît plus
 */
import { useEffect, useState } from 'react'
import { ADRESSE_SERVEUR } from './adresse.ts'
import type { RefusPseudo } from './domaine/pseudo.ts'
import { useChangementAilleurs } from './onglets.ts'

export const CLE_PROFIL = 'francle.profil.v1'

export interface Profil {
  readonly id: string
  readonly pseudo: string
  readonly code: string
}

export type EtatProfil = Profil | { readonly perdu: string } | undefined

export function lireProfil(stockage: Storage = localStorage): EtatProfil {
  try {
    const lu: unknown = JSON.parse(stockage.getItem(CLE_PROFIL) ?? 'null')
    const objet = lu as Record<string, unknown> | null
    if (typeof objet?.id === 'string' && typeof objet.pseudo === 'string' && typeof objet.code === 'string') {
      return { id: objet.id, pseudo: objet.pseudo, code: objet.code }
    }
    if (typeof objet?.perdu === 'string') {
      return { perdu: objet.perdu }
    }
  } catch {
    // stockage refusé ou abîmé : pas de profil
  }
  return undefined
}

export function estProfil(etat: EtatProfil): etat is Profil {
  return etat !== undefined && 'code' in etat
}

// le profil, s'il y en a un (et pas seulement le souvenir d'un profil perdu)
export function profilActuel(stockage: Storage = localStorage): Profil | undefined {
  const etat = lireProfil(stockage)
  return estProfil(etat) ? etat : undefined
}

// l'évènement qui prévient tous les composants de CETTE page qu'un profil a changé. Le navigateur ne prévient que les
// autres onglets (l'évènement « storage ») : sans cela, un profil créé dans la fenêtre d'invitation restait inconnu
// de cette fenêtre même (vu à web.9.3.2), chaque composant ayant sa propre copie du profil
const CHANGEMENT = 'francle-profil'

export function ecrireProfil(etat: EtatProfil, stockage: Storage = localStorage): void {
  try {
    if (etat === undefined) {
      stockage.removeItem(CLE_PROFIL)
    } else {
      stockage.setItem(CLE_PROFIL, JSON.stringify(etat))
    }
  } catch {
    // stockage refusé : le profil ne vaut que pour cette visite
  }
  window.dispatchEvent(new Event(CHANGEMENT))
}

// le serveur ne reconnaît plus le code : on oublie le profil, en gardant son pseudo pour le dire au joueur
export function perdreProfil(stockage: Storage = localStorage): void {
  const etat = lireProfil(stockage)
  if (estProfil(etat)) {
    ecrireProfil({ perdu: etat.pseudo }, stockage)
  }
}

// le profil, tenu à jour quand il change, dans cette page (n'importe quel composant, ou l'envoi des parties qui
// découvre un profil perdu) ou dans un autre onglet
export function useProfil(): [EtatProfil, (etat: EtatProfil) => void] {
  const [etat, setEtat] = useState(() => lireProfil())
  useChangementAilleurs(CLE_PROFIL, () => setEtat(lireProfil()))
  useEffect(() => {
    const relire = () => setEtat(lireProfil())
    window.addEventListener(CHANGEMENT, relire)
    return () => window.removeEventListener(CHANGEMENT, relire)
  }, [])
  return [etat, ecrireProfil]
}

// une requête au serveur pour le profil : le code secret dans l'en-tête Authorization (jamais dans l'adresse)
export function demander(chemin: string, options: RequestInit = {}, profil?: Profil): Promise<Response> {
  return fetch(`${ADRESSE_SERVEUR}${chemin}`, {
    ...options,
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'text/plain;charset=UTF-8' }),
      ...(profil && { Authorization: `Bearer ${profil.code}` }),
    },
    signal: AbortSignal.timeout(10_000),
  })
}

export type ErreurProfil = 'pris' | RefusPseudo | 'secours-inconnu' | 'reseau'

// crée un profil : le profil et son code de secours (à montrer une seule fois), ou la raison du refus
export async function creerProfil(pseudo: string): Promise<{ profil: Profil; secours: string } | { erreur: ErreurProfil }> {
  try {
    const reponse = await demander('/profils', { method: 'POST', body: JSON.stringify({ pseudo }) })
    const corps = (await reponse.json()) as Record<string, string>
    if (reponse.status === 201) {
      return { profil: { id: corps.id, pseudo: corps.pseudo, code: corps.code }, secours: corps.secours }
    }
    if (reponse.status === 409) {
      return { erreur: 'pris' }
    }
    if (reponse.status === 422) {
      return { erreur: corps.raison as RefusPseudo }
    }
  } catch {
    // pas de réseau, ou une réponse illisible
  }
  return { erreur: 'reseau' }
}

// retrouve un profil par son code de secours ; ce navigateur reçoit un nouveau code secret
export async function restaurerProfil(secours: string): Promise<Profil | { erreur: ErreurProfil }> {
  try {
    const reponse = await demander('/profil/secours', { method: 'POST', body: JSON.stringify({ secours }) })
    if (reponse.status === 404) {
      return { erreur: 'secours-inconnu' }
    }
    if (reponse.ok) {
      const corps = (await reponse.json()) as Record<string, string>
      return { id: corps.id, pseudo: corps.pseudo, code: corps.code }
    }
  } catch {
    // pas de réseau
  }
  return { erreur: 'reseau' }
}

// efface le profil sur le serveur : vrai si c'est fait (ou s'il n'existait déjà plus)
export async function supprimerProfil(profil: Profil): Promise<boolean> {
  try {
    const reponse = await demander('/profil', { method: 'DELETE' }, profil)
    return reponse.ok || reponse.status === 401
  } catch {
    return false
  }
}
