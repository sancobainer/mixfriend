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

function detectCuePoints(ess, channelData, sampleRate) {
  const frameSize = 2048
  const hopSize = 1024
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

  const logEnergies = bandEnergies.map((row) => row.map((e) => Math.log1p(e * 1000)))

  const novelty = new Array(numFrames).fill(0)
  for (let f = 1; f < numFrames; f++) {
    let sum = 0
    for (let b = 0; b < numBands; b++) {
      const diff = logEnergies[f][b] - logEnergies[f - 1][b]
      if (diff > 0) sum += diff
    }
    novelty[f] = sum
  }

  const smoothWindow = 4
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

  const mean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length
  const variance = smoothed.reduce((a, b) => a + (b - mean) ** 2, 0) / smoothed.length
  const threshold = mean + Math.sqrt(variance)

  const candidates = []
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] > threshold && smoothed[i] >= smoothed[i - 1] && smoothed[i] >= smoothed[i + 1]) {
      candidates.push({ index: i, strength: smoothed[i] })
    }
  }
  candidates.sort((a, b) => b.strength - a.strength)

  const minSpacingFrames = 8 * frameRate
  const selected = []
  for (const c of candidates) {
    if (!selected.some((s) => Math.abs(s.index - c.index) < minSpacingFrames)) {
      selected.push(c)
    }
  }
  selected.sort((a, b) => a.index - b.index)

  return selected.map((c) => ({
    time: Math.round(((c.index * hopSize) / sampleRate) * 100) / 100,
    strength: Math.round(c.strength * 100) / 100,
  }))
}

self.onmessage = async (event) => {
  const { id, channelData, sampleRate } = event.data

  try {
    const ess = await getEssentia()
    const vectorSignal = ess.arrayToVector(channelData)

    const rhythm = ess.RhythmExtractor2013(vectorSignal, 208, 'multifeature', 40)
    const bpm = rhythm.bpm

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

    const cuePoints = detectCuePoints(ess, channelData, sampleRate)

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
