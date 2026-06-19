// Equal-power crossfade: at center both decks play at ~0.71 gain (not 0.5),
// so perceived loudness stays roughly constant across the sweep instead of
// dipping in the middle. position is 0 (full A) .. 1 (full B).
export function crossfadeGains(position) {
  return {
    a: Math.cos((position * Math.PI) / 2),
    b: Math.cos(((1 - position) * Math.PI) / 2),
  }
}

// playbackRate multiplier to apply to deck B so its tempo matches deck A.
// Returns null when either BPM is missing/zero (sync not possible).
export function syncRatio(bpmA, bpmB) {
  if (!bpmA || !bpmB) return null
  return bpmA / bpmB
}
