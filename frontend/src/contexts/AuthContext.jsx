import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuthHandlers } from '../lib/axios'

const STORAGE_KEY = 'ims.auth'

export const AuthContext = createContext(null)

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(next) {
  try {
    if (!next) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => readStored()?.user ?? null)
  const [accessToken, setAccessToken] = useState(() => readStored()?.accessToken ?? null)
  const [refreshToken, setRefreshToken] = useState(() => readStored()?.refreshToken ?? null)

  const persist = useCallback(
    (next) => {
      writeStored(next)
    },
    []
  )

  const login = useCallback(
    ({ user: nextUser, accessToken: at, refreshToken: rt }) => {
      setUser(nextUser)
      setAccessToken(at)
      setRefreshToken(rt)
      persist({ user: nextUser, accessToken: at, refreshToken: rt })
    },
    [persist]
  )

  const logout = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    persist(null)
    navigate('/login', { replace: true })
  }, [navigate, persist])

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) throw new Error('No refresh token')
    const { data } = await api.post('/auth/refresh', { refreshToken }, { _skipAuthRefresh: true })
    if (!data?.accessToken) throw new Error('Refresh did not return accessToken')
    setAccessToken(data.accessToken)
    if (data.user) setUser(data.user)
    persist({ user: data.user ?? user, accessToken: data.accessToken, refreshToken })
    return data.accessToken
  }, [persist, refreshToken, user])

  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      onAuthUpdate: ({ accessToken: at, user: u }) => {
        if (at) setAccessToken(at)
        if (u) setUser(u)
        const current = readStored()
        persist({
          user: u ?? current?.user ?? user,
          accessToken: at ?? current?.accessToken ?? accessToken,
          refreshToken: current?.refreshToken ?? refreshToken,
        })
      },
      onLogout: logout,
    })
  }, [accessToken, logout, persist, refreshToken, user])

  const isAdmin = user?.role === 'admin'
  const isIntern = user?.role === 'intern'

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      login,
      logout,
      refreshAccessToken,
      isAdmin,
      isIntern,
    }),
    [accessToken, isAdmin, isIntern, login, logout, refreshAccessToken, refreshToken, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

