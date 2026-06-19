import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import { normalizeBeatTicks } from '../utils/normalizeTrack'

const CUE_COLOR = 'rgba(255, 80, 80, 0.9)'
const BAR_COLOR = 'rgba(80, 120, 255, 0.30)'
const LOOP_COLOR = 'rgba(255, 200, 0, 0.18)'

// Draw one grid line per bar (every 4th beat in 4/4) rather than every beat,
// to keep the waveform readable on multi-minute tracks.
const BEATS_PER_BAR = 4

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const Deck = forwardRef(function Deck({ label, track, onLoadRequest, waveformSlot }, ref) {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const regionsRef = useRef(null)
  const loopRegionRef = useRef(null)

  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [looping, setLooping] = useState(false)

  // The audible gain is the per-deck fader (volume) multiplied by the
  // crossfader contribution from the mixer. The crossfader factor is held in
  // a ref (not state) so the mixer can set it imperatively without forcing a
  // re-render of the whole deck on every fader move.
  const crossfadeRef = useRef(1)

  const applyGain = () => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setVolume(volume * crossfadeRef.current)
    }
  }

  // Imperative handle the mixer (App) uses to coordinate both decks.
  useImperativeHandle(ref, () => ({
    getBpm: () => track?.bpm ?? null,
    setCrossfade: (factor) => {
      crossfadeRef.current = factor
      if (wavesurferRef.current && isReady) {
        wavesurferRef.current.setVolume(volume * factor)
      }
    },
    setPlaybackRate: (rate) => {
      if (wavesurferRef.current && isReady) {
        // preservePitch=false: this is a simple tempo change that shifts
        // pitch along with it. True pitch-preserving time-stretch is a
        // larger feature; documented as a known limitation.
        wavesurferRef.current.setPlaybackRate(rate, false)
      }
    },
    isLoaded: () => isReady,
  }))

  // (Re)build wavesurfer whenever the loaded track changes.
  useEffect(() => {
    if (!track || !track.file || !containerRef.current) {
      return
    }

    setIsReady(false)
    setIsPlaying(false)
    setLooping(false)
    loopRegionRef.current = null

    const regions = RegionsPlugin.create()
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#9aa5d6',
      progressColor: '#4a7dff',
      cursorColor: '#222',
      height: 96,
      plugins: [regions],
    })
    wavesurferRef.current = wavesurfer
    regionsRef.current = regions

    const objectUrl = URL.createObjectURL(track.file)
    wavesurfer.load(objectUrl)

    wavesurfer.on('ready', () => {
      setIsReady(true)
      setDuration(wavesurfer.getDuration())
      wavesurfer.setVolume(volume * crossfadeRef.current)

      const beatTicks = normalizeBeatTicks(track.beatTicks)
      for (let i = 0; i < beatTicks.length; i += BEATS_PER_BAR) {
        regions.addRegion({
          start: beatTicks[i],
          color: BAR_COLOR,
          drag: false,
          resize: false,
        })
      }

      const cuePoints = track.cuePoints || []
      cuePoints.forEach((cue, i) => {
        regions.addRegion({
          start: cue.time,
          color: CUE_COLOR,
          drag: false,
          resize: false,
          content: `${i + 1}`,
        })
      })
    })

    wavesurfer.on('timeupdate', (t) => setCurrentTime(t))
    wavesurfer.on('play', () => setIsPlaying(true))
    wavesurfer.on('pause', () => setIsPlaying(false))
    wavesurfer.on('finish', () => setIsPlaying(false))

    return () => {
      wavesurfer.destroy()
      URL.revokeObjectURL(objectUrl)
      wavesurferRef.current = null
      regionsRef.current = null
    }
    // volume intentionally omitted: applied live via the separate effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track])

  // Apply per-deck fader changes live (combined with the crossfade factor)
  // without rebuilding the waveform.
  useEffect(() => {
    applyGain()
    // applyGain reads volume/isReady; deps cover both
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, isReady])

  const togglePlay = () => {
    const ws = wavesurferRef.current
    if (!ws || !isReady) return
    ws.playPause()
  }

  const jumpToCue = (time) => {
    const ws = wavesurferRef.current
    if (!ws || !isReady || !duration) return
    ws.seekTo(time / duration)
  }

  // Loop the 8 bars (≈ one phrase) following the nearest cue at/<= playhead,
  // falling back to the track's first cue. Uses the cue's precomputed
  // phrase8 markers so the loop lands cleanly on phrase boundaries.
  const toggleLoop = () => {
    const ws = wavesurferRef.current
    const regions = regionsRef.current
    if (!ws || !regions || !isReady) return

    if (looping) {
      if (loopRegionRef.current) {
        loopRegionRef.current.remove()
        loopRegionRef.current = null
      }
      setLooping(false)
      return
    }

    const cues = track.cuePoints || []
    if (cues.length === 0) return
    const here = ws.getCurrentTime()
    const cue =
      [...cues].reverse().find((c) => c.time <= here + 0.05) || cues[0]
    const loopEnd =
      cue.phrase8 && cue.phrase8.length ? cue.phrase8[cue.phrase8.length - 1] : cue.time + 8
    const start = cue.time
    const end = Math.min(loopEnd, duration)

    const loopRegion = regions.addRegion({
      start,
      end,
      color: LOOP_COLOR,
      drag: false,
      resize: true,
    })
    loopRegionRef.current = loopRegion
    setLooping(true)

    loopRegion.on('out', () => {
      ws.seekTo(loopRegion.start / duration)
    })

    ws.seekTo(start / duration)
    if (!ws.isPlaying()) ws.play()
  }

  // The waveform DOM lives in a slot at the top of the console (portalled
  // there) while the deck's controls render in their own column. wavesurfer
  // still owns/manages containerRef regardless of where it's mounted.
  const waveform = (
    <div className={`deck-waveform-wrap deck-${label.toLowerCase()}`}>
      {track ? (
        <div ref={containerRef} className="deck-waveform" />
      ) : (
        <div className="deck-waveform-empty">Deck {label} — no track</div>
      )}
    </div>
  )

  const renderedWaveform = waveformSlot ? createPortal(waveform, waveformSlot) : waveform

  if (!track) {
    return (
      <>
        {renderedWaveform}
        <div className="deck deck-empty">
          <div className="deck-header">
            <span className="deck-label">Deck {label}</span>
            <button onClick={onLoadRequest} disabled={!onLoadRequest}>
              Load a track…
            </button>
          </div>
          <div className="deck-placeholder">No track loaded</div>
        </div>
      </>
    )
  }

  return (
    <>
      {renderedWaveform}
      <div className="deck">
        <div className="deck-header">
          <span className="deck-label">Deck {label}</span>
          <span className="deck-track-name">{track.name}</span>
          <span className="deck-meta">
            {track.bpm ? `${track.bpm} BPM` : ''}
            {track.camelotKey ? ` · ${track.camelotKey}` : ''}
          </span>
        </div>

        <div className="deck-controls">
          <button onClick={togglePlay} disabled={!isReady}>
            {isPlaying ? '❚❚' : '▶'}
          </button>

          <span className="deck-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="deck-cues">
            {(track.cuePoints || []).map((cue, i) => (
              <button key={cue.time} onClick={() => jumpToCue(cue.time)} disabled={!isReady}>
                Cue {i + 1}
              </button>
            ))}
          </div>

          <button onClick={toggleLoop} disabled={!isReady} className={looping ? 'active' : ''}>
            {looping ? 'Loop ✓' : 'Loop 8'}
          </button>

          <label className="deck-volume">
            Vol
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </label>
        </div>
      </div>
    </>
  )
})

export default Deck
