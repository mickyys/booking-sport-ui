import api from './axiosInstance';
import { MPConnectStatus } from '../types';

export const getMPConnectStatus = async (token: string): Promise<MPConnectStatus> => {
  const response = await api.get('/admin/mercadopago/status', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getMPConnectAuthURL = async (token: string): Promise<{ auth_url: string }> => {
  const response = await api.get('/admin/mercadopago/connect', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const disconnectMP = async (token: string): Promise<void> => {
  await api.post('/admin/mercadopago/disconnect', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
