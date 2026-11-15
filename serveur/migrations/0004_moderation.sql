-- Le classement public et sa modération (web.9.3.3). Tout profil apparaît dans le classement public (décision 8 de
-- web.9.3) ; un bouton « Signaler », et le retrait d'un pseudo du public par la modération (décision 9). Une migration
-- qui ne fait qu'ajouter.
--
-- profils.masque   1 : le pseudo est retiré du classement public par la modération (le joueur garde sa ligue)
ALTER TABLE profils ADD COLUMN masque INTEGER NOT NULL DEFAULT 0;

-- signalements : qui a signalé qui. Un joueur ne signale un pseudo qu'une fois (la clé primaire sur les deux)
CREATE TABLE IF NOT EXISTS signalements (
  profil TEXT NOT NULL,
  par TEXT NOT NULL,
  PRIMARY KEY (profil, par)
);
