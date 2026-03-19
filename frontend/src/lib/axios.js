// import axios from 'axios'

// const baseURL = import.meta.env.VITE_API_BASE_URL

// export const api = axios.create({
//   baseURL,
//   timeout: 30_000,
// })

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// let auth = {
//   getAccessToken: () => null,
//   getRefreshToken: () => null,
//   onAuthUpdate: () => {},
//   onLogout: () => {},
// }

// export function setAuthHandlers(handlers) {
//   auth = { ...auth, ...handlers }
// }

// api.interceptors.request.use((config) => {
//   const token = auth.getAccessToken?.()
//   if (token) {
//     config.headers = config.headers ?? {}
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// let refreshPromise = null

// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const original = error?.config
//     const status = error?.response?.status

//     // Retry on 429 / transient 5xx using exponential backoff.
//     // Only retries safe requests (GET/HEAD) or requests with Idempotency-Key.
//     if (original && !original._retry429) {
//       const method = String(original.method || 'get').toLowerCase()
//       const hasIdempotencyKey = !!(original.headers && (original.headers['Idempotency-Key'] || original.headers['idempotency-key']))
//       const isSafe = method === 'get' || method === 'head'
//       const isRetryableStatus = status === 429 || status === 502 || status === 503 || status === 504

//       if (isRetryableStatus && (isSafe || hasIdempotencyKey)) {
//         original._retry429 = (original._retry429 || 0) + 1
//         const attempt = original._retry429
//         if (attempt <= 5) {
//           const ra = Number(error?.response?.headers?.['retry-after'])
//           const base = Number.isFinite(ra) ? ra * 1000 : 500
//           const delay = Math.min(15_000, base * 2 ** (attempt - 1))
//           await sleep(delay)
//           return api.request(original)
//         }
//       }
//     }

//     if (status !== 401 || !original || original._retry || original._skipAuthRefresh) {
//       return Promise.reject(error)
//     }

//     original._retry = true

//     const refreshToken = auth.getRefreshToken?.()
//     if (!refreshToken) {
//       auth.onLogout?.()
//       return Promise.reject(error)
//     }

//     try {
//       if (!refreshPromise) {
//         refreshPromise = api
//           .post('/auth/refresh', { refreshToken }, { _skipAuthRefresh: true })
//           .then((r) => r.data)
//           .finally(() => {
//             refreshPromise = null
//           })
//       }

//       const data = await refreshPromise
//       if (!data?.accessToken) throw new Error('No accessToken in refresh response')

//       auth.onAuthUpdate?.({
//         accessToken: data.accessToken,
//         user: data.user,
//       })

//       original.headers = original.headers ?? {}
//       original.headers.Authorization = `Bearer ${data.accessToken}`
//       return api.request(original)
//     } catch (e) {
//       auth.onLogout?.()
//       return Promise.reject(e)
//     }
//   }
// )


import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL,
  timeout: 60000,
  withCredentials: true
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let auth = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  onAuthUpdate: () => {},
  onLogout: () => {},
}

export function setAuthHandlers(handlers) {
  auth = { ...auth, ...handlers }
}

// ✅ Attach token
api.interceptors.request.use((config) => {
  const token = auth.getAccessToken?.()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config
    const status = error?.response?.status

    // ✅ Retry logic (handles Render cold start + 502)
    if (original && !original._retry429) {
      const method = String(original.method || 'get').toLowerCase()
      const hasIdempotencyKey =
        !!(original.headers &&
          (original.headers['Idempotency-Key'] ||
            original.headers['idempotency-key']))

      const isSafe = method === 'get' || method === 'head'
      const isAuthCall = original.url?.includes('/auth')

      const isRetryableStatus =
        status === 429 || status === 502 || status === 503 || status === 504

      if (isRetryableStatus && (isSafe || hasIdempotencyKey || isAuthCall)) {
        original._retry429 = (original._retry429 || 0) + 1
        const attempt = original._retry429

        if (attempt <= 5) {
          const ra = Number(error?.response?.headers?.['retry-after'])
          const base = Number.isFinite(ra) ? ra * 1000 : 500
          const delay = Math.min(15000, base * 2 ** (attempt - 1))

          await sleep(delay)
          return api.request(original)
        }
      }
    }

    // ✅ Refresh token logic
    if (status !== 401 || !original || original._retry || original._skipAuthRefresh) {
      return Promise.reject(error)
    }

    original._retry = true

    const refreshToken = auth.getRefreshToken?.()
    if (!refreshToken) {
      auth.onLogout?.()
      return Promise.reject(error)
    }

    try {
      if (!refreshPromise) {
        refreshPromise = api
          .post('/api/auth/refresh', { refreshToken }, { _skipAuthRefresh: true })
          .then((r) => r.data)
          .finally(() => {
            refreshPromise = null
          })
      }

      const data = await refreshPromise
      if (!data?.accessToken) throw new Error('No accessToken')

      auth.onAuthUpdate?.({
        accessToken: data.accessToken,
        user: data.user,
      })

      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${data.accessToken}`

      return api.request(original)
    } catch (e) {
      auth.onLogout?.()
      return Promise.reject(e)
    }
  }
)

