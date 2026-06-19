const CACHE_ENDPOINT = '/api/cache'

let cachePromise = null

function getCacheKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}`
}

function loadCache() {
  if (!cachePromise) {
    cachePromise = fetch(CACHE_ENDPOINT)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}))
  }
  return cachePromise
}

export async function getCachedResult(file) {
  const cache = await loadCache()
  return cache[getCacheKey(file)] ?? null
}

export async function saveCachedResult(file, result) {
  const key = getCacheKey(file)
  const cache = await loadCache()
  cache[key] = result

  try {
    await fetch(CACHE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: result }),
    })
  } catch (err) {
    console.error('Failed to persist analysis cache entry:', err)
  }
}
