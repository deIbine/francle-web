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
7. ✅ **web.7 Le bonus des départements** : après chaque victoire (partie du jour et partie libre), faire deviner tous
   les départements de la région trouvée (décidé le 16 octobre 2026, étendu à la partie libre le 17 octobre 2026,
   détail plus bas dans « Le bonus des départements »).
   **web.7.5 à web.7.7 Le bonus revu**, après les retours des joueurs : le bonus juste après la victoire, et un
   mode C « cliquer un département, puis écrire son nom » (décidé le 17 octobre 2026, détail plus bas dans « Le
   bonus revu »). Avant web.8.
8. **web.8 Le domaine et le défi** (ancien web.7, renuméroté le 16 octobre 2026) : d'abord le nom de domaine, puis le défi (un lien à envoyer à un ami pour lui
   faire deviner une région). Pas d'archives des jours passés (décidé avant web.4).

## Où on en est (mis à jour le 17 octobre 2026)

**Faites : web.0 à web.7.** Le bonus des départements est en ligne depuis le 17 octobre 2026 : quatre PR (#17 à
#20), relues par l'utilisateur (testées en local) et fusionnées, étiquettes `web-7.1` à `web-7.4` et `web-7` (détail
plus bas dans « Le bonus des départements »). Prochaine étape : **le bonus revu (web.7.5 à web.7.7)**, décidé le
17 octobre 2026 après les retours des joueurs (voir « Le bonus revu » plus bas), puis **web.8 Le domaine et le
défi**, dont le découpage reste à valider (l'utilisateur doit d'abord acheter le nom de domaine).

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
- **Le bonus des départements** (PR #17 à #20, étiquettes `web-7.1` à `web-7.4`, et `web-7`) : voir « Le bonus des
  départements » plus bas. Les choix faits en route (listes « À valider » des PR) ont été acceptés tels quels.
- **Pour reprendre (le 17 octobre 2026, après la PR du bonus revu)** : lire ce plan et `docs/lecons.md`, vérifier
  que `main` est à jour (`git pull`) et que les PR de ce plan (web.7.5.0 et web.7.5.0.1) sont fusionnées. Les
  décisions du **bonus revu** sont toutes prises, phases comprises (voir « Le bonus revu » et « Les décisions des
  phases » plus bas) : les trois phases web.7.5 à web.7.7 s'enchaînent en PR empilées, fusionnées à la fin avec
  l'accord de l'utilisateur, une fois qu'il a dit de lancer. Le découpage de web.8 et ses douze questions ont été présentés le 17 octobre 2026 (voir
  « Le domaine et le défi (web.8) » plus bas) : **l'utilisateur n'a pas encore répondu**, à reprendre après le bonus
  revu.
  - **Reste à faire côté Java**, plus tard et dans une autre conversation (décidé le 17 octobre 2026) : voir « À
    reporter dans le Java » dans « Le bonus revu ».
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
  mode A, avec sa comparaison au Java). La `Tentative` tient toujours : `demande` est le département cliqué, `donne`
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
| Suggestions | Parmi les **101 départements** (comme les régions, parmi toutes celles du mode) : limitées à la région, elles donneraient la réponse. |
| Essais | **Une seule réponse par département** : faux, il devient rouge, le bon nom est montré, et il ne se rejoue plus. |
| Déjà trouvé | Écrire un département déjà trouvé ailleurs sur la carte est refusé avec un message, **sans coûter de réponse**. |
| Après une réponse | **Aucune sélection automatique** : le joueur clique le suivant. |
| Outre-mer | Toujours la question du **numéro**, le seul département étant déjà sélectionné. |
| Numérotation | **web.7.5 à web.7.7**, avant web.8. Une PR par étape, étiquettes `web-7.5`…, et `web-7.5.0` pour ce plan. |
| Java | **Le web d'abord**, dans cette conversation ; le Java **plus tard, dans une autre conversation**, avec les mêmes décisions (voir « À reporter dans le Java »). |

### Les étapes (une branche et une PR chacune)

