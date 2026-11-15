/*
La vérification d'une partie transmise, avant que le serveur la range (web.9.2.1).

Le serveur ne peut pas savoir si le joueur connaissait la réponse (la région du jour se calcule dans la page, voir
web.9.3), mais il peut refuser une partie impossible : une région qui n'existe pas, proposée deux fois, une victoire
qui ne finit pas sur la région du jour, une défaite en moins de six essais, un bonus sans victoire. Pour cela, on
rejoue les coups avec les règles du jeu, comme la sauvegarde le fait au retour sur la page : la partie rejouée doit
arriver au même état que celui annoncé.

Écrite dans src/domaine/ et non dans serveur/ : ce sont les règles du jeu, et un test peut les vérifier sans serveur.
 */
import { avecDifficulte, bonusDuJour, rejouerPaires } from './bonus.ts'
import { abandonner, enCours, nouvellePartie, proposer, type Partie } from './partie.ts'
import { MODE_DU_JOUR, regionDuNumero } from './regionDuJour.ts'
import { estDansLeMode, REGIONS } from './regions.ts'
import type { PartieTransmise } from './transmission.ts'

// la partie, rejouée coup par coup ; undefined si un coup est impossible
function rejouee(transmise: PartieTransmise): Partie | undefined {
  let partie = nouvellePartie(regionDuNumero(transmise.jour), MODE_DU_JOUR)
  for (const id of transmise.regions) {
    const region = REGIONS.find((candidate) => candidate.id === id)
    // une région inconnue, d'une autre époque, ou proposée après la fin de la partie
    if (region === undefined || !estDansLeMode(region, MODE_DU_JOUR) || !enCours(partie)) {
      return undefined
    }
    // le plateau refuse une région déjà proposée sans coûter d'essai : elle ne peut pas être dans une vraie partie
    if (partie.essais.some((essai) => essai.region === region)) {
      return undefined
    }
    const suite = proposer(partie, region.nom.fr)
    if (suite === undefined) {
      return undefined
    }
    partie = suite
  }
  return transmise.etat === 'abandonnee' && enCours(partie) ? abandonner(partie) : partie
}

// vrai si la partie a pu être jouée telle quelle. aujourdhui : le numéro du jour pour le serveur. Un joueur en avance
// sur lui (en Nouvelle-Zélande, il est déjà demain) peut envoyer la partie du lendemain : on l'accepte, pas au-delà
export function estPossible(transmise: PartieTransmise, aujourdhui: number): boolean {
  if (transmise.jour < 1 || transmise.jour > aujourdhui + 1) {
    return false
  }
  const partie = rejouee(transmise)
  if (partie === undefined || partie.etat !== transmise.etat) {
    return false
  }
  if (transmise.bonus === undefined) {
    return true
  }
  // le bonus n'existe qu'après une victoire, et chacune de ses réponses doit avoir pu être donnée
  if (partie.etat !== 'gagnee') {
    return false
  }
  const neuf = avecDifficulte(bonusDuJour(partie.cible, transmise.jour), transmise.bonus.difficile)
  return rejouerPaires(neuf, transmise.bonus.paires).tentatives.length === transmise.bonus.paires.length
}
