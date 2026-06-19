// Camelot Wheel compatibility. A code is like "8B" (number 1-12 + A/B).
// Harmonically compatible moves from a given code:
//   - same code (identical key)
//   - same number, opposite letter (relative major/minor)
//   - ±1 on the number, same letter (adjacent on the wheel)
// Anything else is a "clash" (a key change that won't blend smoothly).

function parseCamelot(code) {
  if (!code) return null
  const match = /^(\d{1,2})([AB])$/.exec(code)
  if (!match) return null
  return { number: parseInt(match[1], 10), letter: match[2] }
}

export function harmonicRelation(codeA, codeB) {
  const a = parseCamelot(codeA)
  const b = parseCamelot(codeB)
  if (!a || !b) return { compatible: false, label: 'unknown' }

  if (a.number === b.number && a.letter === b.letter) {
    return { compatible: true, label: 'same key' }
  }
  if (a.number === b.number && a.letter !== b.letter) {
    return { compatible: true, label: 'relative' }
  }
  // Wheel wraps 12 -> 1.
  const diff = Math.abs(a.number - b.number)
  const adjacent = diff === 1 || diff === 11
  if (adjacent && a.letter === b.letter) {
    return { compatible: true, label: 'adjacent' }
  }
  return { compatible: false, label: 'clash' }
}
