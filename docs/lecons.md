# Leçons de Francle web

Chaque leçon suit le même format : **pourquoi** (le problème et le choix), **comment le faire** (les gestes, les
commandes), **comment le penser** (la question à se poser la prochaine fois).

## web.0 Le projet en ligne

### Node.js et npm : le JDK et le Maven du JavaScript

- **Pourquoi** : le navigateur sait exécuter du JavaScript, mais pas du TypeScript, et il ne sait ni installer des
  bibliothèques ni lancer des tests. Node.js exécute le JavaScript *hors* du navigateur, sur la machine, comme la JVM
  exécute le Java. Tous les outils du projet (Vite, TypeScript, Vitest) sont des programmes Node.
- **Comment le faire** : `winget install OpenJS.NodeJS.LTS`, puis rouvrir le terminal (le `PATH` n'est lu qu'au
  démarrage) et vérifier avec `node --version` et `npm --version`. On prend la version **LTS** (support long), comme
  on prendrait un JDK LTS (17, 21…).
- **Comment le penser** : `package.json` joue le rôle du `pom.xml` (nom, scripts, dépendances) ;
  `package-lock.json` fige la version exacte de *chaque* dépendance, y compris celles des dépendances, pour que tout
  le monde installe la même chose ; `node_modules/` est l'équivalent du dépôt local `~/.m2`, mais propre au projet,
  et ne se met jamais dans git (on le recrée avec `npm ci`).

### `dependencies` et `devDependencies`

- **Pourquoi** : React part dans le site final, chez le joueur. Vite, TypeScript, Vitest ne servent qu'à fabriquer
  et vérifier le site : le joueur ne les télécharge jamais.
- **Comment le faire** : `npm install react` range dans `dependencies` ; `npm install -D vitest` (`-D` pour
  « développement ») range dans `devDependencies`. En Maven, c'est la différence entre la portée `compile` et la
  portée `test` ou `provided`.
- **Comment le penser** : pour chaque bibliothèque, se demander « est-ce que le joueur en a besoin dans son
  navigateur ? ». Si non, c'est un outil : `-D`.

### `npm install` et `npm ci`

- **Pourquoi** : `npm install` peut mettre à jour `package-lock.json` (il choisit la dernière version permise par
  `^19.3.0`, par exemple). `npm ci` installe *exactement* ce que dit le fichier de verrouillage, et échoue s'il ne
  correspond pas à `package.json`.
- **Comment le faire** : `npm install` sur sa machine quand on ajoute ou change une dépendance ; `npm ci` dans la CI,
  pour que la vérification porte sur les mêmes versions que chez soi.
- **Comment le penser** : une CI doit être *reproductible* : même entrée, même résultat. Tout ce qui peut varier
  d'une exécution à l'autre (versions, date, réseau) est un risque de « ça marche chez moi ».

### Ce que fait Vite

- **Pourquoi** : on écrit du TypeScript et du JSX (le HTML dans le code React), répartis en dizaines de fichiers. Le
  navigateur veut du JavaScript simple, en peu de fichiers. Vite fait la traduction : en développement, il sert les
  fichiers à la volée et recharge la page dès qu'on enregistre ; pour la mise en ligne, il produit un dossier `dist/`
  prêt à copier sur n'importe quel serveur.
- **Comment le faire** : `npm run dev` ouvre le site sur `http://localhost:5173/francle-web/` ; `npm run build`
  vérifie les types (`tsc -b`) puis remplit `dist/` ; `npm run preview` sert ce `dist/` pour le tester.
- **Comment le penser** : c'est le rôle de `javac` + `jar` réunis. La différence : il n'y a pas d'exécution côté
  serveur ; `dist/` ne contient que des fichiers statiques (HTML, CSS, JS, images).

### TypeScript : des types vérifiés, puis effacés

- **Pourquoi** : TypeScript ajoute à JavaScript des types vérifiés à la compilation, comme en Java. Mais à
  l'exécution, les types disparaissent : le navigateur ne reçoit que du JavaScript.
- **Comment le faire** : `tsc -b` (dans `npm run build`) vérifie les types sans rien produire (`noEmit`) ; c'est
  Vite qui produit le JavaScript. Les réglages sont dans `tsconfig.app.json` (le code du site) et
  `tsconfig.node.json` (le fichier de configuration de Vite, qui tourne dans Node).
- **Comment le penser** : en Java, un `ClassCastException` est encore possible à l'exécution ; en TypeScript, une
  erreur de type ne se voit *que* si `tsc` a tourné. D'où son passage obligatoire dans le `build` et donc dans la CI.

### Le chemin de base `/francle-web/`

- **Pourquoi** : GitHub Pages sert le site sous `https://deibine.github.io/francle-web/`, pas à la racine du
  domaine. Sans réglage, Vite écrit des liens comme `/assets/index.js`, que le navigateur cherche à
  `https://deibine.github.io/assets/index.js` : la page reste blanche.
- **Comment le faire** : `base: '/francle-web/'` dans `vite.config.ts`. Pour le vérifier après `npm run build` :
  regarder dans `dist/index.html` que les `src=` et `href=` commencent bien par `/francle-web/`.
- **Comment le penser** : un site n'est pas toujours servi à la racine. Quand une page est blanche en ligne mais
  marche en local, ouvrir les outils du navigateur (F12), onglet **Réseau** : les fichiers en 404 donnent
  l'adresse que le navigateur a réellement demandée.

### Tester un composant React sans navigateur

- **Pourquoi** : un composant React fabrique des éléments de page (le DOM). Pour le tester, il faut une page. jsdom
  imite un navigateur en mémoire dans Node ; Testing Library affiche le composant dedans et permet de le chercher
  comme le ferait un joueur.
- **Comment le faire** : `environment: 'jsdom'` dans `vite.config.ts` ; dans le test, `render(<App />)` puis
  `screen.getByRole('heading', { level: 1 })`. `npm test` lance une fois (comme `mvn test`) ;
  `npm run test:watch` relance à chaque enregistrement.
- **Comment le penser** : chercher par **rôle** (« un titre », « un bouton ») plutôt que par classe CSS : le test
  vérifie ce que voit le joueur, et c'est aussi ce qu'utilisent les lecteurs d'écran. Un test qui passe par le rôle
  est un premier pas vers l'accessibilité (web.6).

### La CI qui vérifie, puis qui publie

- **Pourquoi** : on veut que chaque PR soit vérifiée (lint, tests, construction) et que chaque fusion dans `main`
  mette le site en ligne, sans geste manuel.
- **Comment le faire** : un seul fichier `.github/workflows/ci.yml` avec deux tâches. `verifier` tourne pour les PR
  et pour `main`, et dépose `dist/` comme « artefact Pages ». `publier` ne tourne que sur `main`
  (`if: github.event_name == 'push'`) et après `verifier` (`needs`). Côté dépôt, il faut régler Pages sur
  « GitHub Actions » comme source.
- **Comment le penser** : la publication dépend de la vérification : un site cassé ne peut pas partir en ligne. Et on
  publie *exactement* ce qui a été vérifié (le même `dist/`), pas une nouvelle construction.

### Mettre en ligne dès le premier jour

- **Pourquoi** : les problèmes de mise en ligne (chemin de base, droits, réglages de Pages) n'ont rien à voir avec le
  jeu. Les régler sur une page d'un titre, c'est les régler quand ils sont faciles à isoler.
- **Comment le penser** : commencer par le « squelette qui marche de bout en bout » (code, test, CI, mise en ligne),
  puis l'enrichir. Chaque étape suivante n'ajoute alors que du jeu.

## web.1 Les données et les règles

### Comparer à l'ancienne version sur *toutes* les valeurs, pas sur quelques exemples

- **Pourquoi** : on réécrit en TypeScript des calculs déjà justes en Java. Quelques tests à la main (« Bretagne →
  Normandie : 76 % ») laissent passer une erreur sur une paire qu'on n'a pas pensé à tester. Comme le Java existe et
  tourne encore, autant lui faire calculer **toutes** les réponses, et vérifier qu'on retrouve chacune.
- **Comment le faire** : un petit programme Java (`outils/ReferenceJava.java`), compilé contre le projet Java,
  écrit un fichier `src/domaine/reference-java.json` : 1 225 paires de régions (distance, azimut, direction,
  pourcentage), 1 501 jours (région et angle), 944 saisies de suggestions. Le test `reference-java.test.ts` relit ce
  fichier et compare. C'est ce test qui a trouvé la seule différence : le tri alphabétique (voir plus bas).
- **Comment le penser** : quand on remplace un programme qui marche, l'ancien est le meilleur des oracles (le
  programme qui « sait » la bonne réponse). On parle de **tests de non-régression par comparaison** (*golden master*).
  Une limite : on ne compare que ce que l'ancien fait déjà ; les nouveautés (anglais, 6 essais, 5e indice) ont leurs
  propres tests.

### Les nombres de JavaScript : des `double`, et `BigInt` pour le reste

- **Pourquoi** : en JavaScript, tous les nombres (`number`) sont des `double` Java. Ils ne représentent exactement les
  entiers que jusqu'à 2^53 (environ 9 × 10^15). Le hasard de Java, lui, multiplie des entiers de 48 bits par une
  constante de 35 bits : le résultat dépasse 2^53 et serait arrondi, donc faux.
- **Comment le faire** : les `BigInt` sont des entiers de taille illimitée, comme `BigInteger` en Java, et s'écrivent
  avec un `n` : `0x5deece66dn`. `BigInt.asIntN(64, x)` imite un `long` qui déborde, `BigInt.asIntN(32, x)` un `int`,
  et `x | 0` ramène un `number` à un `int` 32 bits. C'est `hasardJava.ts`.
- **Comment le penser** : en Java, le type dit la taille (`int`, `long`), et le débordement est silencieux mais
  prévisible. En JavaScript, il n'y a qu'un type de nombre : dès qu'un calcul dépend des bits (hasard, empreinte,
  identifiant de 64 bits), se demander « est-ce que ça dépasse 2^53 ? ».

### Reproduire un algorithme documenté au bit près

- **Pourquoi** : on a choisi que le site et le Java donnent la même région le même jour. Il faut donc le même hasard.
  C'est possible parce que la documentation de `java.util.Random` et de `Collections.shuffle` décrit l'algorithme
  exact : il est garanti identique sur toutes les machines et toutes les versions de Java.
- **Comment le faire** : lire la documentation (ou le code source du JDK) de `Random.next`, `Random.nextInt` et
  `Collections.shuffle`, les recopier, puis vérifier avec des valeurs données par Java lui-même. `jshell`, la console
  interactive de Java, le fait en une ligne : `new java.util.Random(42).nextInt(100)`.
- **Comment le penser** : un « hasard à graine fixe » est un calcul comme un autre : même graine, même suite. Pour
  qu'un résultat soit le même partout sans serveur, il suffit que tout le monde fasse le même calcul sur les mêmes
  données (la date).

### Les dates : l'heure locale et l'heure d'été

