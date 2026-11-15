import { beforeEach, describe, expect, it } from 'vitest'
import { moisDuNumero, MODE_DU_JOUR, regionDuNumero } from '../../src/domaine/regionDuJour.ts'
import { tirables } from '../../src/domaine/regions.ts'
import { baseDeTest } from './base-de-test.ts'
import { PREMIERS } from './public.ts'
import { traiter } from './serveur.ts'

const MAINTENANT = new Date(Date.UTC(2026, 9, 14, 12))
const OCTOBRE = moisDuNumero(2)
const ADRESSE = 'https://chiffres.francle.workers.dev'
const CLE_MODERATION = 'cle-de-moderation-de-test'

let base: ReturnType<typeof baseDeTest>
beforeEach(() => {
  base = baseDeTest()
})

async function demander(methode: string, chemin: string, code?: string, corps?: unknown) {
  const reponse = await traiter(
    new Request(`${ADRESSE}${chemin}`, {
      method: methode,
      headers: code === undefined ? {} : { Authorization: `Bearer ${code}` },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    }),
    base,
    MAINTENANT,
    CLE_MODERATION,
  )
  return { statut: reponse.status, corps: (await reponse.json()) as any }
}

async function joueur(pseudo: string, essais?: number): Promise<{ id: string; code: string }> {
  const cree = (await demander('POST', '/profils', undefined, { pseudo })).corps
  if (essais !== undefined) {
    const cible = regionDuNumero(2)
    const autres = tirables(MODE_DU_JOUR).filter((region) => region !== cible)
    const regions = [...autres.slice(0, essais - 1), cible].map((region) => region.id)
    await demander('POST', '/profil/parties', cree.code, {
      v: 1,
      parties: [{ jour: 2, regions, etat: 'gagnee', modes: { rotation: false, cachee: false } }],
    })
  }
  return cree
}

const classement = (code?: string) => demander('GET', `/classement?mois=${OCTOBRE}`, code)

describe('Le classement public', () => {
  it('tout profil qui a joué ce mois-ci, lisible sans profil ; pas ceux qui n’ont pas joué', async () => {
    await joueur('Zoé', 1)
    await joueur('Tom', 3)
    await joueur('Eva')
    const { statut, corps } = await classement()
    expect(statut).toBe(200)
    expect(corps.joueurs).toBe(2)
    expect(corps.lignes.map((l: any) => [l.rang, l.pseudo, l.total])).toEqual([
      [1, 'Zoé', 6],
      [2, 'Tom', 4],
    ])
    expect(corps.moi).toBeUndefined()
  })

  it('seuls les 100 premiers sont envoyés ; le joueur plus loin reçoit sa ligne, avec son vrai rang', async () => {
    // 100 joueurs à 6 points, insérés directement dans la base
    for (let i = 0; i < PREMIERS; i++) {
      base.sql(
        `INSERT INTO profils (id, pseudo, cle_pseudo, empreinte_code, empreinte_secours, dernier_jour)
         VALUES ('p${i}', 'J${i}', 'j${i}', 'c${i}', 's${i}', 2)`,
      )
      base.sql(`INSERT INTO parties_profil (profil, jour, partie, points) VALUES ('p${i}', 2, '{}', 6)`)
    }
    const tom = await joueur('Tom', 3)
    const { corps } = await classement(tom.code)
    expect(corps.lignes).toHaveLength(PREMIERS)
    expect(corps.joueurs).toBe(PREMIERS + 1)
    expect(corps.moi).toMatchObject({ pseudo: 'Tom', rang: PREMIERS + 1, total: 4 })
  })
})

describe('Signaler et modérer', () => {
  it('un signalement par joueur ; la modération voit les signalés, retire un pseudo, puis le remet', async () => {
    const zoe = await joueur('Zoé', 1)
    const [tom, eva] = [await joueur('Tom', 2), await joueur('Eva', 2)]
    await demander('POST', '/signaler', tom.code, { profil: zoe.id })
    await demander('POST', '/signaler', tom.code, { profil: zoe.id })
    await demander('POST', '/signaler', eva.code, { profil: zoe.id })
    // on ne se signale pas soi-même
    await demander('POST', '/signaler', zoe.code, { profil: zoe.id })
    const liste = await demander('GET', '/moderation', CLE_MODERATION)
    expect(liste.corps).toEqual([{ id: zoe.id, pseudo: 'Zoé', masque: false, signalements: 2 }])

    await demander('POST', '/moderation/masquer', CLE_MODERATION, { profil: zoe.id, masque: true })
    expect((await classement()).corps.lignes.map((l: any) => l.pseudo)).toEqual(['Eva', 'Tom'])
    // Zoé le sait, et ne se voit plus dans le classement public
    expect((await demander('GET', '/profil', zoe.code)).corps.masque).toBe(true)
    expect((await classement(zoe.code)).corps.moi).toBeUndefined()

    await demander('POST', '/moderation/masquer', CLE_MODERATION, { profil: zoe.id, masque: false })
    expect((await classement()).corps.lignes.map((l: any) => l.pseudo)).toContain('Zoé')
    // remise dans le public, ses signalements ont été examinés : ils sont effacés
    expect((await demander('GET', '/moderation', CLE_MODERATION)).corps).toEqual([])
  })

  it('la modération est fermée sans la bonne clé, ou si le serveur n’en a pas', async () => {
    const zoe = await joueur('Zoé', 1)
    expect((await demander('GET', '/moderation', 'mauvaise')).statut).toBe(403)
    expect((await demander('GET', '/moderation', zoe.code)).statut).toBe(403)
    expect((await demander('POST', '/moderation/masquer', 'mauvaise', { profil: zoe.id, masque: true })).statut).toBe(403)
    const sansCle = await traiter(
      new Request(`${ADRESSE}/moderation`, { headers: { Authorization: 'Bearer ' } }),
      base,
      MAINTENANT,
    )
    expect(sansCle.status).toBe(403)
  })

  it('supprimer un profil efface aussi les signalements qu’il a faits ou reçus', async () => {
    const [zoe, tom] = [await joueur('Zoé', 1), await joueur('Tom', 2)]
    await demander('POST', '/signaler', tom.code, { profil: zoe.id })
    await demander('POST', '/signaler', zoe.code, { profil: tom.id })
    await traiter(new Request(`${ADRESSE}/profil`, { method: 'DELETE', headers: { Authorization: `Bearer ${zoe.code}` } }), base, MAINTENANT)
    expect(base.sql('SELECT * FROM signalements')).toEqual([])
  })
})
