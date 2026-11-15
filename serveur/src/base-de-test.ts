/*
Une vraie base SQLite en mémoire, pour les tests : node:sqlite, fourni avec Node (depuis Node 22), derrière la même
interface que D1 (base.ts). D1 est du SQLite : le SQL du serveur et les migrations sont ainsi vraiment exécutés par les
tests, et non imités.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import type { Base, Requete } from './base.ts'

const MIGRATIONS = new URL('../migrations/', import.meta.url)

// une base neuve, avec toutes les migrations appliquées dans l'ordre, comme le fait wrangler en ligne
export function baseDeTest(): Base & { lignes(): Record<string, unknown>[] } {
  const sqlite = new DatabaseSync(':memory:')
  for (const fichier of readdirSync(MIGRATIONS).filter((nom) => nom.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(fichier, MIGRATIONS), 'utf8'))
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
  }
}