0. ✅ **web.7.5.0 Le plan** : ce chapitre.
1. **web.7.5 Le bonus juste après la victoire** : `PartieDuJour` et `PartieLibre` (plus de fenêtre à la victoire,
   le bonus tout de suite, la fenêtre à la fin du bonus ou à « Passer » avant toute réponse, les cas du retour sur
   la page), tests (`Bonus.test.tsx`, `App.test.tsx`…), « Comment jouer » si besoin, leçons.
2. **web.7.6 Les règles du mode C**, sans affichage : `bonus.ts` (la question `'choix'` ou un nom à décider,
   répondre avec le département cliqué et le département écrit, refus d'un département déjà trouvé, `MODE_BONUS`
   passe à C), `sauvegarde.ts` (des paires, l'ancien format toujours lisible), tests dont la relecture d'une
   ancienne sauvegarde.
3. **web.7.7 Le mode C jouable** : `CarteDepartements` (un clic sélectionne, le choisi est mis en évidence, le zoom
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
| 7.6 | Autre région | Un département d'une autre région écrit en réponse est une **réponse fausse**, qui compte. |
| 7.6 | Refus sans coût | Seul un département **déjà trouvé** est refusé ; un nom déjà donné à tort ailleurs reste possible. |
| 7.6 | Entrée | Un début de nom qui n'évoque qu'**un** département des 101 le joue (« fin » -> Finistère) ; plusieurs : on demande de choisir. |
| 7.7 | Avant le clic | La saisie est **grisée** tant qu'aucun département n'est sélectionné, avec « Clique d'abord sur un département ». |
| 7.7 | La saisie | **Sous la carte** ; elle reçoit le focus au clic sur un département (vérifier à 375 pixels que le clavier du téléphone ne cache pas tout). |
| 7.7 | La carte | Sélectionné en **bleu foncé** ; répondus en vert ou rouge, plus sélectionnables ; les autres foncent au survol. |
| 7.7 | Les textes | « Clique sur un département de la carte », puis « Quel est ce département ? » ; « 3 réponses sur 12 » ; « Juste » et « Raté » inchangés. En anglais aussi. |
| 7.7 | Comment jouer | « Après une victoire, un bonus 🗺️ : clique sur chaque département de la région, puis écris son nom ou son numéro. Une seule réponse par département, et ton score s'ajoute au partage. » En anglais aussi. |
| — | Regroupement | **Trois PR** (7.5, 7.6, 7.7), empilées. |

### À reporter dans le Java (phase 10, plus tard, dans une autre conversation)

Les décisions des phases ci-dessus valent aussi pour le Java (la pause avant la fenêtre, le focus, les paires, la
saisie grisée avant le clic…), sauf ce qui est propre au navigateur (fausses horloges, 375 pixels).

Dans `docs/feuille-de-route.md` de `deIbine/francle`, puis dans le code, avec les décisions du tableau plus haut :

- **10.1 L'enchaînement** : `Fenetre.java`, une victoire du jour lance `jouerBonus()` tout de suite (comme la partie
  libre aujourd'hui) ; `statistiquesEnFinDuJour()` est appelé à la fin du bonus, ou à « Passer » avant toute réponse.
- **10.2 Les règles** : `Bonus.java`, `Question.CHOIX` (ou un nom à décider), `repondre(cliqué, saisie)`, refus d'un
  département déjà trouvé, `MODE` passe à C (A et B restent) ; `Resultat.bonus` en paires, l'ancien format toujours
  lisible ; tests JUnit.
- **10.3 L'affichage** : `CarteDepartements` sélectionne au clic au lieu de répondre ; la saisie (`Autocompletion`)
  sur les 101 départements ; la minuterie entre deux questions n'a plus d'objet en mode C, à retirer comme dans le
  web.
- **La note restée en attente depuis web.7** : trois choix propres au web (pas de minuterie entre deux questions ;
  en mode B, Entrée sur un début de nom joue le seul département évoqué ; un bonus pas commencé attend son bouton
  jusqu'à minuit), à noter dans la phase 9 de la feuille de route.

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
12. La note dans le plan du Java (les trois choix propres au web pour le bonus, voir « Pour reprendre ») : maintenant,
    dans une PR du dépôt Java, ou plus tard ?

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
