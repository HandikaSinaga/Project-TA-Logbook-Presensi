import axiosInstance from '../utils/axiosInstance';

export const attendanceService = {
  getAll: async () => {
    const response = await axiosInstance.get('/user/attendances');
    return response.data;
  },

  checkIn: async (location) => {
    const response = await axiosInstance.post('/user/attendances/check-in', location);
    return response.data;
  },

  checkOut: async () => {
    const response = await axiosInstance.post('/user/attendances/check-out');
    return response.data;
  },

  getToday: async () => {
    const response = await axiosInstance.get('/user/attendances/today');
    return response.data;
  }
};
