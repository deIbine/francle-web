/*
La ligue côté site (web.9.3.2) : les demandes au serveur (serveur/src/ligues.ts) et le lien d'invitation.

Chaque demande rend ce que le serveur a répondu, ou une erreur nommée : le site ne plante jamais si le serveur ne
répond pas. Un code secret que le serveur ne reconnaît plus (401) fait oublier le profil (profil.ts), comme pour
l'envoi des parties.
 */
import { lireClassement, type Classement } from './domaine/classement.ts'
import { ADRESSE } from './domaine/partage.ts'
import { normaliserCode } from './domaine/pseudo.ts'
import { demander, perdreProfil, type Profil } from './profil.ts'
import type { RefusPseudo } from './domaine/pseudo.ts'

export interface Membre {
  readonly id: string
  readonly pseudo: string
  readonly createur: boolean
}

export interface InfosLigue {
  readonly id: string
  readonly nom: string
  readonly code: string
  readonly createur: boolean
  readonly membres: readonly Membre[]
}

export type ErreurLigue = 'ligue-inconnue' | 'ligue-pleine' | RefusPseudo | 'reseau'

// une demande au serveur, et sa réponse lue en JSON ; 401 fait oublier le profil
async function appeler<T>(
  chemin: string,
  profil: Profil | undefined,
  options: RequestInit = {},
): Promise<{ statut: number; corps: T } | undefined> {
  try {
    const reponse = await demander(chemin, options, profil)
    if (reponse.status === 401) {
      perdreProfil()
    }
    return { statut: reponse.status, corps: reponse.status === 204 ? (undefined as T) : ((await reponse.json()) as T) }
  } catch {
    return undefined
  }
}

// la ligue du joueur : ses infos, null s'il n'en a pas, undefined si le serveur ne répond pas (ou ne le reconnaît plus)
export async function maLigue(profil: Profil): Promise<InfosLigue | null | undefined> {
  const reponse = await appeler<{ ligue: InfosLigue | null }>('/profil', profil)
  return reponse?.statut === 200 ? reponse.corps.ligue : undefined
}

// une demande qui rend les infos de la ligue (créer, rejoindre, retirer, changer le code), ou une erreur nommée
async function versLigue(chemin: string, profil: Profil, corps?: unknown): Promise<InfosLigue | { erreur: ErreurLigue }> {
  const reponse = await appeler<InfosLigue & { erreur?: string; raison?: RefusPseudo }>(chemin, profil, {
    method: 'POST',
    body: JSON.stringify(corps ?? {}),
  })
  if (reponse === undefined || reponse.statut >= 500 || reponse.statut === 401) {
    return { erreur: 'reseau' }
  }
  if (reponse.statut === 422) {
    return { erreur: reponse.corps.raison ?? 'mot' }
  }
  if (reponse.statut === 404) {
    return { erreur: 'ligue-inconnue' }
  }
  if (reponse.statut === 409) {
    return { erreur: 'ligue-pleine' }
  }
  return reponse.corps
}

export const creerLigue = (profil: Profil, nom: string) => versLigue('/ligues', profil, { nom })
export const rejoindreLigue = (profil: Profil, code: string) => versLigue('/ligue/rejoindre', profil, { code })
export const retirerMembre = (profil: Profil, membre: string) => versLigue('/ligue/retirer', profil, { membre })
export const changerCode = (profil: Profil) => versLigue('/ligue/code', profil)

// quitte sa ligue : vrai si c'est fait
export async function quitterLigue(profil: Profil): Promise<boolean> {
  const reponse = await appeler('/ligue/quitter', profil, { method: 'POST', body: '{}' })
  return reponse?.statut === 204
}

// l'aperçu d'une ligue par son code (avant de la rejoindre) : son nom et son nombre de membres, null si le code
// n'existe pas, undefined si le serveur ne répond pas
export async function apercuLigue(code: string): Promise<{ nom: string; membres: number } | null | undefined> {
  const reponse = await appeler<{ nom: string; membres: number }>(`/ligues/${normaliserCode(code)}`, undefined)
  return reponse === undefined || reponse.statut >= 500 ? undefined : reponse.statut === 200 ? reponse.corps : null
}

