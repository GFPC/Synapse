import { apiClient } from './client';

export interface SearchResultItem {
  node: {
    id: string;
    type: string;
    title: string;
    display_id: string;
    status?: string;
  };
  snippet: string;
  rank: number;
}

export const searchApi = {
  async search(query: string, projectId?: string, nodeType?: string, limit: number = 20): Promise<{ results: SearchResultItem[]; total: number }> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (projectId && projectId !== 'all') params.set('project_id', projectId);
    if (nodeType && nodeType !== 'all') params.set('type', nodeType);
    params.set('limit', String(limit));

    const res = await apiClient.get<SearchResultItem[]>(`/api/search?${params.toString()}`);
    return {
      results: res.data || [],
      total: res.meta?.total || 0,
    };
  },
};
