# Francle web

Version web de Francle (jeu de devinettes des régions françaises), inspirée de Worldle, jouable en ligne par tous.

**Au début de chaque conversation : lire `docs/plan.md`** (décisions validées, découpage en étapes, point de départ).
Ensuite, s'il existe, `docs/lecons.md`.

**Projet séparé du Java** (depuis le 23 octobre 2026) : le projet Java `deIbine/francle` n'est qu'un **outil de
comparaison** (lire son code, exécuter ses règles pour comprendre). Ne jamais modifier son dépôt ni y ouvrir de PR
depuis ici, ne pas noter de tâches « pour le Java » dans ce plan, et le web n'a pas à lui rester égal.

## Méthode de travail

- Tout en français : explications, commentaires, commits (à l'impératif), PR.
- **Claude code et explique.** Chaque modification est expliquée en profondeur, sur trois axes :
  1. **Pourquoi** : le problème concret, et pourquoi cette solution plutôt qu'une autre ;
  2. **Comment le faire soi-même** : comment repérer le problème, les étapes, les commandes, les outils ;
  3. **Comment le penser** : le principe général, la question à se poser la prochaine fois.
  L'utilisateur vient de Java (projet `deIbine/francle`) : expliquer aussi les notions web (HTML, CSS, TypeScript,
  React, navigateur), en les rapprochant de Java quand c'est utile.
- À la fin de chaque étape, ajouter les leçons dans `docs/lecons.md` (format pourquoi / comment / penser).
- Avant chaque étape, présenter le découpage et poser les questions de décision ; ne rien démarrer sans accord.
- **Le départ vient toujours de l'utilisateur** (règle du 23 octobre 2026) : même après une question posée par Claude
  (« Je lance ? », « On fait comme ça ? »), et même s'il y répond ou valide des décisions, Claude ne commence pas.
  Il attend un message de l'utilisateur qui demande explicitement de commencer (« lance », « tu peux commencer »…).
  Répondre à des questions, ce n'est pas donner le départ.

## Git

- **Une branche et une PR par étape** (web.0, web.1…), fusion **en squash**.
- Une fois la fusion autorisée par l'utilisateur : `gh pr merge <n> --squash --admin`, puis supprimer la branche en
  local et sur GitHub (après avoir vérifié que l'arbre de `main` est identique à celui de la branche), puis repartir
  d'un `main` à jour.
- Une étiquette annotée par étape importante (nommage à décider à web.0, par exemple `web-0`).
