import { apiClient } from './client';
import type { Project, ProjectType, UserRole } from '../types';

export interface CreateProjectInput {
  name: string;
  type?: ProjectType;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  status?: string;
  type?: ProjectType;
  description?: string;
  tags?: string[];
}

export const projectsApi = {
  async listProjects(cursor?: string, limit: number = 50): Promise<{ projects: Project[]; hasMore: boolean; nextCursor?: string }> {
    const query = new URLSearchParams();
    if (cursor) query.set('cursor', cursor);
    if (limit) query.set('limit', String(limit));

    const res = await apiClient.get<Project[]>(`/api/projects?${query.toString()}`);
    return {
      projects: res.data || [],
      hasMore: !!res.meta?.has_more,
      nextCursor: res.meta?.next_cursor,
    };
  },

  async getProject(id: string): Promise<Project> {
    const res = await apiClient.get<Project>(`/api/projects/${id}`);
    return res.data;
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const res = await apiClient.post<Project>('/api/projects', input);
    return res.data;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const res = await apiClient.patch<Project>(`/api/projects/${id}`, input);
    return res.data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/api/projects/${id}`);
  },

  async inviteMember(projectId: string, email: string, role: UserRole): Promise<any> {
    const res = await apiClient.post(`/api/projects/${projectId}/members`, { email, role });
    return res.data;
  },

  async updateMemberRole(projectId: string, userId: string, role: UserRole): Promise<any> {
    const res = await apiClient.patch(`/api/projects/${projectId}/members/${userId}`, { role });
    return res.data;
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/projects/${projectId}/members/${userId}`);
  },
};
