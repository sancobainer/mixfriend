import { describe, it, expect } from 'vitest'
import { crossfadeGains, syncRatio } from './mixer'

describe('crossfadeGains', () => {
  it('gives full A and silent B at position 0', () => {
    const { a, b } = crossfadeGains(0)
    expect(a).toBeCloseTo(1, 5)
    expect(b).toBeCloseTo(0, 5)
  })

  it('gives silent A and full B at position 1', () => {
    const { a, b } = crossfadeGains(1)
    expect(a).toBeCloseTo(0, 5)
    expect(b).toBeCloseTo(1, 5)
  })

  it('is equal-power at center (~0.71 each, not 0.5)', () => {
    const { a, b } = crossfadeGains(0.5)
    expect(a).toBeCloseTo(Math.SQRT1_2, 5)
    expect(b).toBeCloseTo(Math.SQRT1_2, 5)
  })

  it('keeps combined power roughly constant across the sweep', () => {
    for (const pos of [0, 0.25, 0.5, 0.75, 1]) {
      const { a, b } = crossfadeGains(pos)
      expect(a * a + b * b).toBeCloseTo(1, 5)
    }
  })
})

describe('syncRatio', () => {
  it('returns the tempo ratio of A to B', () => {
    expect(syncRatio(128, 120)).toBeCloseTo(128 / 120, 5)
    expect(syncRatio(120, 120)).toBe(1)
  })

  it('returns null when either BPM is missing or zero', () => {
    expect(syncRatio(0, 120)).toBeNull()
    expect(syncRatio(128, 0)).toBeNull()
    expect(syncRatio(null, 120)).toBeNull()
    expect(syncRatio(128, undefined)).toBeNull()
  })
})
