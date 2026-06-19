import { useState } from 'react'
import { harmonicRelation } from '../utils/harmonic'
import { crossfadeGains, syncRatio } from '../utils/mixer'

function Mixer({ deckARef, deckBRef, deckATrack, deckBTrack }) {
  const [position, setPosition] = useState(0.5)
  const [synced, setSynced] = useState(false)

  const applyCrossfade = (pos) => {
    setPosition(pos)
    const { a, b } = crossfadeGains(pos)
    deckARef.current?.setCrossfade(a)
    deckBRef.current?.setCrossfade(b)
  }

  // Sync deck B's tempo to deck A by adjusting B's playbackRate. Requires
  // both decks to have a detected BPM. Toggling off restores B to 1x.
  const toggleSync = () => {
    if (synced) {
      deckBRef.current?.setPlaybackRate(1)
      setSynced(false)
      return
    }
    const bpmA = deckARef.current?.getBpm()
    const bpmB = deckBRef.current?.getBpm()
    const ratio = syncRatio(bpmA, bpmB)
    if (ratio == null) return
    deckBRef.current?.setPlaybackRate(ratio)
    setSynced(true)
  }

  const canSync =
    deckATrack && deckBTrack && deckATrack.bpm && deckBTrack.bpm
  const syncRatioLabel =
    canSync ? syncRatio(deckATrack.bpm, deckBTrack.bpm).toFixed(3) : null

  const relation =
    deckATrack && deckBTrack
      ? harmonicRelation(deckATrack.camelotKey, deckBTrack.camelotKey)
      : null

  return (
    <div className="mixer">
      <div className="mixer-row">
        <span className="mixer-label">A</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={position}
          onChange={(e) => applyCrossfade(parseFloat(e.target.value))}
          className="crossfader"
        />
        <span className="mixer-label">B</span>
      </div>

      <div className="mixer-row mixer-info">
        {relation && (
          <span
            className={`harmonic-badge ${relation.compatible ? 'compatible' : 'clash'}`}
            title={`Deck A ${deckATrack.camelotKey || '?'} vs Deck B ${deckBTrack.camelotKey || '?'}`}
          >
            {relation.compatible ? '✓' : '✕'} {relation.label}
          </span>
        )}

        <button onClick={toggleSync} disabled={!canSync} className={synced ? 'active' : ''}>
          {synced ? 'Synced ✓' : 'Sync B→A'}
        </button>
        {canSync && synced && (
          <span className="sync-note" title="Pitch shifts with tempo (no time-stretch)">
            B ×{syncRatioLabel}
          </span>
        )}
      </div>
    </div>
  )
}

export default Mixer
