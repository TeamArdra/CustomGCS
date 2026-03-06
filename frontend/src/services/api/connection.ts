import apiClient from './client';

export interface ConnectionStatus {
  connected: boolean;
  connection_string?: string;
  connected_at?: number;
}

export interface ConnectionDevice {
  id: string;
  label: string;
  kind: 'serial' | 'network';
}

export interface TelemetryProfile {
  low_latency: boolean;
}

export const connectionService = {
  connect: async (connectionString: string): Promise<ConnectionStatus> => {
    const response = await apiClient.post('/connection/connect', {
      connection_string: connectionString,
    });
    return response.data;
  },

  disconnect: async (): Promise<ConnectionStatus> => {
    const response = await apiClient.post('/connection/disconnect');
    return response.data;
  },

  status: async (): Promise<ConnectionStatus> => {
    const response = await apiClient.get('/connection/status');
    return response.data;
  },

  health: async (): Promise<boolean> => {
    const response = await apiClient.get('/health');
    return response.data?.status === 'ok';
  },

  listPorts: async (): Promise<ConnectionDevice[]> => {
    const response = await apiClient.get('/connection/ports', {
      timeout: 4000,
    });
    return response.data?.devices ?? [];
  },

  getTelemetryProfile: async (): Promise<TelemetryProfile> => {
    const response = await apiClient.get('/telemetry/profile');
    return response.data;
  },

  setTelemetryProfile: async (lowLatency: boolean): Promise<TelemetryProfile> => {
    const response = await apiClient.post('/telemetry/profile', {
      low_latency: lowLatency,
    });
    return response.data;
  },
};
