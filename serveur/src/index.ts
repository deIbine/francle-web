/*
Le point d'entrée du Worker, celui que nomme « main » dans wrangler.jsonc. Cloudflare appelle fetch() à chaque requête,
avec env : ce que la configuration y a branché, ici la base D1 sous le nom BASE (« binding »). Tout le travail est
dans serveur.ts, que les tests appellent directement.
 */
import type { Base } from './base.ts'
import { traiter } from './serveur.ts'

interface Env {
  readonly BASE: Base
}

export default {
  fetch(requete: Request, env: Env): Promise<Response> {
    return traiter(requete, env.BASE, new Date())
  },
}
