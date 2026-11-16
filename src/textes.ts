/*
Tous les textes de l'écran, en français et en anglais, réunis ici plutôt qu'éparpillés dans les composants.

Les textes qui dépendent d'un nombre ou d'un nom sont des fonctions : « resultat(partie, 'Bretagne') » donne
« 🎉 Bretagne, trouvée en 3 essais ». Le type Textes est celui de l'objet français : TypeScript refuse un objet
anglais auquel il manquerait un texte, ou dont une fonction n'aurait pas les mêmes paramètres. Pas besoin de bibliothèque (Worldle utilisait
i18next) : deux langues et une centaine de textes tiennent dans un objet par langue.

En français, l'espace avant « : ; ! ? % » et après « « » est insécable (\u00a0) : sur un écran étroit, la ponctuation
ne se retrouve jamais seule en début de ligne.

Les composants n'importent pas TEXTES directement : ils appellent useTextes(), qui donne les textes de la langue
choisie (voir plus bas).
 */
import { createContext, useContext } from 'react'
import type { ErreurProfil } from './profil.ts'
import type { ErreurLigue } from './ligue.ts'
import { score, total, type Bonus } from './domaine/bonus.ts'
import type { EtatCase } from './domaine/calendrier.ts'
import type { Direction } from './domaine/geographie.ts'
import type { Indice, Partie } from './domaine/partie.ts'
import type { Langue } from './domaine/regions.ts'
import type { Theme, Unite } from './reglages.ts'

// un essai tel que la carte de fin le décrit : son numéro, le nom de la région proposée, sa proximité
export interface EssaiCarte {
  readonly numero: number
  readonly nom: string
  readonly proximite: number
}

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

