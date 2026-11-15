import { beforeEach, describe, expect, it } from 'vitest'
import { MODE_DU_JOUR, regionDuNumero } from '../../src/domaine/regionDuJour.ts'
import { tirables } from '../../src/domaine/regions.ts'
import { baseDeTest } from './base-de-test.ts'
import { traiter } from './serveur.ts'
import { entretien, JOURS_DE_CONSERVATION } from './profils.ts'

// le 14 octobre 2026 à midi, temps universel : la partie n° 2
const MAINTENANT = new Date(Date.UTC(2026, 9, 14, 12))
const ADRESSE = 'https://chiffres.francle.workers.dev'
const SANS_MODE = { rotation: false, cachee: false }

let base: ReturnType<typeof baseDeTest>
beforeEach(() => {
  base = baseDeTest()
})

function demander(methode: string, chemin: string, corps?: unknown, code?: string, maintenant = MAINTENANT) {
  return traiter(
    new Request(`${ADRESSE}${chemin}`, {
      method: methode,
      headers: code === undefined ? {} : { Authorization: `Bearer ${code}` },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    }),
    base,
    maintenant,
  )
}

async function creer(pseudo: string) {
  const reponse = await demander('POST', '/profils', { pseudo })
  return { reponse, profil: (await reponse.json()) as { id: string; pseudo: string; code: string; secours: string } }
}

// la partie du jour n° jour, gagnée en essais coups
function gagnee(jour: number, essais = 1) {
  const cible = regionDuNumero(jour)
  const autres = tirables(MODE_DU_JOUR).filter((region) => region !== cible)
  return { jour, regions: [...autres.slice(0, essais - 1), cible].map((r) => r.id), etat: 'gagnee', modes: SANS_MODE }
}

function lignes(table: string) {
  return base.sql(`SELECT * FROM ${table}`)
}

describe('Créer un profil', () => {
  it('donne un identifiant, le code secret et le code de secours ; le serveur ne garde que leurs empreintes', async () => {
    const { reponse, profil } = await creer('  Loutre   bretonne ')
    expect(reponse.status).toBe(201)
    expect(profil.pseudo).toBe('Loutre bretonne')
    expect(profil.code).toMatch(/^[0-9a-f]{32}$/)
    expect(profil.secours).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)
    const [ligne] = lignes('profils')
    expect(ligne.cle_pseudo).toBe('loutrebretonne')
    // ni le code ni le code de secours ne sont dans la base, seulement leurs empreintes (64 chiffres hexadécimaux)
    expect(JSON.stringify(ligne)).not.toContain(profil.code)
    expect(ligne.empreinte_code).toMatch(/^[0-9a-f]{64}$/)
    expect(ligne.dernier_jour).toBe(2)
  })

  it('refuse un pseudo déjà pris (sans tenir compte des accents et des majuscules), ou refusé', async () => {
    await creer('Clément')
    const pris = await demander('POST', '/profils', { pseudo: 'clement' })
    expect(pris.status).toBe(409)
    expect(await pris.json()).toEqual({ erreur: 'pseudo-pris' })
    const refuse = await demander('POST', '/profils', { pseudo: 'Gros connard' })
    expect(refuse.status).toBe(422)
    expect(await refuse.json()).toEqual({ erreur: 'pseudo-refuse', raison: 'mot' })
    expect((await demander('POST', '/profils', { nom: 'oubli' })).status).toBe(400)
    expect(lignes('profils')).toHaveLength(1)
  })
})

