/*
Quitter une ligue et effacer des profils (depuis web.9.3.2) : des requêtes écrites une seule fois, pour « Quitter la
ligue », « Supprimer mon profil » et l'effacement après 12 mois. Ainsi rien de rattaché à un profil ne peut être oublié
dans l'un des trois.

condition : la fin d'un « WHERE » sur la table profils, avec un seul « ? » (« id = ? », « dernier_jour < ? »), qui
désigne les profils qui partent. Elle est insérée dans le SQL : elle ne vient jamais du joueur, seulement de ce code.
 */
import type { Base, Requete } from './base.ts'

// les profils qui partent quittent leur ligue. Une ligue dont le créateur part passe au membre restant le plus ancien ;
// une ligue sans membre restant disparaît. L'ordre compte : on efface d'abord les ligues vides, puis on transmet les
// autres, enfin on retire les profils de leur ligue
export function quitterLigues(base: Base, condition: string, valeur: unknown): Requete[] {
  const partants = `SELECT id FROM profils WHERE ${condition}`
  const restants = `SELECT p.id FROM profils p WHERE p.ligue = ligues.id AND p.id NOT IN (${partants})`
  return [
    base.prepare(`DELETE FROM ligues WHERE id IN (SELECT ligue FROM profils WHERE ${condition}) AND NOT EXISTS (${restants})`).bind(valeur, valeur),
    // « AND EXISTS » : seulement une ligue où il reste quelqu'un, pour ne jamais lui ôter son créateur
    base
      .prepare(
        `UPDATE ligues SET createur = (${restants} ORDER BY p.entree_ligue LIMIT 1)
         WHERE createur IN (${partants}) AND EXISTS (${restants})`,
      )
      .bind(valeur, valeur, valeur),
    base.prepare(`UPDATE profils SET ligue = NULL, entree_ligue = NULL WHERE ${condition}`).bind(valeur),
  ]
}

// efface des profils et tout ce qui leur est rattaché : leur place dans la ligue, leurs parties
export function effacerProfils(base: Base, condition: string, valeur: unknown): Requete[] {
  return [
    ...quitterLigues(base, condition, valeur),
    base.prepare(`DELETE FROM parties_profil WHERE profil IN (SELECT id FROM profils WHERE ${condition})`).bind(valeur),
    base.prepare(`DELETE FROM profils WHERE ${condition}`).bind(valeur),
  ]
}
