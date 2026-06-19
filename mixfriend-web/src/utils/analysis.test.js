import { describe, it, expect } from 'vitest'
import { correctOctaveError, getForwardPhraseMarkers, getCamelotCode } from './analysis'

describe('correctOctaveError', () => {
  it('leaves a BPM already in the 90-180 range unchanged', () => {
    expect(correctOctaveError(128)).toBe(128)
    expect(correctOctaveError(90)).toBe(90)
    expect(correctOctaveError(180)).toBe(180)
  })

  it('doubles a half-tempo detection up into range', () => {
    expect(correctOctaveError(64)).toBe(128) // 64 -> 128
    expect(correctOctaveError(70)).toBe(140) // 70 -> 140
  })

  it('halves a double-tempo detection down into range', () => {
    expect(correctOctaveError(256)).toBe(128) // 256 -> 128
    expect(correctOctaveError(350)).toBe(175) // 350 -> 175
  })

  it('handles values multiple octaves out of range', () => {
    expect(correctOctaveError(32)).toBe(128) // 32 -> 64 -> 128
  })
})

describe('getForwardPhraseMarkers', () => {
  // A simple 1-second-per-beat grid for easy arithmetic.
  const grid = Array.from({ length: 40 }, (_, i) => i)

  it('returns empty for an empty or missing grid', () => {
    expect(getForwardPhraseMarkers([], 5, 8)).toEqual([])
    expect(getForwardPhraseMarkers(null, 5, 8)).toEqual([])
  })

  it('steps forward by beatsPerBar from the nearest beat to the anchor', () => {
    // anchor at t=0, 8-beat steps -> beats 8, 16, 24, 32
    expect(getForwardPhraseMarkers(grid, 0, 8)).toEqual([8, 16, 24, 32])
  })

  it('snaps the anchor to the nearest beat first', () => {
    // anchor 4.4 -> nearest beat 4; 8-beat steps -> 12, 20, 28, 36
    expect(getForwardPhraseMarkers(grid, 4.4, 8)).toEqual([12, 20, 28, 36])
  })

  it('respects the count parameter', () => {
    expect(getForwardPhraseMarkers(grid, 0, 8, 2)).toEqual([8, 16])
  })

  it('stops at the end of the grid instead of going out of bounds', () => {
    // anchor near the end -> fewer than `count` markers available
    expect(getForwardPhraseMarkers(grid, 30, 8)).toEqual([38])
  })

  it('uses 16-beat steps for 16-bar phrasing', () => {
    expect(getForwardPhraseMarkers(grid, 0, 16)).toEqual([16, 32])
  })
})

describe('getCamelotCode', () => {
  it('maps major keys to their B codes', () => {
    expect(getCamelotCode('C', 'major')).toBe('8B')
    expect(getCamelotCode('E', 'major')).toBe('12B')
  })

  it('maps minor keys to their A codes', () => {
    expect(getCamelotCode('A', 'minor')).toBe('8A')
    expect(getCamelotCode('C', 'minor')).toBe('5A')
  })

  it('normalizes flats to sharps', () => {
    // Ab minor should resolve via G# minor -> 1A
    expect(getCamelotCode('Ab', 'minor')).toBe('1A')
    expect(getCamelotCode('Bb', 'major')).toBe('6B')
  })

  it('defaults to the major table when scale is not minor', () => {
    expect(getCamelotCode('C', undefined)).toBe('8B')
  })

  it('returns null for an unknown key', () => {
    expect(getCamelotCode('H', 'major')).toBeNull()
  })
})
