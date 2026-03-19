import { api } from '../lib/axios'

export const configApi = {
  features: {
    list: async () => (await api.get('/config/features')).data,
    create: async (payload) => (await api.post('/config/features', payload)).data,
    update: async ({ name, ...payload }) => (await api.put(`/config/features/${name}`, payload)).data,
    remove: async (name) => (await api.delete(`/config/features/${name}`)).data,
  },
  settings: {
    list: async () => (await api.get('/config/settings')).data,
    create: async (payload) => (await api.post('/config/settings', payload)).data,
    update: async ({ key, ...payload }) => (await api.put(`/config/settings/${key}`, payload)).data,
    remove: async (key) => (await api.delete(`/config/settings/${key}`)).data,
  },
  schemas: {
    list: async () => (await api.get('/config/schemas')).data,
    create: async (payload) => (await api.post('/config/schemas', payload)).data,
    update: async ({ formType, ...payload }) =>
      (await api.put(`/config/schemas/${formType}`, payload)).data,
    remove: async (formType) => (await api.delete(`/config/schemas/${formType}`)).data,
  },
  workflows: {
    list: async () => (await api.get('/config/workflows')).data,
    create: async (payload) => (await api.post('/config/workflows', payload)).data,
    update: async ({ id, ...payload }) => (await api.put(`/config/workflows/${id}`, payload)).data,
    remove: async (id) => (await api.delete(`/config/workflows/${id}`)).data,
  },
  permissions: {
    list: async () => (await api.get('/config/permissions')).data,
    create: async (payload) => (await api.post('/config/permissions', payload)).data,
    update: async ({ role, resource, ...payload }) =>
      (await api.put(`/config/permissions/${role}/${resource}`, payload)).data,
    remove: async ({ role, resource }) =>
      (await api.delete(`/config/permissions/${role}/${resource}`)).data,
  },
}

