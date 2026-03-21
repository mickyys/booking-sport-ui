import api from './axiosInstance';

export const getUserCancelledBookings = async (token: string, page = 1, limit = 5) => {
  const response = await api.get('/bookings/my-cancelled', {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
