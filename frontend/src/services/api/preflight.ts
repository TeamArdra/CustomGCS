import apiClient from './client';

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

export const preflightService = {
  getChecks: async (): Promise<PreflightResponse> => {
    const response = await apiClient.get('/preflight/checks');
    return response.data;
  },

  runChecks: async (): Promise<PreflightResponse> => {
    const response = await apiClient.post('/preflight/run');
    return response.data;
  },
};
