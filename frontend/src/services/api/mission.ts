import apiClient, { isMissingEndpointError } from './client';
import type { Mission } from '../../types/mission';

export type MissionUploadItem = {
  frame: number;
  command: number;
  param1?: number;
  param2?: number;
  param3?: number;
  param4?: number;
  x: number;
  y: number;
  z: number;
};

export type MissionUploadResponse = {
  mission_upload: number | null;
  mission_count: number;
  source: 'payload' | 'default';
  queued: boolean;
  synced_to_vehicle: boolean;
};

function toMission(items: unknown[]): Mission {
  return {
    id: 'active-mission',
    name: 'Vehicle Mission',
    description: 'Mission synchronized from autopilot',
    waypoints: items.map((item, index) => {
      const point = (item ?? {}) as Record<string, unknown>;
      return {
        id: String(index + 1),
        sequence: index,
        latitude: Number(point.x ?? 0),
        longitude: Number(point.y ?? 0),
        altitude: Number(point.z ?? 0),
        holdTime: Number(point.param1 ?? 0),
        command: String(point.command ?? 'WAYPOINT'),
        params: {
          param1: point.param1,
          param2: point.param2,
          param3: point.param3,
          param4: point.param4,
        },
      };
    }),
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const missionService = {
  uploadMissionItems: async (items: MissionUploadItem[]): Promise<MissionUploadResponse> => {
    const response = await apiClient.post('/mission/upload', { items });
    return response.data;
  },

  getMissions: async (): Promise<Mission[]> => {
    try {
      const response = await apiClient.get('/missions');
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const response = await apiClient.get('/mission/download');
    const items = Array.isArray(response.data?.items) ? response.data.items : [];
    return [toMission(items)];
  },

  getMissionById: async (id: string): Promise<Mission> => {
    try {
      const response = await apiClient.get(`/missions/${id}`);
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const missions = await missionService.getMissions();
    const mission = missions.find((item) => item.id === id);
    if (!mission) {
      throw new Error(`Mission '${id}' not found`);
    }
    return mission;
  },

  createMission: async (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mission> => {
    try {
      const response = await apiClient.post('/missions', mission);
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    await apiClient.post('/mission/upload');
    return {
      ...mission,
      id: `mission-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  updateMission: async (id: string, mission: Partial<Mission>): Promise<Mission> => {
    try {
      const response = await apiClient.put(`/missions/${id}`, mission);
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }

      const current = await missionService.getMissionById(id);
      return {
        ...current,
        ...mission,
        updatedAt: new Date(),
      };
    }
  },

  deleteMission: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/missions/${id}`);
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    await apiClient.delete('/mission/clear');
  },

  uploadMission: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/missions/${id}/upload`);
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    await apiClient.post('/mission/upload');
  },

  downloadMission: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/missions/${id}/download`);
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    await apiClient.get('/mission/download');
  },

  executeMission: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/missions/${id}/execute`);
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    await apiClient.post('/mission/start');
  },

  abortMission: async (): Promise<void> => {
    try {
      await apiClient.post('/missions/abort');
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    await apiClient.delete('/mission/clear');
  },
};