// une superficie, dans l'unité des distances (depuis web.7.18) : km², ou mi² avec les miles. Un mile carré vaut
// 1,609344² km², soit environ 2,59 km²
function superficie(km2: number, unite: Unite, langue: Langue): string {
  return unite === 'km'
    ? `${nombre(km2, langue)}\u00a0km²`
    : `${nombre(Math.round(km2 / KM_PAR_MILE ** 2), langue)}\u00a0mi²`
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
  sousTitreLibre: 'Devine une région française tirée au hasard, en six essais.',
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
  // la superficie, dans l'unité des distances (km² ou mi²)
  superficie: (km2: number, unite: Unite) => superficie(km2, unite, 'fr'),

  abandonner: 'Abandonner',
  confirmerAbandon: 'Abandonner pour de bon\u00a0?',
  oui: 'Oui',
  non: 'Non',

  // le résultat de la partie finie, la même phrase dans le bilan sous le plateau et dans la fenêtre des résultats
  // (depuis web.7.19 : la fenêtre disait « Bravo, trouvé en 4 essais ! » quand le bilan disait « 🎉 …, trouvée en 4
  // essais »). « Ce sera pour demain » n'a de sens que pour la partie du jour
  resultat: (partie: Partie, nom: string, libre = false) =>
    partie.etat === 'gagnee'
      ? partie.essais.length === 1
        ? `🎉 ${nom}, trouvée du premier coup`
        : // \u00a0 : « essais » ne tombe jamais seul sur la ligne suivante, loin de son nombre
          `🎉 ${nom}, trouvée en ${partie.essais.length}\u00a0essais`
      : (partie.etat === 'perdue' ? (libre ? 'Perdu\u00a0!' : 'Perdu, ce sera pour demain.') : 'Partie abandonnée.') +
        ` La réponse\u00a0: ${nom}`,
  // le bilan sous le plateau, une fois la partie finie (depuis web.7.16.4) : un seul bloc, au lieu de phrases répétées
  bilan: { titre: 'Résumé de la partie' },
  // la carte de fin, pour un lecteur d'écran : la réponse, puis chaque essai avec son numéro et sa proximité
  carte: (nom: string, essais: readonly EssaiCarte[]) =>
    `Carte de France, la région ${nom} en bleu` +
    (essais.length === 0
      ? ''
      : `. Tes essais : ${essais.map((e) => `${e.numero} ${e.nom}, ${e.proximite} %`).join(' ; ')}`),
  legende: { proximite: 'Proximité', reponse: 'la réponse' },
  voirResultats: 'Voir les résultats',

  resultats: 'Résultats',
  fermer: 'Fermer',
  partager: 'Partager',
  // depuis web.9.1.3 : le lien de comparaison, envoyé depuis les statistiques, ouvert dans sa fenêtre
  comparaison: {
    titre: 'Comparaison',
    envoyerTitre: 'Se comparer à un ami',
    envoyerAide:
      'Envoie ton bilan par un lien : ton ami verra vos deux bilans côte à côte. Il contient le résultat de chacune de tes parties, pas tes réponses.',
    envoyer: 'Envoyer mon bilan 🤝',
    message: (adresse: string) => `Compare ton Francle au mien : ${adresse}`,
    copie: 'Lien copié : il n’y a plus qu’à le coller.',
    illisible:
      'Ce lien de comparaison est illisible : il a peut-être été coupé en route. Demande à ton ami de le renvoyer.',
    duLien: (date: string) => `Le bilan de ton ami, envoyé le ${date}.`,
    tableau: 'Ton bilan et celui de ton ami',
    statistique: 'Statistique',
    toi: 'Toi',
    ami: 'Ton ami',
    meilleur: '(meilleur)',
    pointsMois: 'Points ce mois-ci',
    moyenneMois: 'Moyenne ce mois-ci',
    pointsToujours: 'Points depuis toujours',
    moyenneToujours: 'Moyenne depuis toujours',
    bonus: 'Bonus : score moyen',
    faceAFace: (jours: number, toi: number, ami: number, egalites: number) =>
      jours === 0
        ? 'Vous n’avez encore fini aucune partie le même jour.'
        : `Sur ${jours === 1 ? 'le jour joué' : `les ${jours} jours joués`} par vous deux : ` +
          `${toi} pour toi, ${ami} pour ton ami, ${egalites} égalité${egalites > 1 ? 's' : ''}.`,
    retour: 'Envoie-lui le tien en retour :',
  },
  copie: 'Résultat copié\u00a0: il n’y a plus qu’à le coller.',
  copieImpossible: 'La copie a échoué. Le navigateur l’a peut-être refusée.',
  prochaine: 'Prochaine région dans',

  epoque: 'Époque',
  confirmerEpoque: 'Changer d’époque\u00a0? La partie en cours sera perdue.',
  // pendant le bonus, la partie est gagnée : c'est le bonus qui serait perdu (depuis web.7.18)
  confirmerEpoqueBonus: 'Changer d’époque\u00a0? Le bonus en cours sera perdu.',
  epoques: { nouvelles: 'Régions actuelles (depuis 2016)', anciennes: 'Anciennes régions (avant 2016)' },
  nouvellePartie: 'Nouvelle partie',

  liste: {
    titre: 'Liste des régions',
    ouvrir: 'Voir la liste des régions',
    // le bouton grisé (bonus sans liste) : pourquoi il ne s'ouvre pas (depuis web.7.19)
    aucune: 'Pas de liste pour cette question',
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
    // depuis web.9.1.2 : les onglets de la fenêtre, le score Francle, les détails et le calendrier
    onglets: 'Les statistiques',
    resume: 'Résumé',
    details: 'Détails',
    calendrier: 'Calendrier',
    score: 'Score Francle',
    scoreAide:
      'Jusqu’à 10 points par partie du jour : 6 pour une région trouvée du premier coup… 1 au sixième essai, jusqu’à 2 pour le bonus, 1 par mode difficile.',
    scoreDuJour: (points: number) => `Partie du jour : ${points}/10 points`,
    moisEnCours: 'Ce mois-ci',
    depuisToujours: 'Depuis toujours',
    points: (points: number) => `${points} point${points > 1 ? 's' : ''}`,
    moyenne: (moyenne: string, parties: number) =>
      `moyenne ${moyenne} sur ${parties} partie${parties > 1 ? 's' : ''}`,
    essaisMoyens: 'Essais par victoire',
    meilleurMois: 'Meilleur mois',
    journeesParfaites: 'Parties à 10 points',
    records: 'Records',
    mieuxTrouvees: 'Les régions les mieux trouvées',
    moinsBienTrouvees: 'Les moins bien trouvées',
    // essais : les essais moyens, et leur écriture dans la langue (« 1,5 ») ; en français, le pluriel commence à 2
    bilanRegion: (victoires: number, parties: number, essais: number | undefined, ecrit: string) =>
      `${victoires} sur ${parties}` +
      (essais === undefined ? '' : ` · ${ecrit} essai${essais >= 2 ? 's' : ''}`),
    modes: 'Modes difficiles',
    rotation: '🌀 Silhouette tournée',
    cachee: '🙈 Silhouette cachée',
    bilanMode: (victoires: number, jouees: number) =>
      jouees === 0 ? 'jamais joué' : `${victoires} victoire${victoires > 1 ? 's' : ''} sur ${jouees}`,
    aucunePartie: 'Aucune partie finie pour l’instant.',
    moisPrecedent: 'Mois précédent',
    moisSuivant: 'Mois suivant',
    legendeGagnee: 'trouvée (essais)',
    legendePerdue: 'manquée',
    legendeAbsente: 'pas jouée',
    // le nom d'une case du calendrier, pour un lecteur d'écran : « 13 novembre : trouvée en 3 essais, 6 points »
    caseCalendrier: (date: string, etat: EtatCase, essais: number, points: number) =>
      `${date} : ` +
      {
        gagnee: `trouvée en ${essais} essai${essais > 1 ? 's' : ''}, ${points} point${points > 1 ? 's' : ''}`,
        manquee: 'manquée, 0 point',
        'en-cours': 'en cours',
        absente: 'pas jouée',
      }[etat],
    // le score moyen tant qu'aucun bonus n'a été joué : « 0 % » laisserait croire à un score nul
    aucunScore: '–',
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
    // une région d'un seul département (l'outre-mer) : toute la carte est en rouge, inutile de le dire (depuis web.7.22)
    fauxSeul: (demande: string, donne: string) => `Raté\u00a0: c’était ${demande} (ta réponse\u00a0: ${donne}).`,
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
    // court : il doit tenir dans le champ sur un téléphone de 375 pixels (« …sur un département » était coupé)
    cliqueDabord: 'Clique d’abord sur la carte',
    repondre: 'Répondre',
    inconnu: 'Ce n’est pas un département.',
    plusieurs: 'Plusieurs départements possibles\u00a0: choisis dans la liste.',
    pasUnNumero: 'Écris un numéro de département, par exemple 971.',
    dejaTrouve: (nom: string) => `${nom}\u00a0: déjà trouvé ailleurs sur la carte.`,
    // version simple : un département d'une autre région est refusé, sans coûter de réponse
    autreRegion: (nom: string) => `${nom}\u00a0: ce département n’est pas dans la région.`,
    passer: 'Passer',
    // après au moins une réponse, « Passer » clôt le bonus : on demande d'abord (depuis web.7.20)
    confirmerPasser: 'Arrêter le bonus pour de bon\u00a0? Ton score sera gardé tel quel.',
    fini: (score: number, total: number) =>
      `Bonus terminé\u00a0: ${score} département${score > 1 ? 's' : ''} trouvé${score > 1 ? 's' : ''} sur ${total}.`,
    arrete: (score: number, total: number) =>
      `Bonus arrêté\u00a0: ${score} département${score > 1 ? 's' : ''} trouvé${score > 1 ? 's' : ''} sur ${total}.`,
    chargement: 'Chargement de la carte…',
    // le téléchargement des contours a échoué (plus de réseau, ou une nouvelle version du site entre-temps)
    echec: 'Impossible de charger la carte.',
    reessayer: 'Réessayer',
  },

  aide: {
    titre: 'Comment jouer',
    ouvrir: 'Comment jouer',
    but: 'Devine la région française à partir de sa silhouette, en six essais au plus.',
    // l'exemple : une vraie ligne du tableau, puis ce que veut dire chaque colonne (depuis web.7.16.4)
    exemple: (nom: string) => `Par exemple, si tu proposes «\u00a0${nom}\u00a0»\u00a0:`,
    tableauExemple: 'Un exemple d’essai',
    colonnes: {
      distance: 'la distance entre les capitales',
      direction: 'la direction à suivre',
      proximite: 'la proximité (100\u00a0%\u00a0: trouvé)',
    },
    indices: 'Après chaque essai raté, un indice\u00a0: la superficie, une spécialité, une personnalité, la capitale, puis un monument.',
    bonus: 'Gagné\u00a0? Un bonus\u00a0: nomme chaque département de la région (la liste les montre aussi). Ton score s’ajoute au partage.',
    jour: 'La partie du jour est la même pour tout le monde, et change à minuit\u00a0; partager ton résultat ne dévoile pas la réponse. En partie libre, joue autant que tu veux, avec les régions actuelles ou celles d’avant 2016.',
    modes: 'Dans les réglages, essaie les modes difficiles\u00a0: la silhouette tournée 🌀, ou cachée 🙈.',
    jouer: 'Jouer',
  },

  // depuis web.9.2.2 : les chiffres de tous les joueurs du jour, dans la fenêtre des résultats
  tous: {
    titre: 'Les joueurs du jour',
    resume: (joueurs: number, taux: number) =>
      `${joueurs.toLocaleString('fr-FR')} joueur${joueurs > 1 ? 's' : ''} aujourd’hui · ${taux} % ${joueurs > 1 ? 'ont' : 'a'} trouvé`,
    mieuxQue: (pourcentage: number, points: number) =>
      `Avec ${points} point${points > 1 ? 's' : ''}, tu fais mieux que ${pourcentage} % des joueurs.`,
    repartition: 'Victoires de tous par nombre d’essais',
    barre: (essais: number, pourcentage: number, toi: boolean) =>
      `${pourcentage} % des victoires en ${essais} essai${essais > 1 ? 's' : ''}${toi ? ', comme toi' : ''}`,
  },

  // depuis web.9.3.1 : le profil (pseudo et code secret), dans les réglages
  profil: {
    titre: 'Profil',
    intro: 'Un pseudo pour les ligues entre amis et le classement public. Ni e-mail, ni mot de passe.',
    public: 'Ton pseudo sera visible par tous, dans le classement public.',
    pseudo: 'Ton pseudo',
    creer: 'Créer mon profil',
    patience: 'Un instant…',
    erreurs: {
      pris: 'Ce pseudo est déjà pris.',
      longueur: 'De 3 à 20 caractères, dont au moins 3 lettres ou chiffres.',
      caracteres: 'Seulement des lettres, des chiffres, des espaces et - _ . ’',
      mot: 'Ce pseudo n’est pas accepté. Essaie une autre orthographe.',
      'secours-inconnu': 'Ce code de secours ne correspond à aucun profil.',
      reseau: 'Le serveur ne répond pas. Réessaie plus tard.',
    } satisfies Record<ErreurProfil, string>,
    secoursTitre: 'Ton code de secours',
    secoursAide:
      'Note-le maintenant\u00a0: il n’est montré qu’une fois. Si les données de ton navigateur sont effacées, il te permettra de retrouver ton profil.',
    copier: 'Copier',
    copie: 'Copié',
    note: 'C’est noté',
    aiSecours: 'J’ai un code de secours',
    codeSecours: 'Code de secours',
    retrouver: 'Retrouver mon profil',
    annuler: 'Annuler',
    connecte: (pseudo: string) => `Ton pseudo\u00a0: ${pseudo}`,
    supprimer: 'Supprimer mon profil',
    confirmer: 'Supprimer ton profil, tes parties envoyées et ta place dans la ligue\u00a0? C’est définitif.',
    oui: 'Oui, supprimer',
    non: 'Non',
    erreurSuppression: 'La suppression a échoué\u00a0: le serveur ne répond pas.',
    perdu: (pseudo: string) =>
      `Ton profil «\u00a0${pseudo}\u00a0» n’est plus reconnu sur cet appareil\u00a0: il a été effacé, ou repris ailleurs. Avec ton code de secours, tu peux le retrouver ici.`,
  },

  // depuis web.9.3.2 : la ligue, dans l'onglet « Classement » des statistiques, et la fenêtre d'invitation
  ligue: {
    onglet: 'Classement',
    sansProfil: 'Crée ton profil dans les réglages (⚙️) pour jouer en ligue entre amis.',
    chargement: 'Chargement…',
    injoignable: 'Le serveur ne répond pas. Réessaie plus tard.',
    sansLigue:
      'Tu n’es dans aucune ligue. Crée la tienne et invite tes amis, ou rejoins celle d’un ami avec son code.',
    nom: 'Nom de la ligue',
    creer: 'Créer la ligue',
    code: 'Code de la ligue',
    rejoindre: 'Rejoindre',
    erreurs: {
      'ligue-inconnue': 'Aucune ligue n’a ce code.',
      'ligue-pleine': 'Cette ligue est pleine.',
      longueur: 'De 3 à 30 caractères, dont au moins 3 lettres ou chiffres.',
      caracteres: 'Seulement des lettres, des chiffres, des espaces et - _ . ’',
      mot: 'Ce nom n’est pas accepté. Essaie une autre orthographe.',
      reseau: 'Le serveur ne répond pas. Réessaie plus tard.',
    } satisfies Record<ErreurLigue, string>,
    tableau: (nom: string, mois: string) => `Classement de «\u00a0${nom}\u00a0», ${mois}`,
    rang: 'Rang',
    joueur: 'Joueur',
    points: 'Points',
    toi: '(toi)',
    // sous le pseudo, en petit (depuis web.9.3.4, plus de colonne à part : le mot « moyenne » dit ce qu'est ce nombre)
    detail: (moyenne: string, parties: number) => `moyenne ${moyenne} · ${parties}\u00a0partie${parties > 1 ? 's' : ''}`,
    inviter: 'Inviter des amis',
    codeLigue: (code: string) => `Code\u00a0: ${code}`,
    envoyerLien: 'Envoyer le lien 🔗',
    lienCopie: 'Lien copié\u00a0: envoie-le à tes amis.',
    invitationTexte: (nom: string, lien: string) => `Rejoins ma ligue Francle «\u00a0${nom}\u00a0»\u00a0: ${lien}`,
    membres: 'Membres',
    createur: '(créateur)',
    retirer: (pseudo: string) => `Retirer ${pseudo}`,
    changerCode: 'Changer le code',
    changerCodeAide: 'L’ancien code et l’ancien lien ne marcheront plus.',
    quitter: 'Quitter la ligue',
    confirmerQuitter: (nom: string) =>
      `Quitter «\u00a0${nom}\u00a0»\u00a0? Tes points restent à toi, mais tu n’apparaîtras plus dans son classement.`,
    oui: 'Oui, quitter',
    non: 'Non',
    invitation: {
      titre: 'Rejoindre une ligue',
      apercu: (nom: string, membres: number) => `«\u00a0${nom}\u00a0», ${membres}\u00a0membre${membres > 1 ? 's' : ''}`,
      inconnue: 'Ce lien ne correspond à aucune ligue (son code a peut-être changé).',
      creerProfil: 'Pour la rejoindre, crée d’abord ton profil\u00a0:',
      deja: 'Tu es déjà dans cette ligue.',
      quitteras: (nom: string) => `Tu quitteras ta ligue actuelle, «\u00a0${nom}\u00a0» (une seule ligue à la fois).`,
      rejoindre: 'Rejoindre la ligue',
      bienvenue: (nom: string) =>
        `Bienvenue dans «\u00a0${nom}\u00a0»\u00a0! Son classement est dans les statistiques (📊), onglet Classement.`,
    },
  },

  // depuis web.9.3.3 : le classement public (dans l'onglet « Classement »), et la modération (…/#moderation)
  public: {
    maLigue: 'Ma ligue',
    public: 'Public',
    vues: 'Quel classement',
    aide: 'Tous les joueurs qui ont un profil et ont joué ce mois-ci. À la confiance\u00a0: le jeu ne peut pas empêcher la triche.',
    joueurs: (nombre: number) => `${nombre}\u00a0joueur${nombre > 1 ? 's' : ''} classé${nombre > 1 ? 's' : ''}`,
    tableau: (mois: string) => `Classement public, ${mois}`,
    personne: 'Aucun joueur classé ce mois-ci.',
    horsClassement: 'Seules les parties jouées avec un profil comptent : crée le tien pour y apparaître.',
    colonneSignaler: 'Signaler',
    signaler: (pseudo: string) => `Signaler ${pseudo}`,
    signale: 'Signalé',
    masque: 'La modération a retiré ton pseudo du classement public. Tu restes dans ta ligue.',
  },

  moderation: {
    titre: 'Modération',
    cle: 'Clé de modération',
    ouvrir: 'Ouvrir',
    refusee: 'Cette clé n’est pas la bonne.',
    aucun: 'Aucun pseudo signalé.',
    signalements: (nombre: number) => `${nombre}\u00a0signalement${nombre > 1 ? 's' : ''}`,
    retire: '(retiré du public)',
    retirer: (pseudo: string) => `Retirer ${pseudo} du public`,
    remettre: (pseudo: string) => `Remettre ${pseudo}`,
  },

  credits: {
    contours: 'Contours des régions et des départements\u00a0: IGN et INSEE',
    licence: 'licence ouverte Etalab',
    inspiration: 'Inspiré de Worldle',
    code: 'Code source',
    // depuis web.9.2.3 : « aucune donnée collectée » n'est plus vrai, si le joueur accepte l'envoi
    // depuis web.9.3.4 : « ni compte » n'est plus tout à fait vrai avec les profils (facultatifs)
    vie: 'Ni e-mail, ni cookie, ni publicité. Tes résultats anonymes servent aux chiffres de tous, si tu le veux.',
    confidentialite: 'Confidentialité',
  },

  // la page de confidentialité (web.9.2.3), dans une fenêtre : des parties courtes, chacune une question
  confidentialite: {
    titre: 'Confidentialité',
    parties: [
      {
        titre: 'En bref',
        textes: [
          'Francle ne te demande ni nom, ni e-mail, ni mot de passe. Pas de cookie, pas de publicité, pas de mesure d’audience. Tes parties sont gardées dans ton navigateur.',
          'Si tu l’acceptes (c’est le réglage de départ), chaque partie du jour finie est aussi envoyée au serveur du jeu, sans rien qui dise qui tu es, pour calculer les chiffres de tous les joueurs.',
          'Si tu crées un profil (c’est facultatif), ton pseudo apparaît dans le classement public et dans ta ligue, et tes parties du jour sont rattachées à ton profil.',
        ],
      },
      {
        titre: 'Ce qui est envoyé',
        textes: [
          'Pour chaque partie du jour finie\u00a0: le numéro du jour, les régions proposées dans l’ordre, le résultat (trouvée, perdue ou abandonnée), les modes difficiles et les réponses du bonus des départements.',
          'Envoyée anonymement, elle porte un numéro tiré au hasard pour elle seule, qui sert à la remplacer quand elle avance (le bonus fini après la victoire). Il change à chaque partie\u00a0: il ne relie pas tes parties entre elles.',
          'La première fois, tes parties du jour déjà jouées partent aussi, une fois (et à ton profil, quand tu en crées un). La partie libre n’est jamais envoyée.',
        ],
      },
      {
        titre: 'Le profil',
        textes: [
          'Ton pseudo, que tout le monde voit dans le classement public, et les membres de ta ligue dans la sienne. Tes parties du jour y sont rattachées, pour calculer tes points.',
          'Un code secret, gardé dans ton navigateur, prouve au serveur que c’est toi. Le serveur ne garde pas ce code, seulement une empreinte qui ne permet pas de le retrouver\u00a0; de même pour ton code de secours.',
          'Le bouton «\u00a0Signaler\u00a0» prévient la modération, qui peut retirer un pseudo du classement public. Le serveur garde qui a signalé qui, jusqu’à ce que la modération ait tranché.',
        ],
      },
      {
        titre: 'Pourquoi',
        textes: [
          'Pour les chiffres du jour (combien de joueurs, combien ont trouvé, où tu te situes), et pour les classements de ta ligue et du public. Les régions proposées sont envoyées, et pas seulement le résultat, pour que le serveur vérifie qu’une partie est possible.',
          'Le classement public se fait à la confiance\u00a0: le jeu ne peut pas empêcher quelqu’un de tricher.',
        ],
      },
      {
        titre: 'Ce qui est gardé, et où',
        textes: [
          'Le serveur ne garde ni ton adresse IP, ni l’heure à laquelle tes parties arrivent, et ne tient aucun journal des requêtes. Il range chaque partie anonyme à part, sans rien qui relierait deux parties envoyées ensemble.',
          'La base est chez Cloudflare, gardée et traitée dans l’Union européenne. Comme pour tout site, GitHub (qui sert les pages du jeu) et Cloudflare (qui fait tourner le serveur) voient passer ton adresse IP pour te répondre\u00a0; leurs propres règles s’appliquent.',
        ],
      },
      {
        titre: 'Combien de temps',
        textes: [
          'Une partie anonyme est effacée 12\u00a0mois après son jour. Un profil sans partie pendant 12\u00a0mois est effacé, avec ses parties et sa place dans sa ligue\u00a0; son pseudo redevient libre.',
          'Une donnée effacée peut subsister jusqu’à 7\u00a0jours dans les sauvegardes automatiques de la base.',
        ],
      },
      {
        titre: 'Refuser',
        textes: [
          'Dans les réglages, désactive «\u00a0Partager mes résultats anonymes\u00a0»\u00a0: tes parties ne partent plus anonymement, et les chiffres de tous ne s’affichent plus. Sans profil, le site ne contacte alors plus du tout le serveur.',
          'Le profil est facultatif. «\u00a0Supprimer mon profil\u00a0», dans les réglages, efface aussitôt ton profil, tes parties envoyées et ta place dans ta ligue.',
        ],
      },
      {
        titre: 'Une question, une suppression',
        textes: [
          'Ouvre un ticket sur le dépôt du jeu, sur GitHub. Il est public\u00a0: n’y écris rien de personnel.',
          'Rien ne relie tes parties anonymes à toi\u00a0: pour les supprimer, il faut leurs numéros tirés. Ils sont ci-dessous, à recopier dans le ticket.',
        ],
      },
    ],
    ticket: 'Ouvrir un ticket sur GitHub',
    numeros: 'Mes numéros tirés',
    aucunNumero: 'Aucune partie envoyée pour l’instant.',
    numero: (date: string, tirage: string) => `${date}\u00a0: ${tirage}`,
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
    listeBouton: 'Bouton liste dans l’en-tête',
    listeAide: 'Il ouvre la liste des régions du jeu, ou des départements pendant le bonus\u00a0: un clic sur un nom le propose.',
    bonus: 'Bonus 🗺️',
    departementsDifficiles: 'Départements\u00a0: version difficile',
    departementsDifficilesAide:
      'La liste et les suggestions proposent les 101 départements, pas seulement ceux de la région. Fixé à la première réponse du bonus.',
    envoiTitre: 'Chiffres de tous',
    envoi: 'Partager mes résultats anonymes',
    envoiAide:
      'Chaque partie du jour finie part, sans rien qui dise qui tu es, pour les chiffres de tous les joueurs. Désactivé, et sans profil, le site ne contacte plus le serveur.',
    envoiDetails: 'Ce qui est envoyé, et pourquoi',
  },
}

