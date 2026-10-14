/*
Le texte à partager à la fin de la partie, à la Worldle : le numéro, le score, et une ligne de carrés par essai.

    #Francle n° 12 3/6
    🟩🟩🟨⬜⬜↗️
    🟩🟩🟩🟩🟨⬅️
    🟩🟩🟩🟩🟩🎉
    https://deibine.github.io/francle-web/

Les carrés s'inspirent de generateSquareCharacters (src/domain/geography.ts de Worldle,
Copyright (c) 2022 teuteuf, licence MIT) : un carré vert par tranche de 20 % de proximité, un jaune s'il reste au
moins 10 %, et du blanc pour compléter. Ni les noms des régions, ni les indices : on ne gâche pas la réponse.
 */
import { EMOJIS } from './geographie.ts'
import { ESSAIS_MAX, type Partie } from './partie.ts'

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

export function textePartage(partie: Partie, numero: number): string {
  const lignes = partie.essais.map((essai) => carres(essai.proximite) + EMOJIS[essai.direction])
  return [`#Francle n° ${numero} ${score(partie)}`, ...lignes, ADRESSE].join('\n')
}
