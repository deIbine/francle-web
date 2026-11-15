-- La table des parties reçues (web.9.2.1). Une ligne par partie, et rien d'autre (décisions de web.9.2) :
--   tirage   le numéro tiré au hasard par le navigateur pour cette partie : la renvoyer remplace la ligne
--   jour     le numéro de la partie du jour
--   partie   la partie transmise, en JSON (le format de src/domaine/transmission.ts, sans le tirage)
--   points   ses points (src/domaine/score.ts), calculés par le serveur à la réception
-- Ni adresse IP, ni heure d'arrivée, ni numéro d'envoi : rien qui relie deux parties entre elles.
--
-- Une migration ne fait qu'ajouter (« IF NOT EXISTS ») : elle ne détruit jamais rien, et l'ancien code lit toujours
-- la base (voir « Revenir en arrière » dans docs/plan.md). Une migration déjà appliquée ne se modifie plus : on en
-- écrit une nouvelle (0002_…).
CREATE TABLE IF NOT EXISTS parties (
  tirage TEXT PRIMARY KEY,
  jour INTEGER NOT NULL,
  partie TEXT NOT NULL,
  points INTEGER NOT NULL
);

-- les chiffres se demandent jour par jour : sans cet index, chaque demande lirait toute la table
CREATE INDEX IF NOT EXISTS parties_par_jour ON parties (jour);
