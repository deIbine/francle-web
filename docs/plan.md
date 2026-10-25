# Francle web : le plan

Décidé le 14 octobre 2026, à la fin de la Phase 6 du projet Java [deIbine/francle](https://github.com/deIbine/francle).
Ce document sert de point de départ à chaque nouvelle conversation : voir d'abord « Où on en est » plus bas.

## L'objectif

Un **nouveau projet**, dans un **nouveau dépôt** (`deIbine/francle-web`, public), avec un **nouveau code**, pour qu'à la
fin **tout le monde puisse jouer à Francle en ligne**. L'inspiration principale est **Worldle**, dont on s'inspire
largement.

Le projet Java `deIbine/francle` (version de bureau, Swing) a servi de **modèle pour les règles et les données** :
régions, indices, distance, direction, proximité, région du jour, angle de rotation, et les valeurs de ses tests.
**Depuis le 23 octobre 2026, les deux projets sont séparés** (web.7.13) : le Java n'est plus qu'un **outil de
comparaison** (voir « Le projet Java, outil de comparaison » à la fin). Rien ne se reporte plus d'un projet à
l'autre, et le web n'a plus à rester égal au Java.

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
| Mise en forme | **Tailwind** (décidé à web.2), avec les couleurs du jeu Java déclarées dans `@theme` (`src/index.css`). |
| Textes de l'écran | Tous dans **`src/textes.ts`** dès web.2, pour que web.5 n'ait plus qu'à ajouter l'anglais. |
| Images | **SVG**, générées par un script **Python** à partir des contours officiels (`outils/generer_images.py`, adapté du Java ; il écrit le SVG lui-même, sans bibliothèque). La carte de fin est **un seul fichier de contours par époque**, dessiné par React, avec l'outre-mer en encadrés. |
| Partie du jour | Les **18 nouvelles régions** (depuis 2016), la même pour tout le monde. |
| Partie libre | Les **deux époques**, au choix : anciennes régions ou nouvelles régions. **Deux onglets** en haut, « Partie du jour » et « Partie libre ». La partie libre n'est **ni sauvegardée, ni comptée, ni partageable** : c'est de l'entraînement (décidé avant web.4). |
| Essais | **6**, comme Worldle (le Java en a 5). |
| Partage | Le résultat en **carrés emoji**, avec un bouton pour le copier, et le **menu de partage du téléphone** quand il existe (Web Share). **Pas d'indices** dans le texte partagé (décidé à web.3). |
| Statistiques | Calculées à partir de l'historique des parties. Une **série** demande des **jours consécutifs** : un jour sauté la remet à zéro (décidé à web.3). |
| Fin de partie et statistiques | Dans une **fenêtre** par-dessus le jeu (`<dialog>`), comme Worldle (décidé à web.3). |
| Indices | **On les garde** (superficie, spécialité, personnalité, capitale) : c'est la particularité de Francle. **Plus un 5e, le monument** (décidé à web.1), révélé après le 5e essai raté. |
| Région du jour | **Reprise du Java** (même hasard, même premier jour, le 13 octobre 2026), puis **figée** dans `reference.json` depuis la séparation des deux projets (web.7.13) : elle ne doit pas changer pour les joueurs. Le jour change **à minuit chez le joueur** (décidé à web.1). |
| Langues | **Français et anglais**, au choix du joueur. Au premier passage, la **langue du navigateur** ; un **bouton FR / EN visible** dans l'en-tête ; les traductions dans **`textes.ts`**, sans bibliothèque ; une **seule adresse** pour les deux langues ; le texte de partage est traduit (« #Francle #12 3/6 » en anglais) (décidé avant web.4). |
| Réglages | Une fenêtre **⚙️**, gardée dans le navigateur. **Thème** : automatique (celui du système) par défaut, ou clair, ou sombre. **Unité** : km par défaut en français, **miles par défaut en anglais** ; l'unité suit la langue tant que le joueur ne l'a pas choisie lui-même, ensuite son choix l'emporte (décidé avant web.4). |
| Modes difficiles 🌀 🙈 | Fixés **au premier essai** : un changement en cours de partie ne compte que pour la partie suivante, pour que l'emoji du partage dise vrai. Rotation : l'angle du jour en partie du jour, un **angle au hasard** en partie libre (décidé avant web.4). |
| Noms en anglais | Noms des régions **et** indices traduits (Brittany, Normandy, Corsica, Burgundy…). À la saisie, on **accepte les deux** noms, quelle que soit la langue. Le tableau des traductions a été relu avant web.4. À faire à web.5 : Mayotte, « le matsidza » devient **« le mataba »** et Taambati Moussa devient **Zéna M'Déré** ; Nouvelle-Aquitaine, Jacques Ellul devient **Montaigne** ; en anglais, **plus d'explications entre parenthèses** (« matelote », pas « matelote (fish stewed in wine) »). Le web s'écarte alors du Java sur ces indices. |
| Finitions | « **Comment jouer** » ouvert à la première visite, puis par un bouton ❓ ; **vérification automatique de l'accessibilité** (axe) dans les tests ; **crédits** en bas de page (contours IGN/Etalab, inspiration Worldle, lien vers le code) ; **README en français** ; **aucune statistique de visite** ; icône : la France en bleu Francle ; **pas de jeu installable** pour l'instant (décidé avant web.4). |
| Nom de domaine | Un domaine à soi, **à web.8** (proposé : `francle.fr`, libre le 14 octobre 2026), acheté par l'utilisateur avant de commencer web.8. Le chemin de base `/francle-web/` deviendra `/` (décidé avant web.4). |
| Directions | **8** (comme Francle), pas 16 : les distances sont courtes en France. Affichées en **emoji** (⬆️ ↗️ … 🎉), dans le tableau comme dans le partage (décidé à web.2). |
| Abandon | Un bouton **Abandonner**, avec confirmation (web.2). Une partie abandonnée compte comme une **défaite** dans les statistiques (web.3). |
| Région déjà proposée | Refusée avec un message, **sans coûter d’essai** (décidé à web.2). |
| Proximité | La **formule de Francle** (pensée pour la France). Celle de Worldle, rapportée au tour de la Terre, donnerait 95 à 100 % partout. |
| Mode « image cachée » 🙈 | La case « Silhouette de la région » de Francle devient ce mode, avec son emoji dans le partage (comme 🌀 pour la rotation). |
| Licence | **MIT**, comme Worldle : « Copyright (c) 2026 deIbine », plus la mention « Copyright (c) 2022 teuteuf » pour ce qui s'inspire de Worldle (décidé avant web.4). |
| Mode de travail | **Claude code et explique** ; des **leçons** dans `docs/lecons.md` (format pourquoi / comment le faire / comment le penser), y compris pour les notions web (HTML, CSS, React, navigateur). |
| Git | **Itératif, une PR par étape.** |
| Liste des régions | Reprise du Java (menu « Liste des régions », Ctrl+L). Un **bouton dans l'en-tête** ouvre la liste ; elle montre les régions **du mode joué** (les 18 nouvelles en partie du jour, l'époque choisie en partie libre) ; **cliquer un nom le propose** ; un **réglage** permet de masquer le bouton Bouton **📃** à droite de l'en-tête, liste dans une fenêtre `<dialog>`, bouton affiché par défaut, régions déjà proposées barrées, plus rien ne se propose quand la partie est finie (décidé le 16 octobre 2026, fait à web.6.3). |

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
7. ✅ **web.7 Le bonus des départements** : après chaque victoire (partie du jour et partie libre), faire deviner tous
   les départements de la région trouvée (décidé le 16 octobre 2026, étendu à la partie libre le 17 octobre 2026,
   détail plus bas dans « Le bonus des départements »).
   **web.7.5 à web.7.7 Le bonus revu**, après les retours des joueurs : le bonus juste après la victoire, et un
   mode C « cliquer un département, puis écrire son nom » (décidé le 17 octobre 2026, détail plus bas dans « Le
   bonus revu »). Avant web.8.
   **web.7.14 Le bonus simplifié** : la liste 📃 et les suggestions limitées aux départements de la région, les 101
   en option « version difficile » (décidé le 23 octobre 2026, détail plus bas dans « Le bonus simplifié »).
8. **web.8 Le domaine et le défi** (ancien web.7, renuméroté le 16 octobre 2026) : d'abord le nom de domaine, puis le défi (un lien à envoyer à un ami pour lui
   faire deviner une région). Pas d'archives des jours passés (décidé avant web.4).

## Où on en est (mis à jour le 25 octobre 2026)

### À faire sur le PC (liste vide depuis le 23 octobre 2026)

