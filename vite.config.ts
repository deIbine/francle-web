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
  test: {
    // Un faux navigateur (jsdom) pour pouvoir afficher les composants React pendant les tests.
    environment: 'jsdom',
    setupFiles: ['src/preparationTests.ts'],
    // Un test d'écran affiche tout le jeu et y tape lettre par lettre : quand la machine est chargée (les fichiers de
    // test tournent en parallèle), il dépasse parfois les 5 s du délai par défaut, et échouait une fois sur cinq.
    // 15 s laissent plus du double de marge (6,9 s au pire, mesuré avec deux suites lancées en même temps).
    testTimeout: 15_000,
  },
})
