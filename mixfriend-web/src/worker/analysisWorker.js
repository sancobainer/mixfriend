import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js'
import Essentia from 'essentia.js/dist/essentia.js-core.es.js'

let essentia = null
let essentiaReady = null

function waitForWasm() {
  if (EssentiaWASM.calledRun) return Promise.resolve(EssentiaWASM)
  return new Promise((resolve) => {
    EssentiaWASM.onRuntimeInitialized = () => resolve(EssentiaWASM)
  })
}

async function getEssentia() {
  if (!essentiaReady) {
    essentiaReady = waitForWasm().then((wasmModule) => {
      essentia = new Essentia(wasmModule)
      return essentia
    })
  }
  return essentiaReady
}

function correctOctaveError(bpm) {
  const minBpm = 90
  const maxBpm = 180
  let corrected = bpm
  while (corrected < minBpm) corrected *= 2
  while (corrected > maxBpm) corrected /= 2
  return corrected
}

function detectCuePoints(ess, channelData, sampleRate) {
  const frameSize = 2048
  const hopSize = 2048
  const frameRate = sampleRate / hopSize
  const numBands = 10
  const nyquist = sampleRate / 2
  const minFreq = 20

  const bandEdges = []
  for (let b = 0; b <= numBands; b++) {
    bandEdges.push(minFreq * Math.pow(nyquist / minFreq, b / numBands))
  }

  const frames = ess.FrameGenerator(channelData, frameSize, hopSize)
  const numFrames = frames.size()
  const binHz = sampleRate / frameSize
  const bandEnergies = []

  for (let f = 0; f < numFrames; f++) {
    const frame = frames.get(f)
    const windowed = ess.Windowing(frame, true, frameSize, 'hann').frame
    const spectrumVec = ess.Spectrum(windowed, frameSize).spectrum
    const spectrum = ess.vectorToArray(spectrumVec)

    const energies = new Array(numBands).fill(0)
    for (let bin = 0; bin < spectrum.length; bin++) {
      const freq = bin * binHz
      for (let b = 0; b < numBands; b++) {
        if (freq >= bandEdges[b] && freq < bandEdges[b + 1]) {
          energies[b] += spectrum[bin] * spectrum[bin]
          break
        }
      }
    }
    bandEnergies.push(energies)
  }

  // Aggregate frame-level energies into ~2s texture windows. Structural
  // changes (drops, chorus entries) happen over seconds, not milliseconds,
  // so averaging over a texture window removes frame-level jitter that was
  // previously getting picked up as false cue points.
  const textureWindowSeconds = 2
  const framesPerWindow = Math.max(1, Math.round(textureWindowSeconds * frameRate))
  const numWindows = Math.ceil(numFrames / framesPerWindow)

  const windowEnergies = []
  for (let w = 0; w < numWindows; w++) {
    const start = w * framesPerWindow
    const end = Math.min(start + framesPerWindow, numFrames)
    const avg = new Array(numBands).fill(0)
    for (let f = start; f < end; f++) {
      for (let b = 0; b < numBands; b++) avg[b] += bandEnergies[f][b]
    }
    const count = end - start
    for (let b = 0; b < numBands; b++) avg[b] /= count
    windowEnergies.push(avg)
  }

  const logEnergies = windowEnergies.map((row) => row.map((e) => Math.log1p(e * 1000)))

  // Z-score normalize each band independently across the whole track.
  // Without this, bands with naturally larger raw energy (typically bass)
  // dominate the novelty sum just because of scale, not because they
  // represent a more meaningful change. Normalizing puts every band on
  // equal footing so a shift in, say, the high-mid band counts as much as
  // a bass swing of similar relative magnitude.
  const bandMeans = new Array(numBands).fill(0)
  for (const row of logEnergies) {
    for (let b = 0; b < numBands; b++) bandMeans[b] += row[b]
  }
  for (let b = 0; b < numBands; b++) bandMeans[b] /= logEnergies.length

  const bandStds = new Array(numBands).fill(0)
  for (const row of logEnergies) {
    for (let b = 0; b < numBands; b++) bandStds[b] += (row[b] - bandMeans[b]) ** 2
  }
  for (let b = 0; b < numBands; b++) bandStds[b] = Math.sqrt(bandStds[b] / logEnergies.length) || 1

  const normalizedEnergies = logEnergies.map((row) =>
    row.map((e, b) => (e - bandMeans[b]) / bandStds[b])
  )

  const novelty = new Array(numWindows).fill(0)
  for (let w = 1; w < numWindows; w++) {
    let sum = 0
    for (let b = 0; b < numBands; b++) {
      const diff = normalizedEnergies[w][b] - normalizedEnergies[w - 1][b]
      if (diff > 0) sum += diff
    }
    novelty[w] = sum
  }

  const smoothWindow = 1
  const smoothed = novelty.map((_, i) => {
    let sum = 0
    let count = 0
    for (let k = -smoothWindow; k <= smoothWindow; k++) {
      const idx = i + k
      if (idx >= 0 && idx < novelty.length) {
        sum += novelty[idx]
        count++
      }
    }
    return sum / count
  })

  const maxCuePoints = 4
  const mean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length
  const variance = smoothed.reduce((a, b) => a + (b - mean) ** 2, 0) / smoothed.length
  const threshold = mean + 2 * Math.sqrt(variance)

  const candidates = []
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] > threshold && smoothed[i] >= smoothed[i - 1] && smoothed[i] >= smoothed[i + 1]) {
      candidates.push({ index: i, strength: smoothed[i] })
    }
  }
  candidates.sort((a, b) => b.strength - a.strength)

  const minSpacingWindows = 15 / textureWindowSeconds
  const selected = []
  for (const c of candidates) {
    if (selected.length >= maxCuePoints) break
    if (!selected.some((s) => Math.abs(s.index - c.index) < minSpacingWindows)) {
      selected.push(c)
    }
  }
  selected.sort((a, b) => a.index - b.index)

  // Snap each cue to the nearest detected beat. Real section boundaries
  // (drops, chorus entries) land on a beat, not an arbitrary novelty-curve
  // timestamp - the raw peak index is only accurate to within one texture
  // window (~2s), so without this step cues can be off by up to a second.
  // 'degara' is used here (vs. 'multifeature' used for the final BPM) since
  // it's faster and we only need tick positions, not a confidence score.
  const beatTicks = ess.vectorToArray(
    ess.RhythmExtractor2013(ess.arrayToVector(channelData), 208, 'degara', 40).ticks
  )

  function snapToNearestBeat(time) {
    if (beatTicks.length === 0) return time
    let closest = beatTicks[0]
    let minDiff = Math.abs(beatTicks[0] - time)
    for (let i = 1; i < beatTicks.length; i++) {
      const diff = Math.abs(beatTicks[i] - time)
      if (diff < minDiff) {
        minDiff = diff
        closest = beatTicks[i]
      }
    }
    return closest
  }

  return selected.map((c) => ({
    time: Math.round(snapToNearestBeat(c.index * textureWindowSeconds) * 100) / 100,
    strength: Math.round(c.strength * 100) / 100,
  }))
}

