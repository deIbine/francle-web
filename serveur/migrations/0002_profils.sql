-- Les profils (web.9.3.1) : un pseudo, et ses parties rattachées, pour la ligue et le classement public.
-- Une migration qui ne fait qu'ajouter : la table « parties » des chiffres anonymes (0001) n'est pas touchée.
--
-- profils
--   id                 tiré au hasard par le serveur ; public (il désigne le joueur dans les classements)
--   pseudo             tel que le joueur l'a écrit
--   cle_pseudo         le pseudo sans majuscules, accents, espaces ni ponctuation : deux pseudos de même clé sont le
--                      même pseudo (src/domaine/pseudo.ts), d'où UNIQUE
--   empreinte_code     l'empreinte SHA-256 du code secret gardé par le navigateur : le serveur ne garde jamais le code
--                      lui-même, une fuite de la base ne permettrait donc pas de se faire passer pour un joueur
--   empreinte_secours  de même pour le code de secours
--   dernier_jour       le numéro du jour de la dernière partie reçue (ou de la création) : un profil sans partie
--                      pendant 365 jours est effacé (décision 3 de web.9.3)
CREATE TABLE IF NOT EXISTS profils (
  id TEXT PRIMARY KEY,
  pseudo TEXT NOT NULL,
  cle_pseudo TEXT NOT NULL UNIQUE,
  empreinte_code TEXT NOT NULL UNIQUE,
  empreinte_secours TEXT NOT NULL UNIQUE,
  dernier_jour INTEGER NOT NULL
);

-- les parties d'un profil : une par jour (la renvoyer la remplace), dans le format transmis, avec ses points
CREATE TABLE IF NOT EXISTS parties_profil (
  profil TEXT NOT NULL,
  jour INTEGER NOT NULL,
  partie TEXT NOT NULL,
  points INTEGER NOT NULL,
  PRIMARY KEY (profil, jour)
);

-- les classements se calculent mois par mois, donc par plage de jours
CREATE INDEX IF NOT EXISTS parties_profil_par_jour ON parties_profil (jour);
