import { useRef, useCallback } from 'react'

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
      const arrayBuffer = await file.arrayBuffer()
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      audioCtx.close()

      const worker = getWorker()
      const id = nextId++

      return new Promise((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject })
        const dataCopy = Float32Array.from(channelData)
        worker.postMessage(
          { id, channelData: dataCopy, sampleRate },
          [dataCopy.buffer]
        )
      })
    },
    [getWorker]
  )

  return { analyzeFile }
}
