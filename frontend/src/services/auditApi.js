import { api } from '../lib/axios'

export const auditApi = {
  list: async (params = {}) => {
    const { data } = await api.get('/audit', { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/audit/${id}`)
    return data
  },
}

