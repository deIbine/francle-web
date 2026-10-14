# Francle web : le plan

Décidé le 14 octobre 2026, à la fin de la Phase 6 du projet Java [deIbine/francle](https://github.com/deIbine/francle).
Aucun code n'est encore écrit : ce document sert de point de départ pour une nouvelle conversation.

## L'objectif

Un **nouveau projet**, dans un **nouveau dépôt** (`deIbine/francle-web`, public), avec un **nouveau code**, pour qu'à la
fin **tout le monde puisse jouer à Francle en ligne**. L'inspiration principale est **Worldle**, dont on s'inspire
largement.

Le projet Java `deIbine/francle` (version de bureau, Swing) est terminé et gardé tel quel, pour nous. Il sert de
**référence pour les règles et les données** : régions, indices, distance, direction, proximité, région du jour,
angle de rotation, et les valeurs de ses tests.

## Worldle, la source d'inspiration

- Le dépôt d'origine `teuteuf/worldle` n'est plus public. Le code complet se trouve sur
  [markgalassi/worldle](https://github.com/markgalassi/worldle) : c'est la version de février 2022, sous **licence MIT**
  (« Copyright (c) 2022 teuteuf »). On peut le lire et s'en inspirer ; si on en reprend des morceaux, on garde cette
  mention de copyright.
- **Technique** : React 17 et TypeScript (create-react-app, aujourd'hui abandonné), Tailwind, i18next (langues),
  seedrandom, luxon (dates), geolib, react-autosuggest, `localStorage`, PWA.
- **Aucun serveur** : c'est un site statique. Le pays du jour **et** l'angle de rotation sont calculés dans le
  navigateur à partir de la date (hasard à graine fixe, comme `RegionDuJour` dans le projet Java). Les essais, les
  statistiques et les réglages sont gardés dans le navigateur (`localStorage`).
- **Fonctions** : 6 essais, 16 directions, pourcentage de proximité, partage du résultat en carrés 🟩🟨⬜
  (« #Worldle #n 3/6 », avec un emoji pour les modes difficiles), mode rotation 🌀, mode image cachée 🙈, thème,
  km ou miles, statistiques, une image SVG par pays.
- Fichiers à étudier : `src/hooks/useCountry.ts` (pays et angle du jour, mise à l'échelle de l'image tournée),
  `src/domain/geography.ts` (proximité, carrés de partage, distances), `src/hooks/useGuesses.ts` (essais en
  `localStorage`), `src/components/Share.tsx` (texte de partage), `src/components/` et `src/hooks/` en général.

## Les décisions (toutes validées par l'utilisateur)

| Sujet | Décision |
|---|---|
| Technologie | **TypeScript, comme Worldle**, site statique sans serveur. Le Java ne sert que de référence. |
| Code de Worldle | **Réécrire en s'en inspirant**, avec des outils actuels, en suivant son organisation et ses idées. Mention MIT de teuteuf si on reprend des morceaux. |
| Outils | **Vite + React + TypeScript**, tests avec **Vitest**, mise en ligne sur **GitHub Pages** par **GitHub Actions** (adresse prévue : `https://deibine.github.io/francle-web/`). |
| Images | **SVG**, générées par un script à partir des contours officiels (comme `outils/generer_images.py` du projet Java, adapté pour produire du SVG). |
| Partie du jour | Les **18 nouvelles régions** (depuis 2016), la même pour tout le monde. |
| Partie libre | Les **deux époques**, au choix : anciennes régions ou nouvelles régions. |
| Essais | **6**, comme Worldle (le Java en a 5). |
| Partage | Le résultat en **carrés emoji**, avec un bouton pour le copier. |
| Indices | **On les garde** (superficie, spécialité, personnalité, capitale) : c'est la particularité de Francle. |
| Langues | **Français et anglais**, au choix du joueur. |
| Noms en anglais | Noms des régions **et** indices traduits (Brittany, Normandy, Corsica, Burgundy…). À la saisie, on **accepte les deux** noms, quelle que soit la langue. |
| Directions | **8** (comme Francle), pas 16 : les distances sont courtes en France. |
| Proximité | La **formule de Francle** (pensée pour la France). Celle de Worldle, rapportée au tour de la Terre, donnerait 95 à 100 % partout. |
| Mode « image cachée » 🙈 | La case « Silhouette de la région » de Francle devient ce mode, avec son emoji dans le partage (comme 🌀 pour la rotation). |
| Licence | **MIT**, comme Worldle. |
| Mode de travail | **Claude code et explique** ; des **leçons** dans `docs/lecons.md` (format pourquoi / comment le faire / comment le penser), y compris pour les notions web (HTML, CSS, React, navigateur). |
| Git | **Itératif, une PR par étape.** |

## Le découpage en étapes (une PR par étape)

0. **web.0 Le projet en ligne** : créer le dépôt `francle-web`, le projet Vite + React + TypeScript, les tests,
   la CI, et la mise en ligne automatique d'une page « Francle arrive bientôt ». On met en ligne dès le début :
   chaque étape est ensuite visible par tous.
1. **web.1 Les données et les règles** : régions (indices, coordonnées, noms français et anglais), distance,
   direction (8), proximité, région du jour, angle. Sans affichage, avec des tests qui reprennent les valeurs du Java
   (mêmes résultats).
2. **web.2 Un jeu jouable** : silhouette, saisie avec suggestions, 6 essais, tableau (distance, flèche, proximité),
   indices, carte de fin. Partie du jour seulement.
3. **web.3 La partie du jour complète** : reprise après fermeture de la page (`localStorage`), statistiques,
   partage en carrés 🟩🟨⬜, compte à rebours jusqu'à la région suivante.
4. **web.4 Les réglages et la partie libre** : thème sombre, km ou miles, rotation 🌀, image cachée 🙈, partie libre
   avec le choix de l'époque.
5. **web.5 L'anglais** : tous les textes en deux langues, au choix du joueur.
6. **web.6 Les finitions** : affichage mobile, accessibilité (clavier, lecteurs d'écran), « comment jouer », README,
   licence.

## Avant de commencer

- **Installer Node.js (version LTS)**, l'équivalent du JDK pour le JavaScript. Il n'était pas installé le 14 octobre
  2026. C'est à l'utilisateur de l'installer (par exemple `winget install OpenJS.NodeJS.LTS` dans PowerShell), puis
  de vérifier avec `node --version` et `npm --version`.
- GitHub CLI (`gh`) est déjà connecté au compte `deIbine`, avec les droits `repo` et `workflow`.
- Le dépôt `deIbine/francle-web` **n'existe pas encore** sur GitHub : il sera créé à l'étape web.0.

## Où trouver le reste

- Projet Java : `C:\Users\cleme\Desktop\Claude\francle` (dépôt `deIbine/francle`, étiquette `phase-6`).
  - les données des régions : `src/main/java/fr/francle/donnees/RegionFr.java` et `docs/indices.md` ;
  - les règles : `src/main/java/fr/francle/jeu/` (`Partie`, `Direction`, `RegionDuJour`) ;
  - le script des images et la source des contours : `outils/generer_images.py` ;
  - les leçons des phases précédentes : `docs/lecons.md`.
