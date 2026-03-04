import apiClient from './client';
import type { User } from '../../types/vehicle';

export const authService = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    const { token, user } = response.data;
    localStorage.setItem('authToken', token);
    return { token, user };
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    const { token } = response.data;
    localStorage.setItem('authToken', token);
    return token;
  },
};
