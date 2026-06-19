import { describe, it, expect } from 'vitest'
import { normalizeBeatTicks } from './normalizeTrack'

describe('normalizeBeatTicks', () => {
  it('returns an empty array for null/undefined', () => {
    expect(normalizeBeatTicks(null)).toEqual([])
    expect(normalizeBeatTicks(undefined)).toEqual([])
  })

  it('passes a real array through unchanged', () => {
    const arr = [0.5, 1.0, 1.5]
    expect(normalizeBeatTicks(arr)).toBe(arr)
  })

  it('converts a keyed object (JSON-serialized typed array) to an array', () => {
    // This is the shape old cached entries had before the Array.from fix.
    const objShape = { 0: 0.46, 1: 0.94, 2: 1.44 }
    expect(normalizeBeatTicks(objShape)).toEqual([0.46, 0.94, 1.44])
  })

  it('preserves order of object values', () => {
    const objShape = { 0: 10, 1: 20, 2: 30, 3: 40 }
    expect(normalizeBeatTicks(objShape)).toEqual([10, 20, 30, 40])
  })
})