Depuis le 19 octobre 2026, le travail se fait aussi **dans le cloud** (Claude Code sur le web, sans le PC). Là-bas,
Claude peut coder, tester, ouvrir et fusionner les PR (le site est alors publié comme d'habitude), mais **ni poser
d'étiquette, ni supprimer de branche** : le serveur intermédiaire du cloud refuse ces envois (erreur 403), et les
outils GitHub du cloud ne savent pas le faire. Les branches du cloud s'appellent toutes `ccr-8009fd8d-mbx5ca`.

**À la première conversation sur le PC, avant de commencer quoi que ce soit d'autre**, faire cette liste, puis la
vider ici (par une petite PR). **Chaque PR fusionnée depuis le cloud y ajoute ses lignes.**

**La liste est vide** (le 23 octobre 2026). Comment s'en servir la prochaine fois : chaque ligne est une commande
exacte, avec le commit visé (`git tag -a <nom> -m "<message>" <commit>`, puis `git push origin <nom>` ;
`git push origin --delete <branche>`). Sur le PC, Claude lance tout lui-même (l'utilisateur ne lance aucune
commande, décidé le 19 octobre 2026), vérifie, puis vide la liste par une petite PR.

**Fait sur le PC le 23 octobre 2026** (un jour avant le retour prévu), par Claude Code, à la demande de l'utilisateur
(« Lance l'étape 1 et enregistre bien tout ce que tu fais ») :

1. `git fetch --all --prune` : déjà à jour (`main` à `bc6c0d7`), aucune PR ouverte.
2. Vérifié avant d'agir : les commits visés (`19493b1`, `24e3ff1`, `c86d891`) sont bien sur `main`
   (`git merge-base --is-ancestor <commit> origin/main`), et la branche du cloud a le même arbre que `main`
   (`git diff --stat origin/main origin/ccr-8009fd8d-mbx5ca` vide) : la supprimer ne perd rien.
3. **Étiquettes posées et envoyées** : `web-7.12.0` (`19493b1`), `web-7.12.0.1` (`24e3ff1`), `web-7.12` (`c86d891`).
4. **Branche du cloud `ccr-8009fd8d-mbx5ca`** : la suppression a d'abord été bloquée par le contrôle de sécurité de
   Claude Code (action destructive), malgré l'autorisation notée ici ; l'utilisateur l'a confirmée dans la
   conversation. Au second essai, GitHub a répondu « remote ref does not exist » : `git ls-remote --heads origin` ne
   montre plus que `main`. Elle avait été supprimée entre-temps (elle existait encore au `fetch` du début), sans doute
   par une autre session Claude ; non confirmé. Références locales nettoyées par `git fetch --prune`.
5. Branches locales : il ne reste que `main` et les branches des dossiers de travail des sessions Claude
   (`claude/…`, une par session, rattachées à un `git worktree`) ; elles ne sont pas supprimées tant que leur session
   peut s'en servir.
6. **Tests** : `npm ci`, puis `npm test`. Le premier passage, juste après l'installation : 3 échecs sur 297, en
   116 s au lieu d'environ 36 (sans doute des délais dépassés : fichiers pas encore en cache, antivirus sur les
   nouveaux fichiers de `node_modules`). Deux passages suivants : **297 sur 297**, en 36 et 37 s. `npm run lint` et
   `npm run build` passent.
7. Cette section vidée par une petite PR (web.7.12.3, #39, sans étiquette : ce ne sont que des notes). Ce fut la
   dernière fois que le ménage se fit aussi dans le dépôt Java : les deux projets sont séparés depuis (web.7.13).

Les PR de notes (#37, #38, #39) n'ont pas d'étiquette : ce ne sont pas des
étapes. Pour le commit d'une PR fusionnée : `git log --oneline -10` sur `main`, ou la page de la PR sur GitHub.

**Faites : web.0 à web.7, le bonus revu (web.7.5 à web.7.7), les corrections du 18 octobre 2026 (web.7.8 à
web.7.11) et la liste des départements (web.7.12, le 19 octobre 2026, depuis le cloud), puis la séparation d'avec le Java
(web.7.13, le 23 octobre 2026), le bonus simplifié (web.7.14, le même jour) et la carte de fin en couleur
(web.7.15, le même jour).** Le bonus des départements est en ligne depuis le
17 octobre 2026 : quatre PR (#17 à #20), étiquettes `web-7.1` à `web-7.4` et `web-7` (détail plus bas dans « Le bonus
des départements »). **Le bonus revu**, décidé le même jour après les retours des joueurs, est en ligne lui aussi :
trois PR empilées (#24, #25, #26), fusionnées en squash le 17 octobre 2026 sur l'accord de l'utilisateur (sans test
en local de sa part), étiquettes `web-7.5`, `web-7.6`, `web-7.7` (détail plus bas dans « Le bonus revu »). Prochaine
étape : **web.8 Le domaine et le défi**, dont le découpage reste à valider (l'utilisateur doit d'abord acheter le nom
de domaine). **Web.8 est repoussé** (décidé le 18 octobre 2026) : l'utilisateur n'achète pas de domaine pour
l'instant. En attendant, **les corrections relevées le 18 octobre 2026** (section du même nom plus bas), découpées et
décidées le même jour, sont codées et en ligne le même jour aussi : quatre PR empilées (#29 à #32), fusionnées en
squash le 18 octobre 2026 sur l'accord de l'utilisateur, étiquettes `web-7.8` à `web-7.11` (voir « Pour reprendre »).

- **web.0** (PR #1, étiquette `web-0`) : dépôt public `deIbine/francle-web`, Vite + React + TypeScript, Vitest, lint
  oxlint, CI `.github/workflows/ci.yml` (tâche `verifier` sur chaque PR et sur `main`, tâche `publier` vers GitHub
  Pages après chaque fusion). Le site est en ligne : https://deibine.github.io/francle-web/ (le jeu complet depuis
  web.6).
- **web.1** (PR #2, étiquette `web-1`) : tout le domaine dans `src/domaine/`, sans affichage :
  - `regions.ts` (35 régions, noms et indices FR/EN, 5e indice « monument »), `recherche.ts` (saisie, suggestions,
    noms FR et EN acceptés), `geographie.ts` (distance, 8 directions, proximité), `partie.ts` (6 essais, valeurs non
    modifiables : `proposer(partie, saisie)` renvoie une nouvelle partie), `hasardJava.ts` + `regionDuJour.ts`
    (région et angle du jour repris du Java, minuit chez le joueur) ;
  - 98 tests, dont `reference-java.test.ts` qui comparait tout au fichier `reference-java.json` produit par
    `outils/ReferenceJava.java` (à web.7.13 : renommés `reference.test.ts` et `reference.json`, valeurs figées
    propres au site, outil supprimé).
- **web.2** (PR #3, étiquette `web-2`) : le jeu jouable, partie du jour seulement, sans sauvegarde.
  - `outils/generer_images.py` produit `src/images/regions/<id>.svg` (36 silhouettes, dont `defaut.svg` pour le mode
    image cachée) et `src/images/cartes/<mode>.json` (contours pour la carte de fin). Les contours sources
    (gregoiredavid/france-geojson, licence ouverte Etalab) ne sont pas dans le dépôt : les télécharger à part.
  - `src/App.tsx` garde la partie (`useState`) ; composants dans `src/composants/` : `Silhouette`, `Saisie`
    (combobox accessible), `TableauEssais`, `Indices`, `FinDePartie`, `CarteFrance`. Textes dans `src/textes.ts`.
  - Tests de composants avec Testing Library et `user-event` (`src/preparationTests.ts` vide la page entre deux tests).
- **web.3** (PR #4, étiquette `web-3`) : la partie du jour complète.
  - `src/sauvegarde.ts` : les parties du jour dans `localStorage` (clé `francle.parties-du-jour.v1`, numéro du jour
    -> régions proposées et état), rejouées avec `proposer()` au retour.
  - `src/domaine/statistiques.ts` (déduites de l'historique, série = jours consécutifs gagnés), `partage.ts`
    (« #Francle n° 12 3/6 », carrés inspirés de Worldle, MIT), `temps.ts` (minuit suivant, durée).
  - `App` ne garde que le jour et affiche `<Jeu key={numero}>` : à minuit, un nouveau `Jeu` repart de zéro.
    `Jeu.tsx` garde la partie ; fenêtre `<dialog>` (`Fenetre`) pour les résultats et les statistiques (bouton 📊),
    `Partager` (menu du téléphone ou presse-papiers), `CompteARebours`.
- **web.4** (PR #5, étiquette `web-4`) : les réglages et la partie libre.
  - `src/reglages.ts` : réglages dans `localStorage` (clé `francle.reglages.v1` : thème, unité, rotation, image
    cachée), `useReglages()`, `useTheme()` (classe `dark` sur `<html>`) ; un script dans `index.html` applique le
    thème avant l'affichage. Couleurs par rôles dans `src/index.css` (`bg-fond`, `text-discret`, `bg-surface`…).
  - `App.tsx` : en-tête (⚙️, titre, 📊), onglets « Partie du jour » / « Partie libre » (les deux restent montés).
    `composants/Plateau.tsx` : le plateau commun. `PartieDuJour.tsx` (ancien `Jeu.tsx`) et `PartieLibre.tsx`.
  - Modes difficiles fixés au premier essai, sauvegardés avec la partie du jour (champ `modes`) et montrés dans le
    partage (« #Francle n° 12 3/6 🌀🙈 »).
- **web.5** (PR #6, étiquette `web-5`) : l'anglais.
  - `src/textes.ts` : `TEXTES.fr` et `TEXTES.en` (type `Textes` déduit du français), `LangueContext`,
    `useLangue()`, `useTextes()`. Nombres avec `toLocaleString` (`fr-FR`, `en-GB`).
  - Réglages : `langue` (sinon celle du navigateur, `langueNavigateur()`), unité par défaut selon la langue
    (`uniteAffichee`). Bouton FR / EN dans l'en-tête ; `<html lang>` à jour (aussi dans le script de `index.html`).
  - Partage en anglais : « #Francle #12 3/6 ». Données corrigées : mataba, Zéna M'Déré, Montaigne, plus de
    parenthèses dans les indices anglais.
- **web.6** (PR #7, étiquette `web-6`) : les finitions.
  - « Comment jouer » (`composants/Aide.tsx`, bouton ❓), ouvert à la première visite (clé `francle.aide-vue.v1`) ;
    son exemple est calculé par les règles du jeu.
  - Bas de page (`composants/Credits.tsx`) : contours IGN/INSEE (Etalab), Worldle, code source, aucune donnée
    collectée. `LICENSE` (MIT, « Copyright (c) 2026 deIbine », mentions Worldle et Etalab). `README.md` en français.
  - Icône `public/favicon.svg` (la métropole en bleu Francle), produite par `outils/generer_images.py`, qui prend
    maintenant un troisième argument : `py outils/generer_images.py <contours> src/images public`.
  - Accessibilité : `axe-core` dans les tests (`src/Accessibilite.test.tsx`) ; contrastes vérifiés dans le
    navigateur, en clair et en sombre. Mobile : vérifié à 375 pixels ; espaces insécables dans les textes français.
- **Ce que web.8 doit faire** : (1) le nom de domaine, une fois acheté par l'utilisateur : `public/CNAME`, réglages
  DNS, domaine déclaré dans GitHub Pages, `base: '/'` dans `vite.config.ts`, `ADRESSE` dans `domaine/partage.ts`,
  liens du README ; (2) le défi : un lien à envoyer pour faire deviner une région choisie.
- **Relu et validé avant web.4** : les monuments et les traductions anglaises de `regions.ts` (corrections faites à
  web.5).
- **Encore à valider par l'utilisateur, en jouant** (signalé dans les PR #5 à #7) : en partie libre, changer
  d'époque commence aussitôt une nouvelle partie ; les textes anglais de l'interface, « Comment jouer » (FR et EN) et
  les crédits du bas de page (`src/textes.ts`) ; le thème sombre et l'affichage sur téléphone.
- **Correctif après web.6** (PR #9, étiquette `web-6.1`) : le jour change aussi quand la partie n'est pas finie,
  et quand la page revient à l'écran (`useJour` dans `App.tsx`) ; l'horloge des tests est arrêtée au 14 octobre 2026
  (`preparationTests.ts`), et `App` n'a plus de paramètre `date`. Les améliorations relevées en même temps sont
  plus bas, dans « Les améliorations à reprendre ».
- **Corrections rapides** (PR web.6.2, étiquette `web-6.2`) : Entrée joue la seule suggestion (`deviner()` dans
  `domaine/recherche.ts`, sinon « Plusieurs régions possibles ») ; confirmation avant de changer d'époque en partie
  libre ; partie du jour et réglages synchronisés entre onglets (évènement `storage`, `src/onglets.ts`) ; couleurs
  par rôle `danger` et `succes` ; la liste des suggestions reste dans la page, cachée.
- **La liste des régions** (PR web.6.3, étiquette `web-6.3`), reprise du Java : bouton 📃 dans l'en-tête (masquable
  dans ⚙️, réglage `liste`), fenêtre gardée par le plateau (`composants/ListeRegions.tsx`), régions du mode joué, un
  clic propose le nom. App garde un compteur de demandes par onglet (`demandeListe`), comme pour 📊. Sur téléphone, les
  boutons de l'en-tête sont plus serrés (`px-1`, `sm:px-2`) pour que le titre tienne sur une ligne.
- **Le bonus des départements** (PR #17 à #20, étiquettes `web-7.1` à `web-7.4`, et `web-7`) : voir « Le bonus des
  départements » plus bas. Les choix faits en route (listes « À valider » des PR) ont été acceptés tels quels.
- **Pour reprendre (mis à jour le 23 octobre 2026)** : sur le PC, Claude fait d'abord ce que liste « À faire sur le
  PC » plus haut, s'il y a quelque chose (l'utilisateur ne lance aucune commande) ; lire ce plan et `docs/lecons.md`, vérifier que `main` est à jour (`git pull`) et qu'aucune PR
  n'est restée ouverte (sur GitHub, onglet « Pull requests »). La suite :
  - **Les corrections relevées le 18 octobre 2026** (section du même nom plus bas) : **faites et en ligne**, quatre
    PR empilées fusionnées en squash le 18 octobre 2026 : web.7.8 Les bugs (#29, `web-7.8`), web.7.9 La saisie et la
    fin de partie (#30, `web-7.9`), web.7.10 Le bonus (#31, `web-7.10`), web.7.11 L'outillage (#32, `web-7.11` :
    tests en 26 s au lieu de 40, plus d'avertissement du canvas). 287 tests. Les choix faits en route (listés sous
    les décisions) ont été acceptés avec la fusion. Reste seulement le point 12 (la carte de fin), pour plus tard.
  - **web.7.12 La liste des départements** (section du même nom plus bas) : **faite et en ligne** le 19 octobre
    2026, depuis le cloud : décisions (PR #34), liste à faire sur le PC (PR #35), code (PR #36), fusionnées en squash
    sur l'accord de l'utilisateur. 297 tests. Étiquettes posées sur le PC le 23 octobre 2026 (voir plus haut).
  - **web.7.13 La séparation d'avec le Java** (le 23 octobre 2026, à la demande de l'utilisateur) : les deux
    projets sont séparés, le Java n'est plus qu'un outil de comparaison (voir la fin de ce plan). Plus de tâches
    « pour le Java » ici, plus de PR jumelles, plus de ménage dans l'autre dépôt depuis une conversation du web.
    **Fusionnée** en squash le 23 octobre 2026 sur l'accord de l'utilisateur (PR #40, étiquette `web-7.13`). Les
    valeurs de référence sont figées dans `reference.json` ; `outils/ReferenceJava.java` est supprimé ; la règle est
    dans `CLAUDE.md`. Reste au dépôt Java, dans sa propre conversation, de retirer ses renvois vers le web.
  - **État vérifié le 23 octobre 2026**, après web.7.13 : aucune PR ouverte ; sur GitHub, seule la branche `main` ;
    en local, `main` et la branche du dossier de travail de la session Claude ; le dossier principal `francle-web`
    à jour sur `main`. Chaque étape a son étiquette (jusqu'à `web-7.13`) ; seules les PR de notes ou de petits
    réglages n'en ont pas (#8, #12, #13, #21, #37, #38, #39, et web.7.13.1 qui note cet état). Aucune PR fermée sans
    fusion. 297 tests.
  - **web.7.14 Le bonus simplifié** (choisi par l'utilisateur le 23 octobre 2026, section du même nom plus bas) :
    **faite et en ligne**. Trois PR empilées : #42 (web.7.14.0, le plan), #43 (web.7.14.1, les règles), #44 (web.7.14.2,
    le réglage et l'affichage), fusionnées en squash le 23 octobre 2026 sur l'accord de l'utilisateur, dans l'ordre :
    chaque branche rebasée sur `main` (`git rebase --onto origin/main <ancienne base> <branche>`), arbre comparé avant
    et après, base de la PR changée en `main`, puis fusion. Étiquettes `web-7.14.0` (`6a6cde7`), `web-7.14.1`
    (`0ec88c7`), `web-7.14.2` et `web-7.14` (`831763c`). Les choix faits en route ont été acceptés avec la fusion : le
    message du refus nomme le département (« Gironde (33) : ce département n'est pas dans la région. ») ; l'aide de la
    case ajoute « Fixé à la première réponse du bonus. » ; le mode B (caché) garde toujours les départements de la
    région. 305 tests.
  - **État vérifié le 23 octobre 2026**, après web.7.14 : les trois branches supprimées en local et sur GitHub (seule
    `main` y reste), le dossier principal `francle-web` à jour sur `main`. La PR de ces notes (web.7.14.3) n'a pas
    d'étiquette.
  - **Encore à vérifier par l'utilisateur, en jouant** : la version simple et l'option ⚙️ sur un vrai téléphone.
  - **Après web.7.14, la prochaine étape est à choisir avec l'utilisateur** (présentée le 23 octobre 2026) :
    web.8 reste repoussé ; parmi « Les améliorations à reprendre » plus bas, les candidates sont la carte de fin en
    couleur (point 12, **recommandée** : la plus visible, déjà repoussée deux fois), le compteur de la partie libre
    (petit, peut l'accompagner), le repère « voisine » (nouvelle règle, à décider) et le mode « métropole
    seulement » ; ou le défi seul (web.8.1, qui ne dépend pas du domaine, après réponse aux questions 5 à 10 de
    web.8). Présenter le découpage et les questions avant de coder.
  - **Choisie le 23 octobre 2026 : la carte de fin en couleur (web.7.15)**, après une maquette que l'utilisateur a
    beaucoup aimée (section du même nom plus bas). Découpage et décisions **validés le même jour** (toutes les
    recommandations acceptées). **Lancée le même jour** par l'utilisateur (« Tu peux lancer l'ensemble des
    phases ») : **faite et en ligne le même jour**. Deux PR empilées : #46 (web.7.15.0, le plan) et #47
    (web.7.15.1, la carte), fusionnées en squash le 23 octobre 2026 sur l'accord de l'utilisateur, dans l'ordre :
    #46, puis la branche de #47 rebasée sur `main` (`git rebase --onto origin/main <ancienne base> <branche>`, arbre
    identique avant et après), base de la PR changée en `main`, CI repassée, fusion. Étiquettes `web-7.15.0`
    (`133fe5a`), `web-7.15.1` et `web-7.15` (`d3610bb`). Le choix fait en route a été accepté avec la fusion : la
    pastille d'une région d'outre-mer va dans le coin de son encadré. 314 tests.
  - **État vérifié le 23 octobre 2026**, après web.7.15 : les deux branches supprimées en local et sur GitHub (seule
    `main` y reste, aucune PR ouverte), le dossier principal `francle-web` à jour sur `main`, le site publié (CI
    `verifier` et `publier` réussies). La PR de ces notes (web.7.15.2) n'a pas d'étiquette.
  - **Encore à vérifier par l'utilisateur, en jouant** : la carte de fin en couleur sur un vrai téléphone.
  - **Après web.7.15, la prochaine étape est à choisir avec l'utilisateur** : web.8 reste repoussé ; parmi « Les
    améliorations à reprendre » plus bas, restent le compteur de la partie libre, le repère « voisine » (nouvelle
    règle, à décider) et le mode « métropole seulement » ; ou le défi seul (web.8.1). Présenter le découpage et les
    questions, puis **attendre le signal de départ de l'utilisateur** (règle de `CLAUDE.md`).
  - **Choisie le 25 octobre 2026 : les corrections et le coup de neuf (web.7.16)**, après une vérification complète
    du jeu demandée par l'utilisateur (section du même nom plus bas) : 5 bugs, 12 soucis d'esthétique, une maquette
    (`docs/maquettes/coup-de-neuf.png`). Décisions **validées le même jour** (toutes les recommandations, et la phase
    4 faite elle aussi). Plan fusionné (PR #49, étiquette `web-7.16.0`) ; maquette **validée** le même jour.
    **Lancée le même jour** par l'utilisateur (« Tu peux lancer les 4 phases d'affilée ») : **faite et en ligne le même
    jour**. Quatre PR empilées, #51 à #54, fusionnées en squash le 25 octobre 2026 sur l'accord de l'utilisateur, dans
    l'ordre : chaque branche rebasée sur `main` (`git rebase --onto origin/main <ancienne base> <branche>`, arbre
    identique avant et après), base de la PR changée en `main`, CI repassée, fusion. Étiquettes `web-7.16.1`
    (`1a44d47`), `web-7.16.2` (`ae50d3d`), `web-7.16.3` (`2c91689`), `web-7.16.4` et `web-7.16` (`f91de62`). 318 tests.
  - **État vérifié le 25 octobre 2026**, après web.7.16 : les quatre branches supprimées en local et sur GitHub (seule
    `main` y reste), le dossier principal `francle-web` à jour sur `main`, le site publié (CI `verifier` et `publier`
    réussies). La PR de ces notes (web.7.16.5) n'a pas d'étiquette.
  - **Encore à vérifier par l'utilisateur, en jouant** : le coup de neuf sur un vrai téléphone (en-tête, réglages,
    bilan) ; « Réessayer » du bonus lors d'une vraie coupure de réseau.
  - **Après web.7.16, la prochaine étape est à choisir avec l'utilisateur** : web.8 reste repoussé ; restent dans « Les
    améliorations à reprendre » le compteur de la partie libre, le repère « voisine » et le mode « métropole
    seulement » ; ou le défi seul (web.8.1) ; ou les silhouettes sans limites de départements (vu à web.7.16.4).
  - **web.8** : **repoussé** le 18 octobre 2026 (pas de domaine acheté pour l'instant). Le découpage et ses onze
    questions ont été présentés le 17 octobre 2026 (voir « Le domaine et le défi (web.8) » plus bas) ; l'utilisateur
    n'y a pas encore répondu.
  - **Encore à vérifier par l'utilisateur, en jouant** : le mode C sur un vrai téléphone (à 375 × 812, la saisie
    commence à 496 pixels : le clavier devrait la laisser visible) et en thème sombre (les captures du navigateur
    intégré ne se dessinaient pas ; vérifié par script seulement). Depuis web.7.10 : sur téléphone, choisir un
    département fait défiler la page jusqu'au haut du bonus (point 9), et sur iPhone, toucher un département à la fin
    du bonus doit afficher son nom (point 10). Depuis web.7.12 : la liste des départements (📃 pendant le bonus) sur
    un vrai téléphone, où elle défile dans sa fenêtre (vérifiée à 375 × 812 dans Chromium, en clair et en sombre).
  - Méthode suivie pour le bonus revu, à reprendre : toutes les questions de toutes les phases posées d'un coup,
    recommandation à chaque fois ; les décisions notées dans le plan par une petite PR avant de coder ; puis les
    phases enchaînées en PR empilées, fusionnées à la fin (`git rebase --onto main <ancienne pointe> <branche>`,
    base changée en `main`, arbres comparés à chaque fusion).
  - Les contours sources ne sont pas dans le dépôt : pour régénérer les images, télécharger
    `departements-avec-outre-mer.geojson`, `regions.geojson` et `regions-avant-redecoupage-2015.geojson` depuis
    https://github.com/gregoiredavid/france-geojson, hors du dépôt. Node : `export PATH="/c/Program Files/nodejs:$PATH";`
    dans le Bash.
  - Pour web.8 : quel domaine, s'il est acheté ; comment fonctionne le lien du défi (région visible dans le lien ou
  codée, partie du jour ou libre, époque…).

## Le bonus des départements (web.7)

Idée du 16 octobre 2026 : après une victoire, en bonus, faire deviner les départements de la région trouvée.

### Ce qui existe déjà

- `outils/generer_images.py` lit déjà `departements-avec-outre-mer.geojson` et contient le tableau `DEPARTEMENTS`
  (région -> départements) **pour les deux époques**. Les silhouettes tracent déjà les limites des départements.
- **Le projet Java a fait tout le bonus** (phase 9, PR deIbine/francle#34). Ce qui en sert ici :
  - `src/main/resources/departements/departements.json` : la **source unique** des données, avec deux parties,
    `departements` (numéro -> nom, 101 départements, « 2A » et « 2B » pour la Corse, « 971 » à « 976 » pour
    l'outre-mer) et `regions` (identifiant de région -> numéros, **les 35 régions des deux époques**). Le script
    Python du Java le lit au lieu d'avoir sa propre liste ;
  - `src/main/resources/departements/<région>.json` : les contours, un fichier par région (35, environ 1 Mo en
    tout), `{"largeur", "hauteur", "zoom" (Île-de-France seulement : x, y, largeur, hauteur du cadre de Paris et de
    la petite couronne), "departements": [{"code", "contours": [[x, y, x, y…], …]}]}`, simplifiés par
    Douglas-Peucker, trous compris ;
  - les règles dans `jeu/Bonus.java` (avec `ReponseBonus`, `Tentative`), l'affichage dans `ui/CarteDepartements.java`
    et `ui/Contours.java`, la sauvegarde dans `stats/Resultat.java` (champ `bonus`), le partage dans `ui/Partage.java`.
  - **L'ordre du jour** : `Collections.shuffle(liste, new Random(SEL + numéroDuJour))`, où `SEL = 0x426F6E7573L`
    (les octets ASCII de « Bonus ») et la liste de départ est celle de `regions` dans `departements.json`, dans cet
    ordre. Un sel à part, pour ne pas reprendre la suite de nombres de l'angle du jour.
- La réforme de 2016 a regroupé les régions **sans toucher aux départements** : une seule liste de 101 départements,
  groupée de deux façons. Noms et numéros sont dans les propriétés du GeoJSON (`code`, `nom`).
- En anglais, on garde les noms français des départements (« Finistère », « Bouches-du-Rhône »).

### Les décisions (validées le 16 octobre 2026, complétées le 17 octobre 2026 avec les réponses du Java)

| Sujet | Décision |
|---|---|
| Quand | **Après chaque victoire**, en partie du jour **comme en partie libre** : le bonus commence de lui-même (comme dans le Java, après le test du jeu ; d'abord prévu pour la partie du jour seulement). Le bonus d'une partie libre n'est **ni sauvegardé, ni compté, ni partagé**, comme la partie libre elle-même, et ses départements sont **dans un ordre au hasard**, ceux de l'**époque jouée**. |
| Combien | **Tous les départements** de la région : ce n'est pas censé être simple. Une région à un seul département (outre-mer) a un bonus d'**une seule question**. |
| Ordre | En partie du jour, **l'ordre repris du Java** (voir « L'ordre du jour » plus haut), figé dans `reference.json` depuis web.7.13. |
| Essais | **Un seul par département** : juste ou faux, on montre la réponse (vert ou rouge) et on passe au suivant. |
| Forme du jeu | Deux modes programmés : **A. cliquer sur la carte** (« Où est le Finistère ? ») et **B. nommer le département coloré** (saisie avec suggestions, **nom ou numéro** acceptés, « 29 »). **Seul A est en ligne** ; B se choisit par une **constante dans le code** (comme `Bonus.MODE` du Java), sans le montrer aux joueurs. |
| Outre-mer | Une région à un seul département : cliquer serait gratuit, donc on demande **le numéro** (« Quel est le numéro de : Guadeloupe ? »). |
| Où | **Sur le plateau, à la place de la silhouette**. Le bonus commence à la fermeture de la fenêtre de fin d'une victoire. |
| Passer | Un bouton **« Passer »**. Passé **avant toute réponse**, le bonus n'a pas commencé : il reste à jouer. |
| Reprise (**propre au web**) | Un bonus du jour commencé (au moins une réponse) puis quitté (page fermée, onglet rechargé) **reprend là où il en était** au retour, avec les réponses déjà données. Le Java, lui, le compte comme joué avec son score partiel, **sans reprise**. Écart décidé le 17 octobre 2026 : sur le web, fermer un onglet par erreur arrive souvent. **« Passer »** un bonus commencé le termine (score partiel), comme dans le Java. |
| Île-de-France | Un **zoom** sur Paris et la petite couronne (75, 92, 93, 94), trop petits sinon : le cadre `zoom` du fichier de contours. |
| Ce qui compte | Le bonus du jour est **sauvegardé**, compte dans les **statistiques** (**score moyen**, moyenne des pourcentages de départements trouvés, et **nombre de bonus**) et apparaît dans le **partage**. |
| Partage | Une ligne de **score** : « 🗺️ 9/12 ». **Aucune ligne 🗺️** tant que le bonus n'est pas fini (pas commencé, ou en cours). |
| Données | **Copie** de `departements.json` du Java dans le web (les deux dépôts sont séparés). Le script web le lit, comme celui du Java. |
| Contours | Générés par `outils/generer_images.py`, en y **reportant les changements du script Java** : **un fichier de contours par région** (les 35, anciennes régions comprises), chaque département étant un tracé à part, avec son numéro. React les dessine, colore et rend cliquables (comme `CarteFrance`). Ce fichier sert aux deux modes. |

### Les phases (une branche et une PR par phase, étiquettes `web-7.0`, `web-7.1`…)

Prévues en sept phases (ci-dessous), **faites en quatre PR** le 17 octobre 2026, avec l'accord de l'utilisateur :

- **web.7.1 Les données et les contours** (phases 1 et 2) : `src/domaine/departements.json` (copie du Java),
  `departements.ts` (101 départements, recherche par nom ou numéro, suggestions) ; le script lit cette liste et écrit
  `src/images/departements/<région>.json` (un chemin SVG par département, 2000 unités, trous compris, zoom de
  l'Île-de-France). 656 Ko pour les 35 régions, 30 Ko au plus pour une.
- **web.7.2 Les règles** (phase 3) : `src/domaine/bonus.ts` ; l'ordre du jour comparé au Java sur 1501 jours
  (`reference-java.json`, régénéré : les suggestions y comparent maintenant les noms des deux langues, comme le Java
  depuis sa phase 8).
- **web.7.3 Le bonus jouable** (phases 4, 5 et 6) : `composants/JeuBonus.tsx`, `CarteDepartements.tsx`,
  `BoutonBonus.tsx`, `contours.ts` (chargement à la demande) ; sauvegarde (`bonus` facultatif dans chaque partie du
  jour), reprise, onglets, statistiques, partage ; mode B derrière `MODE_BONUS` ; `Saisie` reçoit ses suggestions
  en paramètre.
- **web.7.4 Les finitions** (phase 7) : « Comment jouer », crédits, README, test en anglais, ce plan.

Décisions prises avant de lancer (le 17 octobre 2026) : un bonus pas commencé (pas lancé au retour sur la page, ou
passé avant toute réponse) **reste à jouer jusqu'à minuit** par un bouton « 🗺️ Jouer le bonus », sans repartir tout
seul au retour ; en partie libre, jusqu'à la partie suivante. Les **noms au survol** une fois le bonus fini, et au
clavier. Le score partiel d'un bonus passé en cours de route apparaît dans le partage. Deux cases dans les
statistiques : « Bonus joués » et « Score moyen ».

0. **web.7.0 Le plan à jour** : ce chapitre, et l'ancien web.7 renuméroté web.8. ✅
   **web.7.0.1 Les réponses du Java** : les décisions du Java reportées ici, avec l'écart de la reprise (le
   17 octobre 2026). ✅
   **web.7.0.2 Le point de reprise** : où on en est, ce qu'il faudra, et la décision de tout lancer ensemble. ✅
1. ✅ **web.7.1 Les données des départements**, sans affichage : copier `departements.json` du Java (par exemple dans
   `src/domaine/departements.json`), `src/domaine/departements.ts` (101 départements, numéro, nom, région pour chaque
   époque), et le script Python le lit au lieu de son tableau `DEPARTEMENTS`. Tests : 101 départements, chacun dans
   une seule région par époque, aucun oubli, accord avec `regions.ts`.
2. ✅ **web.7.2 Les contours des départements** : reporter dans le script les changements du Java ; il écrit
   `src/images/departements/<région>.json` (les 35 régions, tracés simplifiés, un par département) et le cadre du
   zoom de l'Île-de-France. Vérifier le poids des fichiers ; ne charger que la carte de la région jouée.
3. ✅ **web.7.3 Les règles du bonus**, sans affichage (comme `partie.ts`) : `src/domaine/bonus.ts`, les questions
   (carte, nom, numéro), l'ordre du jour identique au Java (ajouté à `reference-java.json` par
   `outils/ReferenceJava.java`) ou au hasard en partie libre, une réponse renvoie un nouveau bonus, passer, le score,
   la fin. Tests.
4. ✅ **web.7.4 Le bonus jouable, mode A** : composant `CarteDepartements` (carte cliquable à la place de la
   silhouette, question, réponse montrée juste ou fausse, question suivante, bouton « Passer »), zoom de
   l'Île-de-France, question du numéro en outre-mer, lancé après chaque victoire. Accessibilité : chaque département
   atteignable au clavier, **sans que son nom lu par un lecteur d'écran donne la réponse**.
5. ✅ **web.7.5 Sauvegarde, statistiques, partage** : le bonus du jour sauvegardé avec la partie du jour à chaque
   réponse (champ facultatif, les anciennes sauvegardes restent lisibles, pas de `v2`), **repris après fermeture**,
   synchronisé entre onglets (`onglets.ts`) ; score moyen et nombre de bonus dans les statistiques ; la ligne
   « 🗺️ 9/12 » dans le partage, une fois le bonus fini.
6. ✅ **web.7.6 Le mode B, caché** : saisie avec suggestions (reprise de `Saisie` et `recherche.ts`), limitée aux
   départements de la région, nom ou numéro ; une constante dans le code pour choisir A ou B.
7. ✅ **web.7.7 Les finitions** : textes FR et EN, « Comment jouer », tests axe, téléphone à 375 pixels, thème sombre,
   leçons, plan.

(Numérotation d'origine des sept phases ; les PR suivent le regroupement en quatre décrit plus haut.)

## Le bonus revu (web.7.5 à web.7.7)

Retours des joueurs, le 17 octobre 2026 : (1) le bonus doit s'afficher **juste après la victoire**, au lieu de la
fenêtre des statistiques ; (2) plutôt que de chercher sur la carte un département nommé, on **clique sur un
département, puis on écrit son nom**, comme on écrit une région.

### Ce que ça change

- Aujourd'hui, une victoire ouvre la fenêtre des résultats, et le bonus commence à sa fermeture (`fermerFenetre()`
  et `bonusAVenir` dans `PartieDuJour.tsx` et `PartieLibre.tsx`). Il faut donc un autre moment pour ouvrir la
  fenêtre : la fin du bonus. Effet heureux : le partage contient alors déjà la ligne « 🗺️ 9/12 ».
- Le mode C, c'est le mode B dont le joueur choisit l'ordre. Il n'a pas besoin de l'ordre du jour (gardé pour le
  mode A). La `Tentative` tient toujours : `demande` est le département cliqué, `donne`
  celui qui est écrit ; score, statistiques et partage ne changent pas.
- La **sauvegarde** change : elle ne garde que les numéros donnés, dans l'ordre du jour connu d'avance. Avec un ordre
  libre, il faut des **paires** (cliqué -> écrit). Les anciennes sauvegardes se relisent comme aujourd'hui, en les
  rejouant avec l'ordre du jour.

### Les décisions (validées le 17 octobre 2026)

| Sujet | Décision |
|---|---|
| Après une victoire | **Plus de fenêtre** : le bonus prend tout de suite la place de la silhouette. La fenêtre des résultats s'ouvre **à la fin du bonus** (terminé ou passé), avec son score dans le partage. Le bouton « Voir les résultats » reste là pendant le bonus. |
| Passer avant toute réponse | Retour à la silhouette, la fenêtre des résultats s'ouvre, et le bonus reste à jouer par « 🗺️ Jouer le bonus » (jusqu'à minuit ; en partie libre, jusqu'à la partie suivante). Le bonus n'existe toujours **qu'après une victoire**. |
| Retour sur la page | Un bonus **en cours** s'affiche directement, sans la fenêtre par-dessus. Un bonus **pas commencé** attend son bouton, et la fenêtre s'ouvre (comme à web.7). |
| Partie libre | Le même enchaînement. |
| Mode C | **Un nouveau mode**, celui des joueurs : on clique un département (mis en évidence ; on peut changer d'avis avant d'écrire), puis on écrit son nom ou son **numéro** (« 29 »). **A et B restent dans le code**, cachés, choisis par `MODE_BONUS`. |
| Suggestions | Parmi les **101 départements** (comme les régions, parmi toutes celles du mode) : limitées à la région, elles donneraient la réponse. **Remplacé le 23 octobre 2026** (web.7.14) : seulement ceux de la région, les 101 devenant la version difficile. |
| Essais | **Une seule réponse par département** : faux, il devient rouge, le bon nom est montré, et il ne se rejoue plus. |
| Déjà trouvé | Écrire un département déjà trouvé ailleurs sur la carte est refusé avec un message, **sans coûter de réponse**. |
| Après une réponse | **Aucune sélection automatique** : le joueur clique le suivant. |
| Outre-mer | Toujours la question du **numéro**, le seul département étant déjà sélectionné. |
| Numérotation | **web.7.5 à web.7.7**, avant web.8. Une PR par étape, étiquettes `web-7.5`…, et `web-7.5.0` pour ce plan. |

### Les étapes (une branche et une PR chacune)

0. ✅ **web.7.5.0 Le plan** : ce chapitre (PR #22), puis **web.7.5.0.1** les décisions des phases (PR #23).
1. ✅ **web.7.5 Le bonus juste après la victoire** (PR #24, `src/pause.ts` pour la pause) : `PartieDuJour` et `PartieLibre` (plus de fenêtre à la victoire,
   le bonus tout de suite, la fenêtre à la fin du bonus ou à « Passer » avant toute réponse, les cas du retour sur
   la page), tests (`Bonus.test.tsx`, `App.test.tsx`…), « Comment jouer » si besoin, leçons.
2. ✅ **web.7.6 Les règles du mode C**, sans affichage (PR #25 ; `MODE_BONUS` passe à C seulement à web.7.7, pour que le jeu reste jouable entre les deux) : `bonus.ts` (la question `'choix'` ou un nom à décider,
   répondre avec le département cliqué et le département écrit, refus d'un département déjà trouvé, `MODE_BONUS`
   passe à C), `sauvegarde.ts` (des paires, l'ancien format toujours lisible), tests dont la relecture d'une
   ancienne sauvegarde.
3. ✅ **web.7.7 Le mode C jouable** (PR #26 ; `MODE_BONUS` passe à C ici) : `CarteDepartements` (un clic sélectionne, le choisi est mis en évidence, le zoom
   de l'Île-de-France se clique aussi ; au clavier, Tab puis Entrée sélectionne et donne le focus à la saisie, les
   zones toujours sans leur nom), `JeuBonus` (la saisie sous la carte, suggestions des 101 départements), textes FR
   et EN, « Comment jouer », tests axe, téléphone à 375 pixels (le clavier du téléphone peut cacher la carte), thème
   sombre, leçons, plan.

### Les décisions des phases (validées le 17 octobre 2026)

Posées toutes ensemble pour enchaîner les trois phases ; toutes les recommandations ont été acceptées.

| Phase | Sujet | Décision |
|---|---|---|
| 7.5 | La dernière réponse | La fenêtre des résultats s'ouvre après **une courte pause** (environ 1,5 s), pour voir la couleur de la dernière réponse. La seule minuterie du bonus, testée avec les fausses horloges de Vitest. |
| 7.5 | Le focus | À la victoire, la saisie de la région disparaît : le focus va sur le **titre du bonus**. |
| 7.5 | Sous le bonus | Le message de victoire et « Voir les résultats » (partie du jour) ou « Nouvelle partie » (partie libre, qui abandonne le bonus sans confirmation, rien n'étant compté) restent affichés. |
| 7.6 | Sauvegarde | Des **paires** (cliqué -> écrit) à la place de la liste des numéros donnés ; l'ancien format se relit avec l'ordre du jour. |
| 7.6 | Bonus A en cours | Un bonus du mode A commencé et pas fini (seulement le jour de la mise en ligne) **continue en mode C**, avec ses réponses. |
| 7.6 | Autre région | Un département d'une autre région écrit en réponse est une **réponse fausse**, qui compte. **Depuis web.7.14**, en version difficile seulement ; en version simple, refusé sans coût. |
| 7.6 | Refus sans coût | Seul un département **déjà trouvé** est refusé ; un nom déjà donné à tort ailleurs reste possible. |
| 7.6 | Entrée | Un début de nom qui n'évoque qu'**un** département des 101 le joue (« fin » -> Finistère) ; plusieurs : on demande de choisir. **Depuis web.7.14**, des 101 en version difficile, de la région en version simple. |
| 7.7 | Avant le clic | La saisie est **grisée** tant qu'aucun département n'est sélectionné, avec « Clique d'abord sur un département ». |
| 7.7 | La saisie | **Sous la carte** ; elle reçoit le focus au clic sur un département (vérifier à 375 pixels que le clavier du téléphone ne cache pas tout). |
| 7.7 | La carte | Sélectionné en **bleu foncé** ; répondus en vert ou rouge, plus sélectionnables ; les autres foncent au survol. |
| 7.7 | Les textes | « Clique sur un département de la carte », puis « Quel est ce département ? » ; « 3 réponses sur 12 » ; « Juste » et « Raté » inchangés. En anglais aussi. |
| 7.7 | Comment jouer | « Après une victoire, un bonus 🗺️ : clique sur chaque département de la région, puis écris son nom ou son numéro. Une seule réponse par département, et ton score s'ajoute au partage. » En anglais aussi. |
| — | Regroupement | **Trois PR** (7.5, 7.6, 7.7), empilées. |

## Le domaine et le défi (web.8)

Découpage et questions présentés le 17 octobre 2026, **en attente des réponses de l'utilisateur**. Entre parenthèses,
la recommandation de Claude.

### Le découpage proposé (3 PR)

1. **web.8.1 Le défi** : un lien à envoyer pour faire deviner une région, son affichage, textes FR/EN, tests. Il ne
   dépend pas du domaine : le lien se fabrique à partir de l'adresse de la page (`location`), pas d'une constante.
   D'abord, donc, en attendant l'achat du domaine.
2. **web.8.2 Le domaine** : `public/CNAME`, `base: '/'` dans `vite.config.ts`, `ADRESSE` dans `domaine/partage.ts`
   (et son test), liens du README et du bas de page ; les réglages DNS et GitHub Pages, faits par l'utilisateur avec
   la liste exacte donnée par Claude.
3. **web.8.3 L'aperçu des liens** : balises Open Graph (`og:title`, `og:description`, `og:image`, qui demande une
   adresse complète, donc le domaine) et `<meta name="theme-color">`.

### Les questions

Le domaine :

1. Le domaine est-il acheté, et lequel ? (`francle.fr`, libre le 14 octobre 2026, environ 7 à 10 € par an chez OVH,
   Gandi, Infomaniak… ; l'achat est fait par l'utilisateur.)
2. Avec ou sans `www` ? (`francle.fr`, et `www.francle.fr` qui y renvoie : 4 enregistrements A et AAAA vers GitHub,
   un CNAME `www` vers `deibine.github.io`.)
3. Vérifier le domaine dans les réglages GitHub (enregistrement TXT), pour que personne d'autre ne puisse le servir ?
   (Oui.)
4. **Les parties sauvées seront perdues** : `localStorage` est propre à chaque adresse, et GitHub renverra
   `deibine.github.io/francle-web` vers le nouveau domaine sans les données. a. accepter la perte, b. une page de
   transfert temporaire. (a : le jeu n'en est qu'à la partie n° 5.)

Le défi :

5. Qui choisit la région ? (Les deux : « Défier un ami » à la fin d'une partie libre, et un choix libre dans la
   liste 📃. Pas la partie du jour, déjà partagée.)
6. La région lisible dans le lien (`?defi=bretagne`) ou codée (`?defi=k3x9`) ? (Codée : pas un vrai secret, mais la
   surprise n'est pas gâchée.)
7. Ce que porte le lien en plus : l'époque (oui, indispensable pour une ancienne région), les modes difficiles (non :
   les réglages de celui qui reçoit), le score de celui qui défie (oui, facultatif, montré seulement à la fin).
8. Où se joue le défi ? (Dans l'onglet « Partie libre », avec un bandeau « Défi : trouve la région choisie par ton
   ami » ; ni sauvegardé ni compté, bonus après une victoire ; « Nouvelle partie » revient au hasard.)
9. Répondre au défi : un partage « #Francle défi 3/6 » en carrés, avec le lien du même défi ? (Oui.)
10. Un nom dans le défi (« Défi de Clément ») ? (Non : aucune donnée personnelle dans les liens.)

Le reste :

11. Ajouter à web.8 une amélioration en attente (compteur de la partie libre, repère « voisine », mode « métropole
    seulement ») ? (Non : web.8 reste court, elles auront leur étape.)

## Les corrections relevées le 18 octobre 2026

Le jeu a été testé de bout en bout le 18 octobre 2026, à la demande de l'utilisateur et sans rien modifier : tests
(275, tous verts), lint, types et construction ; une partie du jour (La Réunion) et des parties libres (Corse,
Île-de-France) jouées dans le navigateur intégré, sur ordinateur et à 375 × 812 pixels ; puis le code relu aux
endroits suspects. Chaque point a ensuite été comparé au Java, en lisant son code et en exécutant ses règles dans
`jshell`, pour comprendre (la colonne « Java » a été retirée à web.7.13, avec la séparation des deux projets). Décidés le même jour (plus bas), puis **codés le même jour** (web.7.8 à web.7.11), sauf le point 12.

Pas encore vérifié : le jeu sur un **vrai téléphone** (surtout un iPhone, voir le point 10) et le **thème sombre** à
l'œil (les captures du navigateur intégré restent rognées ou en retard).

### Les bugs

| # | Problème | Pour le reproduire | Cause |
|---|---|---|---|
| 1 | « Choisis dans la liste », mais la liste est fermée | Partie libre, anciennes régions : « nor » puis Entrée. Bonus de la Corse : « corse » puis Entrée. Il faut retaper une lettre pour revoir la liste | `proposer()` dans `composants/Saisie.tsx` ferme la liste (`setOuverte(false)`) même quand la saisie est refusée |
| 2 | « 100 % » coupé sur deux lignes ; « Wins 100 % » en anglais, mais « Average score 100% » | 📊 à 375 pixels ; puis en anglais | `composants/Statistiques.tsx` écrit `` `${stats.pourcentage} %` `` à la main (espace ordinaire, pas traduit) au lieu de `textes.stats.pourcentage()` |
| 3 | La réponse se lit dans le nom de l'image | Appui long sur la silhouette, « Ouvrir l'image » : `corse-C5fvIIqz.svg` (clic droit sur ordinateur) | Vite garde le nom du fichier source et n'y ajoute qu'une empreinte. Piste : des noms sans la région (option `build.rollupOptions.output.assetFileNames` de Vite, ou images renommées) |
| 4 | Une saisie vide est « une région qui n'existe pas » | « Proposer » sans rien écrire | Aucun test du cas vide avant `deviner()` (`composants/Plateau.tsx`). Piste : ne rien faire, ou « Écris le nom d'une région » |

### Les soucis d'interface

| # | Problème | Piste |
|---|---|---|
| 5 | En partie du jour, « Alsace » répond « Cette région n'existe pas » | « L'Alsace est une ancienne région, aujourd'hui dans le Grand Est », sans coûter d'essai ; l'inverse en partie libre, anciennes régions |
| 6 | Les indices pas encore révélés restent cachés à la fin : gagné en 4 essais, on ne voit jamais la capitale ni le monument | Tout révéler une fois la partie finie, pour apprendre |
| 7 | Bonus d'outre-mer : « Quel est le numéro de : La Réunion ? » (deux-points maladroits), et le focus va sur le titre du bonus : il faut cliquer dans le champ avant de taper « 974 » | L'article de chaque département d'outre-mer (« de la Guadeloupe », « de La Réunion », « de Mayotte »…) ; le focus dans la saisie quand il faut écrire |
| 8 | Les suggestions de départements n'ont pas de numéro (« Corse-du-Sud, Haute-Corse ») | « Finistère (29) », pour apprendre les numéros en passant |
| 9 | Sur téléphone, en partie libre, la saisie du bonus commence à 572 pixels sur 812 : le clavier cache une partie de la carte | Carte plus petite sur téléphone, ou saisie au-dessus de la carte |
| 10 | À la fin du bonus, « Survole un département… pour voir son nom » : le survol n'existe pas au doigt. Sur Android, toucher un département devrait marcher (le navigateur imite la souris et donne le focus). **Sur iPhone, peut-être pas** : Safari n'imite la souris que sur ce qui lui semble cliquable, et les départements n'ont plus ni `onClick` ni `cursor-pointer` à la fin | Afficher le nom au **clic** (souris comme doigt), et un texte « Touche ou survole… ». À vérifier sur un iPhone |
| 11 | La fenêtre de résultats de la partie libre n'a pas le score du bonus | Le reprendre, comme la partie du jour |
| 12 | La carte de fin ne colore que la réponse (déjà noté dans « Les améliorations à reprendre ») | Les régions proposées en couleur |

Notés en passant, déjà dans « Les améliorations à reprendre » : la suite de tests a pris **52 s** ce jour-là (jsdom
créé 24 fois, 34 % du temps ; Vitest propose encore `pool: 'vmThreads'`), et l'avertissement du canvas s'affiche
maintenant **10 fois**.

### Les décisions (validées le 18 octobre 2026)

Posées toutes ensemble, avec une recommandation chacune : **toutes les recommandations ont été acceptées**. Les
décisions sont notées ici (PR web.7.8.0) avant de coder ; le code attend le « tu peux lancer » de l'utilisateur.

| Sujet | Décision |
|---|---|
| Découpage | **Trois PR empilées**, avant web.8 : **web.7.8 Les bugs** (1, 2, 3, 4), **web.7.9 La saisie et la fin de partie** (5, 6, 11), **web.7.10 Le bonus** (7, 8, 9, 10). Étiquettes `web-7.8`, `web-7.9`, `web-7.10` ; `web-7.8.0` pour ce plan. Puis une **petite PR d'outillage** (tests plus rapides, canvas). |
| (1) « Plusieurs » | La liste **reste ouverte** sur les régions (ou départements) évoquées, **sans en surligner aucune** : deux Entrée de suite ne jouent pas une région au hasard. |
| (2) Pourcentages | Par `textes.stats.pourcentage()`, comme ailleurs ; vérifier qu'aucun autre pourcentage n'est écrit à la main. |
| (3) Nom de l'image | Les silhouettes ont des **noms sans la région** (seulement l'empreinte, par l'option `assetFileNames` de Vite). Arrête la triche d'un appui long, pas celle des outils du navigateur ; en mode développement, les noms restent lisibles. |
| (4) Saisie vide | **Rien ne se passe**, sans message. |
| (5) Autre époque | Refusée **sans coûter d'essai**, avec une tournure sans article (les régions n'en ont pas dans les données). Partie du jour : « Alsace : une ancienne région (avant 2016), aujourd'hui dans la région Grand Est. » Partie libre, anciennes régions : « Grand Est : une région d'après 2016, qui regroupe Alsace, Champagne-Ardenne et Lorraine. » Le lien entre les époques est **déduit des départements** (`departements.json`), sans nouvelle donnée. En anglais aussi. |
| (6) Indices | **Tous montrés** une fois la partie finie (gagnée, perdue ou abandonnée), **sans distinction**. Le partage ne change pas. |
| (11) Résultats de la partie libre | La phrase de fin du bonus (« Bonus terminé : 1 département trouvé sur 2. »), la même que sur la page, comme le Java. |
| (7) Question d'outre-mer | Un petit tableau dans `textes.ts` : « Quel est le numéro de la Guadeloupe / de la Martinique / de la Guyane / de La Réunion / de Mayotte ? » ; en anglais « What is the number of Guadeloupe? », sans article. |
| (7) Focus | Quand le bonus commence par la question du numéro, le focus va **dans la saisie** (comme le Java) ; sinon, sur le titre, comme aujourd'hui. |
| (8) Suggestions | **« Finistère (29) »**, partout dans le bonus. Ne donne pas la réponse : en mode C, la difficulté est de savoir quelle forme est quel département. |
| (9) Clavier du téléphone | Au choix d'un département, la page **défile pour mettre le haut du bonus en haut de l'écran** ; si ça ne suffit pas, une carte plus petite sur téléphone. **À vérifier par l'utilisateur sur un vrai téléphone.** |
| (10) Nom à la fin du bonus | Affiché aussi **au clic** (le doigt sur iPhone comme ailleurs), avec la main au survol. Texte : « Clique ou passe sur un département pour voir son nom. » En anglais aussi. **À vérifier sur un iPhone.** |
| Outillage | Une **4e petite PR** après web.7.10 : mesurer `pool: 'vmThreads'`, puis taire l'avertissement du canvas. |
| (12) Carte de fin | **Plus tard**, dans sa propre étape. |

Choix faits en route, en codant (à valider avec les PR) :

- (5) Une région qui a seulement changé de nom : « Centre-Val de Loire : une région d'après 2016, appelée Centre avant
  2016. » (« qui regroupe Centre » sonnait faux). Un début de nom suffit, comme ailleurs : « champ » en partie du jour
  parle de Champagne-Ardenne.
- (9) Le défilement ne se fait que sur un écran tactile (`pointer: coarse`) : à la souris, il ferait sauter la page à
  chaque clic, pour rien.
- (11) La phrase de fin du bonus est aussi dans les résultats de la partie du jour, qui ne l'avaient pas non plus.
- (10) Le texte de fin ne parle plus du clavier (« Clique ou passe sur un département… »), comme décidé ; le clavier
  marche toujours.

## La liste des départements (web.7.12)

Idée de l'utilisateur, le 19 octobre 2026 : le bonus n'a pas de liste, contrairement à la partie (📃, la liste des
régions). Pendant le bonus, le bouton 📃 ouvre donc la **liste des départements**. **Décidée et faite le 19 octobre
2026**, depuis le cloud (PR #34 pour les décisions, #36 pour le code).

### Les décisions (validées le 19 octobre 2026)

Posées toutes ensemble, avec une recommandation chacune : acceptées, sauf le contenu (point 1), où l'utilisateur a
choisi **les 101 départements** (« ça serait trop simple sinon »).

| Sujet | Décision |
|---|---|
| Contenu | **Les 101 départements**, pas seulement ceux de la région : la liste limitée à la région donnerait toutes les réponses, et le bonus deviendrait un jeu d'association (comme les suggestions, déjà parmi les 101 depuis le 17 octobre 2026). L'**époque ne joue donc aucun rôle** : les départements sont les mêmes dans les deux. **Remplacé le 23 octobre 2026** (web.7.14) : seulement ceux de la région, les 101 devenant la version difficile. |
| Affichage | **Nom et numéro** (« Finistère (29) », comme les suggestions), **triés par nom** (ordre alphabétique de la langue, comme `ListeRegions`), sur deux colonnes. |
| Un clic | Il **répond pour le département sélectionné** sur la carte, comme un clic dans la liste des régions propose la région. Tant qu'aucun département n'est sélectionné, les noms sont **grisés**, avec « Clique d'abord sur un département ». |
| Déjà répondus | **Barrés et grisés**, comme les régions déjà proposées, sans vert ni rouge (ils sont sur la carte). Le nom lu par un lecteur d'écran le dit. |
| Outre-mer | La question y est le numéro (« Quel est le numéro de la Guadeloupe ? ») : la liste, avec ses numéros, la donnerait. Le bouton reste donc **celui des régions** pendant un bonus d'outre-mer. |
| Quand | Les départements **tant que le bonus est sur le plateau**, même fini (tout grisé, avec « Le bonus est fini »). Les régions de nouveau quand la silhouette revient (bonus passé avant toute réponse, nouvelle partie, nouveau jour). Chaque onglet (partie du jour, partie libre) a son propre état. |
| Le bouton | **Même icône 📃** ; l'infobulle et le nom lu changent : « Voir la liste des départements ». |
| ⚙️ et « Comment jouer » | Le réglage « Bouton 📃 » masque les deux listes, son texte le dit (« la liste des régions, ou des départements pendant le bonus ») ; une phrase dans « Comment jouer ». En français et en anglais. |
| Découpage | **Une seule étape**, **web.7.12**, une PR, étiquette `web-7.12` ; ces décisions notées d'abord par une petite PR (web.7.12.0). |

Décisions du découpage (validées le 19 octobre 2026, recommandations acceptées) : sont barrés **tous les
départements dont la place sur la carte est déjà jouée**, trouvés comme manqués (les donner ailleurs ne peut être que
faux) ; après un clic sur un nom, le **focus revient sur 📃** (ce que fait déjà `<dialog>`).

### Ce qui a été fait (PR #36)

- `domaine/bonus.ts` : `avecListe(bonus)` (mode C seulement, donc pas la question du numéro) et `repondus(bonus)`.
- `composants/ListeDepartements.tsx` ; `JeuBonus` garde la fenêtre et répond par `repondreAvec` (la même fonction
  que la saisie) ; `Plateau` note la demande de 📃 mais n'ouvre pas la liste des régions pendant le bonus.
- `src/liste.ts` (`useSignalerListe`) : chaque partie dit à `App` quelle liste ouvre 📃, pour le nom du bouton.
- Textes FR et EN, réglage ⚙️, « Comment jouer » ; `ListeDepartements.test.tsx` (9 tests), un test axe, et le test
  de `ListeRegions` adapté (après la victoire, 📃 ouvre les départements).
- Vérifié dans Chromium à 375 × 812 pixels, en clair et en sombre : la liste défile dans la fenêtre, les noms longs
  passent sur deux lignes, le département barré se voit, et le focus revient sur 📃.

Choix faits en route (à valider avec la PR) :

- Le texte de la fenêtre quand un département est choisi : « Clique sur le nom du département choisi sur la carte. »
- Le bouton 📃 n'a pas d'infobulle (`title`), ni avant ni maintenant : seul son nom lu (`aria-label`) change.
- Les modes A et B, cachés, gardent la liste des régions (`avecListe` ne vaut que pour le mode C).

### Ce que ça demandait dans le code (présenté avant de coder)

- **Le bouton 📃 appartient à `App`** (l'en-tête), qui ne sait pas si un bonus est affiché : `PartieDuJour` et
  `PartieLibre` devront le lui signaler, onglet par onglet (comme `demandeListe`, déjà un compteur par onglet).
- **Le département sélectionné est gardé dans `JeuBonus`** (état `choix`) : la liste des départements s'ouvre donc
  là, et non dans `Plateau`, qui lui transmet la demande quand un bonus est affiché.
- Un composant **`ListeDepartements.tsx`**, sur le modèle de `ListeRegions.tsx`, avec `DEPARTEMENTS` et le nom
  affiché des suggestions (`textes.bonus.departement`).
- Textes FR et EN (`textes.ts`), ⚙️, « Comment jouer ».
- Tests : ouverture pendant le bonus, un clic qui répond, noms grisés sans sélection, déjà répondus barrés,
  outre-mer (liste des régions), retour à la liste des régions, partie du jour et partie libre, axe.
- Leçons et plan.

## Le bonus simplifié (web.7.14)

Idée de l'utilisateur, le 23 octobre 2026 : simplifier le bonus des départements. Pendant le bonus, la **liste 📃**
et les **suggestions de la saisie** ne proposent plus que les **départements de la région** jouée, en partie du jour
comme en partie libre. Le bonus d'aujourd'hui (les 101 départements partout) devient une **option**, la « version
difficile ». Cela **remplace** deux décisions : les suggestions parmi les 101 (17 octobre 2026, « Le bonus revu ») et
la liste des 101 (19 octobre 2026, « La liste des départements »).

### Ce que ça demande dans le code (vu avant de décider)

- Les suggestions sont choisies à un seul endroit, `suggerer` dans `JeuBonus.tsx` : les 101 en mode C, ceux de la
  région en mode B (caché). Il suffit de faire dépendre ce choix de la difficulté, et plus seulement du mode.
- La liste 📃 trie les 101 départements dans `ListeDepartements.tsx` : elle prendra la même liste que la saisie.
- Un réglage ajouté prend tout seul sa valeur par défaut chez les joueurs qui en ont déjà d'enregistrés
  (`lireReglages`) : pas de nouvelle clé de stockage.

### Les décisions (validées le 23 octobre 2026)

Posées toutes ensemble, avec une recommandation chacune : **toutes acceptées**.

| Sujet | Décision |
|---|---|
| Par défaut | La **version simple**, pour tout le monde, joueurs actuels compris. Qui veut les 101 départements coche la case. |
| Le réglage | Une nouvelle rubrique **« Bonus 🗺️ »** dans ⚙️, avec la case **« Départements : version difficile »** et son aide : « La liste 📃 et les suggestions proposent les 101 départements, pas seulement ceux de la région. » En français et en anglais. |
| Quand il est fixé | À la **première réponse du bonus**, comme 🌀 et 🙈 au premier essai : un changement pendant un bonus commencé vaut pour le suivant. |
| Partie du jour et partie libre | La même règle dans les deux. |
| Autre région, version simple | Un nom écrit en entier d'un département d'une autre région est **refusé sans coûter de réponse** (« Ce département n'est pas dans la région »). En version difficile, rien ne change : c'est une réponse fausse qui compte. |
| Touche Entrée, version simple | Un début de nom qui n'évoque qu'**un** département **de la région** le joue (« fi » -> Finistère en Bretagne), comme les suggestions. |
| Partage | La version difficile a son repère, comme 🌀 et 🙈 : « 🗺️ 9/12 💪 ». La version simple n'en a pas. |
| Statistiques | Le même « Score moyen » pour les deux versions, sans les séparer. |
| Anciennes sauvegardes | Un bonus sauvé avant ce changement est relu comme **difficile** (il a été joué ainsi). |
| Outre-mer | Inchangé : la question du numéro, et 📃 garde la liste des régions. |
| « Comment jouer » | Une phrase sur la version simple et l'option. En français et en anglais. |
| Découpage | Trois PR empilées, fusionnées à la fin : **web.7.14.0** ce plan, **web.7.14.1** les règles, **web.7.14.2** le réglage et l'affichage. Étiquettes `web-7.14.0`, `web-7.14.1`, `web-7.14.2`, et `web-7.14`. |

### Les phases (une branche et une PR chacune)

0. ✅ **web.7.14.0 Le plan** (PR #42) : ce chapitre, et les anciennes décisions marquées comme remplacées.
1. ✅ **web.7.14.1 Les règles, sans affichage** (PR #43 ; `avecDifficulte` et `proposables` dans `bonus.ts`, le
   refus `'autre-region'` et son message, déjà affiché par `JeuBonus` pour que les types tiennent ; les tests qui
   donnaient « Gironde » comme réponse fausse en donnent une de la région) : `bonus.ts` (le bonus connaît sa difficulté ; une fonction donne les
   départements proposés, ceux de la région ou les 101 ; le refus sans coût d'un département d'une autre région en
   version simple), `sauvegarde.ts` (la difficulté gardée avec le bonus du jour, une ancienne sauvegarde relue comme
   difficile), `partage.ts` (le repère 💪), tests dont la relecture d'une ancienne sauvegarde.
2. ✅ **web.7.14.2 Le réglage et l'affichage** (PR #44 ; 305 tests ; vérifié dans le navigateur intégré en partie
   libre : « s » ne suggère que la Somme dans les Hauts-de-France, la liste 📃 a 5 noms, puis 101 avec l'option, et le
   bonus commencé en difficile le reste quand on décoche ; ⚙️ lisible à 375 pixels en sombre) : `reglages.ts` et `Reglages.tsx` (la rubrique « Bonus 🗺️ »),
   `PartieDuJour` et `PartieLibre` (la difficulté fixée à la première réponse), `JeuBonus` et `ListeDepartements`
   (la liste de la phase 1), textes FR et EN, « Comment jouer », tests (dont axe), vérification à 375 pixels en clair
   et en sombre, leçons, plan.

## La carte de fin en couleur (web.7.15)

Le point 12 des corrections du 18 octobre 2026 (« Carte de fin » dans « Les améliorations à reprendre »). Une
maquette a été montrée le 23 octobre 2026 ; l'utilisateur l'a beaucoup aimée et a demandé de garder l'idée :
[`docs/maquettes/carte-de-fin-en-couleur.png`](maquettes/carte-de-fin-en-couleur.png). Elle a été dessinée avec les
vrais contours (`src/images/cartes/nouvelles.json`), et ses chiffres viennent des vraies règles (`geographie.ts`) :
l'Occitanie trouvée en 5 essais, en thème clair et en thème sombre.

### L'idée (la maquette)

- La **réponse** reste en **bleu foncé**, comme aujourd'hui.
- Chaque **région proposée** est colorée selon sa **proximité** : un dégradé du **jaune pâle** (loin) au **vert
  vif** (près), les couleurs des carrés 🟨 🟩 du partage. Le Grand Est à 7 % est presque jaune ; la
  Nouvelle-Aquitaine à 73 % est bien verte.
- Une **pastille numérotée** montre l'ordre des essais : on voit le chemin qui se rapproche.
- Les régions jamais proposées gardent la couleur neutre d'aujourd'hui (`carte-fond`).
- Sous la carte de la maquette : une légende du dégradé, et un rappel du tableau des essais (pour expliquer
  l'image, pas forcément à garder).

### Ce que ça demande dans le code (vu avant de décider)

- `FinDePartie.tsx` a déjà toute la partie (`partie`) : il suffit de donner ses essais à `CarteFrance`, au lieu de la
  seule cible.
- `CarteFrance.tsx` colore déjà la réponse par une classe ; il faudra une couleur calculée par essai (style
  `fill`), les pastilles, et dessiner les régions proposées après les autres (en SVG, le dernier dessiné passe
  devant).
- La couleur selon la proximité est une règle pure, testable sans affichage, à côté de `carres()` dans
  `domaine/partage.ts`.
- L'outre-mer est déjà dans ses encadrés : une région d'outre-mer proposée s'y colore comme les autres.

### Les décisions (validées le 23 octobre 2026)

Posées toutes ensemble, avec une recommandation chacune : **toutes acceptées** (« Ok pour tout »).

| Sujet | Décision |
|---|---|
| La couleur | Un **dégradé continu** du jaune pâle (0 %) au vert vif (99 %), comme la maquette, et pas trois paliers comme les carrés ⬜🟨🟩 : il distingue 41 % de 54 %. |
| Les numéros | Une **pastille numérotée** sur chaque région proposée, dans l'ordre des essais. |
| La légende | **Une ligne fine** sous la carte : le dégradé, « 0 % » et « 99 % », et le bleu de la réponse. |
| Le tableau | **Pas de rappel** du tableau des essais sous la carte : il est déjà sur le plateau. |
| Partie perdue ou abandonnée | **Pareil** : la réponse en bleu, les essais en couleur. |
| Partie libre | **La même carte**, dans les deux époques. |
| Thème sombre | **Le même dégradé** (lisible sur la maquette). |
| Au survol | Le **nom** de chaque région colorée. |
| Lecteurs d'écran | Le texte de la carte lit les essais : « Occitanie en bleu ; tes essais : 1 Grand Est, 7 % ; … ». En anglais aussi. |
| Partage | **Inchangé**. |
| Découpage | **Deux PR** empilées (ci-dessous). |

### Le découpage (validé le 23 octobre 2026)

Deux PR empilées, **fusionnées en squash le 23 octobre 2026**, étiquettes `web-7.15.0`, `web-7.15.1` et `web-7.15` :

0. ✅ **web.7.15.0 Le plan** (PR #46) : ce chapitre, avec les décisions ci-dessus.
1. ✅ **web.7.15.1 La carte en couleur** (PR #47 ; 314 tests ; `couleurProximite` dans `partage.ts`,
   `centreDeGravite` et `morceaux` dans `contours.ts` ; choix fait en route : la pastille d'une région d'outre-mer
   va dans le coin de son encadré, sinon elle cachait la région ; la légende ne s'affiche que s'il y a d'autres
   essais que la réponse ; vérifié dans le navigateur intégré, partie libre perdue en 6 essais, à 375 pixels en
   sombre) : la couleur selon la proximité (règle pure, avec ses tests), `CarteFrance`
   (les essais colorés, les pastilles, la légende, le nom au survol, le texte pour les lecteurs d'écran),
   `FinDePartie`, textes FR et EN, tests (dont axe), vérification à 375 pixels en clair et en sombre, en partie du
   jour et en partie libre (les deux époques), leçons, plan.

## Les corrections et le coup de neuf (web.7.16)

Demandé par l'utilisateur le 25 octobre 2026 : « des vérifications de bugs et d'amélioration d'esthétique », et des
phases pour les traiter. Le jeu a été vérifié le même jour **sans rien modifier** : lint, build et tests (**314 sur
314** ; 71 s, car ils tournaient en même temps que l'installation et le build) ; tout le code des composants relu ;
une partie du jour (Martinique, gagnée en 3 essais, avec le bonus) et une partie libre en anciennes régions
(Picardie en 5 essais) jouées dans le navigateur intégré, sur ordinateur puis à 375 × 812 en thème sombre.

### Les bugs

| # | Problème | Cause |
|---|---|---|
| 1 | Le bonus peut rester bloqué sur « Chargement… » | `useContours` (`src/contours.ts`) n'a pas de `.catch` : si le téléchargement des contours échoue (plus de réseau, ou une mise en ligne qui a renommé les fichiers pendant que la page restait ouverte), le message ne part jamais |
| 2 | En partie libre, le sous-titre dit « Devine la région française du jour » | `textes.sousTitre` ne dépend pas de l'onglet (`App.tsx`) |
| 3 | Pendant le bonus de la partie libre, « Nouvelle partie » reste sous la carte : un clic perd le bonus, sans confirmation | Le bloc `fin` du plateau s'affiche dès que la partie est finie, bonus en cours ou non |
| 4 | 📊 : « Score moyen 0 % » alors qu'aucun bonus n'a été joué | `Statistiques.tsx` affiche le pourcentage même quand `bonusJoues` vaut 0 |
| 5 | Liste fermée : il faut appuyer deux fois sur ↓ pour surligner la première suggestion | Dans `touche()` (`Saisie.tsx`), la liste lue est celle d'avant l'ouverture (vide) |

### L'esthétique

| # | Problème | Où |
|---|---|---|
| 6 | À 375 pixels, le titre passe sur deux lignes : « n° 13 » tombe sous « Francle » (le bouton FR / EN, ajouté après web.6.3, prend la place) | En-tête |
| 7 | 📊 : « Série en cours » et « Meilleure série » font deux lignes, leurs chiffres ne sont plus alignés avec les autres | `Statistiques.tsx` |
| 8 | Mode C à 375 pixels : le texte d'exemple est coupé (« Clique d'abord sur un départe… ») | Saisie du bonus |
| 9 | « 1 département trouvé sur 1. » laisse « 1. » seul sur sa ligne | Espace insécable manquante (`textes.ts`) |
| 10 | Les messages qui expliquent (« Alsace : une ancienne région… », « déjà proposée ») sont en rouge, comme des erreurs | `Plateau.tsx`, `JeuBonus.tsx` |
| 11 | Carte de fin : 58 %, 71 % et 90 % ont presque le même vert. En métropole, la proximité dépasse presque toujours 50 % (la Bretagne vaut même 51 % depuis la Martinique) : la moitié jaune du dégradé ne sert pas | `couleurProximite` (`partage.ts`) |
| 12 | Carte de fin : une réponse d'outre-mer se voit à peine (encadré minuscule, la pastille la cache en partie) | `CarteFrance.tsx` |
| 13 | Les boutons « Non » (abandon, changement d'époque) ont une bordure de la couleur du texte, pas `border-bord` | `Plateau.tsx`, `PartieLibre.tsx` |
| 14 | Les icônes de l'en-tête sont des emoji, dessinés différemment par chaque système (❓ rouge sous Windows, 📊 multicolore) | En-tête |
| 15 | Les réglages sont une longue liste de boutons radio | `Reglages.tsx` |
| 16 | « Comment jouer » est un bloc de texte | `Aide.tsx` |
| 17 | Sous un bonus fini, la page répète le résultat (« Bonus terminé… », puis « Bravo… La réponse : … ») | `JeuBonus.tsx`, bloc `fin` des deux parties |

Laissés de côté : Open Graph et `theme-color` (déjà prévus avec web.8) ; le site chargé au départ pèse 362 Ko (les
cartes des deux époques y sont, alors qu'elles ne servent qu'à la fin) ; l'empreinte d'une silhouette ne change pas
d'une mise en ligne à l'autre (on pourrait apprendre « C5fvIIqz = Corse » : triche très improbable).

### La maquette du coup de neuf

[`docs/maquettes/coup-de-neuf.png`](maquettes/coup-de-neuf.png), dessinée le 25 octobre 2026 avec les vraies
silhouettes et les vrais contours (script Node jetable, puis Edge sans fenêtre), en clair et en sombre, à la largeur
d'un téléphone. **Validée par l'utilisateur le 25 octobre 2026** (« c'est effectivement beaucoup mieux »), après la
fusion du plan (PR #49). Quatre écrans :

1. **L'en-tête en icônes** : quatre icônes dessinées en SVG (aide, réglages, liste, statistiques), d'un trait de la
   couleur du texte, à la place des emoji ; le titre et son numéro tiennent sur une ligne. Le message
   d'information est neutre (gris, sur fond `surface`, précédé de ⓘ), plus en rouge.
2. **Les réglages groupés** : langue, thème et distances en boutons côte à côte (le choix en bleu Francle) ; les
   modes difficiles, le bouton liste et la version difficile du bonus en interrupteurs, avec leur explication en
   petit.
3. **« Comment jouer » illustré** : une vraie ligne du tableau (Normandie, 251 km, ↗️, 76 %) avec, dessous, ce que
   veut dire chaque colonne ; puis quatre lignes courtes avec une icône (indices, bonus, partie du jour et partie
   libre, modes difficiles).
4. **La fin de partie sur la page** : sous la carte du bonus, un seul bloc de bilan (« 🎉 Martinique, trouvée en 3
   essais », « Bonus : 1 département sur 1 · 100 % »), avec « Voir les résultats » et « Partager » côte à côte ; plus
   de phrase répétée.

### Les décisions (validées le 25 octobre 2026)

L'utilisateur a accepté **toutes les recommandations** (« oui pour tes recommandations »), sauf la phase 4, qu'il veut
faire **elle aussi**, avec des maquettes proposées par Claude.

| Sujet | Décision |
|---|---|
| (1) Contours | Un message « Impossible de charger la carte. » et un bouton **Réessayer**. Le bonus reste là, « Passer » marche toujours. |
| (3) « Nouvelle partie » | **Caché** tant que le bonus est en cours : « Passer » suffit pour en sortir. |
| (4) Score moyen | **« – »** tant qu'aucun bonus n'a été joué. |
| (11) Le dégradé | Il **commence à 50 %** : en dessous, jaune pâle ; de 50 à 99 %, du jaune au vert. La règle de proximité ne change pas, seulement la couleur (et la légende : « 50 % », « 99 % »). |
| (10) Les messages | **Neutres** (`text-discret`) pour ce qui explique ; le rouge seulement pour les vraies erreurs. |
| Phase 4 | **Faite elle aussi**, après les trois autres, **comme la maquette** (ci-dessus, validée le 25 octobre 2026) : les quatre écrans tels quels. |
| Les autres points | Corrigés comme proposé (2, 5 à 9, 12, 13). |

### Les phases (une branche et une PR chacune, empilées, fusion en squash à la fin)

0. ✅ **web.7.16.0 Le plan** : ce chapitre, la maquette (PR #49 et #50).
1. ✅ **web.7.16.1 Les bugs** : 1 à 5. `useContours` renvoie un état (`contours`, `echec`, `reessayer`) et accepte une
   fonction de téléchargement (pour les tests) ; `sousTitreLibre` ; « Nouvelle partie » caché pendant le bonus ;
   `aucunScore` (« – ») ; ↓ compte les suggestions à venir quand la liste est fermée.
2. ✅ **web.7.16.2 Le téléphone** : 6 à 9. Emoji de l'en-tête en `text-xl` sur téléphone et titre en
   `whitespace-nowrap` (mesuré : 36 pixels de haut, une ligne) ; `justify-end` dans les statistiques ; « Clique d’abord
   sur la carte » (185 pixels pour environ 210 de place) ; espace insécable avant le total du bonus.
3. ✅ **web.7.16.3 Les couleurs et les messages** : 10 à 13. `src/message.ts` (sorte `info` ou `erreur`) et
   `composants/Message.tsx` ; `DEBUT_DEGRADE` (50) dans `partage.ts` ; l'encadré de la réponse d'outre-mer en bleu,
   dessiné en dernier ; `border-bord` sur les boutons « Non ».
4. ✅ **web.7.16.4 Le coup de neuf** : 14 à 17, comme la maquette. `composants/Icones.tsx` (quatre SVG) ; réglages en
   boutons groupés (`has-[:checked]:`) et interrupteurs (`peer-checked:`), sur les vrais `<input>` ; « Comment jouer »
   avec une vraie ligne du tableau ; `composants/Bilan.tsx` (« Résumé de la partie »), avec le partage sur la page.

Choix faits en route (à valider avec les PR) :

- (1) « Réessayer » relance le téléchargement ; **pas vérifié sur une vraie coupure** (le test simule l'échec). Si le
  navigateur garde en mémoire l'échec d'un `import()`, seul un rechargement de la page aidera.
- (6) À 375 pixels, `gap-x-2` dans l'en-tête : le titre touchait le bouton FR / EN.
- (10) Restent rouges : « Cette région n’existe pas », « Ce n’est pas un département », « Écris un numéro… ». Deviennent
  neutres : « Plusieurs… possibles », « déjà proposée », « déjà trouvé », « pas dans la région », l'autre époque.
- (16) Les textes de « Comment jouer » sont raccourcis (FR et EN) ; les emoji de l'en-tête n'y sont plus cités
  (« Bouton liste dans l’en-tête » dans les réglages).
- (17) La dernière réponse du bonus (« Juste : Martinique (972). ») reste sous sa carte ; la maquette ne la montrait pas.
  Le partage est dans le bilan, sauf pendant le bonus.
- Vu en vérifiant, **pas changé** : les silhouettes sont dessinées département par département depuis web.2 (4 tracés
  pour la Bretagne), ce qui laisse voir leurs limites, donc leur nombre. À décider plus tard si ça gêne.

Vérifié le 25 octobre 2026 : 318 tests, lint, build ; dans le navigateur intégré, en clair et en sombre, en taille
ordinateur, et à 375 pixels par script (les captures à cette largeur sortaient rognées).

Le plan est fusionné (PR #49, étiquette `web-7.16.0`, commit `d7492e6`), la validation de la maquette notée par une
petite PR de notes (web.7.16.0.1, sans étiquette).

Étiquettes prévues : `web-7.16.0` à `web-7.16.4`, puis `web-7.16`. **Rien n'est commencé** : le code attend le
signal de départ de l'utilisateur (règle de `CLAUDE.md`).

## Les améliorations à reprendre (relevées le 16 octobre 2026)

Relevées en relisant le code après web.6. Le bug du changement de jour a été corrigé tout de suite (PR #9, étiquette
`web-6.1`) ; la touche Entrée, le changement d'époque, les deux onglets et les détails, à web.6.2. Le reste n'est pas
commencé.

- **Partie libre, le hasard** : `tirer()` est uniforme (vérifié sur 180 000 tirages), mais rien n'empêche deux fois
  la même région de suite (1 fois sur 18). Écarté pour l'instant : avec 18 régions, un « sac mélangé » ne vaut pas
  la peine. Si ça gêne, le plus simple : retirer quand on retombe sur la région précédente.
- **Aperçu des liens partagés** : pas de balises Open Graph (`og:title`, `og:description`, `og:image`) dans
  `index.html` ; un lien envoyé sur WhatsApp ou Discord s'affiche sans titre ni image. À faire avec le domaine (web.8),
  avec `<meta name="theme-color">` (la barre du navigateur sur téléphone en bleu Francle, en clair et en sombre).
- **Partie libre, un compteur** : « 7 trouvées sur 9 » pour la visite, sans rien sauvegarder ni compter dans les
  statistiques.
- **Régions voisines** : la distance se mesure entre les centres, donc deux voisines n'affichent pas 0 km. Un repère
  « voisine » (dans le tableau, voire dans le partage) aiderait : c'est une nouvelle règle, à décider.
- **Outre-mer et mode 🙈** : un mode « métropole seulement » en partie libre (les silhouettes d'outre-mer sont très
  reconnaissables) ; en mode image cachée, révéler la silhouette au bout de quelques essais.
- **Carte de fin** : montrer aussi les régions proposées, en couleur. **Faite le 23 octobre 2026** (web.7.15) : voir « La
  carte de fin en couleur (web.7.15) », avec sa maquette.
- **Partie du jour devinable** : chaque région revient une fois par cycle de 18 jours, donc le 18e jour se devine par
  élimination. Changer cela changerait les régions des jours à venir, et les valeurs figées de `reference.json` : à décider.
- **Des tests plus rapides** : **fait à web.7.11** (`pool: 'vmThreads'`, 40 s -> 26 s ; `delay: null` pas essayé).
  Le délai des tests est passé à 15 s (PR #12), mais les tests d'écran restent lents
  (jusqu'à 5 s chacun, 23 s pour toute la suite). Deux pistes, à mesurer avant de choisir :
  - créer le faux navigateur (jsdom) une fois par processus et non une fois par fichier : il prend 40 à 48 % du
    temps, et Vitest le suggère lui-même (`pool: 'vmThreads'`, qui garde chaque fichier isolé) ;
  - faire taper user-event sans pause entre les lettres : `userEvent.setup({ delay: null })`.
- **Le bruit dans la sortie des tests** : **fait à web.7.11** (c'était axe-core, `_isIconLigature`). « Not implemented: HTMLCanvasElement's getContext() » s'affiche 7 fois,
  car jsdom n'a pas de canvas. Trouver quel code l'appelle (sans doute axe-core, dans les tests d'accessibilité),
  puis le taire, par exemple en remplaçant `getContext` par une fonction vide dans `preparationTests.ts`.

## L'environnement de travail

- **Node.js 24 LTS** et npm 11 sont installés (par `winget install OpenJS.NodeJS.LTS`, le 14 octobre 2026). Dans le
  Bash de Claude Code, Node n'est pas dans le `PATH` : préfixer les commandes par
  `export PATH="/c/Program Files/nodejs:$PATH";`.
- Commandes : `npm run dev` (site en local sur `http://localhost:5173/francle-web/`), `npm test`, `npm run lint`,
  `npm run build`.
- Python 3.10 est installé, accessible par `py` (pas `python`) : il sert à `outils/generer_images.py`.
- GitHub CLI (`gh`) est connecté au compte `deIbine`, avec les droits `repo` et `workflow`.
- Java 21 est installé : de quoi lancer le projet Java pour comparer une règle (voir la section suivante).
- Branches nommées `web-<n>-<sujet>` (par exemple `web-1-donnees-et-regles`), étiquettes `web-<n>`.

## Le projet Java, outil de comparaison

Depuis le 23 octobre 2026 (web.7.13), les deux projets sont **séparés**, chacun dans son dossier et son dépôt, chacun
avec sa conversation. Le Java sert seulement à **comparer** : lire comment il fait, exécuter une de ses règles
(`jshell`) pour comprendre un écart. On ne modifie pas son dépôt depuis ici, on n'y reporte pas les décisions du web,
et le web n'a pas à lui rester égal.

- Où : `C:\Users\cleme\Desktop\Claude\francle` (dépôt `deIbine/francle`).
- Ce qu'on peut y lire : les données des régions (`src/main/java/fr/francle/donnees/RegionFr.java`,
  `docs/indices.md`), les règles (`src/main/java/fr/francle/jeu/` : `Partie`, `Direction`, `RegionDuJour`, `Bonus`),
  le script des images d'origine (`outils/generer_images.py`).
- Pour le lancer : `.\mvnw.cmd test` (PowerShell) ou `./mvnw test` (Bash) ; Maven n'est pas installé, le projet
  apporte le sien (le Maven Wrapper).
