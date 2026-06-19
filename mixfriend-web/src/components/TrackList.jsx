import { useState } from 'react'
import { harmonicRelation } from '../utils/harmonic'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function cueTooltip(cue) {
  const phrase8 = cue.phrase8 && cue.phrase8.length ? cue.phrase8.map(formatTime).join(', ') : 'none'
  const phrase16 = cue.phrase16 && cue.phrase16.length ? cue.phrase16.map(formatTime).join(', ') : 'none'
  return `Cue @ ${formatTime(cue.time)}\n8-bar phrases: ${phrase8}\n16-bar phrases: ${phrase16}`
}

const SORTABLE = {
  name: (t) => (t.name || '').toLowerCase(),
  bpm: (t) => t.bpm ?? -Infinity,
  camelotKey: (t) => t.camelotKey || '',
  danceability: (t) => t.danceability ?? -Infinity,
}

function TrackList({ tracks, deckATrack, onLoadDeckA, onLoadDeckB }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  if (tracks.length === 0) {
    return <p className="empty-state">No tracks yet. Drop some audio files above.</p>
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedTracks = sortKey
    ? [...tracks].sort((a, b) => {
        const va = SORTABLE[sortKey](a)
        const vb = SORTABLE[sortKey](b)
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    : tracks

  const sortArrow = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '')

  return (
    <table className="track-table">
      <thead>
        <tr>
          <th className="sortable" onClick={() => handleSort('name')}>
            Track{sortArrow('name')}
          </th>
          <th className="sortable" onClick={() => handleSort('bpm')}>
            BPM{sortArrow('bpm')}
          </th>
          <th className="sortable" onClick={() => handleSort('camelotKey')}>
            Key{sortArrow('camelotKey')}
          </th>
          <th>Cue points</th>
          <th className="sortable" onClick={() => handleSort('danceability')}>
            Danceability{sortArrow('danceability')}
          </th>
          <th>Harmonic vs A</th>
          <th>Status</th>
          <th>Load</th>
        </tr>
      </thead>
      <tbody>
        {sortedTracks.map((track) => {
          const relation =
            deckATrack && deckATrack.id !== track.id && track.camelotKey && deckATrack.camelotKey
              ? harmonicRelation(deckATrack.camelotKey, track.camelotKey)
              : null
          return (
            <tr key={track.id}>
              <td>{track.name}</td>
              <td>{track.bpm ?? '-'}</td>
              <td>
                {track.key
                  ? `${track.key} ${track.scale ?? ''}`.trim() +
                    (track.camelotKey ? ` (${track.camelotKey})` : '')
                  : '-'}
              </td>
              <td>
                {track.cuePoints && track.cuePoints.length
                  ? track.cuePoints.map((c, i) => (
                      <span key={c.time} title={cueTooltip(c)}>
                        {formatTime(c.time)}
                        {i < track.cuePoints.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  : '-'}
              </td>
              <td>{track.danceability != null ? `${track.danceability}%` : '-'}</td>
              <td>
                {relation ? (
                  <span className={`harmonic-badge ${relation.compatible ? 'compatible' : 'clash'}`}>
                    {relation.compatible ? '✓' : '✕'} {relation.label}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td>{track.status}</td>
              <td className="load-buttons">
                <button
                  disabled={track.status !== 'done'}
                  onClick={() => onLoadDeckA && onLoadDeckA(track.id)}
                >
                  → A
                </button>
                <button
                  disabled={track.status !== 'done'}
                  onClick={() => onLoadDeckB && onLoadDeckB(track.id)}
                >
                  → B
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default TrackList
