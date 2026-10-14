/*
Tous les textes de l'écran, en français et en anglais, réunis ici plutôt qu'éparpillés dans les composants.

Les textes qui dépendent d'un nombre ou d'un nom sont des fonctions : « fin(partie) » donne « Bravo, trouvé en 3
essais ! ». Le type Textes est celui de l'objet français : TypeScript refuse un objet anglais auquel il manquerait un
texte, ou dont une fonction n'aurait pas les mêmes paramètres. Pas besoin de bibliothèque (Worldle utilisait
i18next) : deux langues et une centaine de textes tiennent dans un objet par langue.

En français, l'espace avant « : ; ! ? % » et après « « » est insécable (\u00a0) : sur un écran étroit, la ponctuation
ne se retrouve jamais seule en début de ligne.

Les composants n'importent pas TEXTES directement : ils appellent useTextes(), qui donne les textes de la langue
choisie (voir plus bas).
 */
import { createContext, useContext } from 'react'
import type { Direction } from './domaine/geographie.ts'
import type { Indice, Partie } from './domaine/partie.ts'
import type { Langue } from './domaine/regions.ts'
import type { Theme, Unite } from './reglages.ts'

// 1 mile = 1,609344 km (valeur exacte, par définition)
const KM_PAR_MILE = 1.609344

// les conventions d'écriture des nombres : « 1 025 » en français, « 1,025 » en anglais (britannique : on reste en
// Europe)
export const LOCALES: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB' }

function nombre(n: number, langue: Langue): string {
  return n.toLocaleString(LOCALES[langue])
}

function distance(km: number, unite: Unite, langue: Langue): string {
  // \u00a0 : une espace insécable, pour que le nombre et son unité ne soient jamais séparés en fin de ligne
  return unite === 'km'
    ? `${nombre(Math.round(km), langue)}\u00a0km`
    : `${nombre(Math.round(km / KM_PAR_MILE), langue)}\u00a0mi`
}

