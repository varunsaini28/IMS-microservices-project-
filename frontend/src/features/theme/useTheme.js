import { useEffect } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'

export function useThemePreference() {
  const [theme, setTheme] = useLocalStorage('ims.pref.theme', 'system') // 'light' | 'dark' | 'system'

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    const shouldDark = theme === 'dark' || (theme === 'system' && systemDark)
    root.classList.toggle('dark', Boolean(shouldDark))
  }, [theme])

  return { theme, setTheme }
}

