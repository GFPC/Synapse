import { apiClient } from './client';
import type { Comment } from '../types';

export const commentsApi = {
  async listComments(nodeId: string): Promise<Comment[]> {
    const res = await apiClient.get<Comment[]>(`/api/nodes/${nodeId}/comments`);
    return res.data || [];
  },

  async createComment(nodeId: string, content: string, replyToId?: string): Promise<Comment> {
    const res = await apiClient.post<Comment>(`/api/nodes/${nodeId}/comments`, {
      content,
      reply_to_id: replyToId,
    });
    return res.data;
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const res = await apiClient.patch<Comment>(`/api/comments/${commentId}`, { content });
    return res.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/comments/${commentId}`);
  },

  async toggleReaction(commentId: string, emoji: string): Promise<{ added: boolean }> {
    const res = await apiClient.post<{ added: boolean }>(`/api/comments/${commentId}/reactions`, { emoji });
    return res.data;
  },
};
