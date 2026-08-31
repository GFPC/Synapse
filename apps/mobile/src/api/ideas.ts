import { mobileApiClient } from './client';

export interface IdeaGroup {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  user_id: string;
  group_id?: string;
  title: string;
  content: string;
  tags: string[];
  color?: string;
  status: 'raw' | 'in_progress' | 'matured' | 'archived';
  promoted_node_id?: string;
  created_at: string;
  updated_at: string;
}

export const mobileIdeasApi = {
  async listGroups(): Promise<IdeaGroup[]> {
    const res = await mobileApiClient.get<any>('/api/idea-groups');
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    return raw?.data || [];
  },

  async createGroup(name: string, color?: string, icon?: string): Promise<IdeaGroup> {
    const res = await mobileApiClient.post<any>('/api/idea-groups', { name, color, icon });
    return res.data?.data || res.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await mobileApiClient.delete(`/api/idea-groups/${id}`);
  },

  async listIdeas(groupId?: string): Promise<Idea[]> {
    const endpoint = groupId ? `/api/ideas?group_id=${encodeURIComponent(groupId)}` : '/api/ideas';
    const res = await mobileApiClient.get<any>(endpoint);
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    return raw?.data || [];
  },

  async createIdea(payload: { title: string; content?: string; group_id?: string; tags?: string[]; color?: string; status?: string }): Promise<Idea> {
    const res = await mobileApiClient.post<any>('/api/ideas', payload);
    return res.data?.data || res.data;
  },

  async updateIdea(id: string, payload: Partial<{ title: string; content: string; group_id?: string; tags: string[]; color: string; status: string }>): Promise<Idea> {
    const res = await mobileApiClient.patch<any>(`/api/ideas/${id}`, payload);
    return res.data?.data || res.data;
  },

  async promoteToNode(id: string, projectId: string, type: string = 'component'): Promise<any> {
    const res = await mobileApiClient.post<any>(`/api/ideas/${id}/promote`, {
      project_id: projectId,
      type,
    });
    return res.data?.data || res.data;
  },

  async deleteIdea(id: string): Promise<void> {
    await mobileApiClient.delete(`/api/ideas/${id}`);
  },
};