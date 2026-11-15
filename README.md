# Francle

Devine la région française du jour, en six essais.

**Jouer : https://deibine.github.io/francle-web/**

Francle est un jeu de devinettes inspiré de [Worldle](https://worldle.teuteuf.fr/) : on voit la silhouette d'une
région française, et l'on propose des régions jusqu'à trouver la bonne. Après chaque essai, le jeu donne la distance
entre les deux capitales régionales, la direction à suivre et un pourcentage de proximité. Après chaque essai raté,
un indice apparaît : la superficie, une spécialité, une personnalité, la capitale, puis un monument. Après une
victoire, un bonus : nommer chaque département de la région trouvée.

## Ce qu'on peut faire

- **La partie du jour** : la même région pour tout le monde, parmi les 18 régions actuelles. Elle change à minuit.
  La partie est retrouvée si l'on ferme la page ; les statistiques (parties, victoires, séries) sont gardées.
- **Le bonus des départements** : juste après une victoire, on clique sur un département de la région, puis on
  écrit son nom ou son numéro, dans l'ordre qu'on veut ; une seule réponse par département. Les résultats s'ouvrent à
  la fin du bonus. Le bonus du jour est retrouvé si l'on ferme la page, et compte dans les statistiques (score moyen).
- **Le partage** : le résultat en carrés 🟩🟨⬜, sans dévoiler la réponse, et le score du bonus (🗺️ 9/12).
- **La partie libre** : autant de parties qu'on veut, avec les régions actuelles ou les anciennes régions (avant 2016).
- **Les réglages** : thème clair ou sombre, kilomètres ou miles, et deux modes difficiles : la silhouette tournée 🌀
  ou cachée 🙈.
- **Deux langues** : français et anglais.
- **Les statistiques** : le score Francle (10 points au plus par jour), les détails, le calendrier, un bilan à
  comparer avec un ami par un lien, et les chiffres de tous les joueurs du jour.
- **Les classements** (facultatif) : avec un profil (un pseudo, sans e-mail ni mot de passe), une ligue entre amis
  qu'on rejoint par un lien, et le classement public du mois.

Le jeu tourne dans le navigateur : les parties et les réglages restent sur l'appareil du joueur (`localStorage`), et
le jeu marche sans réseau une fois la page chargée. Depuis web.9.2, si le joueur l'accepte (c'est le réglage de
départ), chaque partie du jour finie est aussi envoyée, sans rien qui dise qui il est, à un petit serveur
(`serveur/`, un Worker Cloudflare) qui calcule les chiffres de tous les joueurs du jour. Depuis web.9.3, un joueur
qui crée un profil y rattache ses parties, pour sa ligue et le classement public. Le détail est dans la page de
confidentialité du jeu (en bas de page, ou `…/#confidentialite`).

## Développer

Il faut [Node.js](https://nodejs.org/) (version LTS).

```bash
npm ci            # installe les dépendances, aux versions exactes de package-lock.json
npm run dev       # le jeu en local : http://localhost:5173/francle-web/
npm test          # les tests (Vitest)
npm run lint      # la vérification du code (oxlint)
npm run build     # le site prêt à publier, dans dist/
npm run verifier:navigateur   # l'accessibilité (axe) dans un vrai navigateur, en clair et en sombre
```

Le serveur des chiffres de tous (`serveur/`) a ses propres dépendances (wrangler, l'outil de Cloudflare). Ses tests
tournent avec ceux du site (`npm test`), sur une vraie base SQLite en mémoire. Pour le faire tourner en local, avec
une base locale :

```bash
cd serveur
npm ci
npm run dev       # le serveur en local : http://localhost:8787
```

puis, dans un autre terminal, `VITE_SERVEUR=http://localhost:8787 npm run dev` pour que le site s'en serve. Il est
publié par la CI à chaque fusion dans `main` (la migration de la base, puis le Worker).

`verifier:navigateur` (`outils/verifier-navigateur.ts`) joue une partie dans Edge ou Chrome, déjà installés, et
vérifie chaque écran avec axe, contrastes compris, ce que les tests ne peuvent pas faire. Il se lance à la main, pas
dans la CI. Sans Edge ni Chrome : `npx playwright install chromium`.

Chaque fusion dans `main` publie le site sur GitHub Pages (`.github/workflows/ci.yml`).

### L'organisation du code

| Dossier ou fichier | Rôle |
|---|---|
| `src/domaine/` | Les règles du jeu, sans affichage : régions, distance, direction, proximité, région du jour, partage, statistiques. |
| `src/composants/` | Les morceaux de l'écran (React) : silhouette, saisie, tableau, indices, carte, fenêtres… |
| `src/App.tsx`, `src/PartieDuJour.tsx`, `src/PartieLibre.tsx` | L'écran du jeu et les deux sortes de partie. |
| `src/textes.ts` | Tous les textes, en français et en anglais. |
| `src/sauvegarde.ts`, `src/reglages.ts` | Ce qui est gardé dans le navigateur. |
| `src/images/` | Les silhouettes (SVG), les contours des cartes et ceux des départements, produits par `outils/generer_images.py`. |
| `outils/` | Le script des images, et la vérification dans un vrai navigateur. |
| `docs/plan.md`, `docs/lecons.md` | Le plan du projet et les leçons apprises à chaque étape. |

### Les images

Les silhouettes, les cartes, les contours des départements et l'icône sont produits à partir des contours officiels des départements et des
régions ([france-geojson](https://github.com/gregoiredavid/france-geojson), données IGN et INSEE, licence ouverte
Etalab). La liste des départements de chaque région est lue dans `src/domaine/departements.json`, copié du projet
Java. Pour les refaire, télécharger les trois fichiers GeoJSON dans un dossier, puis, avec Python 3 :

```bash
py outils/generer_images.py <dossier des contours> src/images public
```

### La version Java

Francle a d'abord été un jeu de bureau en Java ([deIbine/francle](https://github.com/deIbine/francle)). Le site en
a repris les règles et les données, puis a suivi son propre chemin : les deux projets sont séparés, et le Java ne
sert plus que de point de comparaison. Les valeurs de référence du site (région et angle du jour, distances,
suggestions) sont figées dans `src/domaine/reference.json` et vérifiées par `src/domaine/reference.test.ts`.

## Licence

[MIT](LICENSE). Inspiré de Worldle (Copyright (c) 2022 teuteuf, licence MIT). Contours des régions : IGN et INSEE,
licence ouverte Etalab.
