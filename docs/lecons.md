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
