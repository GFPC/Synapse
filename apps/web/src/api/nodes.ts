import { apiClient } from './client';
import type { SynapseNode, NodeType, NodeVisibility, NodeRelation, RelationType } from '../types';

export interface CreateNodeInput {
  type: NodeType;
  title: string;
  content?: string;
  meta?: any;
  status?: string;
  visibility?: NodeVisibility;
  tags?: string[];
  canvas_x?: number;
  canvas_y?: number;
}

export interface UpdateNodeInput {
  title?: string;
  content?: string;
  meta?: any;
  status?: string;
  visibility?: NodeVisibility;
  tags?: string[];
}

export interface ListNodesParams {
  type?: string;
  visibility?: string;
  cursor?: string;
  limit?: number;
}

export const nodesApi = {
  async listNodes(projectId: string, params?: ListNodesParams): Promise<{ nodes: SynapseNode[]; hasMore: boolean; nextCursor?: string }> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.visibility) query.set('visibility', params.visibility);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await apiClient.get<SynapseNode[]>(`/api/projects/${projectId}/nodes?${query.toString()}`);
    return {
      nodes: res.data || [],
      hasMore: !!res.meta?.has_more,
      nextCursor: res.meta?.next_cursor,
    };
  },

  async getNode(id: string): Promise<SynapseNode> {
    const res = await apiClient.get<SynapseNode>(`/api/nodes/${id}`);
    return res.data;
  },

  async createNode(projectId: string, input: CreateNodeInput): Promise<SynapseNode> {
    const res = await apiClient.post<SynapseNode>(`/api/projects/${projectId}/nodes`, input);
    return res.data;
  },

  async updateNode(id: string, input: UpdateNodeInput): Promise<SynapseNode> {
    const res = await apiClient.patch<SynapseNode>(`/api/nodes/${id}`, input);
    return res.data;
  },

  async deleteNode(id: string): Promise<void> {
    await apiClient.delete(`/api/nodes/${id}`);
  },

  async updateCanvas(id: string, x: number, y: number): Promise<{ x: number; y: number }> {
    const res = await apiClient.patch<{ x: number; y: number }>(`/api/nodes/${id}/canvas`, { x, y });
    return res.data;
  },

  async lockNode(id: string): Promise<{ status: string }> {
    const res = await apiClient.post<{ status: string }>(`/api/nodes/${id}/lock`);
    return res.data;
  },

  async unlockNode(id: string): Promise<{ status: string }> {
    const res = await apiClient.delete<{ status: string }>(`/api/nodes/${id}/lock`);
    return res.data;
  },

  async getRelations(nodeId: string): Promise<{ outbound: any[]; inbound: any[] }> {
    const res = await apiClient.get<any>(`/api/nodes/${nodeId}/relations`);
    return res.data;
  },

  async createRelation(fromNodeId: string, toNodeId: string, type: RelationType, note?: string): Promise<NodeRelation> {
    const res = await apiClient.post<NodeRelation>(`/api/nodes/${fromNodeId}/relations`, {
      to_node_id: toNodeId,
      type,
      note,
    });
    return res.data;
  },

  async deleteRelation(id: string): Promise<void> {
    await apiClient.delete(`/api/relations/${id}`);
  },
};
