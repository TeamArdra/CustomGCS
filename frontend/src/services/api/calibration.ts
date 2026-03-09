import apiClient, { isMissingEndpointError } from './client';

export type CalibrationType = 'compass' | 'accelerometer' | 'gyroscope' | 'radio' | 'esc';

export interface CalibrationItem {
  type: CalibrationType | string;
  status: 'unknown' | 'needs_calibration' | 'in_progress' | 'calibrated' | string;
  last_calibrated?: number | null;
  message: string;
}

export const calibrationService = {
  getStatus: async (): Promise<CalibrationItem[]> => {
    try {
      const response = await apiClient.get('/calibration/status');
      if (Array.isArray(response.data?.items)) {
        return response.data.items;
      }
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const response = await apiClient.get('/health');
    const health = response.data ?? {};

    const now = Math.floor(Date.now() / 1000);

    return [
      {
        type: 'compass',
        status: health.gps_fix ? 'calibrated' : 'needs_calibration',
        last_calibrated: health.gps_fix ? now : null,
        message: health.gps_fix ? 'GPS fix acquired' : 'No GPS fix yet',
      },
      {
        type: 'accelerometer',
        status: health.ekf_ok ? 'calibrated' : 'needs_calibration',
        last_calibrated: health.ekf_ok ? now : null,
        message: health.ekf_ok ? 'EKF healthy' : 'EKF not healthy',
      },
      {
        type: 'gyroscope',
        status: health.ekf_ok ? 'calibrated' : 'needs_calibration',
        last_calibrated: health.ekf_ok ? now : null,
        message: health.ekf_ok ? 'Gyro/EKF status healthy' : 'Gyro/EKF check failed',
      },
      {
        type: 'radio',
        status: health.armable ? 'calibrated' : 'needs_calibration',
        last_calibrated: health.armable ? now : null,
        message: health.prearm_message ?? 'Waiting for armable state',
      },
      {
        type: 'esc',
        status: health.battery_ok ? 'calibrated' : 'needs_calibration',
        last_calibrated: health.battery_ok ? now : null,
        message: health.battery_ok ? 'Battery/ESC checks look healthy' : 'Battery condition not healthy',
      },
    ];
  },

  start: async (type: CalibrationType): Promise<CalibrationItem> => {
    try {
      const response = await apiClient.post('/calibration/start', { type });
      if (response.data?.item) {
        return response.data.item;
      }
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const endpointMap: Record<string, string> = {
      compass: '/calibration/compass',
      accelerometer: '/calibration/accelerometer',
      gyroscope: '/calibration/level',
      esc: '/calibration/esc',
    };

    const endpoint = endpointMap[type];
    if (!endpoint) {
      throw new Error(`Calibration type '${type}' is not supported by this backend.`);
    }

    await apiClient.post(endpoint);

    return {
      type,
      status: 'calibrated',
      last_calibrated: Math.floor(Date.now() / 1000),
      message: `${type} calibration command sent`,
    };
  },
};
