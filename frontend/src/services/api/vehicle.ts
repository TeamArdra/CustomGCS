import apiClient from './client';

export const vehicleService = {
  getVehicleInfo: async () => {
    const response = await apiClient.get('/vehicle/info');
    return response.data;
  },

  arm: async (): Promise<void> => {
    await apiClient.post('/vehicle/arm');
  },

  disarm: async (): Promise<void> => {
    await apiClient.post('/vehicle/disarm');
  },

  setMode: async (mode: string): Promise<void> => {
    await apiClient.post('/vehicle/mode', { mode });
  },

  sendCommand: async (command: string, params: Record<string, unknown>): Promise<void> => {
    await apiClient.post('/vehicle/command', { command, params });
  },

  rtl: async (): Promise<void> => {
    await apiClient.post('/vehicle/rtl');
  },

  land: async (): Promise<void> => {
    await apiClient.post('/vehicle/land');
  },

  loiter: async (duration?: number): Promise<void> => {
    await apiClient.post('/vehicle/loiter', { duration });
  },
};
