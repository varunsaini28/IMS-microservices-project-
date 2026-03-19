import { api } from '../lib/axios';

export const internApi = {
  // Profile
  getProfile: async () => {
    const { data } = await api.get('/intern/profile');
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await api.put('/intern/profile', payload);
    return data;
  },

  // Documents
  documents: async () => {
    const { data } = await api.get('/intern/documents');
    return data;
  },

  // eslint-disable-next-line no-unused-vars
  uploadDocument: async (file, documentType = 'other') => {
    const formData = new FormData();
    formData.append('file', file);
    // If your backend expects a document type, uncomment the next line:
    // formData.append('type', documentType);
    const { data } = await api.post('/intern/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Skills
  skills: async () => {
    const { data } = await api.get('/intern/skills');
    return data;
  },

  createSkill: async ({ name, proficiencyLevel = 'beginner' }) => {
    const payload = {
      skill_name: name,
      proficiency_level: proficiencyLevel,
    };
    const { data } = await api.post('/intern/skills', payload);
    return data;
  },

  // Certificates
  certificates: async () => {
    const { data } = await api.get('/intern/certificates');
    return data;
  },

  // Evaluations
  evaluations: async () => {
    const { data } = await api.get('/intern/evaluations');
    return data;
  },
};