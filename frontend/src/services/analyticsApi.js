import { api } from '../lib/axios'

export const analyticsApi = {
  overall: async () => {
    const { data } = await api.get('/analytics/overall')
    return data
  },
  internProductivity: async ({ internId, startDate, endDate }) => {
    const { data } = await api.get(`/analytics/intern/${internId}/productivity`, {
      params: { startDate, endDate },
    })
    return data
  },
  internAttendance: async ({ internId, month, year }) => {
    const { data } = await api.get(`/analytics/intern/${internId}/attendance`, {
      params: { month, year },
    })
    return data
  },
  projectProgress: async ({ projectId }) => {
    const { data } = await api.get(`/analytics/project/${projectId}/progress`)
    return data
  },
}

