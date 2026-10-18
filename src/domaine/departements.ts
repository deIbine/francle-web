/*
Les départements, pour le bonus : leur numéro (« 29 », « 2A », « 971 »), leur nom (« Finistère »), et ceux de chaque
région. Les noms restent en français dans les deux langues du jeu, comme sur les cartes anglaises.

La liste n'est pas écrite ici : elle est dans departements.json, copié tel quel du projet Java
(src/main/resources/departements/departements.json, phase 9), que lit aussi le script des images
(outils/generer_images.py). Une seule liste pour le jeu et pour les cartes : ils ne peuvent pas se contredire.
    "departements" : numéro -> nom, pour les 101 départements
    "regions"      : identifiant de région (celui de regions.ts) -> les numéros de ses départements, pour les
                     35 régions des deux époques. La réforme de 2016 a regroupé les régions sans toucher aux
                     départements : la même liste, groupée de deux façons.

Vite transforme le JSON importé en objet JavaScript au moment de la construction : pas de lecture de fichier, ni
d'erreur possible à l'exécution, contrairement au Java qui lit sa ressource au premier appel (Decoupage.java).
 */
import donnees from './departements.json'
import { mots, simplifier } from './recherche.ts'
import { REGIONS, type Langue, type Region } from './regions.ts'

export interface Departement {
  readonly code: string
  readonly nom: string
}

// la place d'un numéro dans l'ordre habituel : 19, 2A, 2B, 21… Trier les textes ne suffit pas (« 2A » viendrait
// après « 29 »), ni l'ordre des clés de l'objet : JavaScript range d'abord les clés qui ressemblent à des entiers
// (« 10 », « 971 »), puis les autres (« 01 », « 2A »), chacune dans son groupe
function rang(code: string): number {
  if (code === '2A') return 20.1
  if (code === '2B') return 20.2
  return Number(code)
}

// tous les départements, dans l'ordre de leurs numéros
export const DEPARTEMENTS: readonly Departement[] = Object.entries(donnees.departements)
  .map(([code, nom]) => ({ code, nom }))
  .sort((a, b) => rang(a.code) - rang(b.code))

// numéro -> département (une Map, comme une HashMap Java)
const PAR_CODE = new Map(DEPARTEMENTS.map((departement) => [departement.code, departement]))

// identifiant de région -> ses départements, dans l'ordre du fichier (celui des numéros). Un numéro inconnu est une
// faute dans le fichier, pas une erreur du joueur : on s'arrête dès le chargement, et les tests le voient
const PAR_REGION = new Map<string, readonly Departement[]>(
  Object.entries(donnees.regions).map(([region, codes]) => [
    region,
    codes.map((code) => {
      const departement = PAR_CODE.get(code)
      if (departement === undefined) {
        throw new Error(`Département inconnu ${code} dans la région ${region}`)
      }
      return departement
    }),
  ]),
)

// le département de ce numéro, s'il existe
export function parCode(code: string): Departement | undefined {
  return PAR_CODE.get(code)
}

// les départements d'une région, dans l'ordre de leurs numéros
export function departementsDe(region: Region): readonly Departement[] {
  const liste = PAR_REGION.get(region.id)
  if (liste === undefined) {
    throw new Error(`Pas de départements pour ${region.id} dans departements.json`)
  }
  return liste
}

// la saisie écrite comme un numéro de département : « 2a » -> « 2A », « 1 » -> « 01 » (les numéros à un chiffre
// s'écrivent avec un zéro devant). Une saisie qui n'a pas la forme d'un numéro est renvoyée telle quelle
export function numero(saisie: string): string {
  const texte = saisie.trim().toUpperCase()
  return /^[1-9]$/.test(texte) ? `0${texte}` : texte
}

// chaque nom simplifié -> son département, construit une seule fois
const PAR_NOM = new Map(DEPARTEMENTS.map((departement) => [simplifier(departement.nom), departement]))

// le département que le joueur a voulu dire, par son numéro (« 29 », « 2a », « 1 ») ou son nom (« finistere »),
// parmi les 101 : un département d'une autre région est une réponse fausse, pas une saisie inconnue
export function chercherDepartement(saisie: string): Departement | undefined {
  return parCode(numero(saisie)) ?? PAR_NOM.get(simplifier(saisie))
}

// les départements à proposer pendant la frappe, parmi ceux donnés : d'abord ceux dont le nom commence par la saisie
// (« haute » -> Haute-Corse), puis ceux dont un mot commence par elle (« corse » -> Corse-du-Sud, Haute-Corse) ;
// chaque groupe par ordre alphabétique. La même règle que pour les régions (suggestions dans recherche.ts). Un numéro
// (« 29 ») propose le département qui le porte
export function suggestionsDepartements(
  saisie: string,
  parmi: readonly Departement[],
  langue: Langue,
): Departement[] {
  const debut = simplifier(saisie)
  if (debut === '') {
    return []
  }
  const parNumero = parmi.filter((departement) => departement.code === numero(saisie))
  const parNom: Departement[] = []
  const parMot: Departement[] = []
  for (const departement of parmi) {
    if (simplifier(departement.nom).startsWith(debut)) {
      parNom.push(departement)
    } else if (mots(departement.nom).some((mot) => mot.startsWith(debut))) {
      parMot.push(departement)
    }
  }
  const ordre = new Intl.Collator(langue, { ignorePunctuation: true })
  const alphabetique = (a: Departement, b: Departement) => ordre.compare(a.nom, b.nom)
  return [...parNumero, ...parNom.sort(alphabetique), ...parMot.sort(alphabetique)]
}

// Le lien entre les deux époques, déduit des départements : la réforme de 2016 a regroupé les anciennes régions sans
// toucher aux départements, donc une ancienne région est dans la nouvelle région qui a ses départements. Pas de
// nouvelle donnée à écrire ni à tenir à jour.

// la nouvelle région (d'après 2016) qui contient cette ancienne région : Alsace -> Grand Est
export function nouvelleRegionDe(ancienne: Region): Region {
  const premier = departementsDe(ancienne)[0]
  const nouvelle = REGIONS.find(
    (region) => region.epoque === 'nouvelle' && departementsDe(region).includes(premier),
  )
  if (nouvelle === undefined) {
    throw new Error(`Pas de nouvelle région pour ${ancienne.id}`)
  }
  return nouvelle
}

// les anciennes régions (d'avant 2016) regroupées dans cette nouvelle région, dans l'ordre de regions.ts :
// Grand Est -> Champagne-Ardenne, Lorraine, Alsace ; Centre-Val de Loire -> Centre (un simple changement de nom)
export function anciennesRegionsDe(nouvelle: Region): Region[] {
  const siens = departementsDe(nouvelle)
  return REGIONS.filter(
    (region) => region.epoque === 'ancienne' && departementsDe(region).every((departement) => siens.includes(departement)),
  )
}
