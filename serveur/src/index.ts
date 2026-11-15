/*
Le point d'entrée du Worker, celui que nomme « main » dans wrangler.jsonc. Cloudflare appelle :
- fetch() à chaque requête, avec env : ce que la configuration y a branché, ici la base D1 sous le nom BASE
  (« binding ») ;
- scheduled() chaque nuit (depuis web.9.3.1), d'après « triggers » dans wrangler.jsonc : l'entretien, qui efface ce
  qui a dépassé sa durée de conservation.
Tout le travail est dans serveur.ts et profils.ts, que les tests appellent directement.
 */
import type { Base } from './base.ts'
import { entretien } from './profils.ts'
import { traiter } from './serveur.ts'

interface Env {
  readonly BASE: Base
}

export default {
  fetch(requete: Request, env: Env): Promise<Response> {
    return traiter(requete, env.BASE, new Date())
  },
  scheduled(_controle: unknown, env: Env): Promise<void> {
    return entretien(env.BASE, new Date())
  },
}
