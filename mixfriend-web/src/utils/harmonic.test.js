import { describe, it, expect } from 'vitest'
import { harmonicRelation } from './harmonic'

describe('harmonicRelation', () => {
  it('identifies the same key', () => {
    const r = harmonicRelation('8A', '8A')
    expect(r).toEqual({ compatible: true, label: 'same key' })
  })

  it('identifies relative major/minor (same number, opposite letter)', () => {
    const r = harmonicRelation('8A', '8B')
    expect(r).toEqual({ compatible: true, label: 'relative' })
  })

  it('identifies adjacent keys (±1, same letter)', () => {
    expect(harmonicRelation('8A', '9A').label).toBe('adjacent')
    expect(harmonicRelation('8A', '7A').label).toBe('adjacent')
    expect(harmonicRelation('8A', '9A').compatible).toBe(true)
  })

  it('wraps around the wheel (12 <-> 1)', () => {
    const r = harmonicRelation('12A', '1A')
    expect(r).toEqual({ compatible: true, label: 'adjacent' })
  })

  it('flags a clash for non-adjacent keys', () => {
    const r = harmonicRelation('8A', '3A')
    expect(r).toEqual({ compatible: false, label: 'clash' })
  })

  it('does not treat ±1 with different letters as adjacent', () => {
    const r = harmonicRelation('8A', '9B')
    expect(r.compatible).toBe(false)
  })

  it('returns unknown when a code is missing or malformed', () => {
    expect(harmonicRelation(null, '8A')).toEqual({ compatible: false, label: 'unknown' })
    expect(harmonicRelation('8A', 'XX')).toEqual({ compatible: false, label: 'unknown' })
    expect(harmonicRelation('8A', '13C')).toEqual({ compatible: false, label: 'unknown' })
  })
})
