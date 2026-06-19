import { useRef, useCallback } from 'react'
import { getCachedResult, saveCachedResult } from '../utils/analysisCache'

let nextId = 1

export function useAudioAnalyzer() {
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../worker/analysisWorker.js', import.meta.url),
        { type: 'module' }
      )
      workerRef.current.onmessage = (event) => {
        const { id, status, result, error, stack } = event.data
        const pending = pendingRef.current.get(id)
        if (!pending) return
        pendingRef.current.delete(id)
        if (status === 'done') {
          pending.resolve(result)
        } else {
          const err = new Error(error || 'Unknown worker error')
          err.stack = stack || err.stack
          pending.reject(err)
        }
      }
      workerRef.current.onerror = (event) => {
        console.error('Worker crashed:', event)
      }
    }
    return workerRef.current
  }, [])

  const analyzeFile = useCallback(
    async (file) => {
      const cached = await getCachedResult(file)
      if (cached) {
        console.log(`[analyze] ${file.name}: cache hit`, cached)
        return cached
      }
      
      const arrayBuffer = await file.arrayBuffer()
      // essentia's RhythmExtractor2013 has no sampleRate parameter - it
      // hardcodes an internal assumption of 44100Hz. If the browser's
      // AudioContext defaults to a different rate (e.g. 48000Hz, common on
      // Windows), decodeAudioData resamples to that rate and every detected
      // beat interval ends up scaled by 44100/actualRate, undershooting the
      // true BPM by ~8-9%. Forcing 44100Hz here keeps the signal's actual
      // rate matching what essentia assumes.
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100,
      })
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      audioCtx.close()
      console.log(
        `[analyze] ${file.name}: decoded (${audioBuffer.duration.toFixed(1)}s @ ${sampleRate}Hz), sending to worker...`
      )

      const worker = getWorker()
      const id = nextId++
      const startedAt = performance.now()

      const result = await new Promise((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject })
        const dataCopy = Float32Array.from(channelData)
        worker.postMessage(
          { id, channelData: dataCopy, sampleRate },
          [dataCopy.buffer]
        )
      })

      const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1)
      console.log(`[analyze] ${file.name}: worker finished in ${elapsed}s`, result)

      await saveCachedResult(file, result)
      return result
    },
    [getWorker]
  )

  return { analyzeFile }
}
