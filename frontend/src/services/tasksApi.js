import { api } from '../lib/axios';

export const tasksApi = {
  list: async (params = {}) => {
    const { data } = await api.get('/tasks', { params });
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/tasks', payload);
    return data;
  },
  bulkAssign: async ({ batchId, interns, tasks }) => {
    const { data } = await api.post(
      '/tasks/bulk-assign',
      { batchId, interns, tasks },
      {
        headers: batchId ? { 'Idempotency-Key': batchId } : undefined,
      }
    );
    return data;
  },
  updateStatus: async ({ id, status, completedByEmail }) => {
    const { data } = await api.patch(`/tasks/${id}/status`, { status, completedByEmail });
    return data;
  },
  // Attendance
  attendanceMe: async () => {
    const { data } = await api.get('/tasks/attendance/me');
    return data;
  },
  attendanceAll: async (params = {}) => {
    const { data } = await api.get('/tasks/attendance', { params });
    return data;
  },
  markAttendance: async (payload) => {
    const { data } = await api.post('/tasks/attendance/mark', payload);
    return data;
  },
  markSelfAttendance: async () => {                        // <-- new
    const { data } = await api.post('/tasks/attendance/mark-self');
    return data;
  },
  // Leaves
  leavesMe: async () => {
    const { data } = await api.get('/tasks/leaves/me');
    return data;
  },
  leavesAll: async (params = {}) => {
    const { data } = await api.get('/tasks/leaves', { params });
    return data;
  },
  applyLeave: async (payload) => {
    const { data } = await api.post('/tasks/leaves', payload);
    return data;
  },
  updateLeaveStatus: async ({ id, status }) => {
    const { data } = await api.put(`/tasks/leaves/${id}/status`, { status });
    return data;
  },
  // Work logs
  worklogsMe: async (params = {}) => {
    const { data } = await api.get('/tasks/worklogs/me', { params });
    return data;
  },
  worklogsAll: async (params = {}) => {
    const { data } = await api.get('/tasks/worklogs', { params });
    return data;
  },
  createWorklog: async (payload) => {
    const { data } = await api.post('/tasks/worklogs', payload);
    return data;
  },
  updateWorklog: async ({ id, ...payload }) => {
    const { data } = await api.put(`/tasks/worklogs/${id}`, payload);
    return data;
  },
  deleteWorklog: async (id) => {
    const { data } = await api.delete(`/tasks/worklogs/${id}`);
    return data;
  },
  // Calendar
  calendar: async ({ month, year } = {}) => {
    const { data } = await api.get('/tasks/calendar', { params: { month, year } });
    return data;
  },
  setCalendarDay: async (payload) => {
    const { data } = await api.post('/tasks/calendar', payload);
    return data;
  },
};