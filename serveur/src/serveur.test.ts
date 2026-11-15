import { beforeEach, describe, expect, it } from 'vitest'
import { bonusDuJour, restants } from '../../src/domaine/bonus.ts'
import { TAILLE_MAX_ENVOI, type PartieEnvoyee } from '../../src/domaine/chiffres.ts'
import { MODE_DU_JOUR, regionDuNumero } from '../../src/domaine/regionDuJour.ts'
import { tirables } from '../../src/domaine/regions.ts'
import type { Base } from './base.ts'
import { baseDeTest } from './base-de-test.ts'
import { traiter } from './serveur.ts'

// le 14 octobre 2026 à midi, temps universel : la partie n° 2
const MAINTENANT = new Date(Date.UTC(2026, 9, 14, 12))
const JOUR = 2
const CIBLE = regionDuNumero(JOUR)
const AUTRES = tirables(MODE_DU_JOUR)
  .filter((region) => region !== CIBLE)
  .map((region) => region.id)
const SITE = 'https://deibine.github.io'
const ADRESSE = 'https://chiffres.francle.workers.dev'

const tirage = (lettre: string) => lettre.repeat(32)

function gagnee(lettre: string, essais: number, autres: Partial<PartieEnvoyee> = {}): PartieEnvoyee {
  return {
    tirage: tirage(lettre),
    jour: JOUR,
    regions: [...AUTRES.slice(0, essais - 1), CIBLE.id],
    etat: 'gagnee',
    modes: { rotation: false, cachee: false },
    ...autres,
  }
}

let base: ReturnType<typeof baseDeTest>
beforeEach(() => {
  base = baseDeTest()
})

// comme le site : le JSON envoyé en texte simple (voir src/serveur.ts, côté site)
function envoyer(parties: unknown[], origine = SITE, laBase: Base = base) {
  return traiter(
    new Request(`${ADRESSE}/parties`, {
      method: 'POST',
      headers: { Origin: origine, 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ v: 1, parties }),
    }),
    laBase,
    MAINTENANT,
  )
}

async function chiffres(jour: number) {
  const reponse = await traiter(new Request(`${ADRESSE}/chiffres/${jour}`, { headers: { Origin: SITE } }), base, MAINTENANT)
  return { reponse, contenu: (await reponse.json()) as { joueurs: number; points: number[] } }
}

