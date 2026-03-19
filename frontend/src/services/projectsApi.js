import { api } from '../lib/axios';

const ALLOWED_FILTER_KEYS = ['status', 'manager_id'];

const cleanParams = (params = {}) => {
  const cleaned = {};
  ALLOWED_FILTER_KEYS.forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

const isValidId = (val) => val && typeof val === 'string' && val.trim() !== '';

export const projectsApi = {
  list: async (params = {}) => {
    const safeParams = cleanParams(params);
    const { data } = await api.get('/projects', { params: safeParams });
    return data;
  },

  getById: async (id) => {
    if (!isValidId(id)) throw new Error('Invalid project ID');
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  create: async (payload) => {
    const { data } = await api.post('/projects', payload);
    return data;
  },

  update: async ({ id, ...payload }) => {
    if (!isValidId(id)) throw new Error('Invalid project ID');
    const { data } = await api.put(`/projects/${id}`, payload);
    return data;
  },

  updateStatus: async ({ id, status }) => {
    if (!isValidId(id)) throw new Error('Invalid project ID');
    const allowed = ['planning', 'in_progress', 'completed'];
    if (!allowed.includes(status)) {
      throw new Error('Status must be one of: planning, in_progress, completed');
    }
    const { data } = await api.patch(`/projects/${id}/status`, { status });
    return data;
  },

  delete: async (id) => {
    if (!isValidId(id)) throw new Error('Invalid project ID');
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  interns: async (projectId) => {
    if (!isValidId(projectId)) throw new Error('Invalid project ID');
    const { data } = await api.get(`/projects/${projectId}/interns`);
    return data;
  },

  assignIntern: async ({ projectId, internId }) => {
    if (!isValidId(projectId) || !isValidId(internId)) {
      throw new Error('Invalid project or intern ID');
    }
    const { data } = await api.post(`/projects/${projectId}/interns/${internId}`);
    return data;
  },

  bulkAssignInterns: async ({ projectId, internIds, batchId }) => {
    if (!isValidId(projectId)) throw new Error('Invalid project ID');
    const cleanedIds = (internIds || [])
      .map((id) => String(id).trim())
      .filter((id) => id !== '');
    if (cleanedIds.length === 0) {
      throw new Error('At least one valid intern ID is required');
    }
    const { data } = await api.post(
      `/projects/${projectId}/interns/bulk`,
      {
        internIds: cleanedIds,
        batchId: batchId ? String(batchId) : undefined,
      },
      {
        headers: batchId ? { 'Idempotency-Key': String(batchId) } : undefined,
      }
    );
    return data;
  },

  removeIntern: async ({ projectId, internId }) => {
    if (!isValidId(projectId) || !isValidId(internId)) {
      throw new Error('Invalid project or intern ID');
    }
    const { data } = await api.delete(`/projects/${projectId}/interns/${internId}`);
    return data;
  },
};


