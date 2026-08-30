import { apiClient } from './client';
import type { User } from '../types';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/register', {
      name,
      email,
      password,
    });
    if (res.data?.tokens) {
      apiClient.setTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
    }
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    if (res.data?.tokens) {
      apiClient.setTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
    }
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/api/auth/me');
    return res.data;
  },

  logout() {
    apiClient.clearTokens();
  },

  async checkHealth(): Promise<boolean> {
    try {
      const url = apiClient ? '/health' : '/health';
      const res = await fetch(url);
      return res.ok;
    } catch {
      return false;
    }
  },
};
