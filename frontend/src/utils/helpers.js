export function cn(...values) {
  return values
    .flatMap((v) => {
      if (!v) return []
      if (Array.isArray(v)) return v
      if (typeof v === 'object') return Object.entries(v).filter(([, ok]) => ok).map(([k]) => k)
      return [String(v)]
    })
    .join(' ')
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

