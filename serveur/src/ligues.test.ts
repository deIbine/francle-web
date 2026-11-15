import { beforeEach, describe, expect, it } from 'vitest'
import { joursDuMois } from '../../src/domaine/classement.ts'
import { moisDuNumero, MODE_DU_JOUR, regionDuNumero } from '../../src/domaine/regionDuJour.ts'
import { tirables } from '../../src/domaine/regions.ts'
import { baseDeTest } from './base-de-test.ts'
import { MEMBRES_MAX } from './ligues.ts'
import { entretien, JOURS_DE_CONSERVATION } from './profils.ts'
import { traiter } from './serveur.ts'

// le 14 octobre 2026 à midi, temps universel : la partie n° 2
const MAINTENANT = new Date(Date.UTC(2026, 9, 14, 12))
const OCTOBRE = moisDuNumero(2)
const ADRESSE = 'https://chiffres.francle.workers.dev'

let base: ReturnType<typeof baseDeTest>
// l'horloge des entrées dans la ligue : chaque demande arrive une seconde après la précédente, pour que l'ordre
// d'entrée (le plus ancien membre) soit net
let horloge: number
beforeEach(() => {
  base = baseDeTest()
  horloge = MAINTENANT.getTime()
})

async function demander(methode: string, chemin: string, code?: string, corps?: unknown) {
  horloge += 1000
  const reponse = await traiter(
    new Request(`${ADRESSE}${chemin}`, {
      method: methode,
      headers: code === undefined ? {} : { Authorization: `Bearer ${code}` },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    }),
    base,
    new Date(horloge),
  )
  return { statut: reponse.status, corps: reponse.status === 204 ? undefined : ((await reponse.json()) as any) }
}

async function joueur(pseudo: string): Promise<{ id: string; code: string }> {
  return (await demander('POST', '/profils', undefined, { pseudo })).corps
}

async function creerLigue(code: string, nom = 'La famille') {
  return (await demander('POST', '/ligues', code, { nom })).corps
}

// la partie n° jour, gagnée en essais coups (7 − essais points)
function gagnee(jour: number, essais: number) {
  const cible = regionDuNumero(jour)
  const autres = tirables(MODE_DU_JOUR).filter((region) => region !== cible)
  const regions = [...autres.slice(0, essais - 1), cible].map((region) => region.id)
  return { jour, regions, etat: 'gagnee', modes: { rotation: false, cachee: false } }
}

describe('Créer une ligue', () => {
  it('le créateur y entre, avec un code de 6 caractères ; son profil la montre', async () => {
    const zoe = await joueur('Zoé')
    const { statut, corps } = await demander('POST', '/ligues', zoe.code, { nom: '  Les   Francleurs ' })
    expect(statut).toBe(201)
    expect(corps).toMatchObject({ nom: 'Les Francleurs', createur: true, membres: [{ pseudo: 'Zoé', createur: true }] })
    expect(corps.code).toMatch(/^[A-Z2-9]{6}$/)
    expect((await demander('GET', '/profil', zoe.code)).corps.ligue.nom).toBe('Les Francleurs')
  })

  it('refuse un nom grossier, ou sans profil', async () => {
    const zoe = await joueur('Zoé')
    expect((await demander('POST', '/ligues', zoe.code, { nom: 'Les connards' })).statut).toBe(422)
    expect((await demander('POST', '/ligues', undefined, { nom: 'La famille' })).statut).toBe(401)
  })
})

