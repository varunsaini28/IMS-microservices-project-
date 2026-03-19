import { useEffect } from 'react'

export function useKeyboardShortcut(keys, handler, opts = {}) {
  const { enabled = true, preventDefault = true } = opts

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      const normalized = Array.isArray(keys) ? keys : [keys]
      for (const combo of normalized) {
        const wantCtrl = combo.includes('ctrl') || combo.includes('cmd')
        const wantShift = combo.includes('shift')
        const wantAlt = combo.includes('alt')
        const wantKey = combo.split('+').pop()

        if (wantCtrl !== isCtrl) continue
        if (wantShift !== e.shiftKey) continue
        if (wantAlt !== e.altKey) continue
        if (wantKey && wantKey.toLowerCase() !== key) continue

        if (preventDefault) e.preventDefault()
        handler(e)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, handler, keys, preventDefault])
}

