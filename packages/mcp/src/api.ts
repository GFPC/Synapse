import axios, { AxiosInstance } from 'axios';

export class SynapseClient {
  private client: AxiosInstance;
  public baseUrl: string;

  constructor(serverUrl: string = process.env.SYNAPSE_API_URL || 'http://87.58.204.138', apiKey: string = process.env.SYNAPSE_API_KEY || '') {
    this.baseUrl = serverUrl.replace(/\/$/, '');
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });
  }

  public async getMe(): Promise<any> {
    const res = await this.client.get('/api/auth/me');
    return res.data?.data || res.data;
  }

  public async listProjects(): Promise<any[]> {
    const res = await this.client.get('/api/projects');
    const raw = res.data?.data || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async listNodes(projectId: string): Promise<any[]> {
    const res = await this.client.get(`/api/projects/${projectId}/nodes`);
    const raw = res.data?.data || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async getNode(id: string): Promise<any> {
    const res = await this.client.get(`/api/nodes/${id}`);
    return res.data?.data || res.data;
  }

  public async search(query: string, projectId?: string): Promise<any[]> {
    const res = await this.client.get('/api/search', {
      params: { q: query, project_id: projectId },
    });
    return res.data?.data || [];
  }

  public async listQuickDrops(): Promise<any[]> {
    const res = await this.client.get('/api/quick-drop');
    const raw = res.data?.data || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async createQuickDrop(type: string, content: string): Promise<any> {
    const res = await this.client.post('/api/quick-drop', { type, content });
    return res.data?.data || res.data;
  }

  public async listIdeas(): Promise<any[]> {
    const res = await this.client.get('/api/ideas');
    const raw = res.data?.data || res.data;
    return Array.isArray(raw) ? raw : [];
  }

  public async createIdea(title: string, content: string = ''): Promise<any> {
    const res = await this.client.post('/api/ideas', { title, content, status: 'raw' });
    return res.data?.data || res.data;
  }

  public async createNode(projectId: string, node: any): Promise<any> {
    const res = await this.client.post(`/api/projects/${projectId}/nodes`, node);
    return res.data?.data || res.data;
  }
}
