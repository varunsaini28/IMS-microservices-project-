import { api } from '../lib/axios'

export const notificationsApi = {
  list: async (params = {}) => {
    const { data } = await api.get('/notifications', { params })
    return data
  },
  markRead: async (id) => {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data
  },
  markAllRead: async () => {
    const { data } = await api.post('/notifications/read-all')
    return data
  },
  sendBulkEmail: async (payload) => {
    const { data } = await api.post('/notifications/send', payload)
    return data
  },
}

