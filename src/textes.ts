/*
Tous les textes de l'écran, réunis ici plutôt qu'éparpillés dans les composants. Pour l'instant en français
seulement : web.5 ajoutera l'anglais à côté, avec la même forme, sans avoir à fouiller les composants.

Les textes qui dépendent d'un nombre ou d'un nom sont des fonctions : « essais(3) » donne « 3 essais ».
 */
import type { Indice, Partie } from './domaine/partie.ts'
import type { Unite } from './reglages.ts'

// 1 mile = 1,609344 km (valeur exacte, par définition)
const KM_PAR_MILE = 1.609344

export const textes = {
  titre: 'Francle',
  numero: (n: number) => `n° ${n}`,
  sousTitre: 'Devine la région française du jour, en six essais.',
  onglets: { titre: 'Sorte de partie', jour: 'Partie du jour', libre: 'Partie libre' },

  silhouette: 'La silhouette de la région à deviner',
  silhouetteTournee: 'La silhouette de la région à deviner, tournée',
  silhouetteCachee: 'Silhouette cachée : une carte de France et un point d’interrogation',

  saisie: 'Ta proposition',
  saisieExemple: 'Une région…',
  proposer: 'Proposer',
  inconnue: 'Cette région n’existe pas, ou n’est pas dans le jeu.',
  dejaProposee: (nom: string) => `${nom} : déjà proposée.`,

  tableau: 'Tes essais',
  colonnes: { region: 'Région', distance: 'Distance', direction: 'Direction', proximite: 'Proximité' },
  // la distance, arrondie, dans l'unité choisie
  distance: (km: number, unite: Unite) =>
    unite === 'km'
      ? `${Math.round(km).toLocaleString('fr-FR')} km`
      : `${Math.round(km / KM_PAR_MILE).toLocaleString('fr-FR')} mi`,
  pourcentage: (p: number) => `${p} %`,
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
  },

  indices: 'Indices',
  aucunIndice: 'Un indice apparaît après chaque essai raté.',
  nomsIndices: {
    superficie: 'Superficie',
    specialite: 'Spécialité',
    personnalite: 'Personnalité',
    capitale: 'Capitale',
    monument: 'Monument',
  } satisfies Record<Indice, string>,
  kilometresCarres: (km2: number) => `${km2.toLocaleString('fr-FR')} km²`,

  abandonner: 'Abandonner',
  confirmerAbandon: 'Abandonner pour de bon ?',
  oui: 'Oui',
  non: 'Non',

  gagnee: (essais: number) => (essais === 1 ? 'Bravo, trouvé du premier coup !' : `Bravo, trouvé en ${essais} essais !`),
  perdue: 'Perdu, ce sera pour demain.',
  perdueLibre: 'Perdu !',
  abandonnee: 'Partie abandonnée.',
  // le message de fin, selon l'état de la partie (« ce sera pour demain » n'a de sens que pour la partie du jour)
  fin: (partie: Partie, libre = false) =>
    partie.etat === 'gagnee'
      ? textes.gagnee(partie.essais.length)
      : partie.etat === 'perdue'
        ? libre
          ? textes.perdueLibre
          : textes.perdue
        : textes.abandonnee,
  reponse: 'La réponse :',
  carte: (nom: string) => `Carte de France, la région ${nom} en bleu`,
  voirResultats: 'Voir les résultats',

  resultats: 'Résultats',
  fermer: 'Fermer',
  partager: 'Partager',
  copie: 'Résultat copié : il n’y a plus qu’à le coller.',
  copieImpossible: 'La copie a échoué. Le navigateur l’a peut-être refusée.',
  prochaine: 'Prochaine région dans',

  epoque: 'Époque',
  epoques: { nouvelles: 'Régions actuelles (depuis 2016)', anciennes: 'Anciennes régions (avant 2016)' },
  nouvellePartie: 'Nouvelle partie',

  reglages: {
    titre: 'Réglages',
    ouvrir: 'Ouvrir les réglages',
    theme: 'Thème',
    themes: { auto: 'Automatique', clair: 'Clair', sombre: 'Sombre' },
    unite: 'Distances',
    unites: { km: 'Kilomètres', mi: 'Miles' },
    modes: 'Modes difficiles',
    rotation: 'Rotation 🌀',
    rotationAide: 'La silhouette est tournée.',
    cachee: 'Image cachée 🙈',
    cacheeAide: 'Pas de silhouette : seulement les distances, les flèches et les indices.',
    plusTard: 'Ils sont fixés au premier essai : dans une partie commencée, un changement compte pour la suivante.',
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
  },
}
