import apiClient, { isMissingEndpointError } from './client';

export type PreflightStatus = 'pending' | 'passed' | 'failed' | 'warning';

export interface PreflightCheck {
  id: string;
  name: string;
  status: PreflightStatus;
  message: string;
}

export interface PreflightResponse {
  checks: PreflightCheck[];
  ready_for_flight: boolean;
  timestamp: number;
}

function boolToStatus(ok: boolean): PreflightStatus {
  return ok ? 'passed' : 'failed';
}

export const preflightService = {
  getChecks: async (): Promise<PreflightResponse> => {
    try {
      const response = await apiClient.get('/preflight/checks');
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const [healthResponse, stateResponse, linkResponse] = await Promise.all([
      apiClient.get('/health'),
      apiClient.get('/state'),
      apiClient.get('/vehicle/link'),
    ]);

    const health = healthResponse.data ?? {};
    const state = stateResponse.data ?? {};
    const linkAlive = Boolean(linkResponse.data?.link_alive);

    const checks: PreflightCheck[] = [
      {
        id: 'connection',
        name: 'Vehicle Link',
        status: boolToStatus(linkAlive),
        message: linkAlive ? 'Vehicle link is alive' : 'Vehicle link is down',
      },
      {
        id: 'gps',
        name: 'GPS Lock',
        status: boolToStatus(Boolean(health.gps_fix)),
        message: health.gps_fix ? 'GPS fix available' : 'No GPS fix',
      },
      {
        id: 'ekf',
        name: 'EKF',
        status: boolToStatus(Boolean(health.ekf_ok)),
        message: health.ekf_ok ? 'EKF is healthy' : 'EKF not healthy',
      },
      {
        id: 'battery',
        name: 'Battery',
        status: boolToStatus(Boolean(health.battery_ok)),
        message: health.battery_ok ? 'Battery level healthy' : 'Battery check failed',
      },
      {
        id: 'arm_state',
        name: 'Arm State',
        status: state.armed ? 'warning' : 'passed',
        message: state.armed ? 'Vehicle is armed' : 'Vehicle is disarmed',
      },
    ];

    const readyForFlight = checks.every((check) => check.status === 'passed' || check.status === 'warning');

    return {
      checks,
      ready_for_flight: readyForFlight,
      timestamp: Date.now(),
    };
  },

  runChecks: async (): Promise<PreflightResponse> => {
    try {
      const response = await apiClient.post('/preflight/run');
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      return preflightService.getChecks();
    }
  },
};
