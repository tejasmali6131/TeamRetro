import api from './api';
import { Retro, CreateRetroData } from '@/types/retro';

export const retroService = {
  getAll: async (): Promise<Retro[]> => {
    const response = await api.get('/retros');
    return response.data;
  },

  getById: async (id: string): Promise<Retro> => {
    const response = await api.get(`/retros/${id}`);
    return response.data;
  },

  create: async (data: CreateRetroData): Promise<Retro> => {
    const response = await api.post('/retros', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Retro>): Promise<Retro> => {
    const response = await api.patch(`/retros/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/retros/${id}`);
  },

  updateStatus: async (id: string, status: Retro['status']): Promise<Retro> => {
    const response = await api.patch(`/retros/${id}/status`, { status });
    return response.data;
  },
};
