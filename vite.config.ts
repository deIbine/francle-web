/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Le site est servi sous https://deibine.github.io/francle-web/ : tous les liens doivent commencer par ce chemin.
  base: '/francle-web/',
  plugins: [react()],
  test: {
    // Un faux navigateur (jsdom) pour pouvoir afficher les composants React pendant les tests.
    environment: 'jsdom',
  },
})
