# Francle

Devine la région française du jour, en six essais.

**Jouer : https://deibine.github.io/francle-web/**

Francle est un jeu de devinettes inspiré de [Worldle](https://worldle.teuteuf.fr/) : on voit la silhouette d'une
région française, et l'on propose des régions jusqu'à trouver la bonne. Après chaque essai, le jeu donne la distance
entre les deux capitales régionales, la direction à suivre et un pourcentage de proximité. Après chaque essai raté,
un indice apparaît : la superficie, une spécialité, une personnalité, la capitale, puis un monument.

## Ce qu'on peut faire

- **La partie du jour** : la même région pour tout le monde, parmi les 18 régions actuelles. Elle change à minuit.
  La partie est retrouvée si l'on ferme la page ; les statistiques (parties, victoires, séries) sont gardées.
- **Le partage** : le résultat en carrés 🟩🟨⬜, sans dévoiler la réponse.
- **La partie libre** : autant de parties qu'on veut, avec les régions actuelles ou les anciennes régions (avant 2016).
- **Les réglages** : thème clair ou sombre, kilomètres ou miles, et deux modes difficiles : la silhouette tournée 🌀
  ou cachée 🙈.
- **Deux langues** : français et anglais.

Tout se passe dans le navigateur : il n'y a pas de serveur, et aucune donnée n'est collectée. Les parties et les
réglages restent sur l'appareil du joueur (`localStorage`).

## Développer

Il faut [Node.js](https://nodejs.org/) (version LTS).

```bash
npm ci            # installe les dépendances, aux versions exactes de package-lock.json
npm run dev       # le jeu en local : http://localhost:5173/francle-web/
npm test          # les tests (Vitest)
npm run lint      # la vérification du code (oxlint)
npm run build     # le site prêt à publier, dans dist/
```

Chaque fusion dans `main` publie le site sur GitHub Pages (`.github/workflows/ci.yml`).

### L'organisation du code

| Dossier ou fichier | Rôle |
|---|---|
| `src/domaine/` | Les règles du jeu, sans affichage : régions, distance, direction, proximité, région du jour, partage, statistiques. |
| `src/composants/` | Les morceaux de l'écran (React) : silhouette, saisie, tableau, indices, carte, fenêtres… |
| `src/App.tsx`, `src/PartieDuJour.tsx`, `src/PartieLibre.tsx` | L'écran du jeu et les deux sortes de partie. |
| `src/textes.ts` | Tous les textes, en français et en anglais. |
| `src/sauvegarde.ts`, `src/reglages.ts` | Ce qui est gardé dans le navigateur. |
| `src/images/` | Les silhouettes (SVG) et les contours des cartes, produits par `outils/generer_images.py`. |
| `outils/` | Le script des images, et `ReferenceJava.java`, qui produit les valeurs de référence du jeu Java. |
| `docs/plan.md`, `docs/lecons.md` | Le plan du projet et les leçons apprises à chaque étape. |

### Les images

Les silhouettes, les cartes et l'icône sont produites à partir des contours officiels des départements et des
régions ([france-geojson](https://github.com/gregoiredavid/france-geojson), données IGN et INSEE, licence ouverte
Etalab). Pour les refaire, télécharger les trois fichiers GeoJSON dans un dossier, puis, avec Python 3 :

```bash
py outils/generer_images.py <dossier des contours> src/images public
```

### La version Java

Francle a d'abord été un jeu de bureau en Java ([deIbine/francle](https://github.com/deIbine/francle)). Le site
reprend ses règles et ses données : la région du jour est la même, au bit près, et les tests comparent les résultats
aux valeurs du Java (`src/domaine/reference-java.test.ts`).

## Licence

[MIT](LICENSE). Inspiré de Worldle (Copyright (c) 2022 teuteuf, licence MIT). Contours des régions : IGN et INSEE,
licence ouverte Etalab.