- **Pourquoi** : la partie change à minuit chez le joueur. Il faut donc lire la date de *son* calendrier. Mais compter
  les jours en divisant des millisecondes par 24 h est faux en heure locale : le jour du passage à l'heure d'été ne
  dure que 23 heures.
- **Comment le faire** : lire l'année, le mois et le jour locaux (`getFullYear`, `getMonth`, `getDate`), puis les
  replacer en temps universel avec `Date.UTC(…)`, où tous les jours font 24 heures. Attention : en JavaScript, les
  mois commencent à 0 (`new Date(2026, 9, 13)` est le 13 **octobre**). C'est l'équivalent de `LocalDate` en Java, qui
  n'existe pas encore en standard dans les navigateurs.
- **Comment le penser** : distinguer un **instant** (un moment précis, le même partout sur Terre) d'une **date de
  calendrier** (« le 13 octobre », qui commence à des instants différents selon le fuseau). Ici on veut une date de
  calendrier : on ne garde que l'année, le mois et le jour.

### L'ordre alphabétique dépend de la langue (et des espaces)

- **Pourquoi** : trier avec `<` compare les codes des caractères : « Île » passe après « Z ». Il faut l'ordre d'une
  langue. Et même là, deux bibliothèques peuvent différer : Java range « Languedoc » avant « La Réunion » parce qu'il
  ignore les espaces (comme un dictionnaire), le navigateur non. C'est la comparaison avec le Java qui l'a montré.
- **Comment le faire** : `new Intl.Collator('fr', { ignorePunctuation: true }).compare(a, b)`, l'équivalent de
  `Collator.getInstance(Locale.FRENCH)`. Avec `'en'`, l'ordre anglais.
- **Comment le penser** : un tri « pour l'humain » (affichage) passe toujours par la langue ; un tri « pour la
  machine » (ici l'ordre des régions avant le mélange du jour) doit au contraire ne dépendre de rien d'autre que des
  données : là, on compare les codes, exprès.

### Des valeurs qu'on ne modifie pas

- **Pourquoi** : en Java, `Partie` change à chaque essai (`essais.add`). Avec React (web.2), on fera l'inverse :
  chaque essai fabrique une **nouvelle** partie, l'ancienne reste intacte. React compare l'ancienne et la nouvelle
  valeur pour savoir ce qui a changé : si on modifie l'objet sur place, il croit que rien n'a bougé et n'affiche rien.
- **Comment le faire** : `{ ...partie, essais, etat }` copie un objet en changeant certains champs, et
  `[...partie.essais, essai]` copie un tableau avec un élément en plus. `readonly` dans les types fait refuser par
  TypeScript toute modification sur place.
- **Comment le penser** : c'est le `record` Java poussé jusqu'au bout. Pour chaque donnée, se demander « qui doit
  savoir qu'elle a changé ? ». Si quelqu'un compare des versions, ne jamais modifier : remplacer.

### Les types qui se déduisent des données

- **Pourquoi** : la liste des indices sert à la fois de valeur (pour les parcourir dans l'ordre) et de type (pour
  qu'un indice ne puisse être que l'un d'eux). L'écrire deux fois, c'est risquer d'en oublier un.
- **Comment le faire** : `const INDICES = ['superficie', …] as const` puis `type Indice = (typeof INDICES)[number]`.
  TypeScript en déduit `'superficie' | 'specialite' | …`. C'est le rôle d'une `enum` Java ; les unions de textes
  s'affichent et se sauvegardent directement (pas de `name()` / `valueOf()`).
- **Comment le penser** : une information, un seul endroit. Si deux listes doivent rester d'accord, en déduire une de
  l'autre.

## web.2 Un jeu jouable

### Écrire le SVG à la main plutôt qu'avec une bibliothèque

- **Pourquoi** : le script Java dessinait des PNG avec matplotlib. matplotlib sait aussi produire du SVG, mais
  bavard (des styles sur chaque tracé, des métadonnées), et à coordonnées pleines de décimales. Un SVG, c'est du
  texte : `<path d="M10 20l5 3 …z"/>` suffit. En l'écrivant nous-mêmes, une silhouette pèse environ 10 Ko, et le
  script n'a plus besoin que de Python, sans aucune bibliothèque.
- **Comment le faire** : projeter (longitude × cos(latitude), −latitude, car l'axe des y du SVG descend), ramener le
  tout dans un carré de 1000 unités, **arrondir à l'entier**, puis **simplifier** (algorithme de Douglas-Peucker :
  on retire les points qui s'écartent de moins de 1,2 unité du tracé). Les coordonnées relatives (`l`, « à partir du
  point précédent ») sont de petits nombres, donc un fichier plus court. Commande :
  `py outils/generer_images.py <dossier des contours> src/images`.
- **Comment le penser** : avant d'ajouter une dépendance, regarder ce qu'on produit vraiment. Si c'est un format
  texte simple, l'écrire directement est souvent plus court, plus léger et plus facile à comprendre.

### Une seule carte dessinée par la page, au lieu de 35 images

- **Pourquoi** : le Java avait une image de carte par région, la réponse en bleu. Dans une page web, un SVG écrit
  *dans* la page (et non chargé par `<img>`) est fait d'éléments comme le reste du HTML : on peut leur donner une
  classe, donc une couleur. Un seul fichier de contours par époque suffit ; React dessine chaque région et colore la
  réponse.
- **Comment le faire** : le script produit `src/images/cartes/nouvelles.json` (`{ id: tracé }`), le composant
  `CarteFrance` l'importe (Vite sait importer du JSON) et fait un `<path>` par région, avec la classe
  `fill-francle-fonce` pour la réponse. Le dernier dessiné passe devant : on trie pour mettre la réponse à la fin.
- **Comment le penser** : une image est figée, un élément de page est vivant. Si une image ne change que par sa
  couleur ou par une partie mise en avant, en faire des données et laisser la page la dessiner.

### Tailwind : le CSS écrit dans les classes

- **Pourquoi** : en CSS classique, on invente un nom de classe (`.tableau-ligne`), puis on écrit ses règles dans un
  autre fichier. Avec Tailwind, chaque classe *est* une règle : `flex` = `display: flex`, `gap-2` = `gap: 0.5rem`,
  `text-sm` = `font-size: 0.875rem`, `rounded` = `border-radius: 0.25rem`, `p-4` = `padding: 1rem`. On style sur
  place, sans aller-retour entre deux fichiers, et le CSS final ne contient que les classes réellement utilisées
  (12 Ko ici).
- **Comment le faire** : `npm install -D tailwindcss @tailwindcss/vite`, ajouter `tailwindcss()` aux extensions de
  `vite.config.ts`, et `@import 'tailwindcss';` dans `src/index.css`. Les couleurs du jeu se déclarent dans
  `@theme { --color-francle-fonce: #3a4bc4; }` et deviennent `bg-francle-fonce`, `fill-francle-fonce`… Les variantes
  s'écrivent avec deux-points : `hover:bg-gray-100` (au survol), `focus:outline-none` (quand le champ a le focus).
  Pour retrouver la règle CSS derrière une classe : survoler la classe dans l'éditeur (extension Tailwind CSS
  IntelliSense) ou chercher dans https://tailwindcss.com/docs.
- **Comment le penser** : Tailwind ne remplace pas le CSS, il l'abrège. Quand une classe surprend, se demander
  « quelle propriété CSS écrit-elle ? » : c'est elle qu'il faut comprendre.

### Un composant React, c'est une fonction qui reçoit des données et renvoie l'écran

- **Pourquoi** : en Swing, on crée des composants une fois, puis on les modifie (`label.setText(…)`) à chaque
  changement. En React, on ne modifie rien à la main : on décrit ce que l'écran doit montrer *pour un état donné*, et
  React se charge des changements. `App` garde la partie dans `useState` ; à chaque essai, il la remplace par celle
  que renvoie `proposer()`, et React rappelle `App`, qui redessine.
- **Comment le faire** : `const [partie, setPartie] = useState(() => nouvellePartie(…))` ; les composants
  d'affichage (`TableauEssais`, `Indices`…) ne reçoivent que des données en paramètres (les « props ») et ne gardent
  rien. `useState(() => …)` avec une fonction : elle n'est appelée qu'une fois, au premier affichage (utile pour
  `new Date()` ou un calcul coûteux).
- **Comment le penser** : pour chaque donnée, se demander « qui en est le propriétaire ? ». Une seule place la garde
  (ici `App`), les autres la reçoivent. C'est pourquoi le domaine de web.1 renvoie de nouvelles parties au lieu de
  les modifier.

### Une liste de suggestions accessible (le modèle « combobox »)

- **Pourquoi** : une liste déroulante faite de `div` est invisible pour un lecteur d'écran, et souvent inutilisable
  au clavier. Le W3C décrit le modèle à suivre : le champ a `role="combobox"`, la liste `role="listbox"`, chaque
  suggestion `role="option"`, et `aria-activedescendant` dit au lecteur d'écran quelle suggestion est surlignée.
- **Comment le faire** : ↓ et ↑ changent la suggestion surlignée (en boucle ; ↑ sans rien de surligné va à la
  dernière, un bug trouvé par les tests), Entrée propose, Échap ferme. Le clic se fait sur `onMouseDown` et non
  `onClick` : sinon le champ perd d'abord le focus, la liste se ferme, et le clic tombe dans le vide.
- **Comment le penser** : avant d'écrire un élément interactif, chercher son modèle dans
  https://www.w3.org/WAI/ARIA/apg/patterns/ : les rôles, les touches et les cas limites y sont déjà pensés.

### Tester comme un joueur : par les rôles et les textes

- **Pourquoi** : un test qui cherche `.bg-francle-fonce` casse dès qu'on change une couleur. Un test qui cherche
  « le bouton Abandonner » ou « le champ Ta proposition » ne casse que si le joueur ne peut plus faire ce qu'il
  faisait. Et si le test ne trouve pas un élément par son rôle, un lecteur d'écran non plus : c'est aussi un test
  d'accessibilité.
- **Comment le faire** : `screen.getByRole('button', { name: 'Abandonner' })`, `getByRole('combobox')`,
  `getByText(…)`. `userEvent` (bibliothèque `@testing-library/user-event`) tape touche par touche et clique comme
  une personne (focus, `onMouseDown`, `onBlur` compris), là où `fireEvent` n'envoie qu'un seul évènement. Le fichier
  `src/preparationTests.ts` vide la page après chaque test (`cleanup`).
- **Comment le penser** : un test doit décrire ce que le joueur fait et voit, pas comment le code est construit.
  Se demander : « ce test casserait-il si je changeais seulement l'apparence ? » Si oui, il cherche mal.

### Les petites images intégrées au code

- **Pourquoi** : un test vérifiait que chaque silhouette avait une adresse en `.svg` ; celle de la Corse
  commençait par `data:image/svg+xml,…`. Vite écrit directement dans le JavaScript les fichiers de moins de 4 Ko :
  une requête de moins pour le navigateur.
- **Comment le faire** : `import.meta.glob('./images/regions/*.svg', { eager: true, query: '?url', import:
  'default' })` donne l'adresse (ou le contenu intégré) de chaque fichier, avec une empreinte dans le nom
  (`bretagne-3fa9c1.svg`) pour que le navigateur ne garde jamais une ancienne version en cache.
- **Comment le penser** : un outil de construction transforme ce qu'on lui donne. Quand un résultat surprend, le
  regarder (`npm run build` liste les fichiers produits) avant de supposer un bug.

## web.3 La partie du jour complète

### localStorage : un petit dictionnaire qui survit à la fermeture de la page

- **Pourquoi** : sans serveur, le seul endroit où garder la partie et l'historique du joueur, c'est son navigateur.
  `localStorage` est un dictionnaire texte -> texte, propre au site, qui reste après la fermeture de l'onglet (un peu
  comme `java.util.prefs.Preferences`).