const fr = {
  titre: 'Francle',
  numero: (n: number) => `n°\u00a0${n}`,
  sousTitre: 'Devine la région française du jour, en six essais.',
  onglets: { titre: 'Sorte de partie', jour: 'Partie du jour', libre: 'Partie libre' },
  // le bouton de langue montre la langue vers laquelle il fait passer
  autreLangue: { court: 'EN', long: 'Switch to English' },

  silhouette: 'La silhouette de la région à deviner',
  silhouetteTournee: 'La silhouette de la région à deviner, tournée',
  silhouetteCachee: 'Silhouette cachée\u00a0: une carte de France et un point d’interrogation',

  saisie: 'Ta proposition',
  saisieExemple: 'Une région…',
  proposer: 'Proposer',
  inconnue: 'Cette région n’existe pas, ou n’est pas dans le jeu.',
  dejaProposee: (nom: string) => `${nom}\u00a0: déjà proposée.`,

  tableau: 'Tes essais',
  colonnes: { region: 'Région', distance: 'Distance', direction: 'Direction', proximite: 'Proximité' },
  // la distance, arrondie, dans l'unité choisie
  distance: (km: number, unite: Unite) => distance(km, unite, 'fr'),
  pourcentage: (p: number) => `${p}\u00a0%`,
  directions: {
    nord: 'vers le nord',
    'nord-est': 'vers le nord-est',
    est: 'vers l’est',
    'sud-est': 'vers le sud-est',
    sud: 'vers le sud',
    'sud-ouest': 'vers le sud-ouest',
    ouest: 'vers l’ouest',
    'nord-ouest': 'vers le nord-ouest',
    'sur-place': 'trouvée',
  } satisfies Record<Direction, string>,

  indices: 'Indices',
  aucunIndice: 'Un indice apparaît après chaque essai raté.',
  nomsIndices: {
    superficie: 'Superficie',
    specialite: 'Spécialité',
    personnalite: 'Personnalité',
    capitale: 'Capitale',
    monument: 'Monument',
  } satisfies Record<Indice, string>,
  kilometresCarres: (km2: number) => `${nombre(km2, 'fr')}\u00a0km²`,

  abandonner: 'Abandonner',
  confirmerAbandon: 'Abandonner pour de bon\u00a0?',
  oui: 'Oui',
  non: 'Non',

  // le message de fin, selon l'état de la partie (« ce sera pour demain » n'a de sens que pour la partie du jour)
  fin: (partie: Partie, libre = false) =>
    partie.etat === 'gagnee'
      ? partie.essais.length === 1
        ? 'Bravo, trouvé du premier coup\u00a0!'
        : `Bravo, trouvé en ${partie.essais.length} essais\u00a0!`
      : partie.etat === 'perdue'
        ? libre
          ? 'Perdu\u00a0!'
          : 'Perdu, ce sera pour demain.'
        : 'Partie abandonnée.',
  reponse: 'La réponse\u00a0:',
  carte: (nom: string) => `Carte de France, la région ${nom} en bleu`,
  voirResultats: 'Voir les résultats',

  resultats: 'Résultats',
  fermer: 'Fermer',
  partager: 'Partager',
  copie: 'Résultat copié\u00a0: il n’y a plus qu’à le coller.',
  copieImpossible: 'La copie a échoué. Le navigateur l’a peut-être refusée.',
  prochaine: 'Prochaine région dans',

  epoque: 'Époque',
  epoques: { nouvelles: 'Régions actuelles (depuis 2016)', anciennes: 'Anciennes régions (avant 2016)' },
  nouvellePartie: 'Nouvelle partie',

  stats: {
    titre: 'Statistiques',
    ouvrir: 'Voir les statistiques',
    jouees: 'Parties',
    victoires: 'Victoires',
    serie: 'Série en cours',
    meilleureSerie: 'Meilleure série',
    repartition: 'Victoires par nombre d’essais',
    barre: (essais: number, nombre: number) =>
      `${nombre} victoire${nombre > 1 ? 's' : ''} en ${essais} essai${essais > 1 ? 's' : ''}`,
  },

  aide: {
    titre: 'Comment jouer',
    ouvrir: 'Comment jouer',
    but: 'Devine la région française à partir de sa silhouette, en six essais au plus.',
    apres: 'Après chaque essai, tu vois\u00a0:',
    distance: 'la distance entre les capitales des deux régions\u00a0;',
    direction: 'la direction à suivre pour aller vers la région à deviner\u00a0;',
    proximite: 'la proximité\u00a0: 100\u00a0% pour la bonne région, 0\u00a0% pour la plus éloignée.',
    exemple: (nom: string, distance: string, fleche: string, proximite: string) =>
      `Par exemple, «\u00a0${nom} · ${distance} · ${fleche} · ${proximite}\u00a0»\u00a0: la région à deviner est à ${distance}, dans cette direction.`,
    indices: 'Après chaque essai raté, un indice apparaît\u00a0: la superficie, une spécialité, une personnalité, la capitale, puis un monument.',
    jour: 'La partie du jour est la même pour tout le monde, et change à minuit. Partage ton résultat\u00a0: il ne dévoile pas la réponse.',
    libre: 'En partie libre, joue autant que tu veux, avec les régions actuelles ou celles d’avant 2016.',
    modes: 'Dans les réglages ⚙️, essaie les modes difficiles\u00a0: la silhouette tournée 🌀, ou cachée 🙈.',
    jouer: 'Jouer',
  },

  credits: {
    contours: 'Contours des régions\u00a0: IGN et INSEE',
    licence: 'licence ouverte Etalab',
    inspiration: 'Inspiré de Worldle',
    code: 'Code source',
    vie: 'Aucune donnée collectée\u00a0: tout reste dans ton navigateur.',
  },

  reglages: {
    titre: 'Réglages',
    ouvrir: 'Ouvrir les réglages',
    langue: 'Langue',
    langues: { fr: 'Français', en: 'English' } satisfies Record<Langue, string>,
    theme: 'Thème',
    themes: { auto: 'Automatique', clair: 'Clair', sombre: 'Sombre' } satisfies Record<Theme, string>,
    unite: 'Distances',
    unites: { km: 'Kilomètres', mi: 'Miles' } satisfies Record<Unite, string>,
    modes: 'Modes difficiles',
    rotation: 'Rotation 🌀',
    rotationAide: 'La silhouette est tournée.',
    cachee: 'Image cachée 🙈',
    cacheeAide: 'Pas de silhouette\u00a0: seulement les distances, les flèches et les indices.',
    plusTard: 'Ils sont fixés au premier essai\u00a0: dans une partie commencée, un changement compte pour la suivante.',
  },
}

export type Textes = typeof fr

