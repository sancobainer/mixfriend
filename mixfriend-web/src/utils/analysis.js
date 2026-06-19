// Pure, dependency-free analysis helpers. Extracted from the worker so they
// can be unit-tested without loading the essentia.js WASM module (which only
// runs in a worker/browser context, not in a Node test runner).

// Folds a detected BPM into a 90-180 range by doubling/halving. Corrects
// essentia's most common failure mode (reporting half or double the true
// tempo). Assumes the true tempo falls in 90-180; genres outside that range
// would need different bounds.
export function correctOctaveError(bpm) {
  const minBpm = 90
  const maxBpm = 180
  let corrected = bpm
  while (corrected < minBpm) corrected *= 2
  while (corrected > maxBpm) corrected /= 2
  return corrected
}

// Returns the next `count` phrase-boundary timestamps after `anchorTime`,
// stepping every `beatsPerBar` beats along the beat grid. A cue point
// (drop, chorus-in) is musically likely to land on a phrase boundary, so
// stepping forward from it yields usable mix-in points.
export function getForwardPhraseMarkers(beatTicks, anchorTime, beatsPerBar, count = 4) {
  if (!beatTicks || beatTicks.length === 0) return []

  let anchorIndex = 0
  let minDiff = Math.abs(beatTicks[0] - anchorTime)
  for (let i = 1; i < beatTicks.length; i++) {
    const diff = Math.abs(beatTicks[i] - anchorTime)
    if (diff < minDiff) {
      minDiff = diff
      anchorIndex = i
    }
  }

  const markers = []
  for (let n = 1; n <= count; n++) {
    const idx = anchorIndex + n * beatsPerBar
    if (idx >= beatTicks.length) break
    markers.push(Math.round(beatTicks[idx] * 100) / 100)
  }
  return markers
}

const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' }

const CAMELOT_MAJOR = {
  C: '8B', 'C#': '3B', D: '10B', 'D#': '5B', E: '12B', F: '7B',
  'F#': '2B', G: '9B', 'G#': '4B', A: '11B', 'A#': '6B', B: '1B',
}

const CAMELOT_MINOR = {
  C: '5A', 'C#': '12A', D: '7A', 'D#': '2A', E: '9A', F: '4A',
  'F#': '11A', G: '6A', 'G#': '1A', A: '8A', 'A#': '3A', B: '10A',
}

// Maps a detected key + scale to its Camelot Wheel code (e.g. E major -> 12B).
// Normalizes flats to sharps first, since essentia returns sharps.
export function getCamelotCode(key, scale) {
  const normalizedKey = FLAT_TO_SHARP[key] || key
  const table = scale === 'minor' ? CAMELOT_MINOR : CAMELOT_MAJOR
  return table[normalizedKey] || null
}
