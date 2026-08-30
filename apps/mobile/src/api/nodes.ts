import { mobileApiClient } from './client';
import { SynapseNode, NodeRelation, NodeType, RelationType } from '../types';

export interface CreateNodePayload {
  type: NodeType;
  title: string;
  content?: string;
  tags?: string[];
  status?: string;
  visibility?: 'internal' | 'shared';
  meta?: Record<string, any>;
  canvas_x?: number;
  canvas_y?: number;
}

export interface CreateRelationPayload {
  from_node_id: string;
  to_node_id: string;
  type: RelationType;
  note?: string;
}

export const nodesApi = {
  async listByProject(projectId: string): Promise<SynapseNode[]> {
    const res = await mobileApiClient.get<any>(`/api/projects/${projectId}/nodes`);
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return raw?.nodes || [];
  },

  async getById(id: string): Promise<SynapseNode> {
    const res = await mobileApiClient.get<any>(`/api/nodes/${id}`);
    return res.data?.data || res.data;
  },

  async create(projectId: string, payload: CreateNodePayload): Promise<SynapseNode> {
    const res = await mobileApiClient.post<any>(`/api/projects/${projectId}/nodes`, {
      ...payload,
      visibility: payload.visibility || 'shared',
      status: payload.status || 'in_progress',
      tags: payload.tags || [],
      meta: payload.meta || {},
    });
    return res.data?.data || res.data;
  },

  async update(id: string, payload: Partial<CreateNodePayload>): Promise<SynapseNode> {
    const res = await mobileApiClient.patch<any>(`/api/nodes/${id}`, payload);
    return res.data?.data || res.data;
  },

  async delete(id: string): Promise<void> {
    await mobileApiClient.delete(`/api/nodes/${id}`);
  },

  async getRelations(nodeId: string): Promise<NodeRelation[]> {
    try {
      const res = await mobileApiClient.get<any>(`/api/nodes/${nodeId}/relations`);
      const d = res.data?.data || res.data;
      return Array.isArray(d) ? d : [];
    } catch {
      return [];
    }
  },

  async createRelation(nodeId: string, payload: CreateRelationPayload): Promise<NodeRelation> {
    const res = await mobileApiClient.post<any>(`/api/nodes/${nodeId}/relations`, payload);
    return res.data?.data || res.data;
  },

  async deleteRelation(id: string): Promise<void> {
    await mobileApiClient.delete(`/api/relations/${id}`);
  },
};