self.onmessage = async (event) => {
  const { id, channelData, sampleRate } = event.data

  try {
    console.log(`[worker] job ${id}: loading essentia wasm...`)
    const ess = await getEssentia()
    console.log(`[worker] job ${id}: essentia ready, detecting cue points (${channelData.length} samples)...`)

    const cuePoints = detectCuePoints(ess, channelData, sampleRate)
    console.log(`[worker] job ${id}: found ${cuePoints.length} cue points`, cuePoints)

    // Run BPM/key on a 30s window starting just after the strongest cue
    // point, skipping ~1.5s so we land inside the new section instead of
    // on the transition itself (the cut/transient is the worst place to
    // estimate steady tempo or tonal center).
    const analysisDuration = 30
    const transientSkip = 1.5
    const strongestCue = cuePoints.reduce(
      (best, c) => (best === null || c.strength > best.strength ? c : best),
      null
    )
    const startTime = strongestCue ? strongestCue.time + transientSkip : 0
    const startSample = Math.min(
      Math.max(0, Math.round(startTime * sampleRate)),
      Math.max(0, channelData.length - 1)
    )
    const endSample = Math.min(channelData.length, startSample + Math.round(analysisDuration * sampleRate))
    const analysisChunk = channelData.subarray(startSample, endSample)
    console.log(`[worker] job ${id}: analyzing ${startTime.toFixed(1)}s-${(startTime + analysisDuration).toFixed(1)}s window for bpm/key...`)

    const vectorSignal = ess.arrayToVector(analysisChunk)

    const rhythm = ess.RhythmExtractor2013(vectorSignal, 208, 'multifeature', 40)
    const bpm = correctOctaveError(rhythm.bpm)
    console.log(`[worker] job ${id}: bpm=${bpm} (raw=${rhythm.bpm})`)

    const keyResult = ess.KeyExtractor(
      vectorSignal,
      true,
      4096,
      4096,
      12,
      3500,
      60,
      25,
      0.2,
      'bgate',
      sampleRate,
      0.0001,
      440,
      'cosine',
      'hann'
    )
    console.log(`[worker] job ${id}: key=${keyResult.key} ${keyResult.scale} (strength=${keyResult.strength.toFixed(2)})`)

    self.postMessage({
      id,
      status: 'done',
      result: {
        bpm: Math.round(bpm * 10) / 10,
        key: keyResult.key,
        scale: keyResult.scale,
        keyStrength: Math.round(keyResult.strength * 100) / 100,
        cuePoints,
      },
    })
  } catch (err) {
    console.error('Analysis error in worker:', err)
    const message =
      (err && err.message) ||
      (typeof err === 'string' ? err : null) ||
      (err && err.toString && err.toString()) ||
      JSON.stringify(err)
    self.postMessage({ id, status: 'error', error: message, stack: err && err.stack })
  }
}
