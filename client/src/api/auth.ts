import { apiClient } from './client';
import type { AuthUser } from '../types';

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function loginRequest(login: string, password: string) {
  const { data } = await apiClient.post<{ success: true; data: LoginResponse }>('/auth/login', {
    login,
    password,
  });
  return data.data;
}

export async function meRequest() {
  const { data } = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
  return data.data;
}

export async function logoutRequest() {
  const refreshToken = localStorage.getItem('refreshToken');
  await apiClient.post('/auth/logout', { refreshToken });
}
