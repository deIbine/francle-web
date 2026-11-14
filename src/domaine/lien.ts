/*
Le bilan codé dans le lien de comparaison (décision 5 de web.9.1) : toutes les parties finies, en résumé (le jour,
les essais, l'état, les modes, les départements trouvés), écrites en quelques caractères par jour.

    1.x.k.Bs~Ae…
    │ │ │ └─ un morceau par jour, du premier jour joué au dernier : « ~ » si aucune partie finie ce jour-là, sinon deux
    │ │ │    caractères (ci-dessous)
    │ │ └─── le premier jour joué, en base 36 (chiffres et lettres : 33 s'écrit « x »)
    │ └───── le jour où le lien a été fait, en base 36 : la série en cours se calcule à ce jour-là
    └─────── la version du codage : un lien d'une autre version est refusé, plutôt que lu de travers

Les deux caractères d'un jour, pris dans l'alphabet base64url (A–Z, a–z, 0–9, « - », « _ » : 64 caractères qu'une
adresse et les messageries laissent intacts) :
    1er   (état et essais) × 4 + modes. État et essais : victoire en 1 à 6 essais -> 0 à 5 ; défaite -> 6 ; abandon après
          0 à 5 essais -> 7 à 12. Modes : 🌀 -> 1, 🙈 -> 2, les deux -> 3. Au plus 12 × 4 + 3 = 51 < 64
    2e    0 sans bonus fini, sinon le nombre de départements trouvés + 1. Le nombre de départements à trouver ne voyage
          pas : la région du jour est la même pour tous, on le retrouve avec le jour

Une année de parties tient en 730 caractères environ. En Java, ce serait l'équivalent d'écrire soi-même un petit
format binaire avec un DataOutputStream, plutôt qu'un JSON bavard.
 */
import { departementsDe } from './departements.ts'
import { ESSAIS_MAX } from './partie.ts'
import { regionDuNumero } from './regionDuJour.ts'
import type { Resultat } from './statistiques.ts'

export const VERSION_LIEN = '1'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const SANS_PARTIE = '~'
const SEPARATEUR = '.'

// ce que contient un lien : le jour où il a été fait, et les parties finies (numéro du jour -> résumé)
export interface BilanDuLien {
  readonly jourDuLien: number
  readonly parties: ReadonlyMap<number, Resultat>
}

// l'état et les essais, en un nombre de 0 à 12 (voir en haut du fichier)
function codeEtat(resultat: Resultat): number {
  if (resultat.etat === 'gagnee') {
    return resultat.essais - 1
  }
  if (resultat.etat === 'perdue') {
    return ESSAIS_MAX
  }
  return ESSAIS_MAX + 1 + resultat.essais
}

export function coder(historique: ReadonlyMap<number, Resultat>, jourDuLien: number): string {
  const finies = new Map([...historique].filter(([, resultat]) => resultat.etat !== 'en-cours'))
  const jours = [...finies.keys()]
  const premier = jours.length === 0 ? jourDuLien : Math.min(...jours)
  const dernier = jours.length === 0 ? premier - 1 : Math.max(...jours)
  let morceaux = ''
  for (let jour = premier; jour <= dernier; jour++) {
    const resultat = finies.get(jour)
    if (resultat === undefined) {
      morceaux += SANS_PARTIE
      continue
    }
    const modes = (resultat.modes?.rotation ? 1 : 0) + (resultat.modes?.cachee ? 2 : 0)
    const bonus = resultat.bonus === undefined ? 0 : resultat.bonus.score + 1
    morceaux += ALPHABET[codeEtat(resultat) * 4 + modes] + ALPHABET[bonus]
  }
  return [VERSION_LIEN, jourDuLien.toString(36), premier.toString(36), morceaux].join(SEPARATEUR)
}

// un nombre en base 36, positif ou nul (undefined si le texte n'en est pas un : parseInt accepterait « 1z! »)
function base36(texte: string): number | undefined {
  return /^[0-9a-z]{1,6}$/.test(texte) ? parseInt(texte, 36) : undefined
}

// lit un lien : undefined s'il est abîmé (coupé, modifié, d'une autre version). Tout est vérifié : un lien vient
// de quelqu'un d'autre, on ne lui fait pas confiance
export function lire(texte: string): BilanDuLien | undefined {
  const champs = texte.split(SEPARATEUR)
  if (champs.length !== 4 || champs[0] !== VERSION_LIEN) {
    return undefined
  }
  const jourDuLien = base36(champs[1])
  const premier = base36(champs[2])
  if (jourDuLien === undefined || premier === undefined) {
    return undefined
  }
  const parties = new Map<number, Resultat>()
  const morceaux = champs[3]
  let jour = premier
  let i = 0
  while (i < morceaux.length) {
    if (morceaux[i] === SANS_PARTIE) {
      i++
      jour++
      continue
    }
    const resultat = lirePartie(morceaux[i], morceaux[i + 1] ?? '', jour)
    if (resultat === undefined) {
      return undefined
    }
    parties.set(jour, resultat)
    i += 2
    jour++
  }
  return { jourDuLien, parties }
}

function lirePartie(premier: string, second: string, jour: number): Resultat | undefined {
  // second.length : un lien coupé au milieu d'un jour laisse un texte vide, et ''.indexOf donnerait 0, pas -1
  const code = ALPHABET.indexOf(premier)
  const bonus = second.length === 1 ? ALPHABET.indexOf(second) : -1
  if (code < 0 || bonus < 0 || code > 12 * 4 + 3) {
    return undefined
  }
  const etatEssais = Math.floor(code / 4)
  const modes = { rotation: (code & 1) !== 0, cachee: (code & 2) !== 0 }
  const resultat: Resultat =
    etatEssais < ESSAIS_MAX
      ? { etat: 'gagnee', essais: etatEssais + 1, modes }
      : etatEssais === ESSAIS_MAX
        ? { etat: 'perdue', essais: ESSAIS_MAX, modes }
        : { etat: 'abandonnee', essais: etatEssais - ESSAIS_MAX - 1, modes }
  if (bonus === 0) {
    return resultat
  }
  // un bonus n'existe qu'après une victoire, et ne peut pas trouver plus de départements que la région n'en a
  const total = departementsDe(regionDuNumero(jour)).length
  if (resultat.etat !== 'gagnee' || bonus - 1 > total) {
    return undefined
  }
  return { ...resultat, bonus: { score: bonus - 1, total } }
}
