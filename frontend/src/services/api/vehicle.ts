import apiClient, { isMissingEndpointError } from './client';

export interface MotorTestPayload {
  motor_number: number;
  throttle_percent: number;
  duration_sec: number;
}

export const vehicleService = {
  getVehicleInfo: async () => {
    try {
      const response = await apiClient.get('/vehicle/info');
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      const [stateResponse, linkResponse] = await Promise.all([
        apiClient.get('/state'),
        apiClient.get('/vehicle/link'),
      ]);

      return {
        connected: Boolean(linkResponse.data?.link_alive),
        armed: Boolean(stateResponse.data?.armed),
        mode: stateResponse.data?.mode ?? 'UNKNOWN',
      };
    }
  },

  arm: async (): Promise<void> => {
    try {
      await apiClient.post('/vehicle/arm');
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await apiClient.post('/arm');
    }
  },

  disarm: async (): Promise<void> => {
    try {
      await apiClient.post('/vehicle/disarm');
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await apiClient.post('/disarm');
    }
  },

  setMode: async (mode: string): Promise<void> => {
    try {
      await apiClient.post('/vehicle/mode', { mode });
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await apiClient.post('/mode', { mode });
    }
  },

  sendCommand: async (command: string, params: Record<string, unknown>): Promise<void> => {
    try {
      await apiClient.post('/vehicle/command', { command, params });
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    // Generic command endpoint is not available on all backends; map common command.
    if (command.toUpperCase() === 'SET_MODE' && typeof params.mode === 'string') {
      await apiClient.post('/mode', { mode: params.mode });
      return;
    }

    throw new Error('Generic vehicle command endpoint is not available in this backend.');
  },

  motorTest: async (payload: MotorTestPayload): Promise<void> => {
    try {
      await apiClient.post('/vehicle/motor-test', payload);
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    throw new Error('Motor test endpoint is not available in this backend.');
  },

  rtl: async (): Promise<void> => {
    try {
      await apiClient.post('/vehicle/rtl');
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await apiClient.post('/mode', { mode: 'RTL' });
    }
  },

  land: async (): Promise<void> => {
    try {
      await apiClient.post('/vehicle/land');
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await apiClient.post('/mode', { mode: 'LAND' });
    }
  },

  loiter: async (duration?: number): Promise<void> => {
    try {
      await apiClient.post('/vehicle/loiter', { duration });
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await apiClient.post('/mode', { mode: 'LOITER' });
    }
  },
};
