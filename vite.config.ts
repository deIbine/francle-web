/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Le site est servi sous https://deibine.github.io/francle-web/ : tous les liens doivent commencer par ce chemin.
  base: '/francle-web/',
  // tailwindcss() lit les classes écrites dans les composants et produit le CSS qui leur correspond, et lui seul
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Par défaut, un fichier ajouté au site garde son nom et y gagne une empreinte : « corse-C5fvIIqz.svg ». Pour
        // une silhouette, ce nom donne la réponse (appui long sur l'image, « Ouvrir l'image »). Les silhouettes ne
        // gardent donc que leur empreinte ; les autres fichiers restent nommés comme avant.
        assetFileNames: (fichier) =>
          fichier.originalFileNames.some((chemin) => chemin.includes('images/regions/'))
            ? 'assets/[hash][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    // Un faux navigateur (jsdom) pour pouvoir afficher les composants React pendant les tests.
    environment: 'jsdom',
    setupFiles: ['src/preparationTests.ts'],
    // Par défaut, Vitest crée un faux navigateur neuf pour chaque fichier de test (24 fois, un tiers du temps).
    // vmThreads le crée une fois par fil d'exécution, et isole chaque fichier dans son propre contexte (comme un
    // ClassLoader à part en Java) : mesuré le 18 octobre 2026, la suite passe de 40 s à 26 s, sans changer un test.
    pool: 'vmThreads',
    // Un test d'écran affiche tout le jeu et y tape lettre par lettre : quand la machine est chargée (les fichiers de
    // test tournent en parallèle), il dépasse parfois les 5 s du délai par défaut, et échouait une fois sur cinq.
    // 15 s laissent plus du double de marge (6,9 s au pire, mesuré avec deux suites lancées en même temps).
    testTimeout: 15_000,
  },
})
