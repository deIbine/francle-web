/*
Les régions jouables : chaque information n'est écrite qu'ici, une seule fois.
Le reste du code vient chercher ses données dans ce fichier.

Repris de RegionFr.java (deIbine/francle, phase 6), avec en plus les noms et indices en anglais, et un cinquième
indice (le monument), révélé après le cinquième essai raté.
 */

export type Langue = 'fr' | 'en'

// un texte dans les deux langues du jeu
export type Texte = Readonly<Record<Langue, string>>

// l'époque d'une région : avant 2016, depuis 2016, ou inchangée en 2016
export type Epoque = 'ancienne' | 'nouvelle' | 'les-deux'

// où se trouve la région : sert au calcul du pourcentage de proximité
export type Zone = 'metropole' | 'outre-mer'

// les régions jouées : celles d'avant 2016 OU celles d'après, jamais un mélange
export type Mode = 'anciennes' | 'nouvelles'

export interface Region {
  // identifiant stable, sans accents : sert aussi de nom de fichier pour la silhouette (« bretagne.svg »)
  readonly id: string
  readonly nom: Texte
  // coordonnées de la capitale régionale, en degrés
  readonly latitude: number
  readonly longitude: number
  readonly epoque: Epoque
  readonly zone: Zone
  // les cinq indices, dans l'ordre où ils sont révélés
  readonly superficie: number // en km²
  readonly specialite: Texte
  readonly personnalite: Texte
  readonly capitale: string // un nom de ville : le même dans les deux langues
  readonly monument: Texte
}

// les arguments dans l'ordre de RegionFr.java, pour comparer facilement les deux fichiers
function region(
  id: string,
  nom: Texte,
  latitude: number,
  longitude: number,
  epoque: Epoque,
  zone: Zone,
  superficie: number,
  specialite: Texte,
  personnalite: Texte,
  capitale: string,
  monument: Texte,
): Region {
  return { id, nom, latitude, longitude, epoque, zone, superficie, specialite, personnalite, capitale, monument }
}

// un texte identique dans les deux langues (la plupart des noms propres)
function pareil(texte: string): Texte {
  return { fr: texte, en: texte }
}

// les anciennes régions sont toutes en métropole
function ancienne(
  id: string,
  nom: Texte,
  latitude: number,
  longitude: number,
  superficie: number,
  specialite: Texte,
  personnalite: Texte,
  capitale: string,
  monument: Texte,
): Region {
  return region(id, nom, latitude, longitude, 'ancienne', 'metropole', superficie, specialite, personnalite, capitale, monument)
}

