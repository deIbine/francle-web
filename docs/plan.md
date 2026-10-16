# Francle web : le plan

Décidé le 14 octobre 2026, à la fin de la Phase 6 du projet Java [deIbine/francle](https://github.com/deIbine/francle).
Ce document sert de point de départ à chaque nouvelle conversation : voir d'abord « Où on en est » plus bas.

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
| Région du jour | **La même que le Java**, au bit près (même hasard, même premier jour, le 13 octobre 2026). Le jour change **à minuit chez le joueur** (décidé à web.1). |
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
7. **web.7 Le bonus des départements** : après chaque victoire (partie du jour et partie libre), faire deviner tous
   les départements de la région trouvée (décidé le 16 octobre 2026, étendu à la partie libre le 17 octobre 2026,
   détail plus bas dans « Le bonus des départements »).
8. **web.8 Le domaine et le défi** (ancien web.7, renuméroté le 16 octobre 2026) : d'abord le nom de domaine, puis le défi (un lien à envoyer à un ami pour lui
   faire deviner une région). Pas d'archives des jours passés (décidé avant web.4).

## Où on en est (mis à jour le 17 octobre 2026)

**Faites : web.0 à web.6**, et pour web.7 les phases **web.7.0** et **web.7.0.1** (le plan). Le bonus est **fini dans
le projet Java** (phase 9, PR deIbine/francle#34, étiquette `phase-9`) et ses réponses sont reportées plus bas.
Prochaine étape : **web.7.1 Les données des départements** (voir « Le bonus des départements »). Ensuite **web.8 Le
domaine et le défi** (l'utilisateur doit d'abord acheter le nom de domaine).

- **web.0** (PR #1, étiquette `web-0`) : dépôt public `deIbine/francle-web`, Vite + React + TypeScript, Vitest, lint
  oxlint, CI `.github/workflows/ci.yml` (tâche `verifier` sur chaque PR et sur `main`, tâche `publier` vers GitHub
  Pages après chaque fusion). Le site est en ligne : https://deibine.github.io/francle-web/ (le jeu complet depuis
  web.6).
- **web.1** (PR #2, étiquette `web-1`) : tout le domaine dans `src/domaine/`, sans affichage :
  - `regions.ts` (35 régions, noms et indices FR/EN, 5e indice « monument »), `recherche.ts` (saisie, suggestions,
    noms FR et EN acceptés), `geographie.ts` (distance, 8 directions, proximité), `partie.ts` (6 essais, valeurs non
    modifiables : `proposer(partie, saisie)` renvoie une nouvelle partie), `hasardJava.ts` + `regionDuJour.ts`
    (région et angle du jour identiques au Java, minuit chez le joueur) ;
  - 98 tests, dont `reference-java.test.ts` qui compare tout au fichier `reference-java.json` produit par
    `outils/ReferenceJava.java` (mode d'emploi dans son en-tête).
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
- **Pour reprendre** : lire ce plan et `docs/lecons.md`, vérifier que `main` est à jour (`git pull`), puis reprendre
  « Le bonus des départements » ci-dessous : présenter le découpage de **web.7.1** et poser ses questions. Le code
  Java de la phase 9 sert de référence (fichiers cités dans « Ce qui existe déjà »). Aucun code n'est encore écrit
  dans `francle-web` pour web.7 : seules les phases web.7.0 et web.7.0.1, les mises à jour de ce plan, sont faites.
  Pour web.8 : quel domaine, s'il est acheté ; comment fonctionne le lien du défi (région visible dans le lien ou
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
| Ordre | En partie du jour, **le même ordre que le Java, au bit près** (voir « L'ordre du jour » plus haut), vérifié par `reference-java.json`. |
| Essais | **Un seul par département** : juste ou faux, on montre la réponse (vert ou rouge) et on passe au suivant. |
| Forme du jeu | Deux modes programmés : **A. cliquer sur la carte** (« Où est le Finistère ? ») et **B. nommer le département coloré** (saisie avec suggestions, **nom ou numéro** acceptés, « 29 »). **Seul A est en ligne** ; B se choisit par une **constante dans le code** (comme `Bonus.MODE` du Java), sans le montrer aux joueurs. |
| Outre-mer | Une région à un seul département : cliquer serait gratuit, donc on demande **le numéro** (« Quel est le numéro de : Guadeloupe ? »). |
| Où | **Sur le plateau, à la place de la silhouette**. Le bonus commence à la fermeture de la fenêtre de fin d'une victoire. |
| Passer | Un bouton **« Passer »**. Passé **avant toute réponse**, le bonus n'a pas commencé : il reste à jouer. |
| Reprise (**propre au web**) | Un bonus du jour commencé (au moins une réponse) puis quitté (page fermée, onglet rechargé) **reprend là où il en était** au retour, avec les réponses déjà données. Le Java, lui, le compte comme joué avec son score partiel, **sans reprise**. Écart décidé le 17 octobre 2026 : sur le web, fermer un onglet par erreur arrive souvent. **« Passer »** un bonus commencé le termine (score partiel), comme dans le Java. Noté aussi dans la feuille de route du Java. |
| Île-de-France | Un **zoom** sur Paris et la petite couronne (75, 92, 93, 94), trop petits sinon : le cadre `zoom` du fichier de contours. |
| Ce qui compte | Le bonus du jour est **sauvegardé**, compte dans les **statistiques** (**score moyen**, moyenne des pourcentages de départements trouvés, et **nombre de bonus**) et apparaît dans le **partage**. |
| Partage | Une ligne de **score** : « 🗺️ 9/12 ». **Aucune ligne 🗺️** tant que le bonus n'est pas fini (pas commencé, ou en cours). |
| Données | **Copie** de `departements.json` du Java dans le web (les deux dépôts sont séparés). Le script web le lit, comme celui du Java. |
| Contours | Générés par `outils/generer_images.py`, en y **reportant les changements du script Java** : **un fichier de contours par région** (les 35, anciennes régions comprises), chaque département étant un tracé à part, avec son numéro. React les dessine, colore et rend cliquables (comme `CarteFrance`). Ce fichier sert aux deux modes. |
| D'abord en Java | Le bonus est fait **en entier dans les deux projets**, **d'abord dans le projet Java** `deIbine/francle` (sa **phase 9**, plan dans son `docs/feuille-de-route.md`), puis ici en web.7. Le Java a tranché les questions ouvertes en jouant ; ses réponses s'appliquent au web, sauf la reprise (décidé le 16 octobre 2026). |

### Les phases (une branche et une PR par phase, étiquettes `web-7.0`, `web-7.1`…)

0. **web.7.0 Le plan à jour** : ce chapitre, et l'ancien web.7 renuméroté web.8. ✅
   **web.7.0.1 Les réponses du Java** : les décisions du Java reportées ici, avec l'écart de la reprise (le
   17 octobre 2026). ✅
1. **web.7.1 Les données des départements**, sans affichage : copier `departements.json` du Java (par exemple dans
   `src/domaine/departements.json`), `src/domaine/departements.ts` (101 départements, numéro, nom, région pour chaque
   époque), et le script Python le lit au lieu de son tableau `DEPARTEMENTS`. Tests : 101 départements, chacun dans
   une seule région par époque, aucun oubli, accord avec `regions.ts`.
2. **web.7.2 Les contours des départements** : reporter dans le script les changements du Java ; il écrit
   `src/images/departements/<région>.json` (les 35 régions, tracés simplifiés, un par département) et le cadre du
   zoom de l'Île-de-France. Vérifier le poids des fichiers ; ne charger que la carte de la région jouée.
3. **web.7.3 Les règles du bonus**, sans affichage (comme `partie.ts`) : `src/domaine/bonus.ts`, les questions
   (carte, nom, numéro), l'ordre du jour identique au Java (ajouté à `reference-java.json` par
   `outils/ReferenceJava.java`) ou au hasard en partie libre, une réponse renvoie un nouveau bonus, passer, le score,
   la fin. Tests.
4. **web.7.4 Le bonus jouable, mode A** : composant `CarteDepartements` (carte cliquable à la place de la
   silhouette, question, réponse montrée juste ou fausse, question suivante, bouton « Passer »), zoom de
   l'Île-de-France, question du numéro en outre-mer, lancé après chaque victoire. Accessibilité : chaque département
   atteignable au clavier, **sans que son nom lu par un lecteur d'écran donne la réponse**.
5. **web.7.5 Sauvegarde, statistiques, partage** : le bonus du jour sauvegardé avec la partie du jour à chaque
   réponse (champ facultatif, les anciennes sauvegardes restent lisibles, pas de `v2`), **repris après fermeture**,
   synchronisé entre onglets (`onglets.ts`) ; score moyen et nombre de bonus dans les statistiques ; la ligne
   « 🗺️ 9/12 » dans le partage, une fois le bonus fini.
6. **web.7.6 Le mode B, caché** : saisie avec suggestions (reprise de `Saisie` et `recherche.ts`), limitée aux
   départements de la région, nom ou numéro ; une constante dans le code pour choisir A ou B.
7. **web.7.7 Les finitions** : textes FR et EN, « Comment jouer », tests axe, téléphone à 375 pixels, thème sombre,
   leçons, plan.

Ce découpage reste à confirmer phase par phase (décidé le 17 octobre 2026 : faire web.7.0.1, puis voir si toutes
les phases sont nécessaires ou si certaines se regroupent).

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
- **Carte de fin** : montrer aussi les régions proposées, en couleur.
- **Partie du jour devinable** : chaque région revient une fois par cycle de 18 jours, donc le 18e jour se devine par
  élimination. Changer cela casserait l'égalité avec le Java : à décider.
- **Des tests plus rapides** : le délai des tests est passé à 15 s (PR #12), mais les tests d'écran restent lents
  (jusqu'à 5 s chacun, 23 s pour toute la suite). Deux pistes, à mesurer avant de choisir :
  - créer le faux navigateur (jsdom) une fois par processus et non une fois par fichier : il prend 40 à 48 % du
    temps, et Vitest le suggère lui-même (`pool: 'vmThreads'`, qui garde chaque fichier isolé) ;
  - faire taper user-event sans pause entre les lettres : `userEvent.setup({ delay: null })`.
- **Le bruit dans la sortie des tests** : « Not implemented: HTMLCanvasElement's getContext() » s'affiche 7 fois,
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
- Java 21 est installé : il sert à régénérer le fichier de référence du Java si besoin.
- Branches nommées `web-<n>-<sujet>` (par exemple `web-1-donnees-et-regles`), étiquettes `web-<n>`.

## Où trouver le reste

- Projet Java : `C:\Users\cleme\Desktop\Claude\francle` (dépôt `deIbine/francle`, étiquettes `phase-6`, `phase-8`).
  - son plan, dont la phase 9 (le bonus des départements) : `docs/feuille-de-route.md` ;
  - les données des régions : `src/main/java/fr/francle/donnees/RegionFr.java` et `docs/indices.md` ;
  - les règles : `src/main/java/fr/francle/jeu/` (`Partie`, `Direction`, `RegionDuJour`) ;
  - le script des images et la source des contours : `outils/generer_images.py` ;
  - les leçons des phases précédentes : `docs/lecons.md`.
