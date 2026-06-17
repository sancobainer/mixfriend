import { useCallback, useState } from 'react'
import DropZone from './components/DropZone'
import TrackList from './components/TrackList'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'
import './App.css'

let nextTrackId = 1

function App() {
  const [tracks, setTracks] = useState([])
  const { analyzeFile } = useAudioAnalyzer()

  const handleFiles = useCallback(
    (files) => {
      const newTracks = files.map((file) => ({
        id: nextTrackId++,
        file,
        name: file.name,
        status: 'analyzing',
        bpm: null,
        key: null,
        scale: null,
      }))

      setTracks((prev) => [...prev, ...newTracks])

      newTracks.forEach((track) => {
        analyzeFile(track.file)
          .then((result) => {
            setTracks((prev) =>
              prev.map((t) =>
                t.id === track.id ? { ...t, ...result, status: 'done' } : t
              )
            )
          })
          .catch((err) => {
            console.error('Analysis failed for', track.name, err)
            setTracks((prev) =>
              prev.map((t) =>
                t.id === track.id ? { ...t, status: 'error' } : t
              )
            )
          })
      })
    },
    [analyzeFile]
  )

  return (
    <div className="app">
      <header>
        <h1>MixFriend</h1>
        <p>Drop tracks in, get BPM & key analyzed in your browser.</p>
      </header>
      <DropZone onFiles={handleFiles} />
      <TrackList tracks={tracks} />
    </div>
  )
}

export default App
