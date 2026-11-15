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
  // la clé de modération (depuis web.9.3.3) : un secret du Worker, rangé par l'utilisateur dans Cloudflare
  // (« npx wrangler secret put MODERATION », ou le tableau de bord), jamais dans le dépôt. Absente : modération fermée
  readonly MODERATION?: string
}

export default {
  fetch(requete: Request, env: Env): Promise<Response> {
    return traiter(requete, env.BASE, new Date(), env.MODERATION)
  },
  scheduled(_controle: unknown, env: Env): Promise<void> {
    return entretien(env.BASE, new Date())
  },
}
