import { apiClient, API_BASE_URL } from './client';
import type { Attachment } from '../types';

export const attachmentsApi = {
  async uploadFile(nodeId: string, file: File, type: 'image' | 'file' = 'file'): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await apiClient.post<Attachment>(`/api/nodes/${nodeId}/attachments`, formData);
    return res.data;
  },

  async addEmbed(nodeId: string, embedUrl: string): Promise<Attachment> {
    const formData = new FormData();
    formData.append('type', 'embed');
    formData.append('embed_url', embedUrl);

    const res = await apiClient.post<Attachment>(`/api/nodes/${nodeId}/attachments`, formData);
    return res.data;
  },

  getDownloadUrl(attachmentId: string): string {
    const token = apiClient.getAccessToken();
    return `${API_BASE_URL}/api/attachments/${attachmentId}/download${token ? `?token=${token}` : ''}`;
  },

  async deleteAttachment(id: string): Promise<void> {
    await apiClient.delete(`/api/attachments/${id}`);
  },
};
