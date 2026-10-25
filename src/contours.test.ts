import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useContours, type Contours } from './contours.ts'

const CONTOURS: Contours = { largeur: 10, hauteur: 10, departements: [] }

describe('Le téléchargement des contours', () => {
  it('un échec se voit (plus de « Chargement… » sans fin), et « réessayer » relance le téléchargement', async () => {
    // une fausse fonction de téléchargement : elle échoue la première fois (plus de réseau), réussit ensuite
    const charger = vi
      .fn<(region: string) => Promise<Contours>>()
      .mockRejectedValueOnce(new Error('réseau coupé'))
      .mockResolvedValue(CONTOURS)
    // renderHook : fait tourner le hook dans un petit composant de test, et donne accès à ce qu'il renvoie
    const { result } = renderHook(() => useContours('corse', charger))
    expect(result.current).toMatchObject({ contours: undefined, echec: false })

    await waitFor(() => expect(result.current.echec).toBe(true))
    expect(result.current.contours).toBeUndefined()

    // act : laisse React appliquer le changement d'état avant de regarder le résultat
    act(() => result.current.reessayer())
    // pendant le nouvel essai, on attend de nouveau, sans afficher l'échec d'avant
    expect(result.current.echec).toBe(false)
    await waitFor(() => expect(result.current.contours).toBe(CONTOURS))
    expect(charger).toHaveBeenCalledTimes(2)
  })
})
