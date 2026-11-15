/*
Ce dont le serveur se sert dans la base D1 de Cloudflare, et rien de plus. D1 en offre davantage ; décrire ici le
peu qu'on utilise permet de faire tourner le même code dans les tests sur une vraie base SQLite (base-de-test.ts),
sans Cloudflare. C'est l'équivalent d'une interface Java qu'on implémente deux fois : D1 en ligne, SQLite en test.

Une requête se prépare avec ses « ? », puis reçoit ses valeurs par bind() : la base les insère elle-même, à leur
place, sans jamais les lire comme du SQL. C'est ce qui empêche l'injection SQL (comme un PreparedStatement en JDBC).
 */
export interface Requete {
  bind(...valeurs: unknown[]): Requete
  all<T>(): Promise<{ results: T[] }>
  run(): Promise<unknown>
}

export interface Base {
  prepare(sql: string): Requete
  // plusieurs requêtes d'un coup, dans une seule transaction : toutes passent, ou aucune
  batch(requetes: Requete[]): Promise<unknown[]>
}
