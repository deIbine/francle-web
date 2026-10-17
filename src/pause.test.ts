// usePause seul, avec de fausses minuteries : le test avance le temps lui-même, au lieu d'attendre 1,5 s pour de vrai
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PAUSE_FIN_BONUS, usePause } from './pause.ts'

describe('usePause', () => {
  // setTimeout truqué en plus de Date (preparationTests.ts ne truque que Date) ; remis à la normale après chaque test
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fait l’action une fois la pause écoulée, pas avant', () => {
    const action = vi.fn()
    const { result } = renderHook(() => usePause(action))
    act(() => result.current.lancer())
    act(() => vi.advanceTimersByTime(PAUSE_FIN_BONUS - 1))
    expect(action).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('annulée, ne fait rien', () => {
    const action = vi.fn()
    const { result } = renderHook(() => usePause(action))
    act(() => result.current.lancer())
    act(() => result.current.annuler())
    act(() => vi.advanceTimersByTime(PAUSE_FIN_BONUS))
    expect(action).not.toHaveBeenCalled()
  })

  it('ne fait rien si le composant disparaît pendant la pause', () => {
    const action = vi.fn()
    const { result, unmount } = renderHook(() => usePause(action))
    act(() => result.current.lancer())
    unmount()
    act(() => vi.advanceTimersByTime(PAUSE_FIN_BONUS))
    expect(action).not.toHaveBeenCalled()
  })
})
