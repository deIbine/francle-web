/*
Une vraie base SQLite en mémoire, pour les tests : node:sqlite, fourni avec Node (depuis Node 22), derrière la même
interface que D1 (base.ts). D1 est du SQLite : le SQL du serveur et les migrations sont ainsi vraiment exécutés par les
tests, et non imités.
 */
// les types de Node, nommés ici : ce fichier est aussi importé par un test du site (src/ChiffresDeTous.test.tsx), dont
// la configuration TypeScript (tsconfig.app.json) ne les connaît pas, le site ne tournant pas dans Node
/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite'
import type { Base, Requete } from './base.ts'

// toutes les migrations, lues comme du texte au moment de construire les tests : import.meta.glob est une fonction de
// Vite (donc de Vitest), qui marche aussi bien dans les tests du serveur que dans ceux du site (faux navigateur), où
// l'on ne peut pas lire un dossier du disque par son adresse. « ?raw » : le contenu du fichier, tel quel
const MIGRATIONS = import.meta.glob<string>('../migrations/*.sql', { query: '?raw', import: 'default', eager: true })

// une base neuve, avec toutes les migrations appliquées dans l'ordre de leurs noms (0001, 0002…), comme wrangler
export function baseDeTest(): Base & { lignes(): Record<string, unknown>[] } {
  const sqlite = new DatabaseSync(':memory:')
  for (const fichier of Object.keys(MIGRATIONS).sort()) {
    sqlite.exec(MIGRATIONS[fichier])
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
