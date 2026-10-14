/*
Le générateur de hasard de Java (java.util.Random), recopié à l'identique : avec la même graine, il donne exactement
la même suite de nombres qu'en Java. C'est ce qui permet au site de trouver la même région du jour et le même angle
que le Francle Java.

Java décrit précisément son algorithme dans la documentation de Random : un « générateur congruentiel linéaire » sur
48 bits. À chaque tirage : graine = (graine × 0x5DEECE66D + 0xB) mod 2^48.

Les nombres de JavaScript (number) sont des doubles : ils ne représentent exactement les entiers que jusqu'à 2^53,
et la multiplication ci-dessus dépasse largement. On calcule donc avec des BigInt (entiers de taille illimitée,
écrits avec un « n » : 11n), l'équivalent de BigInteger en Java, et on reproduit à la main les débordements des long
et des int de Java.
 */

const MULTIPLICATEUR = 0x5deece66dn
const INCREMENT = 0xbn
const MASQUE_48_BITS = (1n << 48n) - 1n

export class HasardJava {
  private graine: bigint

  // new Random(graine) en Java : la graine est un long (64 bits), mélangée avec le multiplicateur
  constructor(graine: bigint) {
    this.graine = (BigInt.asIntN(64, graine) ^ MULTIPLICATEUR) & MASQUE_48_BITS
  }

  // Random.next(bits) : les « bits » bits de poids fort de la nouvelle graine, lus comme un int Java (signé)
  private suivant(bits: number): number {
    this.graine = (this.graine * MULTIPLICATEUR + INCREMENT) & MASQUE_48_BITS
    return Number(BigInt.asIntN(32, this.graine >> BigInt(48 - bits)))
  }

  // Random.nextInt(borne) : un entier de 0 inclus à borne exclue, sans biais
  entier(borne: number): number {
    if (borne <= 0) {
      throw new RangeError(`La borne doit être positive : ${borne}`)
    }
    // une puissance de 2 (16, 8, 4, 2) : Java prend directement les bits de poids fort
    if ((borne & -borne) === borne) {
      return Number((BigInt(borne) * BigInt(this.suivant(31))) >> 31n)
    }
    // sinon un modulo, en rejetant le haut de l'intervalle pour que chaque résultat ait la même chance.
    // Le test « < 0 » détecte, comme en Java, un dépassement de la capacité d'un int : « | 0 » ramène un nombre
    // JavaScript à un int 32 bits signé, comme le ferait Java
    let tirage: number
    let valeur: number
    do {
      tirage = this.suivant(31)
      valeur = tirage % borne
    } while (((tirage - valeur + (borne - 1)) | 0) < 0)
    return valeur
  }

  // Collections.shuffle(liste, random) : mélange de Fisher-Yates, du dernier élément au deuxième.
  // Renvoie une copie mélangée, la liste reçue reste intacte
  melanger<T>(liste: readonly T[]): T[] {
    const copie = [...liste]
    for (let i = copie.length; i > 1; i--) {
      const j = this.entier(i)
      ;[copie[i - 1], copie[j]] = [copie[j], copie[i - 1]]
    }
    return copie
  }
}