export type Textes = typeof fr

const en: Textes = {
  titre: 'Francle',
  numero: (n: number) => `#${n}`,
  sousTitre: 'Guess the French region of the day, in six tries.',
  sousTitreLibre: 'Guess a random French region, in six tries.',
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
  superficie: (km2: number, unite: Unite) => superficie(km2, unite, 'en'),

  abandonner: 'Give up',
  confirmerAbandon: 'Give up for good?',
  oui: 'Yes',
  non: 'No',

  resultat: (partie: Partie, nom: string, libre = false) =>
    partie.etat === 'gagnee'
      ? partie.essais.length === 1
        ? `🎉 ${nom}, found on the first try`
        : `🎉 ${nom}, found in ${partie.essais.length}\u00a0tries`
      : (partie.etat === 'perdue' ? (libre ? 'Lost!' : 'Lost. Try again tomorrow.') : 'Game abandoned.') +
        ` The answer: ${nom}`,
  bilan: { titre: 'Game summary' },
  carte: (nom: string, essais: readonly EssaiCarte[]) =>
    `Map of France, the region ${nom} in blue` +
    (essais.length === 0 ? '' : `. Your guesses: ${essais.map((e) => `${e.numero} ${e.nom}, ${e.proximite}%`).join('; ')}`),
  legende: { proximite: 'Proximity', reponse: 'the answer' },
  voirResultats: 'See results',

  resultats: 'Results',
  fermer: 'Close',
  partager: 'Share',
  copie: 'Result copied: just paste it.',
  comparaison: {
    titre: 'Comparison',
    envoyerTitre: 'Compare with a friend',
    envoyerAide:
      'Send your stats as a link: your friend will see both of your stats side by side. It holds the result of each of your games, not your answers.',
    envoyer: 'Send my stats 🤝',
    message: (adresse: string) => `Compare your Francle with mine: ${adresse}`,
    copie: 'Link copied: just paste it.',
    illisible: 'This comparison link can’t be read: it may have been cut on the way. Ask your friend to send it again.',
    duLien: (date: string) => `Your friend’s stats, sent on ${date}.`,
    tableau: 'Your stats and your friend’s',
    statistique: 'Statistic',
    toi: 'You',
    ami: 'Your friend',
    meilleur: '(better)',
    pointsMois: 'Points this month',
    moyenneMois: 'Average this month',
    pointsToujours: 'All-time points',
    moyenneToujours: 'All-time average',
    bonus: 'Bonus: average score',
    faceAFace: (jours: number, toi: number, ami: number, egalites: number) =>
      jours === 0
        ? 'You haven’t finished a game on the same day yet.'
        : `On the ${jours === 1 ? 'day' : `${jours} days`} you both played: ` +
          `${toi} for you, ${ami} for your friend, ${egalites} tie${egalites === 1 ? '' : 's'}.`,
    retour: 'Send yours back:',
  },
  copieImpossible: 'Copying failed. The browser may have refused it.',
  prochaine: 'Next region in',

  epoque: 'Era',
  confirmerEpoque: 'Change era? The current game will be lost.',
  confirmerEpoqueBonus: 'Change era? The current bonus will be lost.',
  epoques: { nouvelles: 'Current regions (since 2016)', anciennes: 'Former regions (before 2016)' },
  nouvellePartie: 'New game',

  liste: {
    titre: 'List of regions',
    ouvrir: 'See the list of regions',
    aucune: 'No list for this question',
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
    aucunScore: '–',
    pourcentage: (p: number) => `${p}%`,
    onglets: 'Statistics',
    resume: 'Summary',
    details: 'Details',
    calendrier: 'Calendar',
    score: 'Francle score',
    scoreAide: 'Up to 10 points per daily game: 6 for a region found on the first try… 1 on the sixth, up to 2 for the bonus, 1 per hard mode.',
    scoreDuJour: (points: number) => `Today’s game: ${points}/10 points`,
    moisEnCours: 'This month',
    depuisToujours: 'All time',
    points: (points: number) => `${points} point${points === 1 ? '' : 's'}`,
    moyenne: (moyenne: string, parties: number) => `average ${moyenne} over ${parties} game${parties === 1 ? '' : 's'}`,
    essaisMoyens: 'Tries per win',
    meilleurMois: 'Best month',
    journeesParfaites: '10-point games',
    records: 'Records',
    mieuxTrouvees: 'Best found regions',
    moinsBienTrouvees: 'Least found',
    bilanRegion: (victoires: number, parties: number, essais: number | undefined, ecrit: string) =>
      `${victoires} of ${parties}` + (essais === undefined ? '' : ` · ${ecrit} ${essais === 1 ? 'try' : 'tries'}`),
    modes: 'Hard modes',
    rotation: '🌀 Rotated outline',
    cachee: '🙈 Hidden outline',
    bilanMode: (victoires: number, jouees: number) =>
      jouees === 0 ? 'never played' : `${victoires} win${victoires === 1 ? '' : 's'} of ${jouees}`,
    aucunePartie: 'No finished game yet.',
    moisPrecedent: 'Previous month',
    moisSuivant: 'Next month',
    legendeGagnee: 'found (tries)',
    legendePerdue: 'missed',
    legendeAbsente: 'not played',
    caseCalendrier: (date: string, etat: EtatCase, essais: number, points: number) =>
      `${date}: ` +
      {
        gagnee: `found in ${essais} ${essais === 1 ? 'try' : 'tries'}, ${points} point${points === 1 ? '' : 's'}`,
        manquee: 'missed, 0 points',
        'en-cours': 'in progress',
        absente: 'not played',
      }[etat],
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
    fauxSeul: (demande: string, donne: string) => `Wrong: it was ${demande} (your answer: ${donne}).`,
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
    autreRegion: (nom: string) => `${nom}: this department is not in the region.`,
    passer: 'Skip',
    confirmerPasser: 'Stop the bonus for good? Your score will be kept as it is.',
    fini: (score: number, total: number) =>
      `Bonus over: ${score} department${score === 1 ? '' : 's'} found out of ${total}.`,
    arrete: (score: number, total: number) =>
      `Bonus stopped: ${score} department${score === 1 ? '' : 's'} found out of ${total}.`,
    chargement: 'Loading the map…',
    echec: 'Could not load the map.',
    reessayer: 'Try again',
  },

  aide: {
    titre: 'How to play',
    ouvrir: 'How to play',
    but: 'Guess the French region from its outline, in six tries at most.',
    exemple: (nom: string) => `For example, if you guess “${nom}”:`,
    tableauExemple: 'An example guess',
    colonnes: {
      distance: 'the distance between the capitals',
      direction: 'the direction to go',
      proximite: 'the proximity (100%: found)',
    },
    indices: 'After each wrong guess, a clue: the area, a speciality, a famous person, the capital, then a landmark.',
    bonus: 'You won? A bonus: name each department of the region (the list shows them too). Your score is added to what you share.',
    jour: 'The daily game is the same for everyone, and changes at midnight; sharing your result doesn’t give the answer away. In free play, play as much as you like, with the current regions or those from before 2016.',
    modes: 'In the settings, try the hard modes: the outline rotated 🌀, or hidden 🙈.',
    jouer: 'Play',
  },

  tous: {
    titre: 'Today’s players',
    resume: (joueurs: number, taux: number) =>
      `${joueurs.toLocaleString('en-GB')} player${joueurs > 1 ? 's' : ''} today · ${taux}% found it`,
    mieuxQue: (pourcentage: number, points: number) =>
      `With ${points} point${points > 1 ? 's' : ''}, you did better than ${pourcentage}% of players.`,
    repartition: 'Everyone’s wins by number of guesses',
    barre: (essais: number, pourcentage: number, toi: boolean) =>
      `${pourcentage}% of wins in ${essais} guess${essais > 1 ? 'es' : ''}${toi ? ', like you' : ''}`,
  },

  profil: {
    titre: 'Profile',
    intro: 'A nickname for leagues between friends and the public ranking. No email, no password.',
    public: 'Your nickname will be visible to everyone, in the public ranking.',
    pseudo: 'Your nickname',
    creer: 'Create my profile',
    patience: 'One moment…',
    erreurs: {
      pris: 'This nickname is already taken.',
      longueur: '3 to 20 characters, with at least 3 letters or digits.',
      caracteres: 'Only letters, digits, spaces and - _ . ’',
      mot: 'This nickname is not accepted. Try a different spelling.',
      'secours-inconnu': 'This backup code does not match any profile.',
      reseau: 'The server is not responding. Try again later.',
    },
    secoursTitre: 'Your backup code',
    secoursAide:
      'Write it down now: it is shown only once. If your browser data is cleared, it will let you recover your profile.',
    copier: 'Copy',
    copie: 'Copied',
    note: 'Written down',
    aiSecours: 'I have a backup code',
    codeSecours: 'Backup code',
    retrouver: 'Recover my profile',
    annuler: 'Cancel',
    connecte: (pseudo: string) => `Your nickname: ${pseudo}`,
    supprimer: 'Delete my profile',
    confirmer: 'Delete your profile, your sent games and your place in the league? This cannot be undone.',
    oui: 'Yes, delete',
    non: 'No',
    erreurSuppression: 'Deletion failed: the server is not responding.',
    perdu: (pseudo: string) =>
      `Your profile “${pseudo}” is no longer recognised on this device: it was deleted, or recovered elsewhere. With your backup code, you can recover it here.`,
  },

  ligue: {
    onglet: 'Ranking',
    sansProfil: 'Create your profile in the settings (⚙️) to play in a league with friends.',
    chargement: 'Loading…',
    injoignable: 'The server is not responding. Try again later.',
    sansLigue: 'You are not in any league. Create yours and invite your friends, or join a friend’s with its code.',
    nom: 'League name',
    creer: 'Create the league',
    code: 'League code',
    rejoindre: 'Join',
    erreurs: {
      'ligue-inconnue': 'No league has this code.',
      'ligue-pleine': 'This league is full.',
      longueur: '3 to 30 characters, with at least 3 letters or digits.',
      caracteres: 'Only letters, digits, spaces and - _ . ’',
      mot: 'This name is not accepted. Try a different spelling.',
      reseau: 'The server is not responding. Try again later.',
    },
    tableau: (nom: string, mois: string) => `Ranking of “${nom}”, ${mois}`,
    rang: 'Rank',
    joueur: 'Player',
    points: 'Points',
    toi: '(you)',
    detail: (moyenne: string, parties: number) => `average ${moyenne} · ${parties} game${parties > 1 ? 's' : ''}`,
    inviter: 'Invite friends',
    codeLigue: (code: string) => `Code: ${code}`,
    envoyerLien: 'Send the link 🔗',
    lienCopie: 'Link copied: send it to your friends.',
    invitationTexte: (nom: string, lien: string) => `Join my Francle league “${nom}”: ${lien}`,
    membres: 'Members',
    createur: '(creator)',
    retirer: (pseudo: string) => `Remove ${pseudo}`,
    changerCode: 'Change the code',
    changerCodeAide: 'The old code and the old link will stop working.',
    quitter: 'Leave the league',
    confirmerQuitter: (nom: string) =>
      `Leave “${nom}”? Your points stay yours, but you will no longer appear in its ranking.`,
    oui: 'Yes, leave',
    non: 'No',
    invitation: {
      titre: 'Join a league',
      apercu: (nom: string, membres: number) => `“${nom}”, ${membres} member${membres > 1 ? 's' : ''}`,
      inconnue: 'This link does not match any league (its code may have changed).',
      creerProfil: 'To join it, first create your profile:',
      deja: 'You are already in this league.',
      quitteras: (nom: string) => `You will leave your current league, “${nom}” (one league at a time).`,
      rejoindre: 'Join the league',
      bienvenue: (nom: string) => `Welcome to “${nom}”! Its ranking is in the statistics (📊), Ranking tab.`,
    },
  },

  public: {
    maLigue: 'My league',
    public: 'Public',
    vues: 'Which ranking',
    aide: 'All players with a profile who played this month. On trust: the game cannot prevent cheating.',
    joueurs: (nombre: number) => `${nombre} ranked player${nombre > 1 ? 's' : ''}`,
    tableau: (mois: string) => `Public ranking, ${mois}`,
    personne: 'No ranked player this month.',
    horsClassement: 'Only games played with a profile count: create yours to appear here.',
    colonneSignaler: 'Report',
    signaler: (pseudo: string) => `Report ${pseudo}`,
    signale: 'Reported',
    masque: 'Moderation has removed your nickname from the public ranking. You remain in your league.',
  },

  moderation: {
    titre: 'Moderation',
    cle: 'Moderation key',
    ouvrir: 'Open',
    refusee: 'This key is not the right one.',
    aucun: 'No reported nickname.',
    signalements: (nombre: number) => `${nombre} report${nombre > 1 ? 's' : ''}`,
    retire: '(removed from public)',
    retirer: (pseudo: string) => `Remove ${pseudo} from public`,
    remettre: (pseudo: string) => `Restore ${pseudo}`,
  },

  credits: {
    contours: 'Region and department outlines: IGN and INSEE',
    licence: 'Etalab open licence',
    inspiration: 'Inspired by Worldle',
    code: 'Source code',
    vie: 'No email, no cookies, no ads. Your anonymous results feed everyone’s figures, if you like.',
    confidentialite: 'Privacy',
  },

  confidentialite: {
    titre: 'Privacy',
    parties: [
      {
        titre: 'In short',
        textes: [
          'Francle asks for no name, no email and no password. No cookies, no ads, no visitor tracking. Your games are kept in your browser.',
          'If you agree (it is the default setting), each finished daily game is also sent to the game’s server, with nothing that says who you are, to work out the figures of all players.',
          'If you create a profile (it is optional), your nickname appears in the public ranking and in your league, and your daily games are linked to your profile.',
        ],
      },
      {
        titre: 'What is sent',
        textes: [
          'For each finished daily game: the day number, the regions guessed in order, the result (found, lost or given up), the hard modes and the answers of the departments bonus.',
          'Sent anonymously, it carries a number drawn at random for it alone, which lets it be replaced when it moves on (the bonus finished after the win). It changes with every game: it does not link your games together.',
          'The first time, your daily games already played are sent too, once (and to your profile, when you create one). Free play is never sent.',
        ],
      },
      {
        titre: 'The profile',
        textes: [
          'Your nickname, which everyone sees in the public ranking, and the members of your league in theirs. Your daily games are linked to it, to work out your points.',
          'A secret code, kept in your browser, proves to the server that it is you. The server does not keep this code, only a fingerprint that cannot be turned back into it; the same goes for your backup code.',
          'The “Report” button alerts moderation, which can remove a nickname from the public ranking. The server keeps who reported whom, until moderation has decided.',
        ],
      },
      {
        titre: 'Why',
        textes: [
          'For the day’s figures (how many players, how many found it, where you stand), and for the rankings of your league and of the public. The regions guessed are sent, not only the result, so that the server can check that a game is possible.',
          'The public ranking works on trust: the game cannot stop someone from cheating.',
        ],
      },
      {
        titre: 'What is kept, and where',
        textes: [
          'The server keeps neither your IP address, nor the time your games arrive, and keeps no request log. It stores each anonymous game on its own, with nothing that would link two games sent together.',
          'The database is at Cloudflare, stored and processed in the European Union. As for any website, GitHub (which serves the game’s pages) and Cloudflare (which runs the server) see your IP address in order to reply; their own rules apply.',
        ],
      },
      {
        titre: 'How long',
        textes: [
          'An anonymous game is deleted 12 months after its day. A profile without any game for 12 months is deleted, with its games and its place in its league; its nickname becomes free again.',
          'Deleted data may remain for up to 7 days in the database’s automatic backups.',
        ],
      },
      {
        titre: 'Saying no',
        textes: [
          'In the settings, turn off “Share my anonymous results”: your games are no longer sent anonymously, and everyone’s figures are no longer shown. Without a profile, the site then no longer contacts the server at all.',
          'The profile is optional. “Delete my profile”, in the settings, immediately deletes your profile, your sent games and your place in your league.',
        ],
      },
      {
        titre: 'A question, a deletion',
        textes: [
          'Open an issue on the game’s repository, on GitHub. It is public: do not write anything personal in it.',
          'Nothing links your anonymous games to you: to delete them, their random numbers are needed. They are below, to copy into the issue.',
        ],
      },
    ],
    ticket: 'Open an issue on GitHub',
    numeros: 'My random numbers',
    aucunNumero: 'No game sent yet.',
    numero: (date: string, tirage: string) => `${date}: ${tirage}`,
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
    listeBouton: 'List button in the header',
    listeAide: 'It opens the list of the game’s regions, or of the departments during the bonus: click a name to guess it.',
    bonus: 'Bonus 🗺️',
    departementsDifficiles: 'Departments: hard version',
    departementsDifficilesAide:
      'The list and the suggestions offer all 101 departments, not only those of the region. Set at the bonus’s first answer.',
    envoiTitre: 'Everyone’s figures',
    envoi: 'Share my anonymous results',
    envoiAide:
      'Each finished daily game is sent, with nothing that says who you are, for the figures of all players. When off, and without a profile, the site no longer contacts the server.',
    envoiDetails: 'What is sent, and why',
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
