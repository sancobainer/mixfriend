import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.resolve(__dirname, 'cache', 'analysis-cache.json')

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function writeCache(data) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2))
}

// Dev-only API for persisting analysis results to a real JSON file in the
// repo, so re-uploading the same track skips re-running BPM/key/cue
// detection. Only active under `vite dev` — a production static build has
// no server to handle this, so a real backend would be needed if/when this
// app moves past proof-of-concept.
function analysisCachePlugin() {
  return {
    name: 'analysis-cache-api',
    configureServer(server) {
      server.middlewares.use('/api/cache', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(readCache()))
          return
        }
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { key, value } = JSON.parse(body)
              const cache = readCache()
              cache[key] = value
              writeCache(cache)
              res.statusCode = 204
              res.end()
            } catch (err) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        res.statusCode = 405
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), analysisCachePlugin()],
  optimizeDeps: {
    exclude: ['essentia.js'],
  },
  worker: {
    format: 'es',
  },
})