describe('Rejoindre et quitter', () => {
  it('l’aperçu par le code (même tapé en minuscules), puis rejoindre', async () => {
    const zoe = await joueur('Zoé')
    const ligue = await creerLigue(zoe.code)
    expect((await demander('GET', `/ligues/${ligue.code.toLowerCase()}`)).corps).toEqual({ nom: 'La famille', membres: 1 })
    expect((await demander('GET', '/ligues/ZZZZZZ')).statut).toBe(404)
    const tom = await joueur('Tom')
    const { corps } = await demander('POST', '/ligue/rejoindre', tom.code, { code: ligue.code })
    expect(corps.createur).toBe(false)
    expect(corps.membres.map((membre: { pseudo: string }) => membre.pseudo)).toEqual(['Zoé', 'Tom'])
  })

  it('une seule ligue : en rejoindre une autre fait quitter la première', async () => {
    const zoe = await joueur('Zoé')
    const tom = await joueur('Tom')
    const famille = await creerLigue(zoe.code)
    await demander('POST', '/ligue/rejoindre', tom.code, { code: famille.code })
    const travail = await creerLigue(tom.code, 'Le bureau')
    expect(travail.membres.map((membre: { pseudo: string }) => membre.pseudo)).toEqual(['Tom'])
    const vueDeZoe = (await demander('GET', '/profil', zoe.code)).corps.ligue
    expect(vueDeZoe.membres.map((membre: { pseudo: string }) => membre.pseudo)).toEqual(['Zoé'])
  })

  it('le créateur qui part transmet la ligue au plus ancien ; le dernier qui part l’efface', async () => {
    const [zoe, tom, eva] = [await joueur('Zoé'), await joueur('Tom'), await joueur('Eva')]
    const ligue = await creerLigue(zoe.code)
    await demander('POST', '/ligue/rejoindre', tom.code, { code: ligue.code })
    await demander('POST', '/ligue/rejoindre', eva.code, { code: ligue.code })
    expect((await demander('POST', '/ligue/quitter', zoe.code)).statut).toBe(204)
    const vueDeTom = (await demander('GET', '/profil', tom.code)).corps.ligue
    expect(vueDeTom.createur).toBe(true)
    expect(vueDeTom.membres.map((membre: { pseudo: string }) => membre.pseudo)).toEqual(['Tom', 'Eva'])
    await demander('POST', '/ligue/quitter', tom.code)
    await demander('POST', '/ligue/quitter', eva.code)
    expect(base.sql('SELECT * FROM ligues')).toEqual([])
  })

  it('une ligue pleine refuse un nouveau membre', async () => {
    const zoe = await joueur('Zoé')
    const ligue = await creerLigue(zoe.code)
    for (let i = 1; i < MEMBRES_MAX; i++) {
      base.sql(
        `INSERT INTO profils (id, pseudo, cle_pseudo, empreinte_code, empreinte_secours, dernier_jour, ligue)
         VALUES ('p${i}', 'J${i}', 'j${i}', 'c${i}', 's${i}', 2, '${ligue.id}')`,
      )
    }
    const tom = await joueur('Tom')
    const { statut, corps } = await demander('POST', '/ligue/rejoindre', tom.code, { code: ligue.code })
    expect(statut).toBe(409)
    expect(corps).toEqual({ erreur: 'ligue-pleine' })
  })
})

describe('Les pouvoirs du créateur', () => {
  it('retirer un membre et changer le code ; un autre membre ne le peut pas', async () => {
    const zoe = await joueur('Zoé')
    const tom = await joueur('Tom')
    const ligue = await creerLigue(zoe.code)
    await demander('POST', '/ligue/rejoindre', tom.code, { code: ligue.code })
    expect((await demander('POST', '/ligue/code', tom.code)).statut).toBe(403)
    expect((await demander('POST', '/ligue/retirer', tom.code, { membre: zoe.id })).statut).toBe(403)

    const apres = (await demander('POST', '/ligue/retirer', zoe.code, { membre: tom.id })).corps
    expect(apres.membres.map((membre: { pseudo: string }) => membre.pseudo)).toEqual(['Zoé'])
    expect((await demander('GET', '/profil', tom.code)).corps.ligue).toBeNull()

    const nouveau = (await demander('POST', '/ligue/code', zoe.code)).corps.code
    expect(nouveau).not.toBe(ligue.code)
    expect((await demander('GET', `/ligues/${ligue.code}`)).statut).toBe(404)
    expect((await demander('GET', `/ligues/${nouveau}`)).statut).toBe(200)
  })
})