const en: Textes = {
  titre: 'Francle',
  numero: (n: number) => `#${n}`,
  sousTitre: 'Guess the French region of the day, in six tries.',
  onglets: { titre: 'Kind of game', jour: 'Daily game', libre: 'Free play' },
  autreLangue: { court: 'FR', long: 'Passer en français' },

  silhouette: 'The outline of the region to guess',
  silhouetteTournee: 'The outline of the region to guess, rotated',
  silhouetteCachee: 'Outline hidden: a map of France and a question mark',

  saisie: 'Your guess',
  saisieExemple: 'A region…',
  proposer: 'Guess',
  inconnue: 'This region doesn’t exist, or isn’t in the game.',
  dejaProposee: (nom: string) => `${nom}: already guessed.`,

  tableau: 'Your guesses',
  colonnes: { region: 'Region', distance: 'Distance', direction: 'Direction', proximite: 'Proximity' },
  distance: (km: number, unite: Unite) => distance(km, unite, 'en'),
  pourcentage: (p: number) => `${p}%`,
  directions: {
    nord: 'north',
    'nord-est': 'north-east',
    est: 'east',
    'sud-est': 'south-east',
    sud: 'south',
    'sud-ouest': 'south-west',
    ouest: 'west',
    'nord-ouest': 'north-west',
    'sur-place': 'found',
  },

  indices: 'Clues',
  aucunIndice: 'A clue appears after each wrong guess.',
  nomsIndices: {
    superficie: 'Area',
    specialite: 'Speciality',
    personnalite: 'Famous person',
    capitale: 'Capital',
    monument: 'Landmark',
  },
  kilometresCarres: (km2: number) => `${nombre(km2, 'en')}\u00a0km²`,

  abandonner: 'Give up',
  confirmerAbandon: 'Give up for good?',
  oui: 'Yes',
  non: 'No',

  fin: (partie: Partie, libre = false) =>
    partie.etat === 'gagnee'
      ? partie.essais.length === 1
        ? 'Well done, first try!'
        : `Well done, found in ${partie.essais.length} tries!`
      : partie.etat === 'perdue'
        ? libre
          ? 'Lost!'
          : 'Lost. Try again tomorrow.'
        : 'Game abandoned.',
  reponse: 'The answer:',
  carte: (nom: string) => `Map of France, the region ${nom} in blue`,
  voirResultats: 'See results',

  resultats: 'Results',
  fermer: 'Close',
  partager: 'Share',
  copie: 'Result copied: just paste it.',
  copieImpossible: 'Copying failed. The browser may have refused it.',
  prochaine: 'Next region in',

  epoque: 'Era',
  epoques: { nouvelles: 'Current regions (since 2016)', anciennes: 'Former regions (before 2016)' },
  nouvellePartie: 'New game',

  stats: {
    titre: 'Statistics',
    ouvrir: 'See statistics',
    jouees: 'Played',
    victoires: 'Wins',
    serie: 'Current streak',
    meilleureSerie: 'Best streak',
    repartition: 'Wins by number of tries',
    barre: (essais: number, nombre: number) =>
      `${nombre} win${nombre === 1 ? '' : 's'} in ${essais} ${essais === 1 ? 'try' : 'tries'}`,
  },

  aide: {
    titre: 'How to play',
    ouvrir: 'How to play',
    but: 'Guess the French region from its outline, in six tries at most.',
    apres: 'After each guess, you see:',
    distance: 'the distance between the capitals of the two regions;',
    direction: 'the direction to go to reach the region to guess;',
    proximite: 'the proximity: 100% for the right region, 0% for the farthest one.',
    exemple: (nom: string, distance: string, fleche: string, proximite: string) =>
      `For example, “${nom} · ${distance} · ${fleche} · ${proximite}”: the region to guess is ${distance} away, in that direction.`,
    indices: 'After each wrong guess, a clue appears: the area, a speciality, a famous person, the capital, then a landmark.',
    jour: 'The daily game is the same for everyone, and changes at midnight. Share your result: it doesn’t give the answer away.',
    libre: 'In free play, play as much as you like, with the current regions or those from before 2016.',
    modes: 'In the settings ⚙️, try the hard modes: the outline rotated 🌀, or hidden 🙈.',
    jouer: 'Play',
  },

  credits: {
    contours: 'Region outlines: IGN and INSEE',
    licence: 'Etalab open licence',
    inspiration: 'Inspired by Worldle',
    code: 'Source code',
    vie: 'No data collected: everything stays in your browser.',
  },

  reglages: {
    titre: 'Settings',
    ouvrir: 'Open settings',
    langue: 'Language',
    langues: { fr: 'Français', en: 'English' },
    theme: 'Theme',
    themes: { auto: 'Automatic', clair: 'Light', sombre: 'Dark' },
    unite: 'Distances',
    unites: { km: 'Kilometres', mi: 'Miles' },
    modes: 'Hard modes',
    rotation: 'Rotation 🌀',
    rotationAide: 'The outline is rotated.',
    cachee: 'Hidden image 🙈',
    cacheeAide: 'No outline: only distances, arrows and clues.',
    plusTard: 'They are set at the first guess: in a game already started, a change applies to the next one.',
  },
}

export const TEXTES: Record<Langue, Textes> = { fr, en }

// La langue choisie, transmise à tous les composants sans la passer de parent en enfant : un « contexte » React.
// App le fournit (<LangueContext value={…}>) ; n'importe quel composant en dessous le lit avec useContext.
// En Java, ce serait un peu comme une valeur ThreadLocal, mais liée à l'arbre des composants
export const LangueContext = createContext<Langue>('fr')

export function useLangue(): Langue {
  return useContext(LangueContext)
}

export function useTextes(): Textes {
  return TEXTES[useLangue()]
}
