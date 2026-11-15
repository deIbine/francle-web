-- Les ligues entre amis (web.9.3.2). Une seule ligue par joueur (décision 7 de web.9.3) : la ligue est une colonne du
-- profil. Une migration qui ne fait qu'ajouter : une table, et deux colonnes facultatives à « profils » (ALTER TABLE
-- … ADD COLUMN ne touche pas aux lignes déjà là, qui ont NULL : pas de ligue).
--
-- ligues
--   id        tiré au hasard par le serveur
--   nom       choisi par le créateur (les règles d'un pseudo, src/domaine/pseudo.ts)
--   code      le code d'invitation, 6 caractères, qu'on peut changer (UNIQUE : deux ligues n'ont jamais le même)
--   createur  le profil qui peut retirer un membre et changer le code ; s'il part, la ligue passe au membre le plus
--             ancien, et elle disparaît avec son dernier membre
CREATE TABLE IF NOT EXISTS ligues (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  createur TEXT NOT NULL
);

-- la ligue du profil, et l'ordre d'entrée (pour savoir qui est le plus ancien)
ALTER TABLE profils ADD COLUMN ligue TEXT;
ALTER TABLE profils ADD COLUMN entree_ligue INTEGER;

CREATE INDEX IF NOT EXISTS profils_par_ligue ON profils (ligue);
