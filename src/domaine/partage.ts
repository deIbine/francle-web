/*
Le texte à partager à la fin de la partie, à la Worldle : le numéro, le score, et une ligne de carrés par essai.

    #Francle n° 12 3/6        (« #Francle #12 3/6 » en anglais, suivi de 🌀 et/ou 🙈 en mode difficile)
    🟩🟩🟨⬜⬜↗️
    🟩🟩🟩🟩🟨⬅️
    🟩🟩🟩🟩🟩🎉
    🗺️ 9/12                  (le bonus des départements, une fois fini : 9 trouvés sur 12 ; suivi de 💪 dans sa
                              version difficile)
    https://deibine.github.io/francle-web/

Les carrés s'inspirent de generateSquareCharacters (src/domain/geography.ts de Worldle,
Copyright (c) 2022 teuteuf, licence MIT) : un carré vert par tranche de 20 % de proximité, un jaune s'il reste au
moins 10 %, et du blanc pour compléter. Ni les noms des régions, ni les indices : on ne gâche pas la réponse.
 */
import { EMOJIS } from './geographie.ts'
import { ESSAIS_MAX, type Partie } from './partie.ts'
import type { Langue } from './regions.ts'
import type { ScoreBonus } from './statistiques.ts'

// les modes difficiles avec lesquels la partie a été jouée : fixés au premier essai
export interface ModesDifficiles {
  readonly rotation: boolean
  readonly cachee: boolean
}

export const SANS_MODE: ModesDifficiles = { rotation: false, cachee: false }

// le bonus fini, tel qu'il se partage : son score, et sa version (difficile : les 101 départements proposés)
export interface BonusPartage extends ScoreBonus {
  readonly difficile: boolean
}

export const ADRESSE = 'https://deibine.github.io/francle-web/'

const CARRES = 5

// les cinq carrés d'un pourcentage de proximité : 87 % -> 🟩🟩🟩🟩⬜ (4 × 20 = 80, il reste 7 : moins de 10)
export function carres(proximite: number): string {
  const verts = Math.floor(proximite / 20)
  const jaunes = proximite - verts * 20 >= 10 ? 1 : 0
  return '🟩'.repeat(verts) + '🟨'.repeat(jaunes) + '⬜'.repeat(CARRES - verts - jaunes)
}

// le score : « 3/6 » si trouvée en 3 essais, « X/6 » si perdue ou abandonnée (comme Wordle)
export function score(partie: Partie): string {
  return `${partie.etat === 'gagnee' ? partie.essais.length : 'X'}/${ESSAIS_MAX}`
}

// « 🌀 » si la silhouette était tournée, « 🙈 » si elle était cachée, rien sinon : un défi relevé se voit
export function emojisModes(modes: ModesDifficiles): string {
  return (modes.rotation ? '🌀' : '') + (modes.cachee ? '🙈' : '')
}

// le numéro de la partie, à la française (« n° 12 ») ou à l'anglaise (« #12 »)
const NUMERO: Record<Langue, (numero: number) => string> = { fr: (n) => `n° ${n}`, en: (n) => `#${n}` }

export function textePartage(
  partie: Partie,
  numero: number,
  modes: ModesDifficiles = SANS_MODE,
  langue: Langue = 'fr',
  bonus?: BonusPartage,
): string {
  const lignes = partie.essais.map((essai) => carres(essai.proximite) + EMOJIS[essai.direction])
  if (bonus !== undefined) {
    lignes.push(`🗺️ ${bonus.score}/${bonus.total}` + (bonus.difficile ? ' 💪' : ''))
  }
  const titre = [`#Francle ${NUMERO[langue](numero)}`, score(partie), emojisModes(modes)].filter(
    (morceau) => morceau !== '',
  )
  return [titre.join(' '), ...lignes, ADRESSE].join('\n')
}