- **Comment le faire** : un seul texte JSON sous la clé `francle.parties-du-jour.v1` (`JSON.stringify` pour écrire,
  `JSON.parse` pour lire). On n'y range que les régions proposées et l'état ; au retour, on **rejoue** les
  propositions avec `proposer()`, qui recalcule distances et pourcentages. Tout est dans des `try … catch` :
  navigation privée, stockage plein ou sauvegarde abîmée ne doivent jamais empêcher de jouer. Pour regarder ce qui
  est rangé : outils de développement du navigateur (F12), onglet **Application**, puis **Local Storage**.
- **Comment le penser** : sauvegarder le **minimum qui permet de tout reconstruire**, pas le résultat des calculs.
  Mettre un numéro de version dans la clé, et traiter ce qu'on relit comme une saisie de l'utilisateur : ça peut être
  n'importe quoi (d'où `estPartieSauvee`, qui vérifie la forme avant de faire confiance).

### Des statistiques déduites, pas tenues à jour

- **Pourquoi** : des compteurs (« parties jouées += 1 ») peuvent se désynchroniser des parties (un rechargement au
  mauvais moment, un bug corrigé plus tard). En recalculant tout depuis l'historique, les statistiques sont toujours
  justes, et une règle changée (la série, par exemple) s'applique aussi au passé.
- **Comment le faire** : `statistiques(historique, aujourdhui)` est une fonction pure : même entrée, même résultat,
  donc facile à tester avec des historiques écrits en abrégé (`{ 1: 'g3', 2: 'p' }`). La série remonte les jours
  gagnés depuis aujourd'hui (ou hier, si la partie du jour n'est pas finie) : un jour sauté l'arrête.
- **Comment le penser** : avant de stocker une valeur, se demander « puis-je la recalculer ? ». Si oui et que c'est
  rapide, la recalculer : une seule source de vérité.

### `<dialog>` : une fenêtre que le navigateur sait déjà gérer

- **Pourquoi** : une fenêtre par-dessus la page doit bloquer ce qui est derrière, garder le focus du clavier à
  l'intérieur, se fermer avec Échap, puis rendre le focus. Avant, il fallait une bibliothèque ; la balise `<dialog>`
  le fait seule, à condition de l'ouvrir avec `showModal()`.
- **Comment le faire** : `showModal()` et `close()` sont des **ordres** donnés à l'élément, pas une description de
  l'écran : `useRef` donne accès à l'élément, `useEffect` donne l'ordre quand `ouverte` change. L'évènement `close`
  prévient React quelle que soit la façon de fermer. Le fond grisé se style avec `backdrop:bg-black/50` (le
  pseudo-élément `::backdrop`). jsdom ne connaît pas encore `showModal()` : `src/preparationTests.ts` l'imite.
- **Comment le penser** : avant d'écrire un comportement d'interface, vérifier si une balise HTML le fait déjà
  (`<dialog>`, `<details>`, `<input type="date">`…). Ce que le navigateur fait lui-même est plus solide et plus
  accessible que ce qu'on refait.

### Repartir de zéro avec `key`

- **Pourquoi** : à minuit, page ouverte, il faut passer à la région suivante : nouvelle partie, messages effacés,
  fenêtre fermée. Remettre chaque `useState` à zéro à la main, c'est risquer d'en oublier un.
- **Comment le faire** : `App` ne garde que le jour, et affiche `<Jeu key={numero(jour)} … />`. Quand la clé change,
  React jette l'ancien `Jeu` et en crée un neuf : tout son état repart de zéro, et la nouvelle partie est lue dans la
  sauvegarde comme au premier affichage.
- **Comment le penser** : quand un composant doit « recommencer », chercher l'identité de ce qu'il affiche (ici le
  jour) et en faire sa clé, plutôt que d'écrire du code de remise à zéro.

### Sauvegarder au moment du changement, pas après coup

