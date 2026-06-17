function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function TrackList({ tracks }) {
  if (tracks.length === 0) {
    return <p className="empty-state">No tracks yet. Drop some audio files above.</p>
  }

  return (
    <table className="track-table">
      <thead>
        <tr>
          <th>Track</th>
          <th>BPM</th>
          <th>Key</th>
          <th>Cue points</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((track) => (
          <tr key={track.id}>
            <td>{track.name}</td>
            <td>{track.bpm ?? '-'}</td>
            <td>{track.key ? `${track.key} ${track.scale ?? ''}`.trim() : '-'}</td>
            <td>
              {track.cuePoints && track.cuePoints.length
                ? track.cuePoints.map((c) => formatTime(c.time)).join(', ')
                : '-'}
            </td>
            <td>{track.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TrackList
