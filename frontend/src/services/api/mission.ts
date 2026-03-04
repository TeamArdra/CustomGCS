import apiClient from './client';
import type { Mission } from '../../types/mission';

export const missionService = {
  getMissions: async (): Promise<Mission[]> => {
    const response = await apiClient.get('/missions');
    return response.data;
  },

  getMissionById: async (id: string): Promise<Mission> => {
    const response = await apiClient.get(`/missions/${id}`);
    return response.data;
  },

  createMission: async (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mission> => {
    const response = await apiClient.post('/missions', mission);
    return response.data;
  },

  updateMission: async (id: string, mission: Partial<Mission>): Promise<Mission> => {
    const response = await apiClient.put(`/missions/${id}`, mission);
    return response.data;
  },

  deleteMission: async (id: string): Promise<void> => {
    await apiClient.delete(`/missions/${id}`);
  },

  uploadMission: async (id: string): Promise<void> => {
    await apiClient.post(`/missions/${id}/upload`);
  },

  downloadMission: async (id: string): Promise<void> => {
    await apiClient.post(`/missions/${id}/download`);
  },

  executeMission: async (id: string): Promise<void> => {
    await apiClient.post(`/missions/${id}/execute`);
  },

  abortMission: async (): Promise<void> => {
    await apiClient.post('/missions/abort');
  },
};