describe('Le classement de la ligue', () => {
  it('le total du mois, tous les membres (même sans partie), et des rangs partagés', async () => {
    const [zoe, tom, eva, max] = [await joueur('Zoé'), await joueur('Tom'), await joueur('Eva'), await joueur('Max')]
    const ligue = await creerLigue(zoe.code)
    for (const membre of [tom, eva, max]) {
      await demander('POST', '/ligue/rejoindre', membre.code, { code: ligue.code })
    }
    // Zoé : 6 + 5 = 11 en 2 parties ; Tom : 6 + 5 = 11 en 2 ; Eva : 6 en 1 ; Max : rien
    await demander('POST', '/profil/parties', zoe.code, { v: 1, parties: [gagnee(1, 1), gagnee(2, 2)] })
    await demander('POST', '/profil/parties', tom.code, { v: 1, parties: [gagnee(1, 2), gagnee(2, 1)] })
    await demander('POST', '/profil/parties', eva.code, { v: 1, parties: [gagnee(2, 1)] })
    const { corps } = await demander('GET', `/ligue/classement?mois=${OCTOBRE}`, zoe.code)
    expect(corps.mois).toBe(OCTOBRE)
    expect(corps.lignes.map((l: any) => [l.rang, l.pseudo, l.total, l.parties])).toEqual([
      [1, 'Tom', 11, 2],
      [1, 'Zoé', 11, 2],
      [3, 'Eva', 6, 1],
      [4, 'Max', 0, 0],
    ])
    // le mois suivant : tout le monde repart de zéro
    const novembre = (await demander('GET', `/ligue/classement?mois=${OCTOBRE + 1}`, zoe.code)).corps
    expect(novembre.lignes.every((ligne: { total: number }) => ligne.total === 0)).toBe(true)
  })

  it('à total égal, celui qui a joué le moins de parties passe devant', async () => {
    const [zoe, tom] = [await joueur('Zoé'), await joueur('Tom')]
    const ligue = await creerLigue(zoe.code)
    await demander('POST', '/ligue/rejoindre', tom.code, { code: ligue.code })
    // Zoé : 6 en 1 partie ; Tom : 3 + 3 = 6 en 2 parties
    await demander('POST', '/profil/parties', zoe.code, { v: 1, parties: [gagnee(1, 1)] })
    await demander('POST', '/profil/parties', tom.code, { v: 1, parties: [gagnee(1, 4), gagnee(2, 4)] })
    const { corps } = await demander('GET', `/ligue/classement?mois=${OCTOBRE}`, tom.code)
    expect(corps.lignes.map((l: any) => [l.rang, l.pseudo])).toEqual([
      [1, 'Zoé'],
      [2, 'Tom'],
    ])
  })

  it('sans ligue ou sans mois valide : 400', async () => {
    const zoe = await joueur('Zoé')
    expect((await demander('GET', `/ligue/classement?mois=${OCTOBRE}`, zoe.code)).statut).toBe(400)
    await creerLigue(zoe.code)
    expect((await demander('GET', '/ligue/classement?mois=abc', zoe.code)).statut).toBe(400)
  })

  it('les jours d’un mois', () => {
    // octobre 2026 : du 1er (n° −11) au 31 (n° 19), la partie n° 1 étant le 13
    expect(joursDuMois(OCTOBRE)).toEqual([-11, 19])
  })
})

describe('Effacer un créateur', () => {
  it('« Supprimer mon profil » et l’effacement après 12 mois transmettent la ligue', async () => {
    const [zoe, tom] = [await joueur('Zoé'), await joueur('Tom')]
    const ligue = await creerLigue(zoe.code)
    await demander('POST', '/ligue/rejoindre', tom.code, { code: ligue.code })
    await demander('DELETE', '/profil', zoe.code)
    expect((await demander('GET', '/profil', tom.code)).corps.ligue).toMatchObject({ createur: true })
    // un an plus tard, sans partie, Tom est effacé à son tour : la ligue, vide, disparaît
    await entretien(base, new Date(MAINTENANT.getTime() + (JOURS_DE_CONSERVATION + 1) * 24 * 3600 * 1000))
    expect(base.sql('SELECT * FROM ligues')).toEqual([])
    expect(base.sql('SELECT * FROM profils')).toEqual([])
  })
})
