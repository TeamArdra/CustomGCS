import apiClient from './client';

export interface Parameter {
  id: string;
  name: string;
  value: string | number | boolean;
  type: string;
}

export const parameterService = {
  getParameters: async (): Promise<Parameter[]> => {
    const response = await apiClient.get('/parameters');
    return response.data;
  },

  getParameterByName: async (name: string): Promise<Parameter> => {
    const response = await apiClient.get(`/parameters/${name}`);
    return response.data;
  },

  updateParameter: async (name: string, value: unknown): Promise<Parameter> => {
    const response = await apiClient.post(`/parameters/${name}`, { value });
    return response.data;
  },

  resetParameters: async (): Promise<void> => {
    await apiClient.post('/parameters/reset');
  },

  downloadParameters: async (): Promise<void> => {
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
  },
};
