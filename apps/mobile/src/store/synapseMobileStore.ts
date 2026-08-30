import { create } from 'zustand';
import { SynapseNode, NodeRelation, Project, User, NodeType } from '../types';
import { mobileApiClient } from '../api/client';
import { synapseCore } from '../native/SynapseCore';

interface SynapseMobileState {
  // Connection & Auth
  isConnected: boolean;
  isLoading: boolean;
  currentUser: User | null;
  
  // Projects & Data
  projects: Project[];
  activeProject: Project | null;
  nodes: SynapseNode[];
  visibleNodeIds: string[];
  relations: NodeRelation[];
  selectedNodeId: string | null;

  // Filters & Views
  viewMode: 'canvas' | 'sections';
  activeTypeFilter: NodeType | 'all';
  searchQuery: string;

  // Actions
  init: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  fetchNodesAndRelations: (projectId: string) => Promise<void>;
  updateVisibleNodes: (viewport: { minX: number; minY: number; maxX: number; maxY: number }) => void;
  selectNode: (nodeId: string | null) => void;
  setViewMode: (mode: 'canvas' | 'sections') => void;
  setTypeFilter: (filter: NodeType | 'all') => void;
  setSearchQuery: (q: string) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>;
  applyAutoLayout: (type?: 'hierarchical' | 'force') => Promise<void>;
}

export const useSynapseMobileStore = create<SynapseMobileState>((set, get) => ({
  isConnected: false,
  isLoading: false,
  currentUser: {
    id: 'user-1',
    name: 'Lead Architect',
    email: 'architect@synapse.local',
    created_at: Date.now(),
  },
  projects: [],
  activeProject: null,
  nodes: [],
  visibleNodeIds: [],
  relations: [],
  selectedNodeId: null,
  viewMode: 'canvas',
  activeTypeFilter: 'all',
  searchQuery: '',

  init: async () => {
    set({ isLoading: true });
    try {
      // Auto login as default architect
      const loginRes = await mobileApiClient.post('/api/auth/login', {
        email: 'architect@synapse.local',
        password: 'password123',
      });
      if (loginRes.data?.tokens) {
        mobileApiClient.setTokens(loginRes.data.tokens.access_token, loginRes.data.tokens.refresh_token);
        set({ currentUser: loginRes.data.user, isConnected: true });
      }
      await get().fetchProjects();
    } catch {
      set({ isConnected: false });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const res = await mobileApiClient.get<{ projects: Project[] }>('/api/projects');
      const projects = Array.isArray(res.data) ? res.data : (res.data as any)?.projects || [];
      set({ projects });
      if (projects.length > 0 && !get().activeProject) {
        await get().selectProject(projects[0].id);
      }
    } catch (e) {
      console.warn('Failed to fetch projects', e);
    }
  },

  selectProject: async (projectId: string) => {
    const proj = get().projects.find((p) => p.id === projectId) || null;
    set({ activeProject: proj });
    await get().fetchNodesAndRelations(projectId);
  },

  fetchNodesAndRelations: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const res = await mobileApiClient.get<SynapseNode[]>(`/api/projects/${projectId}/nodes`);
      const nodes: SynapseNode[] = Array.isArray(res.data) ? res.data : (res.data as any)?.nodes || [];
      
      synapseCore.updateSpatialIndex(nodes);
      set({
        nodes,
        visibleNodeIds: nodes.map((n: SynapseNode) => n.id),
      });
    } catch (e) {
      console.warn('Failed to fetch nodes', e);
    } finally {
      set({ isLoading: false });
    }
  },

  updateVisibleNodes: (viewport: { minX: number; minY: number; maxX: number; maxY: number }) => {
    const visibleIds = synapseCore.queryVisibleNodeIds(viewport);
    set({ visibleNodeIds: visibleIds });
  },

  selectNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
  setViewMode: (mode: 'canvas' | 'sections') => set({ viewMode: mode }),
  setTypeFilter: (filter: NodeType | 'all') => set({ activeTypeFilter: filter }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),

  updateNodePosition: async (nodeId: string, x: number, y: number) => {
    const nodes = get().nodes.map((n: SynapseNode) => (n.id === nodeId ? { ...n, canvas_x: x, canvas_y: y } : n));
    set({ nodes });
    synapseCore.updateSpatialIndex(nodes);

    try {
      await mobileApiClient.patch(`/api/nodes/${nodeId}/canvas`, {
        canvas_x: x,
        canvas_y: y,
      });
    } catch (e) {
      console.warn('Failed to update node canvas position', e);
    }
  },

  applyAutoLayout: async (type = 'hierarchical') => {
    const { nodes, relations } = get();
    const layout = synapseCore.computeAutoLayout(nodes, relations, type);
    const updated = nodes.map((n) => {
      const pos = layout.find((l) => l.id === n.id);
      return pos ? { ...n, canvas_x: pos.x, canvas_y: pos.y } : n;
    });

    set({ nodes: updated });
    synapseCore.updateSpatialIndex(updated);

    // Persist batch
    for (const pos of layout) {
      mobileApiClient.patch(`/api/nodes/${pos.id}/canvas`, {
        canvas_x: pos.x,
        canvas_y: pos.y,
      }).catch(() => {});
    }
  },
}));
