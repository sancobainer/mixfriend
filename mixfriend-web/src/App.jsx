import { useCallback, useRef, useState } from 'react'
import DropZone from './components/DropZone'
import TrackList from './components/TrackList'
import Deck from './components/Deck'
import Mixer from './components/Mixer'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'
import './App.css'

let nextTrackId = 1

function App() {
  const [tracks, setTracks] = useState([])
  const [deckA, setDeckA] = useState(null)
  const [deckB, setDeckB] = useState(null)
  const { analyzeFile } = useAudioAnalyzer()

  const deckARef = useRef(null)
  const deckBRef = useRef(null)

  // Waveform slots live at the top of the console; each Deck portals its
  // waveform into its slot. Stored in state (not a ref) so the decks
  // re-render once the slot DOM nodes are attached.
  const [waveSlotA, setWaveSlotA] = useState(null)
  const [waveSlotB, setWaveSlotB] = useState(null)

  const deckATrack = tracks.find((t) => t.id === deckA) || null
  const deckBTrack = tracks.find((t) => t.id === deckB) || null

  const handleFiles = useCallback(
    (files) => {
      const newTracks = files.map((file) => ({
        id: nextTrackId++,
        file,
        name: file.name,
        status: 'queued',
        bpm: null,
        key: null,
        scale: null,
      }))

      setTracks((prev) => [...prev, ...newTracks])

      const runOne = async (track) => {
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, status: 'analyzing' } : t))
        )
        try {
          const result = await analyzeFile(track.file)
          setTracks((prev) =>
            prev.map((t) =>
              t.id === track.id ? { ...t, ...result, status: 'done' } : t
            )
          )
        } catch (err) {
          console.error('Analysis failed for', track.name, err)
          setTracks((prev) =>
            prev.map((t) => (t.id === track.id ? { ...t, status: 'error' } : t))
          )
        }
      }

      // Limit concurrent decode+analyze. Each job decodes the whole file into
      // memory up front, so analyzing a large folder all at once would spike
      // memory; the worker also runs serially, so high parallelism buys
      // nothing. A small pool keeps things responsive without overloading.
      const CONCURRENCY = 2
      const queue = [...newTracks]
      const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          await runOne(queue.shift())
        }
      })
      Promise.all(workers)
    },
    [analyzeFile]
  )

  return (
    <div className="app">
      {/* Fixed DJ console: waveforms on top, deck controls flanking the
          center mixer. The library below is the only scrolling region. */}
      <div className="console">
        <div className="waveform-row">
          <div className="waveform-slot" ref={setWaveSlotA} />
          <div className="waveform-slot" ref={setWaveSlotB} />
        </div>

        <div className="console-row">
          <Deck ref={deckARef} label="A" track={deckATrack} waveformSlot={waveSlotA} />
          <Mixer
            deckARef={deckARef}
            deckBRef={deckBRef}
            deckATrack={deckATrack}
            deckBTrack={deckBTrack}
          />
          <Deck ref={deckBRef} label="B" track={deckBTrack} waveformSlot={waveSlotB} />
        </div>
      </div>

      <div className="library">
        <DropZone onFiles={handleFiles} />
        <TrackList
          tracks={tracks}
          deckATrack={deckATrack}
          onLoadDeckA={(id) => setDeckA(id)}
          onLoadDeckB={(id) => setDeckB(id)}
        />
      </div>
    </div>
  )
}

export default App
