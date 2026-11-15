/*
Une vraie base SQLite en mémoire, pour les tests : node:sqlite, fourni avec Node (depuis Node 22), derrière la même
interface que D1 (base.ts). D1 est du SQLite : le SQL du serveur et les migrations sont ainsi vraiment exécutés par les
tests, et non imités.
 */
// les types de Node, nommés ici : ce fichier est aussi importé par un test du site (src/ChiffresDeTous.test.tsx), dont
// la configuration TypeScript (tsconfig.app.json) ne les connaît pas, le site ne tournant pas dans Node
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Base, Requete } from './base.ts'

// le dossier des migrations, depuis la racine du projet, d'où les tests sont toujours lancés (npm test). Ni
// import.meta.url (une adresse qui n'est pas un fichier dans le faux navigateur des tests du site), ni import.meta.glob
// de Vite : son résultat est gardé dans le cache de Vitest, qui ne sait pas qu'une nouvelle migration le change (vu à
// web.9.3.2 : la migration 0003 était absente des tests, sans erreur). Lire le dossier à chaque fois ne coûte presque rien
const MIGRATIONS = join(process.cwd(), 'serveur', 'migrations')

// une base neuve, avec toutes les migrations appliquées dans l'ordre de leurs noms (0001, 0002…), comme wrangler
export function baseDeTest(): Base & {
  lignes(): Record<string, unknown>[]
  sql(texte: string): Record<string, unknown>[]
} {
  const sqlite = new DatabaseSync(':memory:')
  for (const fichier of readdirSync(MIGRATIONS).filter((nom) => nom.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(join(MIGRATIONS, fichier), 'utf8'))
  }

  function requete(sql: string, valeurs: unknown[]): Requete & { executer(): void } {
    const preparee = () => sqlite.prepare(sql)
    return {
      bind: (...nouvelles) => requete(sql, nouvelles),
      all: async <T,>() => ({ results: preparee().all(...(valeurs as never[])) as T[] }),
      run: async () => preparee().run(...(valeurs as never[])),
      executer: () => void preparee().run(...(valeurs as never[])),
    }
  }

  return {
    prepare: (sql) => requete(sql, []),
    batch: async (requetes) => {
      sqlite.exec('BEGIN')
      try {
        for (const r of requetes) {
          ;(r as ReturnType<typeof requete>).executer()
        }
        sqlite.exec('COMMIT')
      } catch (erreur) {
        sqlite.exec('ROLLBACK')
        throw erreur
      }
      return []
    },
    // tout le contenu de la table, pour vérifier ce qui a été rangé (et rien d'autre)
    lignes: () => sqlite.prepare('SELECT * FROM parties ORDER BY jour, tirage').all() as Record<string, unknown>[],
    // n'importe quelle requête, pour préparer ou vérifier la base dans un test : les lignes d'un SELECT, rien sinon
    sql: (texte) =>
      /^\s*select/i.test(texte)
        ? (sqlite.prepare(texte).all() as Record<string, unknown>[])
        : (sqlite.exec(texte), []),
  }
}
