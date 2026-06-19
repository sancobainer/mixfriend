# MixFriend

A browser-based tool for analyzing audio tracks — detects BPM, musical key, and structural cue points (drops, chorus entries, big section changes) entirely client-side. Built as a proof-of-concept toward a MixMeister-style DJ set-planning tool.

All analysis runs in-browser using [essentia.js](https://mtg.github.io/essentia.js/) (a WASM port of the Essentia MIR library) inside a Web Worker, so the UI stays responsive and no audio ever leaves the machine.

## Features

- **Drag-and-drop or file-picker upload** of audio files (`src/components/DropZone.jsx`)
- **BPM detection** with octave-error correction
- **Musical key detection** (key + scale + confidence score)
- **Cue point detection** — up to 4 timestamps marking the track's biggest structural/spectral changes, snapped to the nearest beat
- **Result caching** to a JSON file in the repo (`cache/analysis-cache.json`), so re-uploading the same file skips re-analysis
- **Track list UI** showing BPM, key, and cue points per track (`src/components/TrackList.jsx`)

## How analysis works

All of this happens in `src/worker/analysisWorker.js`, off the main thread.

### 1. Decoding

The uploaded file is decoded via the Web Audio API (`useAudioAnalyzer.js`). The `AudioContext` is explicitly forced to **44100Hz**:

```js
new AudioContext({ sampleRate: 44100 })
```

This matters because essentia's `RhythmExtractor2013` algorithm has no `sampleRate` parameter — it hardcodes an internal assumption that the input signal is sampled at 44100Hz. If the browser's audio hardware defaulted to a different rate (commonly 48000Hz on Windows) and we didn't force this, every detected beat interval would be scaled by `44100/48000 ≈ 0.92`, undershooting the true BPM by roughly 8–9% (about 10–14 BPM on a typical track). Forcing 44100Hz here keeps the signal's actual rate matching what the algorithm assumes.

### 2. Cue point detection

This runs first, over the **entire track**, and is the most involved part of the pipeline:

1. **Frame the signal**: split into 2048-sample frames with a 2048-sample hop (no overlap), each windowed (Hann) and converted to a spectrum via FFT.
2. **Band energies**: each frame's spectrum is bucketed into 10 logarithmically-spaced frequency bands (20Hz–Nyquist), and energy (magnitude²) is summed per band.
3. **Texture windows**: frame-level band energies are averaged into ~2-second "texture windows." Structural changes (drops, chorus entries) happen over seconds, not milliseconds, so this removes frame-level jitter that would otherwise register as false cue points.
4. **Log compression + per-band normalization**: energies are log-compressed (`log1p`), then each band is independently z-score normalized (zero mean, unit variance) across the whole track. Without this, bands with naturally larger raw energy (typically bass) would dominate the novelty signal just because of scale, not because they represent a more meaningful change.
5. **Novelty curve**: for each texture window, sum the positive (half-wave rectified) differences across all bands compared to the previous window. A spike means several bands jumped in energy at once — a likely section change.
6. **Smoothing**: a small moving average (±1 window) smooths the novelty curve.
7. **Peak picking**: local maxima above `mean + 2×stddev` are candidate cue points, sorted by strength (strongest first).
8. **Selection**: the top 4 candidates are kept, enforcing a minimum 15-second spacing between them (skipping weaker candidates that are too close to an already-selected one).
9. **Beat alignment**: each selected cue's timestamp is snapped to the nearest beat detected by a separate, fast `RhythmExtractor2013` pass (`'degara'` method) over the whole track. Raw novelty peaks are only accurate to within one texture window (~2s); snapping to an actual beat tick corrects this, since real section boundaries land on a beat, not an arbitrary timestamp.

**Caveat**: these are spectral-energy change points, not semantically labeled "chorus" vs. "verse" — essentia has no built-in song-structure classifier. Distinguishing section *types* would require a trained ML model, which is out of scope here.

### 3. BPM and key

Rather than analyzing the whole track, BPM and key are computed from a **30-second window starting 1.5 seconds after the strongest cue point** (highest novelty strength). The 1.5s skip avoids landing on the transition/cut itself — the worst place to estimate steady tempo or tonal center — and instead lands inside the new, presumably stable section that follows. If no cue points were found, the window falls back to the start of the track.

- **BPM**: `RhythmExtractor2013` (`'multifeature'` method, tempo range 40–208 BPM) on the 30s window, run through `correctOctaveError()`, which folds the result into the 90–180 BPM range by doubling/halving. This corrects essentia's most common failure mode (reporting half or double the true tempo). Note: this heuristic assumes the true tempo falls in 90–180 BPM — genres outside that range (e.g. very slow hip-hop, very fast hardcore) would need the bounds adjusted.
- **Key**: `KeyExtractor` on the same 30s window, returning key, scale (major/minor), and a confidence score.
  - `keyStrength` (0–1) reflects how well the audio matches the detected key's chroma profile. High (~0.7–0.9) means a clear, unambiguous tonal center; low (~0.3–0.5) means weak/ambiguous tonality (common in percussion-heavy or atonal sections) — low-confidence results should be treated with some skepticism.

### 4. Caching

Results are cached by `name::size::lastModified` key to `cache/analysis-cache.json` via a Vite dev-server middleware (`vite.config.js`, `/api/cache` endpoint). Re-uploading an already-analyzed file returns the cached result instantly instead of re-running analysis.

**This only works under `vite dev`** — there's no server in a production static build, so the cache silently no-ops if deployed as a static site. A real backend would be needed to persist caching beyond local development.

## Project status

This is a frontend-only proof-of-concept (no backend yet). The plan is to validate the analysis pipeline here, then port to Electron for a desktop app with deeper local file/library integration (e.g. reading a Rekordbox library) once the core analysis is solid.

## Getting started

```bash
npm install
npm run dev
```

Drop an audio file onto the page — BPM, key, and cue points will appear in the track list once analysis finishes. Check the browser console for detailed per-stage logs (cache checks, decode info, worker timing, and step-by-step analysis output).
