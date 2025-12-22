import axios from 'axios';
import { Template, Retro, CreateRetroData } from '@/types/retro';

// Use relative URL when served from same server, or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Template API ============

export const getTemplates = async (): Promise<Template[]> => {
  const response = await api.get<Template[]>('/templates');
  return response.data;
};

export const getTemplateById = async (templateId: string): Promise<Template> => {
  const response = await api.get<Template>(`/templates/${templateId}`);
  return response.data;
};

// ============ Retro API ============

export const createRetro = async (data: CreateRetroData): Promise<Retro> => {
  const response = await api.post<Retro>('/retros', data);
  return response.data;
};

export const getRetroById = async (retroId: string): Promise<Retro> => {
  const response = await api.get<Retro>(`/retros/${retroId}`);
  return response.data;
};

export const updateRetro = async (retroId: string, data: Partial<Retro>): Promise<Retro> => {
  const response = await api.patch<Retro>(`/retros/${retroId}`, data);
  return response.data;
};

export const deleteRetro = async (retroId: string): Promise<void> => {
  await api.delete(`/retros/${retroId}`);
};

// Export the axios instance for any custom calls
export default api;
