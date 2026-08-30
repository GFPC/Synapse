import { mobileApiClient } from './client';
import { Comment } from '../types';

export const commentsApi = {
  async listByNode(nodeId: string): Promise<Comment[]> {
    try {
      const res = await mobileApiClient.get<any>(`/api/nodes/${nodeId}/comments`);
      const d = res.data?.data || res.data;
      return Array.isArray(d) ? d : [];
    } catch {
      return [];
    }
  },

  async create(nodeId: string, content: string, replyToId?: string): Promise<Comment> {
    const res = await mobileApiClient.post<any>(`/api/nodes/${nodeId}/comments`, {
      content,
      reply_to_id: replyToId || null,
    });
    return res.data?.data || res.data;
  },

  async toggleReaction(commentId: string, emoji: string): Promise<{ added: boolean }> {
    const res = await mobileApiClient.post<any>(`/api/comments/${commentId}/reactions`, {
      emoji,
    });
    return res.data?.data || res.data;
  },

  async delete(commentId: string): Promise<void> {
    await mobileApiClient.delete(`/api/comments/${commentId}`);
  },
};
