import apiClient, { isMissingEndpointError } from './client';

export interface Parameter {
  id: string;
  name: string;
  value: string | number | boolean;
  type: string;
}

function detectType(value: unknown): string {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

function asParameter(name: string, value: unknown): Parameter {
  return {
    id: name,
    name,
    value: (value as string | number | boolean) ?? '',
    type: detectType(value),
  };
}

export const parameterService = {
  getParameters: async (): Promise<Parameter[]> => {
    try {
      const response = await apiClient.get('/parameters');
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const response = await apiClient.get('/parameters/cache');
    const parameters = response.data?.parameters ?? {};
    return Object.entries(parameters).map(([name, value]) => asParameter(name, value));
  },

  getParameterByName: async (name: string): Promise<Parameter> => {
    try {
      const response = await apiClient.get(`/parameters/${name}`);
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const response = await apiClient.get(`/parameters/info/${name}`);
    return asParameter(name, response.data?.value);
  },

  updateParameter: async (name: string, value: unknown): Promise<Parameter> => {
    try {
      const response = await apiClient.post(`/parameters/${name}`, { value });
      return response.data;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const response = await apiClient.post('/parameters/set', { name, value });
    return asParameter(name, response.data?.new_value ?? value);
  },

  resetParameters: async (): Promise<void> => {
    try {
      await apiClient.post('/parameters/reset');
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    throw new Error('Reset parameters endpoint is not available in this backend.');
  },

  downloadParameters: async (): Promise<void> => {
    try {
      const response = await apiClient.get('/parameters/download', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'parameters.txt');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      return;
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
    }

    const response = await apiClient.get('/parameters/download');
    const content = JSON.stringify(response.data?.parameters ?? {}, null, 2);
    const url = window.URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'parameters.json');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
};
