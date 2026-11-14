/*
Le format d'une partie transmise (décision 4 de web.9.1) : ce que contient une partie du jour quand elle quitte le
navigateur du joueur. Le même pour le serveur des chiffres de tous (web.9.2) et pour les ligues (web.9.3). Le lien de
comparaison n'en garde que le résumé (lien.ts), plus court.

Le format complet garde les coups eux-mêmes (les régions proposées, les réponses du bonus) et non leurs
conséquences (le nombre d'essais, les points) : comme la sauvegarde, on rejoue les coups pour tout retrouver. Si une
règle change (les bornes du bonus, par exemple), les parties déjà transmises se recalculent avec la nouvelle règle.

    {
      "v": 1,                                  le numéro de version du format
      "parties": [
        {
          "jour": 33,                          le numéro de la partie du jour
          "regions": ["bretagne", "normandie"],  les identifiants des régions proposées, dans l'ordre
          "etat": "gagnee",                    en-cours, gagnee, perdue ou abandonnee
          "modes": { "rotation": true, "cachee": false },
          "bonus": {                           absent si le bonus n'a pas commencé
            "paires": [["29", "29"], ["35", "22"]],  [département demandé, département donné], dans l'ordre
            "etat": "termine",                 en-cours, termine ou passe
            "difficile": false                 la version difficile (les 101 départements proposés)
          }
        }
      ]
    }

Une enveloppe d'une autre version est refusée en entier, plutôt que lue de travers : la version 2, si elle vient un
jour, aura ses propres règles de lecture.
 */
import { avecDifficulte, bonusDuJour, bonusEnCours, commence, passer, rejouerPaires, score, total } from './bonus.ts'
import type { EtatBonus } from './bonus.ts'
import type { ModesDifficiles } from './partage.ts'
import type { Etat } from './partie.ts'
import { regionDuNumero } from './regionDuJour.ts'
import type { Resultat } from './statistiques.ts'

export const VERSION_TRANSMISSION = 1

export interface PartieTransmise {
  readonly jour: number
  readonly regions: readonly string[]
  readonly etat: Etat
  readonly modes: ModesDifficiles
  readonly bonus?: BonusTransmis
}

export interface BonusTransmis {
  readonly paires: readonly (readonly [string, string])[]
  readonly etat: EtatBonus
  readonly difficile: boolean
}

export interface Envoi {
  readonly v: typeof VERSION_TRANSMISSION
  readonly parties: readonly PartieTransmise[]
}

export function envoi(parties: readonly PartieTransmise[]): Envoi {
  return { v: VERSION_TRANSMISSION, parties }
}

// lit une enveloppe reçue (le JSON déjà décodé) : undefined si elle n'a pas la bonne forme ou la bonne version.
// Comme pour la sauvegarde, JSON.parse renvoie n'importe quoi : on vérifie tout avant de s'en servir
export function lireEnvoi(valeur: unknown): Envoi | undefined {
  const objet = valeur as Envoi
  if (
    typeof valeur !== 'object' ||
    valeur === null ||
    objet.v !== VERSION_TRANSMISSION ||
    !Array.isArray(objet.parties) ||
    !objet.parties.every(estPartieTransmise)
  ) {
    return undefined
  }
  return objet
}

const ETATS: readonly Etat[] = ['en-cours', 'gagnee', 'perdue', 'abandonnee']
const ETATS_BONUS: readonly EtatBonus[] = ['en-cours', 'termine', 'passe']

export function estPartieTransmise(valeur: unknown): valeur is PartieTransmise {
  const partie = valeur as PartieTransmise
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    Number.isSafeInteger(partie.jour) &&
    Array.isArray(partie.regions) &&
    partie.regions.every((id) => typeof id === 'string') &&
    ETATS.includes(partie.etat) &&
    typeof partie.modes === 'object' &&
    partie.modes !== null &&
    typeof partie.modes.rotation === 'boolean' &&
    typeof partie.modes.cachee === 'boolean' &&
    (partie.bonus === undefined || estBonusTransmis(partie.bonus))
  )
}

function estBonusTransmis(valeur: unknown): valeur is BonusTransmis {
  const bonus = valeur as BonusTransmis
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    Array.isArray(bonus.paires) &&
    bonus.paires.every(
      (paire) =>
        Array.isArray(paire) && paire.length === 2 && paire.every((code: unknown) => typeof code === 'string'),
    ) &&
    ETATS_BONUS.includes(bonus.etat) &&
    typeof bonus.difficile === 'boolean'
  )
}

// le résumé d'une partie transmise : ce qu'il faut pour les statistiques et le score. Le bonus est rejoué sur celui
// du jour (la même région et le même ordre pour tout le monde), pour compter les départements trouvés ; il ne compte
// qu'une fois fini, terminé ou passé après au moins une réponse
export function resume(partie: PartieTransmise): Resultat {
  const resultat: Resultat = { etat: partie.etat, essais: partie.regions.length, modes: partie.modes }
  if (partie.bonus === undefined) {
    return resultat
  }
  const neuf = avecDifficulte(bonusDuJour(regionDuNumero(partie.jour), partie.jour), partie.bonus.difficile)
  const rejoue = rejouerPaires(neuf, partie.bonus.paires)
  const bonus = partie.bonus.etat === 'passe' && commence(rejoue) && bonusEnCours(rejoue) ? passer(rejoue) : rejoue
  if (!commence(bonus) || bonusEnCours(bonus)) {
    return resultat
  }
  return { ...resultat, bonus: { score: score(bonus), total: total(bonus) } }
}
