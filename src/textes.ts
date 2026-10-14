/*
Tous les textes de l'écran, réunis ici plutôt qu'éparpillés dans les composants. Pour l'instant en français
seulement : web.5 ajoutera l'anglais à côté, avec la même forme, sans avoir à fouiller les composants.

Les textes qui dépendent d'un nombre ou d'un nom sont des fonctions : « essais(3) » donne « 3 essais ».
 */
import type { Indice, Partie } from './domaine/partie.ts'

export const textes = {
  titre: 'Francle',
  numero: (n: number) => `n° ${n}`,
  sousTitre: 'Devine la région française du jour, en six essais.',

  silhouette: 'La silhouette de la région à deviner',

  saisie: 'Ta proposition',
  saisieExemple: 'Une région…',
  proposer: 'Proposer',
  inconnue: 'Cette région n’existe pas, ou n’est pas dans le jeu.',
  dejaProposee: (nom: string) => `${nom} : déjà proposée.`,

  tableau: 'Tes essais',
  colonnes: { region: 'Région', distance: 'Distance', direction: 'Direction', proximite: 'Proximité' },
  kilometres: (km: number) => `${km.toLocaleString('fr-FR')} km`,
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
  abandonnee: 'Partie abandonnée.',
  // le message de fin, selon l'état de la partie
  fin: (partie: Partie) =>
    partie.etat === 'gagnee'
      ? textes.gagnee(partie.essais.length)
      : partie.etat === 'perdue'
        ? textes.perdue
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