describe('POST /parties', () => {
  it('range chaque partie sur une ligne : son tirage, le jour, la partie sans le tirage, ses points', async () => {
    const reponse = await envoyer([gagnee('a', 2, { modes: { rotation: true, cachee: false } })])
    expect(reponse.status).toBe(200)
    expect(await reponse.json()).toEqual({ rangees: 1, ignorees: 0 })
    const [ligne] = base.lignes()
    expect(Object.keys(ligne).sort()).toEqual(['jour', 'partie', 'points', 'tirage'])
    expect(ligne.tirage).toBe(tirage('a'))
    expect(ligne.jour).toBe(JOUR)
    // victoire en 2 essais : 5 points, + 1 pour 🌀
    expect(ligne.points).toBe(6)
    expect(JSON.parse(ligne.partie as string)).toEqual({
      jour: JOUR,
      regions: [AUTRES[0], CIBLE.id],
      etat: 'gagnee',
      modes: { rotation: true, cachee: false },
    })
  })

  it('remplace une partie renvoyée (le bonus fini) au lieu d’en ajouter une', async () => {
    await envoyer([gagnee('a', 1)])
    const codes = restants(bonusDuJour(CIBLE, JOUR)).map((departement) => departement.code)
    const bonus = { paires: codes.map((code) => [code, code] as [string, string]), etat: 'termine' as const, difficile: false }
    await envoyer([gagnee('a', 1, { bonus })])
    const lignes = base.lignes()
    expect(lignes).toHaveLength(1)
    // 6 points pour la victoire en 1 essai, + 2 pour le bonus entièrement trouvé
    expect(lignes[0].points).toBe(8)
  })

  it('ne déplace pas une partie vers un autre jour', async () => {
    await envoyer([gagnee('a', 1)])
    const demain = regionDuNumero(JOUR + 1)
    await envoyer([{ ...gagnee('a', 1), jour: JOUR + 1, regions: [demain.id] }])
    expect(base.lignes().map((ligne) => ligne.jour)).toEqual([JOUR])
  })

  it('ignore les parties en cours ou impossibles, et range les autres', async () => {
    const reponse = await envoyer([
      gagnee('a', 3),
      { ...gagnee('b', 1), etat: 'en-cours', regions: [] },
      { ...gagnee('c', 1), regions: ['atlantide'] },
    ])
    expect(await reponse.json()).toEqual({ rangees: 1, ignorees: 2 })
    expect(base.lignes().map((ligne) => ligne.tirage)).toEqual([tirage('a')])
  })

  it('refuse un envoi illisible ou trop gros, sans rien ranger', async () => {
    expect((await envoyer([{ ...gagnee('a', 1), tirage: 'court' }])).status).toBe(400)
    const illisible = new Request(`${ADRESSE}/parties`, { method: 'POST', body: '{pas du json' })
    expect((await traiter(illisible, base, MAINTENANT)).status).toBe(400)
    const gros = new Request(`${ADRESSE}/parties`, { method: 'POST', body: 'x'.repeat(TAILLE_MAX_ENVOI + 1) })
    expect((await traiter(gros, base, MAINTENANT)).status).toBe(413)
    expect(base.lignes()).toEqual([])
  })

  it('répond 503 si la base ne répond pas', async () => {
    const enPanne: Base = {
      prepare: () => {
        throw new Error('quota dépassé')
      },
      batch: () => Promise.reject(new Error('quota dépassé')),
    }
    const reponse = await envoyer([gagnee('a', 1)], SITE, enPanne)
    expect(reponse.status).toBe(503)
    expect(await reponse.json()).toEqual({ erreur: 'serveur indisponible' })
  })
})

describe('GET /chiffres/<jour>', () => {
  it('donne les chiffres du jour, et seulement des nombres', async () => {
    await envoyer([
      gagnee('a', 1),
      gagnee('b', 3),
      gagnee('c', 3, { modes: { rotation: true, cachee: true } }),
      { ...gagnee('d', 1), regions: AUTRES.slice(0, 6), etat: 'perdue' },
    ])
    const { reponse, contenu } = await chiffres(JOUR)
    expect(reponse.status).toBe(200)
    expect(reponse.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(contenu).toEqual({
      jour: JOUR,
      joueurs: 4,
      victoires: 3,
      repartition: [1, 0, 2, 0, 0, 0],
      // perdue : 0 ; victoire en 3 : 4 ; en 3 avec 🌀 et 🙈 : 6 ; en 1 : 6
      points: [1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0],
    })
  })

  it('donne des zéros pour un jour sans partie', async () => {
    const { contenu } = await chiffres(40)
    expect(contenu.joueurs).toBe(0)
    expect(contenu.points).toEqual(Array(11).fill(0))
  })
})

describe('les autres demandes', () => {
  it('laisse le site lire les réponses (CORS), pas un autre site', async () => {
    const duSite = await envoyer([gagnee('a', 1)])
    expect(duSite.headers.get('Access-Control-Allow-Origin')).toBe(SITE)
    const dAilleurs = await envoyer([gagnee('b', 1)], 'https://ailleurs.example')
    expect(dAilleurs.headers.get('Access-Control-Allow-Origin')).toBeNull()
    const question = await traiter(
      new Request(`${ADRESSE}/parties`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } }),
      base,
      MAINTENANT,
    )
    expect(question.status).toBe(204)
    expect(question.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('répond 404 à une adresse inconnue', async () => {
    for (const chemin of ['/', '/chiffres/abc', '/parties/1']) {
      expect((await traiter(new Request(`${ADRESSE}${chemin}`), base, MAINTENANT)).status).toBe(404)
    }
  })
})
