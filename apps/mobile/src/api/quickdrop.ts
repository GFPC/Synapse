import { mobileApiClient } from './client';

export interface QuickDropItem {
  id: string;
  user_id: string;
  type: 'text' | 'code' | 'link' | 'image' | 'file';
  content: string;
  metadata: {
    filename?: string;
    mime_type?: string;
    size_bytes?: number;
    language?: string;
    preview_url?: string;
    device?: string;
  };
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const mobileQuickDropApi = {
  async list(): Promise<QuickDropItem[]> {
    const res = await mobileApiClient.get<any>('/api/quick-drop');
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    return raw?.data || [];
  },

  async create(payload: { type: string; content: string; metadata?: any; is_pinned?: boolean }): Promise<QuickDropItem> {
    const res = await mobileApiClient.post<any>('/api/quick-drop', payload);
    return res.data?.data || res.data;
  },

  async uploadPhoto(uri: string, filename: string, mimeType: string = 'image/jpeg'): Promise<QuickDropItem> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename || 'photo.jpg',
      type: mimeType,
    } as any);

    const res = await mobileApiClient.post<any>('/api/quick-drop/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  async togglePin(id: string): Promise<QuickDropItem> {
    const res = await mobileApiClient.patch<any>(`/api/quick-drop/${id}/pin`);
    return res.data?.data || res.data;
  },

  async delete(id: string): Promise<void> {
    await mobileApiClient.delete(`/api/quick-drop/${id}`);
  },

  async clearUnpinned(): Promise<void> {
    await mobileApiClient.delete('/api/quick-drop');
  },
};