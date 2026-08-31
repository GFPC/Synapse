import axios, { AxiosInstance } from 'axios';
import { loadConfig, loadApiKey } from './config';

export interface SynapseUser {
  id: string;
  name: string;
  email: string;
}

export interface SynapseProject {
  id: string;
  name: string;
  status: string;
  description?: string;
  tags?: string[];
  node_counts?: Record<string, number>;
  members?: any[];
}

export interface SynapseNode {
  id: string;
  project_id?: string;
  display_id: string;
  type: string;
  title: string;
  content: string;
  status?: string;
  tags?: string[];
  canvas_x: number;
  canvas_y: number;
  created_at: string;
  updated_at: string;
}

export interface SynapseQuickDrop {
  id: string;
  type: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface SynapseIdea {
  id: string;
  title: string;
  content: string;
  status: string;
  tags?: string[];
  created_at: string;
}

export class SynapseApi {
  private client: AxiosInstance;
  public baseUrl: string;

  constructor(serverUrl?: string, apiKey?: string) {
    const cfg = loadConfig();
    this.baseUrl = (serverUrl || cfg.server || 'http://87.58.204.138').replace(/\/$/, '');
    const key = apiKey || loadApiKey() || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
    });
  }

  public setApiKey(key: string) {
    this.client.defaults.headers['Authorization'] = `Bearer ${key}`;
  }

  public async ping(): Promise<number> {
    const t0 = Date.now();
    await this.client.get('/health');
    return Date.now() - t0;
  }

  public async getMe(): Promise<SynapseUser> {
    const res = await this.client.get('/api/auth/me');
    return res.data?.data || res.data;
  }

  public async createApiKey(name: string): Promise<{ key: string; api_key: any }> {
    const res = await this.client.post('/api/auth/api-keys', { name });
    return res.data?.data || res.data;
  }

  public async listProjects(): Promise<SynapseProject[]> {
    const res = await this.client.get('/api/projects');
    const raw = res.data?.data || res.data?.projects || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async getProject(id: string): Promise<SynapseProject> {
    const res = await this.client.get(`/api/projects/${id}`);
    return res.data?.data || res.data;
  }

  public async listNodes(projectId: string): Promise<SynapseNode[]> {
    const res = await this.client.get(`/api/projects/${projectId}/nodes`);
    const raw = res.data?.data || res.data?.nodes || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async getNode(id: string): Promise<SynapseNode> {
    const res = await this.client.get(`/api/nodes/${id}`);
    return res.data?.data || res.data;
  }

  public async updateNode(id: string, updates: Partial<SynapseNode>): Promise<SynapseNode> {
    const res = await this.client.patch(`/api/nodes/${id}`, updates);
    return res.data?.data || res.data;
  }

  public async createNode(projectId: string, node: any): Promise<SynapseNode> {
    const res = await this.client.post(`/api/projects/${projectId}/nodes`, node);
    return res.data?.data || res.data;
  }

  public async listQuickDrops(): Promise<SynapseQuickDrop[]> {
    const res = await this.client.get('/api/quick-drop');
    const raw = res.data?.data || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async createQuickDrop(type: string, content: string): Promise<SynapseQuickDrop> {
    const res = await this.client.post('/api/quick-drop', { type, content });
    return res.data?.data || res.data;
  }

  public async listIdeas(): Promise<SynapseIdea[]> {
    const res = await this.client.get('/api/ideas');
    const raw = res.data?.data || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async createIdea(title: string, content: string = ''): Promise<SynapseIdea> {
    const res = await this.client.post('/api/ideas', { title, content, status: 'raw' });
    return res.data?.data || res.data;
  }

  public async search(query: string, projectId?: string): Promise<any[]> {
    const res = await this.client.get('/api/search', {
      params: { q: query, project_id: projectId },
    });
    return res.data?.data || [];
  }
}