describe('Le code secret', () => {
  it('ouvre le profil ; sans lui ou avec un faux, 401', async () => {
    const { profil } = await creer('Zoé')
    const reponse = await demander('GET', '/profil', undefined, profil.code)
    expect(await reponse.json()).toEqual({ id: profil.id, pseudo: 'Zoé' })
    expect((await demander('GET', '/profil')).status).toBe(401)
    expect((await demander('GET', '/profil', undefined, 'f'.repeat(32))).status).toBe(401)
  })

  it('le code de secours donne un nouveau code secret, et l’ancien ne marche plus', async () => {
    const { profil } = await creer('Zoé')
    // tapé à la main, en minuscules et sans tirets
    const reponse = await demander('POST', '/profil/secours', { secours: profil.secours.toLowerCase().replace(/-/g, ' ') })
    const restaure = (await reponse.json()) as { id: string; code: string }
    expect(restaure.id).toBe(profil.id)
    expect(restaure.code).not.toBe(profil.code)
    expect((await demander('GET', '/profil', undefined, restaure.code)).status).toBe(200)
    expect((await demander('GET', '/profil', undefined, profil.code)).status).toBe(401)
    expect((await demander('POST', '/profil/secours', { secours: 'AAAA-BBBB-CCCC-DDDD' })).status).toBe(404)
  })
})

describe('Les parties d’un profil', () => {
  it('sont rangées une par jour, avec leurs points ; une partie renvoyée remplace la précédente', async () => {
    const { profil } = await creer('Zoé')
    const reponse = await demander('POST', '/profil/parties', { v: 1, parties: [gagnee(1), gagnee(2, 3)] }, profil.code)
    expect(await reponse.json()).toEqual({ rangees: 2, ignorees: 0 })
    await demander('POST', '/profil/parties', { v: 1, parties: [gagnee(2, 2)] }, profil.code)
    const parties = lignes('parties_profil')
    expect(parties.map((partie) => [partie.jour, partie.points])).toEqual([
      [1, 6],
      [2, 5],
    ])
    // les parties d'un profil ne se mêlent pas aux parties anonymes
    expect(lignes('parties')).toEqual([])
  })

  it('ignore les parties impossibles ; sans code, 401', async () => {
    const { profil } = await creer('Zoé')
    const reponse = await demander('POST', '/profil/parties', { v: 1, parties: [{ ...gagnee(2), regions: ['atlantide'] }] }, profil.code)
    expect(await reponse.json()).toEqual({ rangees: 0, ignorees: 1 })
    expect((await demander('POST', '/profil/parties', { v: 1, parties: [gagnee(2)] })).status).toBe(401)
  })
})

describe('Effacer', () => {
  it('« Supprimer mon profil » efface le profil et ses parties, et libère le pseudo', async () => {
    const { profil } = await creer('Zoé')
    await demander('POST', '/profil/parties', { v: 1, parties: [gagnee(2)] }, profil.code)
    expect((await demander('DELETE', '/profil', undefined, profil.code)).status).toBe(204)
    expect(lignes('profils')).toEqual([])
    expect(lignes('parties_profil')).toEqual([])
    expect((await creer('zoe')).reponse.status).toBe(201)
  })

  it('l’entretien de la nuit efface les profils sans partie depuis 365 jours, et les parties anonymes de plus de 365 jours', async () => {
    const { profil: ancien } = await creer('Ancien')
    await demander('POST', '/profil/parties', { v: 1, parties: [gagnee(2)] }, ancien.code)
    // un an et un jour plus tard, un autre joueur se crée un profil et joue
    const plusTard = new Date(MAINTENANT.getTime() + (JOURS_DE_CONSERVATION + 1) * 24 * 3600 * 1000)
    const recent = (await (await demander('POST', '/profils', { pseudo: 'Récent' }, undefined, plusTard)).json()) as {
      code: string
    }
    base.sql(`INSERT INTO parties (tirage, jour, partie, points) VALUES ('${'a'.repeat(32)}', 2, '{}', 6)`)
    await entretien(base, plusTard)
    expect(lignes('profils').map((ligne) => ligne.pseudo)).toEqual(['Récent'])
    expect(lignes('parties_profil')).toEqual([])
    expect(lignes('parties')).toEqual([])
    expect((await demander('GET', '/profil', undefined, recent.code, plusTard)).status).toBe(200)
  })
})
