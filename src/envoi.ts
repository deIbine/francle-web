/*
Le site et le serveur des chiffres de tous (web.9.2.2) : envoyer les parties finies, demander les chiffres d'un jour.

Le jeu ne dépend jamais du serveur : s'il ne répond pas (quota du jour dépassé, pas de réseau, serveur en panne), rien
ne s'affiche de plus, aucun message n'interrompt le joueur, et les parties non reçues repartiront la fois suivante
(leur empreinte n'a pas été notée, voir sauvegarde.ts). C'est la règle « continuer à marcher si le serveur ne répond
pas » de docs/plan.md.

fetch() est la fonction du navigateur pour faire une requête HTTP ; elle rend une promesse (une Promise, l'équivalent
d'un CompletableFuture en Java) : la réponse arrivera plus tard, le jeu continue en attendant.
 */
import {
  lireChiffres,
  PARTIES_PAR_ENVOI,
  type ChiffresDuJour,
  type EnvoiAuServeur,
  type PartieEnvoyee,
} from './domaine/chiffres.ts'
import { VERSION_TRANSMISSION } from './domaine/transmission.ts'
import { lireReglages } from './reglages.ts'
import { aEnvoyer, marquerEnvoyees } from './sauvegarde.ts'

// l'adresse du serveur. VITE_SERVEUR la remplace pendant le développement (par exemple
// VITE_SERVEUR=http://localhost:8787 npm run dev, avec le serveur lancé en local par « npm run dev » dans serveur/)
export const ADRESSE_SERVEUR: string = import.meta.env.VITE_SERVEUR ?? 'https://chiffres.francle.workers.dev'

// au-delà, on abandonne : un serveur qui ne répond pas ne doit pas laisser une requête pendante
const DELAI = 10_000 // en millisecondes

// envoie des parties au serveur, par morceaux (un long historique dépasserait la taille permise d'un envoi) ; rend
// celles qu'il a bien reçues. Le JSON part en « text/plain » : c'est une requête « simple » pour le navigateur, sans
// question préalable au serveur (preflight), donc une requête au lieu de deux
async function envoyer(parties: readonly PartieEnvoyee[]): Promise<PartieEnvoyee[]> {
  const recues: PartieEnvoyee[] = []
  for (let debut = 0; debut < parties.length; debut += PARTIES_PAR_ENVOI) {
    const morceau = parties.slice(debut, debut + PARTIES_PAR_ENVOI)
    const envoi: EnvoiAuServeur = { v: VERSION_TRANSMISSION, parties: morceau }
    const reponse = await fetch(`${ADRESSE_SERVEUR}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(envoi),
      signal: AbortSignal.timeout(DELAI),
    })
    if (!reponse.ok) {
      break
    }
    recues.push(...morceau)
  }
  return recues
}

// les envois l'un après l'autre : deux synchronisations lancées coup sur coup (la victoire, puis la première réponse
// du bonus) enverraient sinon deux fois la même partie en même temps
let file: Promise<void> = Promise.resolve()

// envoie au serveur tout ce qui ne l'a pas encore été, et le note dans la sauvegarde. Ne rejette jamais : une erreur
// (réseau, serveur) laisse simplement les parties à envoyer pour la prochaine fois. Le réglage est relu ici, au moment
// d'envoyer, et pas seulement par l'appelant : refusé (même dans un autre onglet, une seconde plus tôt), rien ne part
export function synchroniser(): Promise<void> {
  file = file.then(async () => {
    if (!lireReglages().envoi) {
      return
    }
    try {
      const parties = aEnvoyer()
      if (parties.length > 0) {
        marquerEnvoyees(await envoyer(parties))
      }
    } catch {
      // pas de réseau, serveur en panne, délai dépassé : on réessaiera
    }
  })
  return file
}

// les chiffres de tous pour le jour n° jour ; undefined si le serveur ne répond pas, ou répond autre chose qu'attendu.
// « no-store » : toujours la réponse du moment, pour que la partie qu'on vient d'envoyer y soit
export async function chiffresDuJour(jour: number): Promise<ChiffresDuJour | undefined> {
  try {
    const reponse = await fetch(`${ADRESSE_SERVEUR}/chiffres/${jour}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(DELAI),
    })
    return reponse.ok ? lireChiffres(await reponse.json()) : undefined
  } catch {
    return undefined
  }
}
