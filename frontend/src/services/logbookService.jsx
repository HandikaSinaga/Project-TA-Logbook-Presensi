import axiosInstance from '../utils/axiosInstance';

export const logbookService = {
  getAll: async () => {
    const response = await axiosInstance.get('/user/logbooks');
    return response.data;
  },

  create: async (data) => {
    const response = await axiosInstance.post('/user/logbooks', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosInstance.put(`/user/logbooks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/user/logbooks/${id}`);
    return response.data;
  }
};
