import { apiClient } from './client';

export interface ApiKeyItem {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface CreateApiKeyResult {
  api_key: ApiKeyItem;
  key: string;
}

export const apiKeyApi = {
  async list(): Promise<ApiKeyItem[]> {
    const res = await apiClient.get<any>('/api/auth/api-keys');
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    return raw?.data || [];
  },

  async create(name: string, permissions: string[] = ['read', 'write']): Promise<CreateApiKeyResult> {
    const res = await apiClient.post<any>('/api/auth/api-keys', { name, permissions });
    return res.data?.data || res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/auth/api-keys/${id}`);
  },
};
