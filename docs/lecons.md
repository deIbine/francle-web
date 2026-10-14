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
