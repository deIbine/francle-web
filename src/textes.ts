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
import { score, total, type Bonus } from './domaine/bonus.ts'
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

// des noms en une phrase, par ordre alphabétique : « Alsace, Champagne-Ardenne et Lorraine » en français,
// « Alsace, Champagne-Ardenne and Lorraine » en anglais britannique. Intl.ListFormat connaît le « et » de chaque
// langue, comme Intl.Collator son ordre alphabétique
function enumeration(noms: readonly string[], langue: Langue): string {
  const ordre = new Intl.Collator(langue, { ignorePunctuation: true })
  return new Intl.ListFormat(LOCALES[langue], { type: 'conjunction' }).format(noms.toSorted(ordre.compare))
}

// « de la Guadeloupe », « de La Réunion » : l'article de chaque département d'outre-mer, pour la question du numéro
// (les noms des données n'en ont pas). Les seuls départements à qui on la pose : ceux des régions d'un seul département
const DE_OUTRE_MER: Readonly<Record<string, string>> = {
  '971': 'de la Guadeloupe',
  '972': 'de la Martinique',
  '973': 'de la Guyane',
  '974': 'de La Réunion',
  '976': 'de Mayotte',
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
  plusieurs: 'Plusieurs régions possibles\u00a0: choisis dans la liste.',
  // une région de l'autre époque, refusée sans coûter d'essai. Sans article : les régions n'en ont pas dans les
  // données (« Alsace », pas « l'Alsace »)
  ancienneRegion: (nom: string, nouvelle: string) =>
    `${nom}\u00a0: une ancienne région (avant 2016), aujourd’hui dans la région ${nouvelle}.`,
  // anciennes : une seule quand la région a seulement changé de nom (Centre -> Centre-Val de Loire)
  nouvelleRegion: (nom: string, anciennes: readonly string[]) =>
    anciennes.length === 1
      ? `${nom}\u00a0: une région d’après 2016, appelée ${anciennes[0]} avant 2016.`
      : `${nom}\u00a0: une région d’après 2016, qui regroupe ${enumeration(anciennes, 'fr')}.`,
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
  confirmerEpoque: 'Changer d’époque\u00a0? La partie en cours sera perdue.',
  epoques: { nouvelles: 'Régions actuelles (depuis 2016)', anciennes: 'Anciennes régions (avant 2016)' },
  nouvellePartie: 'Nouvelle partie',

  liste: {
    titre: 'Liste des régions',
    ouvrir: 'Voir la liste des régions',
    aide: 'Clique sur une région pour la proposer.',
    finie: 'La partie est finie.',
    dejaProposee: 'déjà proposée',
    // pendant le bonus (mode C), la liste des 101 départements : un clic répond pour le département choisi
    departements: {
      titre: 'Liste des départements',
      ouvrir: 'Voir la liste des départements',
      aide: 'Clique sur le nom du département choisi sur la carte.',
      sansChoix: 'Clique d’abord sur un département de la carte.',
      finie: 'Le bonus est fini.',
      dejaRepondu: 'déjà répondu',
    },
  },

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
    bonus: 'Bonus des départements',
    bonusJoues: 'Bonus joués',
    scoreMoyenBonus: 'Score moyen',
    pourcentage: (p: number) => `${p}\u00a0%`,
  },

  bonus: {
    titre: 'Bonus\u00a0: les départements',
    jouer: '🗺️ Jouer le bonus',
    // la question, selon sa sorte (voir domaine/bonus.ts)
    carte: (nom: string) => `Clique sur\u00a0: ${nom}`,
    choisir: 'Clique sur un département de la carte',
    choix: 'Quel est ce département\u00a0?',
    nom: 'Quel est ce département, en bleu foncé\u00a0?',
    // sans article connu (ce qui n'arrive pas), la tournure d'avant
    numero: (nom: string, code: string) => `Quel est le numéro ${DE_OUTRE_MER[code] ?? `de\u00a0: ${nom}`}\u00a0?`,
    avancement: (rang: number, total: number) => `Département ${rang} sur ${total}`,
    // mode C : le nombre de réponses déjà données
    reponses: (nombre: number, total: number) => `${nombre} réponse${nombre > 1 ? 's' : ''} sur ${total}`,
    // « Finistère (29) »
    departement: (nom: string, code: string) => `${nom} (${code})`,
    juste: (demande: string) => `Juste\u00a0: ${demande}.`,
    faux: (demande: string, donne: string) => `Raté\u00a0: c’était ${demande}, en rouge sur la carte (ta réponse\u00a0: ${donne}).`,
    // la carte et ses zones : pendant le bonus, un lecteur d'écran ne doit pas lire les noms (ce serait la réponse)
    carteRegion: 'Carte des départements de la région',
    zone: (rang: number, total: number) => `Zone ${rang} sur ${total}`,
    zoom: 'Paris et la petite couronne, agrandis',
    trouve: 'trouvé',
    manque: 'manqué',
    // « clique » : le doigt d'un téléphone n'a pas de survol (le nom s'affiche aussi au clavier)
    survol: 'Clique ou passe sur un département pour voir son nom.',
    saisie: 'Ta réponse',
    saisieExemple: 'Un nom ou un numéro…',
    saisieNumero: 'Un numéro…',
    cliqueDabord: 'Clique d’abord sur un département',
    repondre: 'Répondre',
    inconnu: 'Ce n’est pas un département.',
    plusieurs: 'Plusieurs départements possibles\u00a0: choisis dans la liste.',
    pasUnNumero: 'Écris un numéro de département, par exemple 971.',
    dejaTrouve: (nom: string) => `${nom}\u00a0: déjà trouvé ailleurs sur la carte.`,
    passer: 'Passer',
    fini: (score: number, total: number) =>
      `Bonus terminé\u00a0: ${score} département${score > 1 ? 's' : ''} trouvé${score > 1 ? 's' : ''} sur ${total}.`,
    arrete: (score: number, total: number) =>
      `Bonus arrêté\u00a0: ${score} département${score > 1 ? 's' : ''} trouvé${score > 1 ? 's' : ''} sur ${total}.`,
    chargement: 'Chargement de la carte…',
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
    bonus: 'Après une victoire, un bonus 🗺️\u00a0: clique sur chaque département de la région, puis écris son nom ou son numéro. Une seule réponse par département, et ton score s’ajoute au partage. Pendant le bonus, la liste 📃 montre les 101 départements.',
    jouer: 'Jouer',
  },

  credits: {
    contours: 'Contours des régions et des départements\u00a0: IGN et INSEE',
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
    liste: 'Liste des régions',
    listeBouton: 'Bouton 📃 dans l’en-tête',
    listeAide: 'Il ouvre la liste des régions du jeu, ou des départements pendant le bonus\u00a0: un clic sur un nom le propose.',
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
  plusieurs: 'Several regions match: pick one from the list.',
  dejaProposee: (nom: string) => `${nom}: already guessed.`,
  ancienneRegion: (nom: string, nouvelle: string) =>
    `${nom}: a former region (before 2016), now part of the ${nouvelle} region.`,
  nouvelleRegion: (nom: string, anciennes: readonly string[]) =>
    anciennes.length === 1
      ? `${nom}: a region since 2016, called ${anciennes[0]} before 2016.`
      : `${nom}: a region since 2016, which combines ${enumeration(anciennes, 'en')}.`,

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
  confirmerEpoque: 'Change era? The current game will be lost.',
  epoques: { nouvelles: 'Current regions (since 2016)', anciennes: 'Former regions (before 2016)' },
  nouvellePartie: 'New game',

  liste: {
    titre: 'List of regions',
    ouvrir: 'See the list of regions',
    aide: 'Click a region to guess it.',
    finie: 'The game is over.',
    dejaProposee: 'already guessed',
    departements: {
      titre: 'List of departments',
      ouvrir: 'See the list of departments',
      aide: 'Click the name of the department chosen on the map.',
      sansChoix: 'First click a department on the map.',
      finie: 'The bonus is over.',
      dejaRepondu: 'already answered',
    },
  },

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
    bonus: 'Departments bonus',
    bonusJoues: 'Bonuses played',
    scoreMoyenBonus: 'Average score',
    pourcentage: (p: number) => `${p}%`,
  },

  bonus: {
    titre: 'Bonus: the departments',
    jouer: '🗺️ Play the bonus',
    carte: (nom: string) => `Click on: ${nom}`,
    choisir: 'Click on a department on the map',
    choix: 'Which department is this?',
    nom: 'Which department is this, in dark blue?',
    numero: (nom: string, _code: string) => `What is the number of ${nom}?`,
    avancement: (rang: number, total: number) => `Department ${rang} of ${total}`,
    reponses: (nombre: number, total: number) => `${nombre} answer${nombre === 1 ? '' : 's'} of ${total}`,
    departement: (nom: string, code: string) => `${nom} (${code})`,
    juste: (demande: string) => `Correct: ${demande}.`,
    faux: (demande: string, donne: string) => `Wrong: it was ${demande}, in red on the map (your answer: ${donne}).`,
    carteRegion: 'Map of the region’s departments',
    zone: (rang: number, total: number) => `Area ${rang} of ${total}`,
    zoom: 'Paris and its inner suburbs, enlarged',
    trouve: 'found',
    manque: 'missed',
    survol: 'Click or hover over a department to see its name.',
    saisie: 'Your answer',
    saisieExemple: 'A name or a number…',
    saisieNumero: 'A number…',
    cliqueDabord: 'Click on a department first',
    repondre: 'Answer',
    inconnu: 'This is not a department.',
    plusieurs: 'Several departments match: pick one from the list.',
    pasUnNumero: 'Type a department number, for example 971.',
    dejaTrouve: (nom: string) => `${nom}: already found elsewhere on the map.`,
    passer: 'Skip',
    fini: (score: number, total: number) =>
      `Bonus over: ${score} department${score === 1 ? '' : 's'} found out of ${total}.`,
    arrete: (score: number, total: number) =>
      `Bonus stopped: ${score} department${score === 1 ? '' : 's'} found out of ${total}.`,
    chargement: 'Loading the map…',
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
    bonus: 'After a win, a bonus 🗺️: click on each department of the region, then type its name or number. One answer per department, and your score is added to what you share. During the bonus, the list 📃 shows the 101 departments.',
    jouer: 'Play',
  },

  credits: {
    contours: 'Region and department outlines: IGN and INSEE',
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
    liste: 'List of regions',
    listeBouton: '📃 button in the header',
    listeAide: 'It opens the list of the game’s regions, or of the departments during the bonus: click a name to guess it.',
  },
}

export const TEXTES: Record<Langue, Textes> = { fr, en }

// la phrase de fin d'un bonus fini (terminé, ou passé après au moins une réponse) : « Bonus terminé : 1 département
// trouvé sur 2. ». La même sous la carte et dans la fenêtre des résultats
export function finDuBonus(bonus: Bonus, textes: Textes): string {
  return (bonus.etat === 'termine' ? textes.bonus.fini : textes.bonus.arrete)(score(bonus), total(bonus))
}

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
