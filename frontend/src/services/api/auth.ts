import apiClient from './client';
import type { User } from '../../types/vehicle';

export const authService = {
  login: async (username: string, password: string) => {
    void username;
    void password;
    throw new Error('Authentication endpoints are not available in this backend.');
  },

  logout: async () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<User> => {
    throw new Error('Authentication endpoints are not available in this backend.');
  },

  refreshToken: async () => {
    // Keep API shape for callers; there is no server-side auth refresh route.
    const existing = localStorage.getItem('authToken') ?? '';
    return existing;
  },
};