- **Pourquoi** : la fenêtre de résultats s'ouvre au moment où la partie se termine, et ses statistiques doivent déjà
  compter cette partie. Si la sauvegarde se faisait dans un `useEffect` (après l'affichage), la fenêtre lirait
  l'historique d'avant.
- **Comment le faire** : une seule fonction `changer(suite)` dans `Jeu` remplace la partie, l'enregistre, relit
  l'historique et ouvre la fenêtre si la partie est finie. `proposer` et `abandonner` passent tous deux par elle.
- **Comment le penser** : quand plusieurs choses doivent arriver ensemble, les mettre dans une seule fonction par
  laquelle tout passe, plutôt que de compter sur l'ordre des effets.

### Les minuteries et le temps dans les tests

- **Pourquoi** : le compte à rebours dépend de l'heure. Un test qui attend vraiment minuit est impossible, et un test
  qui dépend de l'heure de son lancement échoue un jour sur deux.
- **Comment le faire** : `setInterval(…, 1000)` met à jour l'affichage chaque seconde ; la fonction renvoyée par
  `useEffect` l'arrête quand le composant disparaît (`clearInterval`), sinon elle tournerait pour rien. Dans le test,
  `vi.useFakeTimers({ toFake: ['Date'] })` puis `vi.setSystemTime(…)` truquent l'horloge : on se place à 23 h 59,
  on gagne, on avance l'horloge après minuit, et on attend (`findByRole`) que le jeu passe au n° 3.
- **Comment le penser** : le temps est une entrée comme une autre. Le rendre réglable (paramètre `date`, horloge
  truquée) rend testable tout ce qui en dépend.

### Partager : le menu du téléphone, ou le presse-papiers

- **Pourquoi** : sur téléphone, `navigator.share` ouvre le menu de partage du système (Messages, WhatsApp…). Sur
  ordinateur, certains navigateurs l'ont aussi, mais il ouvre le menu de Windows, peu pratique ; copier est mieux.
- **Comment le faire** : `matchMedia('(pointer: coarse)')` dit si le pointeur est un doigt. Sinon,
  `navigator.clipboard.writeText(texte)`, qui renvoie une promesse (`await`, comme attendre un `CompletableFuture`)
  car le navigateur peut demander la permission. Dans les tests, `userEvent.setup()` fournit un faux presse-papiers
  qu'on relit avec `navigator.clipboard.readText()`.
- **Comment le penser** : tester la **capacité** (« le pointeur est-il un doigt ? », « `share` existe-t-il ? »)
  plutôt que deviner l'appareil d'après son nom. Et toujours prévoir le cas où l'action est refusée.

## web.4 Les réglages et la partie libre

### Le thème sombre : des couleurs qui sont des rôles

- **Pourquoi** : la manière directe, avec Tailwind, est d'écrire deux couleurs sur chaque élément
  (`bg-gray-100 dark:bg-gray-800`). Sur trente éléments, on en oublie forcément, et changer une couleur oblige à
  repasser partout. On a préféré nommer des **rôles** (le fond, le texte, la surface d'une ligne, le texte discret,
  la bordure), et ne changer que leur valeur en thème sombre.
- **Comment le faire** : dans `src/index.css`, `@theme { --color-surface: #f3f4f6; … }` crée la classe `bg-surface`
  (et `border-surface`, `text-surface`…). Le bloc `.dark { --color-surface: #1f2937; }` redéfinit la **variable CSS**
  quand `<html>` porte la classe `dark` ; toutes les classes qui l'utilisent suivent seules. `@custom-variant dark`
  dit à Tailwind que le sombre vient de cette classe, et non directement du système : le joueur peut ainsi forcer
  clair ou sombre. `color-scheme: dark` demande aussi au navigateur ses propres éléments en sombre (barres de
  défilement, cases à cocher, fenêtres `<dialog>`).
- **Comment le penser** : nommer une couleur par **ce qu'elle fait** (« texte discret »), pas par **ce qu'elle est**
  (« gris 500 »). C'est l'idée des variables CSS : une valeur, un seul endroit, et la cascade fait le reste. Le même
  principe qu'une constante Java plutôt qu'un nombre magique répété.

### L'éclair blanc au chargement

- **Pourquoi** : React ne démarre qu'après avoir téléchargé et exécuté le JavaScript. D'ici là, la page est
  affichée sans la classe `dark` : en clair. Un joueur en thème sombre verrait un éclair blanc à chaque ouverture.
- **Comment le faire** : un petit `<script>` directement dans `index.html`, avant le reste, lit le réglage dans
  `localStorage` et pose la classe `dark` tout de suite. Il est écrit en JavaScript simple (pas de TypeScript, pas
  d'import) parce qu'il s'exécute tel quel, avant tout outil.
- **Comment le penser** : se demander ce que voit le joueur **pendant** le chargement, pas seulement après.

### Un plateau commun, deux propriétaires

- **Pourquoi** : la partie du jour et la partie libre ont le même plateau (silhouette, saisie, tableau, indices),
  mais pas le même comportement : l'une sauvegarde, compte et partage ; l'autre non. Copier le plateau, c'était
  devoir corriger chaque bug deux fois.
- **Comment le faire** : `Plateau` reçoit la partie et une fonction `onChanger(suite)` ; il ne garde que ce qui
  lui est propre (le message d'erreur, la confirmation d'abandon). `PartieDuJour` et `PartieLibre` gardent la
  partie et décident quoi faire à chaque changement. Ce qui diffère à l'écran (le bas de la fenêtre de fin) passe
  par `children` ou par une prop qui contient du JSX (`fin={…}`).
- **Comment le penser** : séparer **ce qui s'affiche** de **qui décide**. En Java, ce serait une vue qui reçoit un
  écouteur plutôt que de connaître le contrôleur.

### Fixer les modes au premier essai

- **Pourquoi** : sans règle, on pourrait jouer avec la silhouette, puis cocher 🙈 juste avant de partager, et
  afficher un exploit qu'on n'a pas fait. La partie doit donc retenir les modes avec lesquels elle a été jouée.
- **Comment le faire** : tant qu'aucun essai n'est joué, la partie suit les réglages ; au premier changement,
  `setModesFixes(modes)` les fige. Pour la partie du jour, ils sont sauvegardés avec elle (champ `modes`, absent
  des anciennes sauvegardes : on lit alors « aucun mode »).
- **Comment le penser** : quand une valeur peut changer *pendant* qu'on s'en sert, se demander à quel moment elle
  doit être **lue une fois pour toutes**, et la copier à ce moment-là.

### Garder les deux onglets montés, l'un caché

- **Pourquoi** : afficher un seul onglet à la fois, c'est retirer l'autre de la page : React jette alors son état,
  et la partie libre en cours serait perdue au premier coup d'œil à la partie du jour.
- **Comment le faire** : les deux panneaux restent dans la page ; celui qu'on ne regarde pas a l'attribut `hidden`.
  Piège : la classe `flex` l'emporte sur `hidden` (deux règles `display` en concurrence) ; la variante
  `[&[hidden]]:hidden` remet `display: none` quand l'attribut est présent. Les rôles `tablist`, `tab` et `tabpanel`
  et les flèches ← → suivent le modèle « onglets » du W3C.
- **Comment le penser** : cacher n'est pas détruire. Se demander si l'état de ce qu'on fait disparaître doit
  survivre ; si oui, cacher plutôt que retirer.

### Une espace qui disparaît pour les lecteurs d'écran

- **Pourquoi** : un test ne trouvait plus le titre « Francle n° 3 ». À l'écran, tout allait bien ; mais l'espace
  était écrite au début du `<span>` du numéro, et le calcul du **nom accessible** (le texte que lit un lecteur
  d'écran) la perdait : « Francleno° 3 ».
- **Comment le faire** : écrire l'espace **hors** du `<span>` (`{' '}` juste avant). Les tests qui cherchent par
  rôle et par nom (`getByRole('heading', { name: … })`) vérifient justement ce nom accessible.
- **Comment le penser** : ce qu'on voit et ce qu'un lecteur d'écran entend peuvent différer. Un test par rôle et par
  nom est aussi un test d'accessibilité : quand il échoue sans raison visible, c'est souvent un vrai problème.

## web.5 L'anglais

### Deux langues sans bibliothèque, vérifiées par TypeScript

- **Pourquoi** : Worldle utilisait i18next, une bibliothèque de traduction avec des fichiers de clés
  (`"stats.titre": "…"`). Pour deux langues et une centaine de textes, c'est beaucoup d'outillage, et une clé
  oubliée ne se voit qu'à l'écran. Avec deux objets TypeScript, l'oubli se voit à la compilation.
- **Comment le faire** : `const fr = { … }`, puis `type Textes = typeof fr` (le type se **déduit** de l'objet
  français), puis `const en: Textes = { … }`. Si l'anglais oublie `stats.serie`, ou si sa fonction `fin` n'a pas les
  mêmes paramètres, `npx tsc -b` refuse. Les textes variables sont des fonctions (`fin(partie)`,
  `barre(essais, nombre)`), car l'ordre des mots et les pluriels changent d'une langue à l'autre (« 2 victoires en
  3 essais », « 2 wins in 3 tries »).
- **Comment le penser** : laisser le compilateur vérifier ce qu'on oublierait. Un type déduit d'une valeur de
  référence garantit que les autres valeurs ont la même forme, comme une interface Java implémentée deux fois.

### Le contexte React : une valeur pour tout l'arbre

- **Pourquoi** : presque tous les composants affichent du texte. Passer la langue de parent en enfant
  (`<Plateau langue={…}>` puis `<Saisie langue={…}>`…) alourdit chaque composant, même ceux qui ne font que la
  transmettre.
- **Comment le faire** : `const LangueContext = createContext<Langue>('fr')` ; `App` entoure tout de
  `<LangueContext value={langue}>` ; n'importe quel composant en dessous lit `useContext(LangueContext)`. Nos hooks
  `useLangue()` et `useTextes()` cachent ce détail. Quand la langue change, React réaffiche tous les composants qui
  la lisent.
- **Comment le penser** : un contexte convient à une valeur **lue partout et rarement changée** (langue, thème,
  utilisateur connecté). Pour le reste, les props restent plus claires : on voit d'où vient chaque donnée.

### Les nombres et les langues

- **Pourquoi** : « 1 025 km » en français, « 1,025 km » en anglais ; « 42 % » avec une espace en français, « 42% »
  sans espace en anglais. Écrire ces règles à la main, c'est se tromper.
- **Comment le faire** : `n.toLocaleString('fr-FR')` ou `n.toLocaleString('en-GB')`. Le navigateur connaît les
  conventions de chaque langue. Le séparateur des milliers en français est une **espace fine insécable** (U+202F) :
  dans les tests, on compare avec `toLocaleString` plutôt qu'avec une espace tapée au clavier.
- **Comment le penser** : tout ce qui dépend de la langue (nombres, dates, ordre alphabétique avec `Intl.Collator`,
  comme à web.1) a déjà une réponse dans `Intl` : la chercher avant d'écrire sa règle.

### La langue du navigateur, et l'attribut lang

- **Pourquoi** : un anglophone qui arrive sur le site ne doit pas avoir à chercher comment passer en anglais. Et un
  lecteur d'écran lit le texte avec l'accent de la langue annoncée par la page : du français lu « à l'anglaise » est
  incompréhensible.
- **Comment le faire** : `navigator.languages[0]` (la langue préférée réglée dans le navigateur) ; `fr`, `fr-FR`,
  `fr-BE`, `fr-CA` donnent le français, tout le reste l'anglais. `document.documentElement.lang = langue` met à jour
  `<html lang>`. Le bouton FR / EN porte son propre `lang` : son nom (« Switch to English ») est dans l'autre langue.
  Dans les tests, jsdom se dit en anglais (`en-US`) : `src/preparationTests.ts` le remet en français.
- **Comment le penser** : partir de ce que le système sait déjà du joueur (langue, thème sombre…) et le laisser
  changer d'avis, plutôt que de lui poser la question.

### Un réglage « automatique » tant qu'on n'a pas choisi

- **Pourquoi** : en anglais, les miles sont attendus par défaut. Mais un joueur anglais qui a choisi les
  kilomètres ne doit pas les perdre en passant en français, puis en revenant à l'anglais.
- **Comment le faire** : `unite: Unite | undefined` dans les réglages. `undefined` veut dire « pas choisi » :
  `uniteAffichee()` suit alors la langue. Dès que le joueur choisit, la valeur est enregistrée et l'emporte. Même
  chose pour la langue : `undefined` = celle du navigateur.
- **Comment le penser** : distinguer « la valeur par défaut » de « la valeur choisie ». Si on enregistre la valeur
  par défaut comme un choix, on ne peut plus la faire évoluer.

## web.6 Les finitions

### L'accessibilité vérifiée par un outil, et l'outil vérifié lui-même

- **Pourquoi** : on ne remarque pas soi-même un bouton sans nom (« ❓ » ne dit rien à un lecteur d'écran) ou un
  identifiant en double. axe, la bibliothèque d'accessibilité la plus utilisée (elle est aussi dans les outils de
  développement des navigateurs), parcourt la page et signale ces fautes.
- **Comment le faire** : `npm install -D axe-core`, puis dans un test `await axe.run(document.body)` : la liste
  `violations` doit être vide. On la lance sur chaque état important de l'écran (départ, aide, réglages,
  suggestions ouvertes, résultats, partie libre en anglais). Un premier test donne exprès une image sans `alt` et un
  bouton vide, pour vérifier qu'axe les **trouve** : un test qui ne trouve jamais rien peut aussi ne rien vérifier.
  jsdom ne dessine rien, donc ne mesure pas les contrastes : on a lancé axe une fois dans le vrai navigateur
  (`axe.run(document, { runOnly: ['color-contrast'] })`), en clair et en sombre.
- **Comment le penser** : un outil automatique trouve environ un tiers des problèmes d'accessibilité ; le reste se
  voit au clavier et au lecteur d'écran. Mais ce tiers revient à chaque modification : autant le confier aux tests.

### Les espaces insécables du français

- **Pourquoi** : sur téléphone, « 76 % » se coupait en fin de ligne, le « % » seul sur la ligne suivante. En
  français, on met une espace avant « : ; ! ? % » et dans « « » » ; elle doit être **insécable**, sinon le
  navigateur peut couper la ligne à cet endroit.
- **Comment le faire** : ` ` (espace insécable) dans les textes français, entre un nombre et son unité
  (« 251 km »), avant la ponctuation double (« La réponse : »). On l'écrit sous la forme visible
  ` ` dans le code, plutôt que le caractère lui-même, invisible et indiscernable d'une espace ordinaire. Dans
  les tests, `\s` dans une expression régulière reconnaît aussi l'espace insécable.
- **Comment le penser** : tester l'affichage à la largeur d'un téléphone (375 pixels) fait apparaître ce que l'écran
  large cache : coupures de ligne, débordements, défilement horizontal (`document.documentElement.scrollWidth` doit
  rester égal à `innerWidth`).

### Afficher l'aide une seule fois

- **Pourquoi** : un nouveau joueur doit comprendre les règles sans chercher ; un habitué ne doit pas refermer l'aide à
  chaque visite.
- **Comment le faire** : une clé `francle.aide-vue.v1` dans `localStorage`, posée quand on ferme l'aide.
  `useState(() => !aideVue())` ouvre la fenêtre au premier affichage seulement. Si le stockage est refusé, on
  préfère ne **pas** l'ouvrir (sinon elle reviendrait à chaque visite). Dans les tests, `beforeEach` pose la clé :
  chaque test fait comme si l'aide avait été vue, sauf ceux qui l'effacent pour la vérifier.
- **Comment le penser** : l'exemple de l'aide (« Normandie · 251 km · ↙️ · 76 % ») est **calculé** par les règles du
  jeu, pas écrit à la main : il reste juste si une règle change. Ce qui peut se déduire du code ne doit pas être
  recopié.

### Licence, crédits et README : ce qu'on doit à ceux dont on s'inspire

- **Pourquoi** : la licence MIT de Worldle demande de garder sa mention de copyright si l'on reprend son code ; la
  licence ouverte Etalab demande de citer la source des données (les contours viennent de l'IGN et de l'INSEE).
  Le README, lui, dit à un visiteur du dépôt ce qu'est le projet et comment le lancer.
- **Comment le faire** : `LICENSE` (MIT, « Copyright (c) 2026 deIbine »), avec les mentions de Worldle et d'Etalab
  à la suite ; un bas de page (`<footer>`, que les lecteurs d'écran savent trouver) avec les liens ; un README en
  français : présentation, commandes, organisation du code, images, lien avec la version Java.
- **Comment le penser** : pour chaque chose reprise (code, données, idée), se demander « sous quelle licence, et que
  demande-t-elle ? ». Le faire au moment où l'on reprend, pas à la fin.

### Une icône produite comme le reste

- **Pourquoi** : l'icône de l'onglet était un « F » provisoire. Une silhouette de la France, dans le bleu du jeu, se
  reconnaît mieux, et on avait déjà tout pour la dessiner.
- **Comment le faire** : une fonction de plus dans `outils/generer_images.py`, qui écrit `public/favicon.svg` : la
  métropole ramenée à 64 unités, et simplifiée bien plus fort (à 16 pixels, les détails de la côte sont invisibles) :
  1,4 Ko. Le dossier `public/` est copié tel quel dans le site : c'est là que vont les fichiers dont l'adresse doit
  rester fixe.
- **Comment le penser** : quand un outil sait déjà produire une famille de fichiers, lui ajouter le nouveau venu
  plutôt que de le faire à la main : on pourra le refaire à l'identique.

## Fusionner des PR empilées

### Rebaser une branche qui partait d'une autre branche, après une fusion en squash

- **Pourquoi** : web.5 partait de la branche de web.4, et web.6 de celle de web.5. Une fusion en squash crée sur
  `main` un **nouveau** commit, qui a le même contenu que la branche mais pas la même histoire. La branche suivante
  porte toujours les anciens commits : il faut la « rebaser » sur `main` pour ne garder que ses propres commits.
  Une fois, la commande a reçu le mauvais point de départ (la branche précédente déjà rebasée, et non celle dont la
  branche partait vraiment) : git a voulu rejouer les commits de web.4 et a signalé des conflits partout.
- **Comment le faire** : `git rebase --onto origin/main <ancien sommet de la branche précédente> <branche>`. L'ancien
  sommet est le commit de la branche précédente **tel qu'il était quand la branche suivante en est partie** ; le
  retrouver avec `git log --oneline` sur la branche suivante, et le vérifier avec
  `git merge-base --is-ancestor <commit> <branche>`. En cas de conflits inattendus : `git rebase --abort` remet tout
  comme avant. Après le rebase, vérifier que le contenu n'a pas changé : `git rev-parse <avant>^{tree}` et
  `git rev-parse <après>^{tree}` doivent être égaux. Puis `gh pr edit <n> --base main` et
  `git push --force-with-lease` (qui refuse d'écraser un travail que l'on n'a pas vu).
- **Comment le penser** : des conflits sur des fichiers qu'on n'a pas touchés, c'est le signe que git rejoue des
  commits qu'il ne devrait pas. S'arrêter, annuler, et vérifier le point de départ plutôt que de résoudre.

## Correctif après web.6 : le changement de jour

### Une page web peut rester ouverte des jours

- **Pourquoi** : le passage à la région suivante ne se faisait que par le compte à rebours, or celui-ci n'est affiché
  qu'à la fin d'une partie. Une partie commencée le soir et pas finie restait donc sur la région de la veille le
  lendemain matin, dans un onglet de téléphone gardé ouvert. En Java, l'application de bureau était relancée chaque
  jour : la question ne se posait pas. Sur le web, une page vit aussi longtemps que l'onglet, et un téléphone en
  veille endort ses minuteries (`setTimeout`, `setInterval`).
- **Comment le faire** : la surveillance du jour est remontée dans `App` (le hook `useJour`), qui existe toujours,
  que la partie soit finie ou non : une minuterie jusqu'à minuit, plus l'évènement `visibilitychange`, que le
  navigateur envoie quand la page revient à l'écran (`document.visibilityState === 'visible'`). Le compte à rebours
  ne fait plus qu'afficher. Le `return` de `useEffect` retire l'écouteur et la minuterie, comme on retire un
  listener en Swing.
- **Comment le penser** : une tâche qui doit toujours se faire ne doit pas dépendre d'un composant qui n'est affiché
  que parfois. Se demander : « que se passe-t-il si la page reste ouverte longtemps, ou revient après une veille ? »

### Des tests qui dépendaient du vrai jour

- **Pourquoi** : les tests donnaient le 14 octobre à `App`, mais le compte à rebours, lui, lisait la vraie horloge.
  Ils passaient le 14 octobre, et échouaient tous depuis le lendemain (10 sur 178) : une bombe à retardement, que la
  CI n'a vue qu'à la PR suivante.
- **Comment le faire** : arrêter l'horloge dans `src/preparationTests.ts` : `vi.useFakeTimers({ toFake: ['Date'] })`
  puis `vi.setSystemTime(...)`, une première fois avant que les fichiers de test ne calculent leur région, puis
  avant chaque test. Seule `Date` est truquée : les minuteries restent réelles (user-event en a besoin). Le paramètre
  `date` de `App`, qui ne servait qu'aux tests, disparaît : tout le code lit la même horloge. Pour prouver qu'un
  nouveau test attrape bien le bug, le lancer une fois sur l'ancien code (`git show main:src/App.tsx > src/App.tsx`)
  et le voir échouer.
- **Comment le penser** : un test qui dépend de la date, du hasard ou du réseau finit par échouer sans que le code ait
  changé. Tout ce qui varie d'une exécution à l'autre se fixe dans les tests, et une seule source de vérité (une
  seule horloge) vaut mieux qu'un paramètre qui ne couvre qu'une partie du code.

## web.6.2 Les corrections rapides

### Entrée : deviner ce que le joueur veut dire, sans jouer à sa place

- **Pourquoi** : « bret » + Entrée répondait « région inconnue » alors que la Bretagne était la seule suggestion. Mais
  prendre toujours la première suggestion aurait été pire : « nor » chez les anciennes régions évoque
  Nord-Pas-de-Calais, Basse- et Haute-Normandie, et Entrée aurait joué l'une d'elles au hasard de l'ordre
  alphabétique, en coûtant un essai.
- **Comment le faire** : une règle du domaine, `deviner(saisie, mode)` dans `domaine/recherche.ts` : le nom exact,
  sinon la seule suggestion, sinon `'plusieurs'` (un message demande de choisir dans la liste, sans coûter d'essai).
  Le type de retour `Region | 'plusieurs' | undefined` est une « union » : TypeScript oblige le code qui l'appelle à
  traiter les trois cas, un peu comme un `sealed interface` Java avec un `switch`. La règle vit dans le domaine,
  testée sans affichage, et le plateau (`Plateau.tsx`) ne fait que l'appliquer.
- **Comment le penser** : quand on devine l'intention de l'utilisateur, se demander ce que coûte une erreur. Ici, une
  mauvaise devinette coûte un essai : on ne devine que quand il n'y a aucun doute, et on demande sinon.

### Un bouton radio « contrôlé » qui ne change pas tout de suite

- **Pourquoi** : changer d'époque en partie libre relançait la partie sans prévenir. Il fallait pouvoir demander
  confirmation… et que le bouton radio reste sur l'ancienne époque en attendant.
- **Comment le faire** : en React, un champ dont la valeur vient de l'état (`checked={mode === choix}`) est
  « contrôlé » : après un clic, React remet le bouton dans l'état qu'il calcule. Il suffit donc de ne pas changer
  `mode` tout de suite : on note l'époque demandée (`epoqueDemandee`), on affiche la question, et seul « Oui » appelle
  `recommencer`. La question est dans un `aria-live` pour qu'un lecteur d'écran la lise.
- **Comment le penser** : l'écran n'est que le reflet de l'état. Pour « retenir » un changement, on ne touche pas au
  bouton : on retarde le changement d'état.
- **Piège des tests** : `getByText` remplace toutes les espaces, insécables comprises, par des espaces simples. Une
  phrase française avec ` ` se cherche donc avec une espace simple ; sinon le test ne trouve rien, et l'erreur
  fait croire à tort que le bouton ne marche pas. Vérifier dans le vrai navigateur a permis de comprendre que le
  problème venait du test.

### Deux onglets : l'évènement storage

- **Pourquoi** : chaque onglet gardait sa propre copie de la partie du jour en mémoire. On pouvait jouer la partie
  deux fois, et le dernier onglet à sauvegarder écrasait les essais de l'autre. En Java, une seule fenêtre à la fois :
  la question ne se posait pas.
- **Comment le faire** : quand un onglet écrit dans `localStorage`, le navigateur envoie l'évènement `storage` aux
  AUTRES onglets du même site (pas à celui qui écrit). Le hook `useChangementAilleurs(cle, quandChange)`
  (`src/onglets.ts`) l'écoute ; la partie du jour relit alors la sauvegarde et rejoue ses essais, les réglages se
  relisent aussi. `useEffectEvent` donne une fonction qui voit toujours les dernières valeurs du composant sans
  réinstaller l'écouteur à chaque affichage. Pour le tester : écrire dans `localStorage`, puis
  `fireEvent(window, new StorageEvent('storage', { key }))`, comme le ferait le navigateur.
- **Comment le penser** : tout ce qui est gardé dans le navigateur peut être modifié par un autre onglet. Se
  demander : « que se passe-t-il si le joueur ouvre la page deux fois ? » La source de vérité est la sauvegarde, la
  mémoire n'en est qu'une copie à tenir à jour.

### Des couleurs par rôle, même pour les boutons

- **Pourquoi** : `bg-red-700` et `bg-green-700` étaient écrits en dur dans deux composants. On ne pouvait pas
  réutiliser `erreur` : en thème sombre, c'est un rouge clair, et un texte blanc dessus serait illisible.
- **Comment le faire** : deux rôles dans `@theme` (`src/index.css`), `--color-danger` et `--color-succes`, qui
  reprennent les couleurs de Tailwind (`var(--color-red-700)`). Les composants utilisent `bg-danger`, `bg-succes`.
- **Comment le penser** : nommer une couleur par ce qu'elle veut dire (« danger »), pas par ce qu'elle est
  (« rouge 700 »). Le jour où on la change, on la change à un seul endroit.

### Un élément désigné par aria-controls doit exister

- **Pourquoi** : le champ de saisie disait « je contrôle la liste n° X » (`aria-controls`), mais la liste n'était
  dans la page que lorsqu'elle était ouverte.
- **Comment le faire** : garder la `<ul>` toujours présente, avec l'attribut `hidden` quand elle est vide (le
  navigateur ne l'affiche pas, et les lecteurs d'écran l'ignorent), comme dans le modèle combobox du W3C.
- **Comment le penser** : un attribut `aria-*` qui désigne un autre élément par son `id` est une référence, comme un
  pointeur : elle doit toujours mener quelque part.

## web.6.3 La liste des régions

### Un bouton dans l'en-tête, une action dans la partie affichée

- **Pourquoi** : le bouton 📃 est dans l'en-tête, qui appartient à `App`, mais la liste doit proposer un nom dans la
  partie de l'onglet affiché, et montrer les régions de SON époque. Or `App` ne connaît ni la partie du jour ni
  l'époque de la partie libre : chacune garde son état.
- **Comment le faire** : comme pour 📊, `App` ne garde qu'un compteur de demandes, un par onglet
  (`{ jour: 0, libre: 0 }`), et n'augmente que celui de l'onglet affiché. Chaque partie le passe à son plateau, qui
  ouvre sa propre fenêtre quand le compteur change, et propose le nom avec la même fonction `jouer` que la saisie
  (mêmes messages, même sauvegarde). Un compteur, et non un booléen « ouvert » : deux clics de suite font deux
  demandes, même si la fenêtre a été fermée entre-temps.
- **Comment le penser** : l'état vit là où il sert. Quand un composant du haut doit déclencher une action plus bas,
  on lui envoie un signal (« une demande de plus »), sans remonter tout l'état. En Java, ce serait un évènement
  envoyé à un écouteur, plutôt que de rendre la partie publique.

### Comparer par identifiant, pas par objet

- **Pourquoi** : dans le navigateur, après une modification du code, la liste ne barrait plus la région proposée.
  Le rechargement à chaud de Vite (HMR : le code change sans recharger la page) avait recréé les objets régions,
  tandis que la partie gardait les anciens. `Set.has` compare les objets par référence, comme `==` en Java sur
  des objets : deux objets identiques en contenu, mais distincts, ne sont pas égaux.
- **Comment le faire** : un `Set` des identifiants (`essai.region.id`) au lieu des objets. Un rechargement complet de
  la page avait montré que ce n'était pas un vrai bug pour le joueur, mais la comparaison par identifiant ne dépend
  plus de cela.
- **Comment le penser** : en TypeScript comme en Java, l'égalité d'objets est une égalité de référence. Pour
  reconnaître « la même région », comparer ce qui l'identifie (l'`id`), comme on écrirait `equals` en Java.

### La place sur un écran de téléphone

- **Pourquoi** : un troisième bouton à droite de l'en-tête faisait passer le numéro du jour sous le titre, sur un
  écran de 375 pixels.
- **Comment le faire** : mesurer dans le navigateur, avec la taille d'écran d'un téléphone (la hauteur du `<h1>` :
  36 pixels pour une ligne, 72 pour deux), puis serrer les boutons sur les petits écrans seulement :
  `px-1 sm:px-2`. Avec Tailwind, `sm:` veut dire « à partir de 640 pixels de large » : on écrit d'abord pour le
  téléphone, puis on ajoute pour les écrans plus grands.
- **Comment le penser** : chaque élément ajouté à une barre prend la place d'un autre. Vérifier à la plus petite
  largeur visée, pas seulement sur l'ordinateur.

## Un test qui échoue parfois : le délai des tests

### Lire le message avant de corriger

- **Pourquoi** : environ un lancement sur cinq de toute la suite, un test d'écran échouait, puis passait à la relance.
  Un test qui échoue « parfois » a une cause précise (un délai, un ordre d'exécution, une donnée partagée) : il faut
  la trouver, sinon on corrige au hasard.
- **Comment le faire** : relancer la suite en boucle en gardant la sortie de chaque lancement
  (`npx vitest run > run1.txt`). Dix lancements calmes passaient tous ; alors on charge la machine exprès, en lançant
  deux suites en même temps : l'échec revient à coup sûr, avec le message `Error: Test timed out in 5000ms`. C'est un
  délai dépassé, pas un élément introuvable. Puis mesurer : `npx vitest run --reporter=json --outputFile=r.json`
  donne la durée de chaque test ; les plus lents montaient à 4,9 s, pour une limite de 5 s. Enfin, essayer la
  correction sans toucher au code : `npx vitest run --testTimeout=15000`, toujours sous double charge : plus aucun
  échec, 6,9 s au pire.
- **Comment le penser** : un échec intermittent devient reproductible quand on aggrave sa cause supposée (ici, la
  charge). Et un échec en cache parfois un autre : un test dont le délai expire n'est pas arrêté, il continue de
  cliquer pendant le test suivant, qui échoue à son tour sur une assertion. Corriger la première erreur, pas la
  dernière.

### Allonger le délai, ou alléger le test

- **Pourquoi** : les tests d'écran affichent tout le jeu (`<App />`) dans jsdom et tapent les noms lettre par lettre
  avec user-event : c'est du vrai travail, pas une attente. Leur durée dépend de la machine et de ce qui tourne à
  côté. Le délai par défaut de Vitest (5 s) est pensé pour des tests unitaires, bien plus courts.
- **Comment le faire** : `testTimeout: 15_000` dans la partie `test` de `vite.config.ts`, pour toute la suite. Un
  test seul peut aussi avoir son propre délai : `it('…', async () => { … }, 15_000)`. Le `_` de `15_000` sépare les
  milliers, comme en Java.
- **Comment le penser** : le délai d'un test sert à arrêter un test bloqué, pas à mesurer la vitesse. On le règle
  avec une marge nette au-dessus de la durée mesurée au pire (ici plus du double). Alléger les tests (moins de
  frappe, des composants plus petits) vaudrait mieux si la suite devenait trop longue à attendre ; ce n'est pas le
  cas (environ 23 s).

## web.7.0.1 Les réponses du Java

### Deux projets, une seule liste de décisions

- **Pourquoi** : le bonus a été fait d'abord en Java, et ses réponses ont changé une décision du web (le bonus aussi
  en partie libre). Si chaque projet garde ses décisions dans son coin, on finit par programmer ici une règle
  abandonnée là-bas, sans le savoir.
- **Comment le faire** : avant de coder, comparer les deux plans (`docs/plan.md` ici, `docs/feuille-de-route.md` du
  Java), relever chaque différence et la trancher. Puis écrire la réponse **dans les deux** : la règle commune ici, et
  l'écart voulu (la reprise du bonus) des deux côtés, avec sa raison. `git log` et `git show --stat <commit>` dans
  l'autre dépôt montrent vite ce qui a été fait.
- **Comment le penser** : un écart entre deux versions n'est pas un défaut s'il est écrit et expliqué. Ce qui coûte
  cher, c'est l'écart qu'on découvre plus tard. Ici, le web s'écarte parce qu'un navigateur se ferme plus facilement
  qu'une application de bureau : une même règle peut mal convenir à un autre support.

## web.7.1 Les données et les contours des départements

### Une seule liste pour le jeu et pour les images

- **Pourquoi** : le script Python avait son propre tableau `DEPARTEMENTS`, et le jeu allait en avoir besoin aussi.
  Deux copies de la même liste finissent toujours par se contredire (un département ajouté d'un côté, oublié de
  l'autre). Le Java avait déjà réglé la question avec `departements.json`, lu par le jeu **et** par le script.
- **Comment le faire** : copier le fichier du Java dans `src/domaine/departements.json`, l'importer dans
  `departements.ts` (`import donnees from './departements.json'` : Vite en fait un objet JavaScript au moment de
  construire le site), et le lire dans le script avec `json.load`. Le script vérifie au passage que chaque nom du
  fichier est celui des contours officiels. Les tests vérifient le reste : 101 départements, chacun dans une seule
  région par époque.
- **Comment le penser** : une donnée = un endroit. Quand deux programmes (ici, un en Python, un en TypeScript) en ont
  besoin, on choisit un format que les deux savent lire (JSON) plutôt que de la recopier dans chaque langage.

### L'ordre des clés d'un objet JavaScript

- **Pourquoi** : `Object.entries({"10": …, "01": …, "2A": …, "971": …})` ne rend **pas** l'ordre du fichier.
  JavaScript range d'abord les clés qui s'écrivent comme des entiers (« 10 », « 971 »), par ordre croissant, puis les
  autres (« 01 », « 2A »), dans l'ordre d'écriture. En Java, `LinkedHashMap` garde l'ordre ; un objet JavaScript, pas
  tout à fait.
- **Comment le faire** : trier soi-même (`rang()` dans `departements.ts` : « 2A » vaut 20,1) ; et dans les fichiers
  de contours, écrire une **liste** `[{ "code", "d" }]` plutôt qu'un objet `{ code: d }`.
- **Comment le penser** : un objet JavaScript est fait pour chercher par clé, pas pour garder un ordre. Si l'ordre
  compte, c'est une liste (ou une `Map`, qui garde l'ordre d'ajout).

### Des contours SVG cliquables, trous compris

- **Pourquoi** : pour le bonus, chaque département doit être dessiné et cliqué séparément. Le Java écrit des listes de
  points et teste lui-même « ce clic est-il dans cette forme ? » (`Shape.contains`). Dans un navigateur, un `<path>`
  SVG sait déjà le faire : il reçoit le clic s'il tombe dans sa forme.
- **Comment le faire** : le script écrit `src/images/departements/<région>.json`, un chemin SVG par département, sur
  2000 unités (le double des silhouettes, pour que Paris reste net une fois zoomé), simplifié par Douglas-Peucker,
  sans les îlots minuscules. Les trous sont gardés (l'enclave des Papes, du Vaucluse, dans la Drôme) : avec
  `fill-rule="evenodd"`, le navigateur sait qu'un point entouré deux fois est dehors. Poids : 656 Ko pour les 35
  régions, 30 Ko au plus pour une seule ; le jeu ne chargera que celle de la région trouvée.
- **Comment le penser** : avant de recoder ce que faisait le Java (le test du clic), se demander ce que la plateforme
  fait déjà. Ici, le navigateur fait le dessin, le clic, le survol et le clavier : on lui donne juste les formes.

## web.7.2 Les règles du bonus

### Reprendre un mélange au bit près

- **Pourquoi** : le bonus du jour doit poser les départements dans le même ordre que le Java, pour tout le monde. Le
  Java mélange avec `Collections.shuffle(liste, new Random(SEL + numéroDuJour))`. Comme pour la région du jour, il
  suffit de rejouer le même générateur (`HasardJava`, déjà écrit à web.1) avec la même graine, sur la même liste de
  départ (celle de `departements.json`, dans l'ordre des numéros).
- **Comment le faire** : `ordreDuJour()` dans `src/domaine/bonus.ts`, avec le sel `0x426f6e7573n` (« Bonus » en
  ASCII, un `BigInt` car il dépasse 32 bits). Pour le vérifier, on a étendu `outils/ReferenceJava.java` : il écrit
  maintenant l'ordre du bonus de chacun des 1501 jours de `reference-java.json`, et un test les compare tous. Depuis la
  phase 9, le Java lit un fichier JSON avec Jackson : il faut ajouter ses bibliothèques au classpath
  (`mvnw dependency:build-classpath`, mode d'emploi dans l'en-tête du fichier).
- **Comment le penser** : un sel différent pour chaque usage du hasard (« Francle » pour la région, « Angle », «
  Bonus ») évite que deux tirages du même jour soient liés. Et pour garantir que deux programmes donnent le même
  résultat, on ne relit pas le code en se disant « ça a l'air pareil » : on compare des centaines de valeurs.

### Régénérer une référence, et regarder ce qui change

- **Pourquoi** : en régénérant `reference-java.json`, les suggestions avaient changé : le Java cherche maintenant
  aussi les noms anglais (sa phase 8 a repris la règle du web). Le test du web cherchait exprès les seuls noms
  français pour imiter l'ancien Java ; il compare maintenant la vraie règle, et le paramètre `nomsCherches`, qui ne
  servait qu'à ce test, a disparu.
- **Comment le faire** : après avoir régénéré un fichier de référence, lire `git diff` **avant** de lancer les
  tests : chaque ligne changée doit avoir une raison connue.
- **Comment le penser** : une référence qui change n'est pas forcément une erreur ; c'est une question à poser. Ici,
  la réponse a permis de supprimer du code fait seulement pour les tests.

## web.7.3 Le bonus jouable

### Un <path> SVG comme bouton, sans donner la réponse

- **Pourquoi** : en mode A, on clique sur un département de la carte. Il doit aussi se jouer au clavier, et un lecteur
  d'écran doit pouvoir l'annoncer, mais pas par son nom (« Finistère » serait la réponse).
- **Comment le faire** : chaque `<path>` reçoit `role="button"`, `tabIndex={0}` (atteignable par Tab), un
  `onKeyDown` pour Entrée et Espace, et `aria-label="Zone 3 sur 4"`. Les zones sont numérotées du haut vers le bas de
  la carte (`centre()` dans `contours.ts`), pas dans l'ordre des numéros, qui serait un indice. Une fois le bonus
  fini, le rôle devient `img` et l'étiquette dit le nom et le résultat ; le nom s'affiche aussi sous la carte au
  survol, au clavier, et au doigt sur téléphone (toucher un élément atteignable lui donne le focus). axe vérifie les
  deux états (`Accessibilite.test.tsx`).
- **Comment le penser** : l'accessibilité n'est pas « tout dire » : c'est donner au lecteur d'écran la même chose
  qu'aux yeux. Pendant le bonus, les yeux voient des formes sans nom ; le lecteur d'écran entend des zones sans nom.

### Une fonction en paramètre pour réutiliser un composant

- **Pourquoi** : le mode B a besoin du même champ que la partie (suggestions, flèches, Entrée), mais pour des
  départements. Copier `Saisie` aurait fait deux composants à corriger à chaque fois.
- **Comment le faire** : `Saisie` ne connaît plus les régions : elle reçoit `suggerer(texte)`, qui renvoie des
  `{ cle, nom }`. Le plateau lui passe les régions, le bonus les départements. Et la règle d'Entrée de web.6.2 (un
  début de nom qui n'évoque qu'une réponse la joue) vaut aussi pour les départements : le test l'a montré.
- **Comment le penser** : c'est l'injection d'une stratégie, comme une interface Java passée au constructeur. Avant de
  dupliquer un composant, se demander ce qui change vraiment entre les deux usages, et en faire un paramètre.

### Charger un fichier à la demande : use() ou useEffect ?

- **Pourquoi** : les contours (656 Ko) ne sont téléchargés qu'au début du bonus (`import.meta.glob` sans `eager` :
  un fichier par région, à part du site). Le premier essai, avec `use(promesse)` et `<Suspense>` (React 19), marchait
  dans le navigateur mais pas dans un test : React a prévenu « A component suspended inside an act scope » et n'a
  jamais réaffiché la carte.
- **Comment le faire** : un petit hook, `useContours()` : `useEffect` lance le téléchargement après l'affichage, et
  `setState` fait réafficher le composant à l'arrivée ; un indicateur `actif` ignore une réponse arrivée trop tard.
  Les contours déjà arrivés sont gardés dans une `Map`, et s'affichent ensuite tout de suite.
- **Comment le penser** : lire les avertissements de la console des tests, ils disent souvent la cause. Et préférer
  l'outil le plus simple qui suffit : `use()` est fait pour des données gérées par un cadre (un routeur, un cache) ;
  pour un fichier chargé une fois, `useEffect` est plus simple à suivre et à tester.

### Sauver le bonus sans casser les anciennes sauvegardes

- **Pourquoi** : le bonus du jour doit survivre à la fermeture de la page. Changer de clé (`v2`) obligerait à
  convertir les anciennes parties.
- **Comment le faire** : un champ **facultatif** `bonus?: { reponses, etat }` dans chaque partie sauvée ; une
  ancienne sauvegarde ne l'a pas, et reste valable. Comme pour la partie, on garde les réponses et on les rejoue
  (`rejouer()`), sans garder le score. `enregistrer()` reprend ce qui était déjà sauvé de ce jour
  (`...parties.get(numero)`) pour ne pas effacer le bonus.
- **Comment le penser** : faire évoluer un format, c'est d'abord se demander comment se lisent les données d'hier.
  Un champ facultatif, et un test qui relit une sauvegarde d'avant (`sauvegarde.test.ts`), y suffisent souvent.

## web.7.4 Les finitions du bonus

### Une fonction n'est finie que quand on peut la découvrir

- **Pourquoi** : un bonus qui arrive sans prévenir après une victoire surprend ; un joueur qui lit « Comment jouer »
  doit le connaître, et le README doit le citer. Les crédits aussi changent : les contours des départements viennent
  de la même source que ceux des régions.
- **Comment le faire** : un paragraphe dans « Comment jouer » (`aide.bonus` dans `textes.ts`, en français et en
  anglais), les crédits et le README mis à jour, un test qui joue le bonus en anglais (`Anglais.test.tsx`), et
  `npm run build` pour vérifier que chaque région a bien son petit fichier de contours à part (17 à 30 Ko, 5 à 9 Ko
  compressés), chargé seulement au début du bonus.
- **Comment le penser** : avant de dire « c'est fait », relire la liste de ce qui touche le joueur : l'aide, les
  textes dans chaque langue, le téléphone, le thème sombre, les crédits. Et vérifier dans un vrai navigateur ce que
  jsdom ne sait pas montrer : la mise en page, les couleurs, le survol.

## web.7.5.0 Le bonus revu : partir des retours des joueurs

### Avant de coder, chercher ce qui change et ce qui tient

- **Pourquoi** : deux retours de joueurs (« le bonus juste après la victoire », « cliquer puis écrire ») semblaient
  demander de tout refaire. En lisant le code, la plus grande partie tient : la `Tentative` (`demande`, `donne`)
  convient telle quelle au mode C, donc le score, les statistiques et le partage ne bougent pas. Ce qui change vraiment
  se limite à trois endroits : le moment où s'ouvre la fenêtre des résultats, ce qu'un clic veut dire sur la carte, et
  le format de la sauvegarde (des paires, puisque l'ordre n'est plus connu d'avance).
- **Comment le faire** : pour chaque retour, suivre le chemin dans le code (ici `changer()` puis `fermerFenetre()`
  dans `PartieDuJour.tsx`, et `repondre()` dans `bonus.ts`), noter ce qui suppose l'ancien fonctionnement (l'ordre
  imposé, `bonusAVenir`), et poser une question pour chaque cas que le retour ne tranche pas (passer avant toute
  réponse, retour sur la page, suggestions de la région ou de toute la France).
- **Comment le penser** : une demande d'utilisateur décrit ce qu'il voit, pas ce qu'il faut changer. La question
  utile : « quelle idée du code cette demande contredit-elle ? » (ici : « l'ordre des questions est fixé d'avance »).
  Ce qui ne la contredit pas peut rester tel quel. Et une donnée déjà sauvegardée chez les joueurs est toujours ce
  qui coûte le plus à changer : il faut y penser en premier.

## web.7.5 Le bonus juste après la victoire

### Décider au moment de l'évènement, plutôt que garder un état « en attente »

- **Pourquoi** : avant, une victoire mettait `bonusAVenir` à vrai, et la fermeture de la fenêtre lançait le bonus.
  Deux états à garder d'accord (la fenêtre, le drapeau), et un oubli possible à chaque nouveau chemin (changer
  d'époque, minuit). Le bonus devant commencer tout de suite, le drapeau n'a plus de raison d'être.
- **Comment le faire** : tout se décide dans les deux fonctions qui changent l'état : `changer()` (une victoire lance
  le bonus, une défaite ouvre la fenêtre) et `changerBonus()` (fini : la fenêtre après une pause ; passé : tout de
  suite). L'état de départ, au retour sur la page, se déduit de ce qui est sauvé : fenêtre ouverte si la partie est
  finie, sauf si un bonus est en cours.
- **Comment le penser** : un drapeau qui dit « il faudra faire X plus tard » est un signal. Se demander si l'on peut
  faire X au moment où l'on sait qu'il faut le faire. C'est comme en Java : mieux vaut agir dans le
  `actionPerformed` que poser un booléen lu par un autre écouteur.

### Une minuterie dans React : un état et un effet

- **Pourquoi** : la fenêtre doit s'ouvrir 1,5 s après la dernière réponse. Un `setTimeout` lancé dans le clic
  continuerait de tourner si le composant disparaît (minuit, nouvelle partie) et ouvrirait la fenêtre d'une partie
  qui n'existe plus.
- **Comment le faire** : `usePause` (`src/pause.ts`) garde un état « en attente » ; un `useEffect` lance la
  minuterie quand il passe à vrai, et rend une fonction qui l'arrête (`clearTimeout`). React appelle cette fonction
  si l'état change (`annuler()`, appelé par « Nouvelle partie ») ou si le composant disparaît. Testé seul avec de
  fausses minuteries (`vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })` et
  `vi.advanceTimersByTime`), et une fois pour de vrai dans `Bonus.test.tsx`.
- **Comment le penser** : tout ce qui continue après le clic (minuterie, téléchargement, écouteur) doit savoir
  s'arrêter. La question à se poser : « que se passe-t-il si le composant disparaît pendant ce temps ? ». En
  Swing, c'est le `javax.swing.Timer` qu'on oublie d'arrêter en fermant une fenêtre.

### Rendre le focus quand ce qu'on utilisait disparaît

- **Pourquoi** : le joueur tape la région, appuie sur Entrée, et la saisie disparaît (la partie est finie). Le focus
  du clavier retombe alors sur la page : un joueur au clavier ou avec un lecteur d'écran ne sait plus où il est.
- **Comment le faire** : le titre du bonus reçoit le focus à son apparition (`ref`, `tabIndex={-1}` pour qu'il
  puisse le recevoir sans devenir une étape de Tab, et `focus()` dans un `useEffect`). Seulement quand le joueur
  vient de lancer le bonus, pas quand il le retrouve en revenant sur la page. Le test vérifie
  `document.activeElement`.
- **Comment le penser** : à chaque élément qui disparaît après une action, se demander où va le focus. La fenêtre
  `<dialog>` le gère toute seule ; le reste de la page, non.

## web.7.6 Les règles du mode C

### Garder ce qui décrit le jeu, changer ce qui le contraint

- **Pourquoi** : le mode C laisse le joueur choisir l'ordre. Une `Tentative` (`demande`, `donne`) le décrit déjà ;
  ce qui supposait un ordre imposé, c'est `demande(bonus)` (« la question en cours ») et `repondre()`, qui s'en
  servait. Récrire tout le bonus aurait cassé le mode A, ses tests et la comparaison avec le Java.
- **Comment le faire** : une fonction interne `ajouter(bonus, demande, donne)` fait le travail commun ; `repondre()`
  (modes A et B) lui passe la question en cours, `repondreChoix()` (mode C) le département choisi. `demande()` refuse
  le mode C par une erreur : l'appeler serait une erreur de programmation, pas une action du joueur. Le refus d'un
  département déjà trouvé est une valeur rendue (`'deja-trouve'`), puisque le joueur peut le provoquer.
- **Comment le penser** : distinguer l'erreur du joueur (une valeur, à afficher) de l'erreur du programmeur (une
  exception, qui doit faire échouer un test). C'est la différence, en Java, entre une valeur de retour comme
  `Optional` ou un `sealed interface` de résultats, et une `IllegalStateException`.

### Un format de sauvegarde de plus, sans perdre l'ancien

- **Pourquoi** : en mode C, l'ordre des réponses ne dit plus quel département était demandé. Les numéros donnés ne
  suffisent plus : il faut des paires (demandé, donné). Mais des joueurs ont déjà des bonus sauvés au format de web.7.
- **Comment le faire** : deux champs facultatifs, `reponses` (web.7) et `paires` (web.7.6). On n'écrit plus que
  `paires` ; à la lecture, `paires` sinon `reponses`, rejouées avec l'ordre du jour comme avant. La vérification
  (`estBonusSauve`) accepte l'un ou l'autre. Un test relit une sauvegarde de web.7 écrite à la main, un autre une
  paire abîmée.
- **Comment le penser** : une sauvegarde est une promesse faite aux données d'hier. Avant de changer un format, écrire
  le test qui relit l'ancien ; et nommer chaque format dans un commentaire, avec la version qui l'a introduit.

## web.7.7 Le mode C jouable

### Un état d'affichage n'appartient pas aux règles

- **Pourquoi** : en mode C, le joueur clique un département avant de le nommer. Ce choix ne compte pour rien tant
  qu'il n'a pas répondu, et il peut changer d'avis. Le mettre dans le `Bonus` l'aurait fait sauvegarder et comparer
  dans les tests des règles, pour une information qui ne vit que le temps d'un clic.
- **Comment le faire** : un `useState` dans `JeuBonus` (`choix`) ; la carte le reçoit (`choisi`) et prévient d'un clic
  (`onChoisir`). Le département choisi n'est utilisé que s'il attend encore sa réponse
  (`restants(bonus).includes(choix)`) : un autre onglet a pu y répondre entre-temps. On le déduit à chaque affichage,
  plutôt que de le corriger dans un effet.
- **Comment le penser** : se demander « si je ferme la page maintenant, est-ce que je veux retrouver cette
  information ? ». Si oui, c'est une donnée du jeu (le domaine, la sauvegarde) ; sinon, c'est un état de l'écran,
  gardé par le composant qui l'affiche. En Swing, la même différence sépare le modèle de la sélection d'une `JList`.

### Donner le focus à un champ qui vient de cesser d'être grisé

- **Pourquoi** : un clic sur un département doit donner le focus à la saisie, pour taper le nom tout de suite. Mais
  au moment du clic, la saisie est encore grisée (`disabled`), et un champ grisé refuse le focus.
- **Comment le faire** : le parent incrémente un compteur (`demandeFocus`), et la saisie appelle `focus()` dans un
  `useEffect` qui dépend de ce compteur : l'effet passe après l'affichage, quand le champ n'est plus grisé. Un
  compteur plutôt qu'un booléen : deux clics de suite font deux demandes, même si la valeur « vrai » ne change pas.
  C'est la même façon de faire que pour les boutons de l'en-tête (`demandeStats`, `demandeListe`).
- **Comment le penser** : ce qui touche à l'élément lui-même (focus, mesure, défilement) se fait après l'affichage,
  donc dans un effet. La question : « l'élément est-il déjà dans l'état où je le veux, au moment où j'agis ? ».

### Un test qui dépend des données du jour

- **Pourquoi** : un test supposait au moins trois départements dans la région du jour des tests ; c'est la Corse,
  qui n'en a que deux (et le bonus était fini après la deuxième réponse). Un autre truquait `Math.random` après
  l'ouverture du jeu, alors que la première partie libre est tirée à l'ouverture.
- **Comment le faire** : lire le message d'erreur (« reading 'nom' » d'un `undefined`, « Unable to find » la carte),
  vérifier la donnée en cause, puis écrire le test pour qu'il tienne quelle que soit la région (une réponse fausse
  prise hors de la région, « Gironde ») et truquer le hasard avant `render`.
- **Comment le penser** : un test ne doit supposer des données que ce qu'il vérifie lui-même. Quand il en suppose
  plus, le dire dans un commentaire, ou mieux, choisir des données qui ne peuvent pas manquer.

## web.7.8 Les bugs relevés en jouant

### Un refus n'est pas une fin : garder ce qui aide à corriger

- **Pourquoi** : après « nor » puis Entrée, le jeu répondait « Plusieurs régions possibles… choisis dans la liste »,
  mais la saisie fermait la liste quoi qu'il arrive (`setOuverte(false)` après chaque envoi). Le message renvoyait à
  quelque chose qu'on venait de cacher.
- **Comment le faire** : `onProposer` dit déjà si la saisie est acceptée (il renvoie un booléen). La liste se ferme
  seulement dans ce cas : `setOuverte(!acceptee)`. Rien n'y est surligné (`setChoisie(-1)`), pour qu'une seconde
  Entrée renvoie le texte tapé au lieu de jouer une région au hasard. La saisie vide s'arrête plus tôt encore
  (`saisie.trim() === ''`), dans la saisie elle-même : la partie et le bonus en profitent tous les deux.
- **Comment le penser** : relire chaque message d'erreur en se demandant « ce qu'il conseille de faire, l'écran le
  permet-il encore ? ». Et placer une règle au plus près de ce qu'elle concerne : « une saisie vide ne veut rien
  dire » ne dépend ni des régions ni des départements, donc elle va dans le champ, pas dans ceux qui l'utilisent.

### Une seule fonction pour un format

- **Pourquoi** : les statistiques écrivaient « 100 % » à la main, avec une espace ordinaire : le signe passait à la
  ligne sur téléphone, et l'anglais gardait l'espace (« 100 % » au lieu de « 100% »). La bonne fonction,
  `textes.stats.pourcentage()`, existait déjà, deux lignes plus bas.
- **Comment le faire** : chercher tous les endroits qui fabriquent le même format (`grep -n "%" src/**/*.tsx`), et
  les faire passer par la fonction des textes.
- **Comment le penser** : un format (pourcentage, date, nombre) est une règle de langue, comme un mot ; il se range
  avec les textes. En Java, ce serait un `NumberFormat` partagé plutôt qu'une concaténation dans chaque écran.

### Le nom d'un fichier se voit

- **Pourquoi** : Vite range chaque image dans le site sous son nom d'origine, plus une empreinte :
  `corse-C5fvIIqz.svg`. Un appui long sur la silhouette, « Ouvrir l'image », et la réponse s'affiche dans l'adresse.
- **Comment le faire** : `npm run build`, puis `ls dist/assets` montre les noms publiés. L'option
  `build.rolldownOptions.output.assetFileNames` de Vite (Vite 8 s'appuie sur Rolldown ; `rollupOptions` est
  l'ancien nom) peut être une fonction : elle reçoit le chemin d'origine du fichier (`originalFileNames`) et renvoie
  le modèle du nom. Pour les silhouettes, `assets/[hash][extname]` ; pour le reste, le modèle par défaut.
- **Comment le penser** : tout ce que le navigateur reçoit, le joueur peut le lire (nom de fichier, code, réseau).
  On ne cache pas une réponse, on la rend seulement moins facile à trouver par accident. Ici, l'appui long est
  fermé ; les outils du navigateur restent ouverts, et c'est accepté (les contours des départements, chargés au
  bonus, gardent d'ailleurs leur nom : ils n'arrivent qu'après la victoire).

## web.7.9 La saisie et la fin de partie

### Déduire une relation au lieu de l'écrire

- **Pourquoi** : pour dire « Alsace : une ancienne région, aujourd'hui dans la région Grand Est », il faut savoir
  quelle ancienne région va dans quelle nouvelle. On aurait pu ajouter ce lien à chaque région de `regions.ts` ; mais
  `departements.json` le contient déjà : la réforme de 2016 a regroupé les régions sans toucher aux départements.
- **Comment le faire** : `nouvelleRegionDe(ancienne)` cherche la nouvelle région qui contient le premier département
  de l'ancienne ; `anciennesRegionsDe(nouvelle)` garde les anciennes régions dont tous les départements sont dans la
  nouvelle. Deux tests vérifient la relation sur toutes les régions (chaque ancienne est regroupée par sa nouvelle,
  et les anciennes couvrent exactement les départements de la nouvelle), plutôt que trois exemples seulement.
- **Comment le penser** : avant d'ajouter une donnée, se demander « puis-je la calculer à partir de ce que j'ai
  déjà ? ». Une donnée de plus peut contredire les autres ; une donnée calculée, jamais. C'est la même idée qu'une
  méthode `getAge()` calculée à partir de la date de naissance plutôt qu'un champ `age` en Java.

### Laisser les règles tranquilles, changer ce qu'on montre

- **Pourquoi** : à la fin d'une partie, on veut voir tous les indices. Changer `indicesReveles()` aurait été plus
  court, mais cette fonction est la règle du jeu, la même que le Java (et vérifiée par ses tests de référence).
- **Comment le faire** : une deuxième fonction, `indicesAffiches(partie)`, qui renvoie les indices révélés pendant
  la partie et tous une fois la partie finie. Le plateau l'appelle ; les règles ne bougent pas.
- **Comment le penser** : distinguer « ce que le jeu décide » (une règle) de « ce que l'écran choisit de montrer »
  (un affichage). Les deux changent pour des raisons différentes ; les séparer évite qu'une envie d'affichage casse
  une règle partagée.

### Une fonction de plus dans un fichier de composants

- **Pourquoi** : la phrase de fin du bonus sert maintenant à deux endroits (sous la carte, et dans la fenêtre des
  résultats). La mettre dans `JeuBonus.tsx` et l'exporter faisait râler le lint : `only-export-components`. Le
  rechargement à chaud de Vite (le « fast refresh », qui remplace un composant modifié sans recharger la page) ne
  marche que si un fichier `.tsx` n'exporte que des composants.
- **Comment le faire** : la fonction va dans `textes.ts`, à côté des phrases qu'elle choisit (`finDuBonus`).
- **Comment le penser** : un fichier de composant exporte des composants ; ce qui se partage entre plusieurs
  composants va dans un module ordinaire. Quand le lint signale quelque chose qu'on ne comprend pas, lire le nom de
  la règle : il dit presque toujours pourquoi elle existe.

### Les tests voient aussi ce qui est caché

- **Pourquoi** : une fois la phrase de fin du bonus ajoutée aux résultats, `getByText` en trouvait deux : celle du
  bonus, et celle de la fenêtre, pourtant fermée. Un `<dialog>` fermé reste dans la page, et `getByText` ne regarde
  pas si un élément est visible (`getByRole`, lui, ignore les éléments cachés).
- **Comment le faire** : chercher dans une zone précise : `within(zoneBonus())`, la section du bonus trouvée par son
  rôle (`region`, celui d'une `<section>` qui a un titre).
- **Comment le penser** : quand un test trouve « plusieurs éléments », ne pas prendre le premier au hasard ; se
  demander lequel le joueur regarde, et le désigner comme lui le trouverait.