// le classement de sa ligue pour le mois donné (voir moisDuNumero), ou undefined
export async function classementLigue(profil: Profil, mois: number): Promise<Classement | undefined> {
  const reponse = await appeler<unknown>(`/ligue/classement?mois=${mois}`, profil, { cache: 'no-store' })
  return reponse?.statut === 200 ? lireClassement(reponse.corps) : undefined
}

// le lien d'invitation : « https://deibine.github.io/francle-web/#ligue=ABC234 ». Dans le fragment (après #), qui ne
// part jamais vers GitHub : seul le joueur qui l'ouvre et le serveur du jeu voient le code
const PREFIXE = '#ligue='
export function lienInvitation(code: string): string {
  return `${ADRESSE}${PREFIXE}${code}`
}

// le code d'invitation d'une adresse (« #ligue=ABC234 »), ou undefined
export function codeDuFragment(fragment: string): string | undefined {
  if (!fragment.startsWith(PREFIXE)) {
    return undefined
  }
  const code = normaliserCode(decodeURIComponent(fragment.slice(PREFIXE.length)))
  return /^[A-Z0-9]{6}$/.test(code) ? code : undefined
}

// depuis web.9.3.3 : le classement public, lisible sans profil (avec un profil, il contient aussi la ligne du joueur).
// « no-store » (depuis web.9.4.2) : toujours la réponse du moment, jamais une copie gardée par le navigateur, qui
// pouvait dater d'avant le profil ou la dernière partie (comme les chiffres du jour, envoi.ts)
export async function classementPublic(profil: Profil | undefined, mois: number): Promise<Classement | undefined> {
  const reponse = await appeler<unknown>(`/classement?mois=${mois}`, profil, { cache: 'no-store' })
  return reponse?.statut === 200 ? lireClassement(reponse.corps) : undefined
}

// signale un pseudo à la modération : vrai si c'est fait
export async function signaler(profil: Profil, vise: string): Promise<boolean> {
  const reponse = await appeler('/signaler', profil, { method: 'POST', body: JSON.stringify({ profil: vise }) })
  return reponse?.statut === 200
}

// la modération retire-t-elle le pseudo du joueur du classement public ? undefined si le serveur ne répond pas
export async function estMasque(profil: Profil): Promise<boolean | undefined> {
  const reponse = await appeler<{ masque?: boolean }>('/profil', profil)
  return reponse?.statut === 200 ? reponse.corps.masque === true : undefined
}

export interface Signale {
  readonly id: string
  readonly pseudo: string
  readonly masque: boolean
  readonly signalements: number
}

// la modération (depuis web.9.3.3) : la clé de modération remplace le code d'un profil dans l'en-tête Authorization
const cleDeModeration = (cle: string) => ({ id: '', pseudo: '', code: cle })

// les pseudos signalés ou retirés ; 'refusee' si la clé n'est pas la bonne, undefined si le serveur ne répond pas
export async function listeModeration(cle: string): Promise<Signale[] | 'refusee' | undefined> {
  try {
    const reponse = await demander('/moderation', {}, cleDeModeration(cle))
    if (reponse.status === 403) {
      return 'refusee'
    }
    return reponse.ok ? ((await reponse.json()) as Signale[]) : undefined
  } catch {
    return undefined
  }
}

// retire un pseudo du classement public (masque), ou l'y remet : vrai si c'est fait
export async function masquer(cle: string, profil: string, masque: boolean): Promise<boolean> {
  try {
    const reponse = await demander(
      '/moderation/masquer',
      { method: 'POST', body: JSON.stringify({ profil, masque }) },
      cleDeModeration(cle),
    )
    return reponse.ok
  } catch {
    return false
  }
}
