import { estDansLeMode, REGIONS, type Langue, type Mode, type Region } from './regions.ts'

// « Île-de-France » -> « iledefrance » : sans espaces, majuscules, ponctuation ni accents.
// normalize('NFD') sépare chaque lettre accentuée en lettre + accent (« é » -> « e » + « ´ »), puis on ne garde que
// les lettres et les chiffres sans accent. Comme le Java, avec en plus l'apostrophe typographique (’), qu'un
// téléphone tape souvent à la place de '
export function simplifier(saisie: string): string {
  return saisie
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '')
}

// chaque nom simplifié (français et anglais) -> sa région, construit une seule fois.
// Une Map est l'équivalent d'une HashMap Java
const PAR_CLE = new Map<string, Region>()
for (const region of REGIONS) {
  PAR_CLE.set(simplifier(region.nom.fr), region)
  PAR_CLE.set(simplifier(region.nom.en), region)
}

// les sigles courants (depuis web.7.22) : « PACA » est souvent plus connu que le nom entier. Une liste fermée, décidée
// avec l'utilisateur, plutôt que des initiales calculées : « CVL » ou « PDL » n'aideraient personne. Ils valent comme un
// nom exact (chercher), et la région s'affiche dans les suggestions dès que le sigle est tapé en entier
const SIGLES: Readonly<Record<string, string>> = {
  paca: 'provence-alpes-cote-dazur',
  idf: 'ile-de-france',
  ara: 'auvergne-rhone-alpes',
  bfc: 'bourgogne-franche-comte',
  hdf: 'hauts-de-france',
  npdc: 'nord-pas-de-calais',
}
for (const [sigle, id] of Object.entries(SIGLES)) {
  const region = REGIONS.find((candidate) => candidate.id === id)
  if (region === undefined) {
    throw new Error(`Sigle ${sigle} : la région ${id} n'existe pas`)
  }
  PAR_CLE.set(sigle, region)
}

// la région correspondant à la saisie du joueur, en français ou en anglais quelle que soit la langue choisie,
// ou undefined si elle est inconnue ou refusée dans ce mode
export function chercher(saisie: string, mode: Mode): Region | undefined {
  const region = PAR_CLE.get(simplifier(saisie))
  return region !== undefined && estDansLeMode(region, mode) ? region : undefined
}

