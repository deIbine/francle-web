/*
Les icônes de l'en-tête (et de « Comment jouer »), dessinées en SVG depuis web.7.16.4. Avant, c'étaient des emoji
(❓ ⚙️ 📃 📊), que chaque système dessine à sa façon : ❓ rouge sous Windows, 📊 multicolore… Un SVG a la même allure
partout, et prend la couleur du texte (stroke="currentColor"), donc suit le thème clair ou sombre tout seul.

Dessinées à la main sur une grille de 24 × 24, d'un trait de 1,8 (voir la maquette, docs/maquettes/coup-de-neuf.png).
aria-hidden : le bouton qui les contient a déjà son nom (aria-label) ; l'icône n'est qu'un dessin.
 */
import type { ReactNode } from 'react'

function Icone({ children, className = 'size-6' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

// un point d'interrogation dans un cercle : « Comment jouer »
export function IconeAide({ className }: { className?: string }) {
  return (
    <Icone className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4" />
      <circle cx="12" cy="17.6" r="0.6" fill="currentColor" stroke="none" />
    </Icone>
  )
}

// deux curseurs : les réglages
export function IconeReglages({ className }: { className?: string }) {
  return (
    <Icone className={className}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </Icone>
  )
}

// un hexagone (la France) avec trois lignes de texte : la liste des régions (ou des départements). Depuis web.7.17 ;
// avant, trois lignes à puces, qu'on confondait avec le menu « hamburger » des sites (☰)
export function IconeListe({ className }: { className?: string }) {
  return (
    <Icone className={className}>
      <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" />
      <path d="M8.5 9.5h7M8.5 12h7M8.5 14.5h4.5" />
    </Icone>
  )
}

// trois barres : les statistiques
export function IconeStats({ className }: { className?: string }) {
  return (
    <Icone className={className}>
      <path d="M5 20V11M12 20V4M19 20v-6" />
    </Icone>
  )
}
