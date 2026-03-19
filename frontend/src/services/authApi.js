import { api } from '../lib/axios'

export const authApi = {
  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  registerInitiate: async ({ email, password, fullName }) => {
    const { data } = await api.post('/auth/register/initiate', {
      email,
      password,
      fullName,
      role: 'intern',
    })
    return data
  },
  registerVerify: async ({ email, otp }) => {
    const { data } = await api.post('/auth/register/verify', { email, otp })
    return data
  },
  resendOtp: async ({ email }) => {
    const { data } = await api.post('/auth/otp/resend', { email })
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  listUsers: async ({ role, q } = {}) => {
    const { data } = await api.get('/auth/users', { params: { role, q } })
    return data
  },
}

