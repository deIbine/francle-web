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
  const parNom: Region[] = []
  const parMot: Region[] = []
  for (const region of REGIONS) {
    if (!estDansLeMode(region, mode)) {
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
  return [...parNom.sort(alphabetique), ...parMot.sort(alphabetique)]
}

// la région que le joueur veut dire quand il appuie sur Entrée sans choisir dans la liste : le nom exact s'il l'a
// tapé, sinon la seule suggestion (« bret » -> Bretagne). « plusieurs » si la saisie en évoque plusieurs (« nor » chez
// les anciennes régions : Nord-Pas-de-Calais, Basse- et Haute-Normandie) : mieux vaut demander que jouer au hasard
// l'une d'elles et faire perdre un essai. undefined si elle n'en évoque aucune
export function deviner(saisie: string, mode: Mode): Region | 'plusieurs' | undefined {
  const exacte = chercher(saisie, mode)
  if (exacte !== undefined) {
    return exacte
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
