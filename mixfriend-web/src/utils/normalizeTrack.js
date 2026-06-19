// Older cached entries (and Float32Array round-trips through JSON) can store
// beatTicks as a keyed object {"0": 0.46, "1": 0.94, ...} instead of a real
// array. Normalize to a plain number array so .length/index access works.
export function normalizeBeatTicks(beatTicks) {
  if (!beatTicks) return []
  if (Array.isArray(beatTicks)) return beatTicks
  return Object.values(beatTicks)
}
