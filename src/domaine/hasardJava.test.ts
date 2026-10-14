import { describe, expect, it } from 'vitest'
import { HasardJava } from './hasardJava.ts'

// Valeurs calculées par Java lui-même (jshell, JDK 21) : new Random(…).nextInt(…) et Collections.shuffle(…)
describe('HasardJava', () => {
  it('donne la même suite que new Random(42).nextInt(…)', () => {
    const hasard = new HasardJava(42n)
    // 100 et 360 : le cas général (modulo) ; 16 : une puissance de 2 ; un milliard : le rejet devient fréquent
    expect([hasard.entier(100), hasard.entier(100), hasard.entier(16), hasard.entier(360), hasard.entier(1_000_000_007)])
      .toEqual([30, 63, 10, 44, 662969970])
  })

  it('mélange comme Collections.shuffle(liste, new Random(-7))', () => {
    expect(new HasardJava(-7n).melanger(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual(['b', 'c', 'g', 'f', 'a', 'd', 'e'])
  })

  it('accepte une graine de plus de 53 bits sans perte, comme un long Java', () => {
    expect(new HasardJava(0x4672616e636c65n + 123456789n).entier(18)).toBe(10)
  })

  it('ne modifie pas la liste reçue', () => {
    const liste = [1, 2, 3, 4, 5]
    new HasardJava(1n).melanger(liste)
    expect(liste).toEqual([1, 2, 3, 4, 5])
  })

  it('refuse une borne nulle ou négative, comme Java', () => {
    expect(() => new HasardJava(1n).entier(0)).toThrow(RangeError)
  })
})
