/*
Le lien de comparaison (web.9.1.3) : l'adresse du jeu suivie du bilan codé (lien.ts) dans le fragment, la partie
après « # ».

    https://deibine.github.io/francle-web/#bilan=1.x.k.EA~YA

Le fragment a deux qualités ici. Le navigateur ne l'envoie jamais au serveur (GitHub Pages ne reçoit que
« /francle-web/ ») : le bilan voyage seulement d'un joueur à l'autre. Et changer le fragment ne recharge pas la page :
un lien collé dans un onglet déjà ouvert sur le jeu prévient la page (l'évènement « hashchange »), sans perdre la
partie en cours.

Le « face-à-face » compare les jours que les deux joueurs ont joués : qui a eu le plus de points ce jour-là.
 */
import { coder } from './lien.ts'
import { ADRESSE } from './partage.ts'
import { points } from './score.ts'
import type { Resultat } from './statistiques.ts'

export const PREFIXE = '#bilan='

export function adresseDuBilan(historique: ReadonlyMap<number, Resultat>, aujourdhui: number): string {
  return ADRESSE + PREFIXE + coder(historique, aujourdhui)
}

// le bilan codé d'un fragment (« #bilan=… » -> « … ») ; undefined si le fragment n'est pas un lien de comparaison
export function bilanDuFragment(fragment: string): string | undefined {
  return fragment.startsWith(PREFIXE) ? fragment.slice(PREFIXE.length) : undefined
}

export interface FaceAFace {
  // les jours où les deux ont fini une partie, et qui a eu le plus de points
  readonly jours: number
  readonly moi: number
  readonly ami: number
  readonly egalites: number
}

export function faceAFace(moi: ReadonlyMap<number, Resultat>, ami: ReadonlyMap<number, Resultat>): FaceAFace {
  let resultat = { jours: 0, moi: 0, ami: 0, egalites: 0 }
  for (const [jour, mienne] of moi) {
    const sienne = ami.get(jour)
    if (sienne === undefined || mienne.etat === 'en-cours' || sienne.etat === 'en-cours') {
      continue
    }
    const ecart = points(mienne) - points(sienne)
    resultat = {
      jours: resultat.jours + 1,
      moi: resultat.moi + (ecart > 0 ? 1 : 0),
      ami: resultat.ami + (ecart < 0 ? 1 : 0),
      egalites: resultat.egalites + (ecart === 0 ? 1 : 0),
    }
  }
  return resultat
}
