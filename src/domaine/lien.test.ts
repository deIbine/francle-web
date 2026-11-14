import { describe, expect, it } from 'vitest'
import { departementsDe } from './departements.ts'
import { coder, lire } from './lien.ts'
import { SANS_MODE } from './partage.ts'
import { regionDuNumero } from './regionDuJour.ts'
import type { Resultat } from './statistiques.ts'

// le nombre de départements de la région du jour n° jour
const total = (jour: number) => departementsDe(regionDuNumero(jour)).length

describe('Le lien de comparaison', () => {
  it('toutes les parties finies se relisent à l’identique, jours sautés compris', () => {
    const historique = new Map<number, Resultat>([
      [
        3,
        { etat: 'gagnee', essais: 1, modes: { rotation: true, cachee: true }, bonus: { score: total(3), total: total(3) } },
      ],
      [4, { etat: 'gagnee', essais: 6, modes: SANS_MODE, bonus: { score: 0, total: total(4) } }],
      [5, { etat: 'perdue', essais: 6, modes: { rotation: false, cachee: true } }],
      // le jour 6 n'est pas joué
      [7, { etat: 'abandonnee', essais: 0, modes: SANS_MODE }],
      [8, { etat: 'abandonnee', essais: 5, modes: { rotation: true, cachee: false } }],
      [9, { etat: 'gagnee', essais: 3, modes: SANS_MODE }],
    ])
    const texte = coder(historique, 40)
    expect(lire(texte)).toEqual({ jourDuLien: 40, parties: historique })
  })

  it('il est court : deux caractères par jour joué, un par jour sauté, et rien que des caractères sûrs', () => {
    const historique = new Map<number, Resultat>([
      [33, { etat: 'gagnee', essais: 2, modes: SANS_MODE }],
      [35, { etat: 'perdue', essais: 6, modes: SANS_MODE }],
    ])
    // 33 s'écrit « x » en base 36 ; victoire en 2 : 1 × 4 = 4 -> E ; défaite : 6 × 4 = 24 -> Y ; sans bonus : A
    expect(coder(historique, 36)).toBe('1.10.x.EA~YA')
    expect(coder(historique, 36)).toMatch(/^[A-Za-z0-9_.~-]+$/)
  })

  it('une partie en cours ne voyage pas ; sans partie finie, le lien reste lisible', () => {
    const enCours = new Map<number, Resultat>([[12, { etat: 'en-cours', essais: 2 }]])
    expect(lire(coder(enCours, 12))).toEqual({ jourDuLien: 12, parties: new Map() })
  })

  it('un lien abîmé ou d’une autre version est refusé', () => {
    expect(lire('')).toBeUndefined()
    expect(lire('2.10.x.EA')).toBeUndefined() // autre version
    expect(lire('1.10.x.E')).toBeUndefined() // coupé au milieu d'un jour
    expect(lire('1.10.x.!A')).toBeUndefined() // caractère inconnu
    expect(lire('1.10.x.0A')).toBeUndefined() // 0 = 52 : code trop grand (51 au plus)
    expect(lire('1.1-0.x.EA')).toBeUndefined() // nombre invalide
    expect(lire('1.10.x.YB')).toBeUndefined() // un bonus après une défaite
    expect(lire('1.10.x.A_')).toBeUndefined() // plus de départements trouvés que la région n'en a
  })
})
