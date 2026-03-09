import apiClient, { isMissingEndpointError } from './client';

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

const FALLBACK_DEVICES: ConnectionDevice[] = [
  { id: 'tcp:127.0.0.1:5760', label: 'TCP (127.0.0.1:5760)', kind: 'network' },
  { id: 'udp:127.0.0.1:14555', label: 'UDP (127.0.0.1:14555)', kind: 'network' },
  { id: 'udp:127.0.0.1:14550', label: 'UDP (127.0.0.1:14550)', kind: 'network' },
  { id: 'tcp:192.168.1.100:5760', label: 'TCP (192.168.1.100:5760)', kind: 'network' },
];

export const connectionService = {
  connect: async (connectionString: string): Promise<ConnectionStatus> => {
    try {
      const response = await apiClient.post('/connection/connect', {
        connection_string: connectionString,
      });
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      // New backend connects during startup; preserve API contract for UI callers.
      return {
        connected: true,
        connection_string: connectionString,
        connected_at: Date.now(),
      };
    }
  },

  disconnect: async (): Promise<ConnectionStatus> => {
    try {
      const response = await apiClient.post('/connection/disconnect');
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      // New backend does not expose manual disconnect endpoint.
      return { connected: false };
    }
  },

  status: async (): Promise<ConnectionStatus> => {
    try {
      const response = await apiClient.get('/connection/status');
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      const response = await apiClient.get('/vehicle/link');
      return { connected: Boolean(response.data?.link_alive) };
    }
  },

  health: async (): Promise<boolean> => {
    const response = await apiClient.get('/health');
    if (typeof response?.data?.status === 'string') {
      return response.data.status === 'ok';
    }
    return Boolean(response?.data);
  },

  listPorts: async (): Promise<ConnectionDevice[]> => {
    try {
      const response = await apiClient.get('/connection/ports', {
        timeout: 4000,
      });
      return response.data?.devices ?? [];
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      return FALLBACK_DEVICES;
    }
  },

  getTelemetryProfile: async (): Promise<TelemetryProfile> => {
    try {
      const response = await apiClient.get('/telemetry/profile');
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      return { low_latency: false };
    }
  },

  setTelemetryProfile: async (lowLatency: boolean): Promise<TelemetryProfile> => {
    try {
      const response = await apiClient.post('/telemetry/profile', {
        low_latency: lowLatency,
      });
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      // New backend may not expose low-latency control endpoint.
      return { low_latency: lowLatency };
    }
  },
};