// readonly : personne ne pourra ajouter ou retirer une région par erreur
export const REGIONS: readonly Region[] = [
  // nouvelles régions et régions inchangées
  region('hauts-de-france', pareil('Hauts-de-France'), 50.62925, 3.057256, 'nouvelle', 'metropole', 31814,
    { fr: 'la bière', en: 'beer' },
    pareil('Charles de Gaulle'), 'Lille',
    { fr: 'la cathédrale d’Amiens', en: 'Amiens Cathedral' }),
  region('normandie', { fr: 'Normandie', en: 'Normandy' }, 49.443232, 1.099971, 'nouvelle', 'metropole', 29907,
    { fr: 'la matelote', en: 'matelote (fish stewed in wine)' },
    { fr: 'Guillaume le Conquérant', en: 'William the Conqueror' }, 'Rouen',
    { fr: 'le Mont-Saint-Michel', en: 'Mont-Saint-Michel' }),
  region('bretagne', { fr: 'Bretagne', en: 'Brittany' }, 48.117266, -1.6777926, 'les-deux', 'metropole', 27208,
    { fr: 'la crêpe', en: 'crêpes' },
    pareil('Louis Guilloux'), 'Rennes',
    { fr: 'les alignements de Carnac', en: 'the Carnac stones' }),
  region('pays-de-la-loire', pareil('Pays de la Loire'), 47.218371, -1.553621, 'les-deux', 'metropole', 32082,
    { fr: 'la fouace', en: 'fouace (a sweet star-shaped bread)' },
    pareil('Jules Verne'), 'Nantes',
    { fr: 'le château de Saumur', en: 'Saumur Castle' }),
  region('ile-de-france', pareil('Île-de-France'), 48.856614, 2.3522219, 'les-deux', 'metropole', 12012,
    { fr: 'le macaron', en: 'macarons' },
    pareil('Alexandre Dumas'), 'Paris',
    { fr: 'la tour Eiffel', en: 'the Eiffel Tower' }),
  region('centre-val-de-loire', pareil('Centre-Val de Loire'), 47.902964, 1.909251, 'nouvelle', 'metropole', 39151,
    { fr: 'la tarte Tatin', en: 'tarte Tatin' },
    { fr: 'Jeanne d’Arc', en: 'Joan of Arc' }, 'Orléans',
    { fr: 'le château de Chambord', en: 'Château de Chambord' }),
  region('grand-est', pareil('Grand Est'), 48.5734053, 7.7521113, 'nouvelle', 'metropole', 57433,
    { fr: 'la choucroute', en: 'choucroute (sauerkraut with sausages)' },
    pareil('Paul Verlaine'), 'Strasbourg',
    { fr: 'la cathédrale de Reims', en: 'Reims Cathedral' }),
  region('bourgogne-franche-comte', { fr: 'Bourgogne-Franche-Comté', en: 'Burgundy-Franche-Comté' }, 47.322047, 5.04148,
    'nouvelle', 'metropole', 47784,
    { fr: 'le bœuf bourguignon', en: 'beef bourguignon' },
    pareil('Victor Hugo'), 'Dijon',
    { fr: 'les Hospices de Beaune', en: 'the Hospices de Beaune' }),
  region('auvergne-rhone-alpes', pareil('Auvergne-Rhône-Alpes'), 45.764043, 4.835659, 'nouvelle', 'metropole', 69711,
    { fr: 'le coq au vin', en: 'coq au vin' },
    pareil('Jean Moulin'), 'Lyon',
    { fr: 'le mont Blanc', en: 'Mont Blanc' }),
  region('nouvelle-aquitaine', pareil('Nouvelle-Aquitaine'), 44.837789, -0.57918, 'nouvelle', 'metropole', 84060,
    { fr: 'les huîtres du Bassin d’Arcachon', en: 'Arcachon Bay oysters' },
    pareil('Jacques Ellul'), 'Bordeaux',
    { fr: 'la dune du Pilat', en: 'the Dune of Pilat' }),
  region('occitanie', { fr: 'Occitanie', en: 'Occitania' }, 43.604652, 1.444209, 'nouvelle', 'metropole', 72724,
    { fr: 'le confit de canard', en: 'duck confit' },
    pareil('Jean Jaurès'), 'Toulouse',
    { fr: 'la cité de Carcassonne', en: 'the medieval city of Carcassonne' }),
  region('provence-alpes-cote-dazur', pareil('Provence-Alpes-Côte d’Azur'), 43.296482, 5.36978, 'les-deux', 'metropole',
    31400,
    { fr: 'la bouillabaisse', en: 'bouillabaisse' },
    pareil('Fernandel'), 'Marseille',
    { fr: 'le palais des Papes d’Avignon', en: 'the Palace of the Popes in Avignon' }),
  region('corse', { fr: 'Corse', en: 'Corsica' }, 41.919229, 8.738635, 'les-deux', 'metropole', 8680,
    { fr: 'le figatellu', en: 'figatellu (smoked liver sausage)' },
    { fr: 'Napoléon Bonaparte', en: 'Napoleon Bonaparte' }, 'Ajaccio',
    { fr: 'les calanques de Piana', en: 'the Calanques of Piana' }),
  region('mayotte', pareil('Mayotte'), -12.7806, 45.2278, 'les-deux', 'outre-mer', 374,
    { fr: 'le matsidza', en: 'matsidza' },
    pareil('Taambati Moussa'), 'Mamoudzou',
    { fr: 'le lac Dziani', en: 'Lake Dziani' }),
  region('la-reunion', { fr: 'La Réunion', en: 'Réunion' }, -20.882057, 55.450675, 'les-deux', 'outre-mer', 2504,
    { fr: 'le rhum arrangé', en: 'rhum arrangé (rum infused with fruit and spices)' },
    pareil('Michel Houellebecq'), 'Saint-Denis',
    { fr: 'le piton de la Fournaise', en: 'Piton de la Fournaise' }),
  region('guyane', { fr: 'Guyane', en: 'French Guiana' }, 4.9227, -52.3269, 'les-deux', 'outre-mer', 83534,
    { fr: 'le poulet boucané', en: 'poulet boucané (smoked chicken)' },
    pareil('Henri Salvador'), 'Cayenne',
    { fr: 'le centre spatial de Kourou', en: 'the Kourou space centre' }),
  region('martinique', pareil('Martinique'), 14.6160647, -61.0587804, 'les-deux', 'outre-mer', 1128,
    { fr: 'le gratin de bananes', en: 'banana gratin' },
    pareil('Aimé Césaire'), 'Fort-de-France',
    { fr: 'la montagne Pelée', en: 'Mount Pelée' }),
  region('guadeloupe', pareil('Guadeloupe'), 17.302606, -62.717692, 'les-deux', 'outre-mer', 1703,
    { fr: 'les accras de morue', en: 'salt cod fritters (accras)' },
    pareil('Teddy Riner'), 'Basse-Terre',
    { fr: 'le volcan de la Soufrière', en: 'La Soufrière volcano' }),

  // anciennes régions (avant 2016)
  ancienne('nord-pas-de-calais', pareil('Nord-Pas-de-Calais'), 50.62925, 3.057256, 12414,
    { fr: 'le potjevleesch', en: 'potjevleesch (meats in aspic)' },
    pareil('Robespierre'), 'Lille',
    { fr: 'le beffroi d’Arras', en: 'the Arras belfry' }),
  ancienne('picardie', { fr: 'Picardie', en: 'Picardy' }, 49.844067, 2.295753, 19399,
    { fr: 'la ficelle picarde', en: 'ficelle picarde (a savoury filled crêpe)' },
    pareil('Jean de La Fontaine'), 'Amiens',
    { fr: 'la baie de Somme', en: 'the Bay of the Somme' }),
  ancienne('haute-normandie', { fr: 'Haute-Normandie', en: 'Upper Normandy' }, 49.443232, 1.099971, 12317,
    { fr: 'le canard à la rouennaise', en: 'Rouen-style duck' },
    pareil('Gustave Flaubert'), 'Rouen',
    { fr: 'les falaises d’Étretat', en: 'the cliffs of Étretat' }),
  ancienne('basse-normandie', { fr: 'Basse-Normandie', en: 'Lower Normandy' }, 49.182863, -0.370679, 17589,
    { fr: 'le camembert', en: 'Camembert' },
    { fr: 'Guillaume le Conquérant', en: 'William the Conqueror' }, 'Caen',
    { fr: 'le Mont-Saint-Michel', en: 'Mont-Saint-Michel' }),
  ancienne('poitou-charentes', pareil('Poitou-Charentes'), 46.580224, 0.340375, 25810,
    { fr: 'le cognac', en: 'cognac' },
    pareil('François Mitterrand'), 'Poitiers',
    pareil('Fort Boyard')),
  ancienne('centre', pareil('Centre'), 47.902964, 1.909251, 39151,
    { fr: 'la tarte Tatin', en: 'tarte Tatin' },
    pareil('Honoré de Balzac'), 'Orléans',
    { fr: 'le château de Chambord', en: 'Château de Chambord' }),
  ancienne('champagne-ardenne', pareil('Champagne-Ardenne'), 48.956682, 4.363073, 25606,
    { fr: 'le champagne', en: 'champagne' },
    pareil('Arthur Rimbaud'), 'Châlons-en-Champagne',
    { fr: 'la cathédrale de Reims', en: 'Reims Cathedral' }),
  ancienne('lorraine', pareil('Lorraine'), 49.1193089, 6.1757156, 23547,
    { fr: 'la quiche lorraine', en: 'quiche Lorraine' },
    { fr: 'Jeanne d’Arc', en: 'Joan of Arc' }, 'Metz',
    { fr: 'la place Stanislas à Nancy', en: 'Place Stanislas in Nancy' }),
  ancienne('alsace', pareil('Alsace'), 48.5734053, 7.7521113, 8280,
    { fr: 'la flammekueche', en: 'flammekueche (tarte flambée)' },
    pareil('Albert Schweitzer'), 'Strasbourg',
    { fr: 'le château du Haut-Kœnigsbourg', en: 'Haut-Kœnigsbourg Castle' }),
  ancienne('bourgogne', { fr: 'Bourgogne', en: 'Burgundy' }, 47.322047, 5.04148, 31582,
    { fr: 'les escargots de Bourgogne', en: 'snails cooked in garlic butter' },
    pareil('Gustave Eiffel'), 'Dijon',
    { fr: 'les Hospices de Beaune', en: 'the Hospices de Beaune' }),
  ancienne('franche-comte', pareil('Franche-Comté'), 47.237829, 6.0240539, 16202,
    { fr: 'le comté', en: 'Comté cheese' },
    pareil('Louis Pasteur'), 'Besançon',
    { fr: 'la saline royale d’Arc-et-Senans', en: 'the Royal Saltworks at Arc-et-Senans' }),
  ancienne('rhone-alpes', pareil('Rhône-Alpes'), 45.764043, 4.835659, 43698,
    { fr: 'le gratin dauphinois', en: 'gratin dauphinois' },
    pareil('Antoine de Saint-Exupéry'), 'Lyon',
    { fr: 'le mont Blanc', en: 'Mont Blanc' }),
  ancienne('auvergne', pareil('Auvergne'), 45.777222, 3.087025, 26013,
    { fr: 'la truffade', en: 'truffade (potatoes with melted cheese)' },
    pareil('Blaise Pascal'), 'Clermont-Ferrand',
    { fr: 'le puy de Dôme', en: 'the Puy de Dôme' }),
  ancienne('limousin', pareil('Limousin'), 45.833619, 1.261105, 16942,
    { fr: 'le clafoutis', en: 'clafoutis' },
    pareil('Auguste Renoir'), 'Limoges',
    { fr: 'le lac de Vassivière', en: 'Lake Vassivière' }),
  ancienne('aquitaine', pareil('Aquitaine'), 44.837789, -0.57918, 41309,
    { fr: 'le canelé', en: 'canelés' },
    pareil('Montesquieu'), 'Bordeaux',
    { fr: 'la dune du Pilat', en: 'the Dune of Pilat' }),
  ancienne('midi-pyrenees', pareil('Midi-Pyrénées'), 43.604652, 1.444209, 45348,
    { fr: 'la saucisse de Toulouse', en: 'Toulouse sausage' },
    pareil('Henri de Toulouse-Lautrec'), 'Toulouse',
    { fr: 'le cirque de Gavarnie', en: 'the Cirque de Gavarnie' }),
  ancienne('languedoc-roussillon', pareil('Languedoc-Roussillon'), 43.610769, 3.876716, 27376,
    { fr: 'le cassoulet', en: 'cassoulet' },
    pareil('Georges Brassens'), 'Montpellier',
    { fr: 'le pont du Gard', en: 'the Pont du Gard' }),
]

// les régions de ce mode : celles de son époque, plus les régions inchangées en 2016 (Bretagne, outre-mer…).
// Une seule règle sert à la fois pour tirer la région à deviner et pour accepter la proposition du joueur :
// on ne peut proposer que ce qu'on pourrait avoir à deviner
export function estDansLeMode(region: Region, mode: Mode): boolean {
  const autre: Epoque = mode === 'anciennes' ? 'nouvelle' : 'ancienne'
  return region.epoque !== autre
}

export function tirables(mode: Mode): Region[] {
  return REGIONS.filter((region) => estDansLeMode(region, mode))
}

// une région au hasard, pour la partie libre. Le hasard est un paramètre (Math.random par défaut) : un test peut
// en donner un fixe et savoir d'avance ce qui sera tiré
export function tirer(mode: Mode, hasard: () => number = Math.random): Region {
  const liste = tirables(mode)
  return liste[Math.floor(hasard() * liste.length)]
}

export function parId(id: string): Region {
  const trouvee = REGIONS.find((region) => region.id === id)
  if (trouvee === undefined) {
    throw new Error(`Région inconnue : ${id}`)
  }
  return trouvee
}
