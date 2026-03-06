import apiClient from './client';

export type CalibrationType = 'compass' | 'accelerometer' | 'gyroscope' | 'radio' | 'esc';

export interface CalibrationItem {
  type: CalibrationType | string;
  status: 'unknown' | 'needs_calibration' | 'in_progress' | 'calibrated' | string;
  last_calibrated?: number | null;
  message: string;
}

export const calibrationService = {
  getStatus: async (): Promise<CalibrationItem[]> => {
    const response = await apiClient.get('/calibration/status');
    return response.data?.items ?? [];
  },

  start: async (type: CalibrationType): Promise<CalibrationItem> => {
    const response = await apiClient.post('/calibration/start', { type });
    return response.data?.item;
  },
};
