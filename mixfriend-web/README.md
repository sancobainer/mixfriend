# MixFriend

A browser-based tool for analyzing audio tracks — detects BPM, musical key, and structural cue points (drops, chorus entries, big section changes) entirely client-side. Built as a proof-of-concept toward a MixMeister-style DJ set-planning tool.

All analysis runs in-browser using [essentia.js](https://mtg.github.io/essentia.js/) (a WASM port of the Essentia MIR library) inside a Web Worker, so the UI stays responsive and no audio ever leaves the machine.

## Features

**Import**
- **File, folder, or drag-and-drop upload** — pick individual files, browse a whole folder (`webkitdirectory`), or drag files/folders in (recursively walks dropped directory trees). Filtered by MIME type with an extension fallback (`src/components/DropZone.jsx`)
- **Batched analysis** with a small concurrency limit, so dropping a large folder doesn't spike memory

**Per-track analysis**
- **BPM detection** with octave-error correction (rounded to a whole number)
- **Musical key detection** — key + scale + confidence score, plus the **Camelot Wheel code** (e.g. `8B`) for harmonic mixing
- **Cue point detection** — up to 4 timestamps marking the track's biggest structural/spectral changes, snapped to the nearest beat, each with upcoming 8-bar and 16-bar phrase markers
- **Danceability** score (0–100%)
- **Beat grid** — full array of detected beat positions across the track

**Mixing / set planning**
- **Dual-deck player** — two independent waveform decks (A/B) with play/pause, scrub, cue jumping, looping, per-deck volume, and beat/cue overlays (`src/components/Deck.jsx`)
- **Mixer** — equal-power crossfader between decks, BPM sync (deck B → deck A), and a live harmonic-compatibility badge (`src/components/Mixer.jsx`)
- **Harmonic compatibility column** in the track list, comparing every track to whatever's loaded on Deck A
- **Sortable track list** by name, BPM, key, or danceability, with load-to-deck buttons (`src/components/TrackList.jsx`)
- **DJ-console layout** — fixed console (waveforms on top, deck controls flanking the center mixer) over a scrollable track library

**Persistence**
- **Result caching** to a JSON file in the repo (`cache/analysis-cache.json`), so re-uploading the same file skips re-analysis

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
  - `camelotKey` translates the detected key/scale into Camelot Wheel notation (e.g. `E major` → `12B`, `A minor` → `8A`), the standard DJ reference for harmonic mixing. Tracks with adjacent Camelot codes (or the same number) mix together harmonically.
- **Danceability**: `Danceability` (based on Detrended Fluctuation Analysis) on the same 30s window. Essentia's raw output is roughly 0–3 (higher = more danceable); normalized to a 0–100% scale and clamped at 100.

### 4. Phrase markers and beat grid

Two outputs are derived cheaply from the beat grid (the `ticks` from the beat-alignment `RhythmExtractor2013` pass), with no extra analysis cost:

- **Per-cue phrase markers**: each cue point carries `phrase8` and `phrase16` — the timestamps of the next four 8-bar and 16-bar boundaries after that cue. A cue (drop, chorus-in) almost always lands on a phrase boundary, so stepping forward in 8- or 16-beat increments from it yields musically meaningful mix-in points. We expose only a handful of upcoming markers per cue rather than the entire bar grid (a 4.5-minute track has ~146 bars — too many to be useful as a list).
- **Beat grid** (`beatTicks`): the full array of detected beat timestamps, used to render bar lines on the deck waveforms. (`Array.from` is used when serializing this, because essentia returns a `Float32Array` and a typed array would otherwise be JSON-serialized as a keyed object instead of a real array.)

### 5. Dual-deck player

Two independent decks (`src/components/Deck.jsx`), each backed by its own [wavesurfer.js](https://wavesurfer.xyz/) instance, render a track's waveform with overlays and provide DJ-style transport controls. A track is loaded into a deck via the `→ A` / `→ B` buttons in the track list.

- **Play/pause + scrub**: standard transport, plus click-to-seek anywhere on the waveform.
- **Cue jumping**: a button per detected cue point seeks the playhead straight to it.
- **Looping**: "Loop 8" sets an 8-bar loop anchored at the nearest cue at/before the playhead, using that cue's precomputed `phrase8` markers so the loop ends on a phrase boundary. The loop region is resizable.
- **Per-deck volume**: a volume fader applied live without rebuilding the waveform.
- **Overlays**: bar grid lines (every 4th beat) and numbered cue markers drawn on each waveform.

Layout-wise, each deck's waveform is rendered into a slot at the top of the console (via a React portal), while its controls render in a column flanking the center mixer — so the wavesurfer instance and all its refs stay owned by one component regardless of where the waveform is displayed.

### 6. Mixer and harmonic compatibility

The mixer (`src/components/Mixer.jsx`) sits between the two decks and coordinates them via imperative handles each deck exposes (`forwardRef`/`useImperativeHandle`):

- **Crossfader**: an equal-power crossfade (`crossfadeGains` in `src/utils/mixer.js`) — at center, both decks play at ~0.71 gain rather than 0.5, so perceived loudness stays roughly constant across the sweep (the sum of squared gains is ~1 throughout). This multiplies with each deck's own volume fader.
- **BPM sync**: sets deck B's `playbackRate` to `bpmA / bpmB` (`syncRatio` in `src/utils/mixer.js`). This is a simple tempo change that **shifts pitch along with tempo** — true pitch-preserving time-stretch is a larger, deferred feature.
- **Harmonic compatibility**: `harmonicRelation` (`src/utils/harmonic.js`) compares two Camelot codes and labels the pair `same key`, `relative` (relative major/minor), `adjacent` (±1 on the wheel, wrapping 12↔1), or `clash`. Shown both as a badge in the mixer (Deck A vs Deck B) and as a column in the track list (every track vs Deck A).

### 7. Caching

Results are cached by `name::size::lastModified` key to `cache/analysis-cache.json` via a Vite dev-server middleware (`vite.config.js`, `/api/cache` endpoint). Re-uploading an already-analyzed file returns the cached result instantly instead of re-running analysis.

**This only works under `vite dev`** — there's no server in a production static build, so the cache silently no-ops if deployed as a static site. A real backend would be needed to persist caching beyond local development.

## Project status

This is a frontend-only proof-of-concept (no backend yet). The plan is to validate the analysis pipeline here, then port to Electron for a desktop app with deeper local file/library integration (e.g. reading a Rekordbox library) once the core analysis is solid.

## Getting started

```bash
npm install
npm run dev
```

Drop audio files (or a whole folder) onto the page — BPM, key (with Camelot code), cue points, and danceability appear in the track list once analysis finishes. Use the `→ A` / `→ B` buttons to load a track into either deck, then play, scrub, jump between cue points, loop, and adjust per-deck volume. The mixer between the decks provides the crossfader, BPM sync, and a harmonic-compatibility readout. Check the browser console for detailed per-stage logs (cache checks, decode info, worker timing, and step-by-step analysis output).

## Testing

Pure analysis/mixing logic is extracted into dependency-free modules under `src/utils/` (so it can be tested without loading the essentia.js WASM module, which only runs in a worker/browser) and covered by [Vitest](https://vitest.dev/):

```bash
npm test          # run once
npm run test:watch
```

Current coverage (`src/utils/*.test.js`):

- `analysis.test.js` — BPM octave correction, forward phrase-marker stepping, and Camelot code mapping (including flat→sharp normalization).
- `harmonic.test.js` — Camelot compatibility relations (same/relative/adjacent/clash, wheel wraparound, malformed input).
- `mixer.test.js` — equal-power crossfade gains and BPM sync ratio.
- `normalizeTrack.test.js` — beat-grid normalization (handles the keyed-object shape that old cached entries had).

The wavesurfer-driven decks and the essentia analysis pipeline itself are integration-tested by hand in the browser rather than unit-tested.
