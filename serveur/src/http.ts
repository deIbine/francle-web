/*
Ce dont chaque adresse du serveur a besoin : les en-têtes CORS, une réponse JSON, la lecture d'un corps JSON limité en
taille, l'empreinte d'un code, et le numéro du jour pour le serveur. Sorti de serveur.ts à web.9.3.1, quand les
adresses se sont multipliées (profils, ligue, classements).
 */
import { numero } from '../../src/domaine/regionDuJour.ts'

// les pages qui ont le droit de lire les réponses du serveur : le site en ligne, et le site en local pendant le
// développement (npm run dev, npm run preview). Un autre site peut toujours envoyer une requête, mais son navigateur
// ne lui montrera pas la réponse (c'est la règle « CORS » des navigateurs)
const ORIGINES = new Set([
  'https://deibine.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
])

// les en-têtes CORS : ils disent au navigateur que la page d'origine peut lire cette réponse. « Vary: Origin » prévient
// les caches que la réponse dépend de la page qui la demande. Depuis web.9.3.1 : DELETE (supprimer son profil) et
// l'en-tête Authorization (le code secret du profil)
export function entetesCors(requete: Request): Record<string, string> {
  const origine = requete.headers.get('Origin')
  if (origine === null || !ORIGINES.has(origine)) {
    return { Vary: 'Origin' }
  }
  return {
    'Access-Control-Allow-Origin': origine,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function json(requete: Request, statut: number, contenu: unknown, entetes: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(contenu), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...entetesCors(requete), ...entetes },
  })
}

// une réponse vide (204 : « fait, rien à dire »)
export function vide(requete: Request): Response {
  return new Response(null, { status: 204, headers: entetesCors(requete) })
}

// le corps d'une requête, lu comme du JSON, s'il ne dépasse pas taille octets : la valeur, 'trop-gros' ou 'illisible'
export async function lireCorps(requete: Request, taille: number): Promise<unknown> {
  const annoncee = Number(requete.headers.get('Content-Length') ?? 0)
  if (annoncee > taille) {
    return TROP_GROS
  }
  const texte = await requete.text()
  if (new TextEncoder().encode(texte).length > taille) {
    return TROP_GROS
  }
  try {
    return JSON.parse(texte)
  } catch {
    return ILLISIBLE
  }
}

export const TROP_GROS = Symbol('trop gros')
export const ILLISIBLE = Symbol('illisible')

// l'empreinte SHA-256 d'un code, en hexadécimal. Une empreinte ne se « décode » pas : on retrouve un profil en
// calculant l'empreinte du code reçu et en la cherchant, sans jamais garder le code lui-même
export async function empreinte(code: string): Promise<string> {
  const octets = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)))
  return [...octets].map((octet) => octet.toString(16).padStart(2, '0')).join('')
}

// le code secret d'une requête : l'en-tête « Authorization: Bearer <code> », ou undefined
export function codeDe(requete: Request): string | undefined {
  const entete = requete.headers.get('Authorization')
  const code = entete?.startsWith('Bearer ') ? entete.slice('Bearer '.length).trim() : undefined
  return code === '' ? undefined : code
}

// le numéro du jour pour le serveur : celui du temps universel (le serveur n'a pas de fuseau)
export function jourDuServeur(maintenant: Date): number {
  return numero(new Date(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate()))
}

// un champ texte d'un petit corps JSON ({ "pseudo": "…" }) : sa valeur, ou undefined si le corps est illisible, trop
// gros (1 Ko au plus) ou n'a pas ce champ en texte
export async function lireChamp(requete: Request, nom: string): Promise<string | undefined> {
  const corps = await lireCorps(requete, 1024)
  if (typeof corps !== 'object' || corps === null) {
    return undefined
  }
  const valeur = (corps as Record<string, unknown>)[nom]
  return typeof valeur === 'string' ? valeur : undefined
}