// ce qui sépare les mots d'un nom : espaces, tirets, apostrophes
const SEPARATEURS = /[\s\-'’]+/

// les mots du nom, simplifiés, sans les petits mots (« de », « la », « d’ ») : « Provence-Alpes-Côte d’Azur » ->
// provence, alpes, cote, azur. Sinon « d » ou « de » ferait apparaître la moitié des régions
export function mots(nom: string): string[] {
  return nom
    .split(SEPARATEURS)
    .map(simplifier)
    .filter((mot) => mot.length >= 3)
}

// les régions à proposer pendant la frappe, parmi celles acceptées dans ce mode : d'abord celles dont un NOM
// commence par la saisie (« nor » -> Normandie), puis celles dont un MOT commence par elle (« loire » -> Pays de la
// Loire) ; chaque groupe par ordre alphabétique du nom dans la langue du joueur. Les deux noms, français et anglais,
// sont cherchés : « bri » trouve la Bretagne (Brittany) même en français (comme le Java depuis sa phase 8)
export function suggestions(saisie: string, mode: Mode, langue: Langue): Region[] {
  const debut = simplifier(saisie)
  if (debut === '') {
    return []
  }
  // un sigle tapé en entier (« paca ») : sa région en tête de liste, pour que le joueur voie ce qu'il va proposer
  const parSigle = debut in SIGLES ? PAR_CLE.get(debut) : undefined
  const parNom: Region[] = []
  const parMot: Region[] = []
  for (const region of REGIONS) {
    if (!estDansLeMode(region, mode) || region === parSigle) {
      continue
    }
    const noms = [region.nom.fr, region.nom.en]
    if (noms.some((nom) => simplifier(nom).startsWith(debut))) {
      parNom.push(region)
    } else if (noms.some((nom) => mots(nom).some((mot) => mot.startsWith(debut)))) {
      parMot.push(region)
    }
  }
  // Intl.Collator : l'ordre alphabétique d'une langue (« Île » rangé avec les « I », pas après « Z »),
  // comme Collator.getInstance(Locale.FRENCH) en Java. ignorePunctuation : les espaces et tirets ne comptent pas,
  // comme en Java et dans un dictionnaire (« Languedoc » avant « La Réunion », lu « lareunion »)
  const ordre = new Intl.Collator(langue, { ignorePunctuation: true })
  const alphabetique = (a: Region, b: Region) => ordre.compare(a.nom[langue], b.nom[langue])
  const sigle = parSigle !== undefined && estDansLeMode(parSigle, mode) ? [parSigle] : []
  return [...sigle, ...parNom.sort(alphabetique), ...parMot.sort(alphabetique)]
}

// les régions de 2016 qui n'ont fait que changer de nom, sans changer de territoire : l'ancienne -> la nouvelle
const RENOMMEES: Readonly<Record<string, string>> = { centre: 'centre-val-de-loire' }

// la même région sous son nom de l'autre époque (Centre <-> Centre-Val de Loire), si elle n'a fait que changer de nom
function renommee(region: Region, mode: Mode): Region | undefined {
  const id =
    mode === 'nouvelles'
      ? RENOMMEES[region.id]
      : Object.keys(RENOMMEES).find((ancienne) => RENOMMEES[ancienne] === region.id)
  const autre = REGIONS.find((candidate) => candidate.id === id)
  return autre !== undefined && estDansLeMode(autre, mode) ? autre : undefined
}

// la région que le joueur veut dire quand il appuie sur Entrée sans choisir dans la liste : le nom exact s'il l'a
// tapé, sinon la seule suggestion (« bret » -> Bretagne). « plusieurs » si la saisie en évoque plusieurs (« nor » chez
// les anciennes régions : Nord-Pas-de-Calais, Basse- et Haute-Normandie) : mieux vaut demander que jouer au hasard
// l'une d'elles et faire perdre un essai. undefined si elle n'en évoque aucune
//
// Le nom exact d'une région de l'AUTRE époque ne devine rien (depuis web.7.22) : « Aquitaine », chez les régions
// actuelles, jouait Nouvelle-Aquitaine (un mot de son nom) et coûtait un essai, quand « Lorraine » donnait un message
// sans en coûter. Désormais tous ces noms passent par autreEpoque, et le plateau explique. Sauf une région seulement
// renommée (RENOMMEES) : c'est le même territoire, le message ne ferait que demander de retaper le nom
export function deviner(saisie: string, mode: Mode): Region | 'plusieurs' | undefined {
  const exacte = PAR_CLE.get(simplifier(saisie))
  if (exacte !== undefined) {
    return estDansLeMode(exacte, mode) ? exacte : renommee(exacte, mode)
  }
  // la langue ne change que l'ordre des suggestions, pas leur nombre
  const liste = suggestions(saisie, mode, 'fr')
  if (liste.length === 0) {
    return undefined
  }
  return liste.length === 1 ? liste[0] : 'plusieurs'
}

// la région de l'AUTRE époque que la saisie désigne (le nom exact, ou la seule région qu'il évoque), quand elle n'est
// pas dans celle-ci : « Alsace » en partie du jour, « Grand Est » chez les anciennes régions. Le plateau le dit au
// joueur au lieu de répondre « cette région n'existe pas ». undefined si la saisie ne désigne aucune de ces régions
export function autreEpoque(saisie: string, mode: Mode): Region | undefined {
  const region = deviner(saisie, mode === 'nouvelles' ? 'anciennes' : 'nouvelles')
  return typeof region === 'object' && !estDansLeMode(region, mode) ? region : undefined
}
