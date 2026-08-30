import { create } from 'zustand';
import { SynapseNode, NodeRelation, NodeType, User, Project } from '../types';
import { mobileApiClient } from '../api/client';
import { synapseWS, WSEvent } from '../api/ws';
import { synapseCore } from '../native/SynapseCore';

interface SynapseMobileState {
  isConnected: boolean;
  isLoading: boolean;
  currentUser: User | null;
  projects: Project[];
  activeProject: Project | null;
  nodes: SynapseNode[];
  relations: NodeRelation[];
  visibleNodeIds: string[];
  selectedNodeId: string | null;
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
  applyAutoLayout: (type: 'hierarchical' | 'force') => void;
}

export const useSynapseMobileStore = create<SynapseMobileState>((set, get) => {
  return {
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
    relations: [],
    visibleNodeIds: [],
    selectedNodeId: null,
    viewMode: 'canvas',
    activeTypeFilter: 'all',
    searchQuery: '',

    init: async () => {
      set({ isLoading: true });
      try {
        const loginRes = await mobileApiClient.post('/api/auth/login', {
          email: 'architect@synapse.local',
          password: 'password123',
        });
        const loginData = loginRes?.data?.tokens
          ? loginRes.data
          : (loginRes?.data as any)?.data || loginRes?.data;

        if (loginData?.tokens) {
          const accessToken = loginData.tokens.access_token;
          mobileApiClient.setTokens(accessToken, loginData.tokens.refresh_token);
          set({ currentUser: loginData.user, isConnected: true });
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
        const res = await mobileApiClient.get<any>('/api/projects');
        const raw = res.data;
        const projects: Project[] = Array.isArray(raw)
          ? raw
          : raw?.data || raw?.projects || [];
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

      // Connect to Live WS
      const token = mobileApiClient.getAccessToken();
      if (token) {
        synapseWS.connect(token, projectId);
        synapseWS.subscribe((event: WSEvent) => {
          if (event.type === 'node_created' && event.data) {
            const newNode = event.data;
            set((s) => ({ nodes: [...s.nodes, newNode] }));
          } else if (event.type === 'node_updated' && event.data) {
            const updated = event.data;
            set((s) => ({
              nodes: s.nodes.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
            }));
          } else if (event.type === 'node_deleted' && event.data) {
            const delId = event.data.id || event.data;
            set((s) => ({ nodes: s.nodes.filter((n) => n.id !== delId) }));
          }
        });
      }
    },

    fetchNodesAndRelations: async (projectId: string) => {
      set({ isLoading: true });
      try {
        const res = await mobileApiClient.get<any>(`/api/projects/${projectId}/nodes`);
        const raw = res.data;
        const nodes: SynapseNode[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : raw?.nodes || [];

        synapseCore.updateSpatialIndex(nodes);

        // Immediately update nodes and clear loading so canvas renders instantly
        set({
          nodes,
          isLoading: false,
          visibleNodeIds: nodes.map((n: SynapseNode) => n.id),
        });

        // Fetch relations in parallel in background
        if (nodes.length > 0) {
          const promises = nodes.slice(0, 20).map((node) =>
            mobileApiClient
              .get<any>(`/api/nodes/${node.id}/relations`)
              .then((relRes) => {
                const d = relRes?.data?.data || relRes?.data;
                return Array.isArray(d) ? d : [];
              })
              .catch(() => [])
          );

          const results = await Promise.all(promises);
          const allRelations = results.flat();
          const uniqueRelations = Array.from(
            new Map(allRelations.map((r) => [r.id, r])).values()
          );
          set({ relations: uniqueRelations });
        }
      } catch (e) {
        console.warn('Failed to fetch nodes', e);
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
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, canvas_x: x, canvas_y: y } : n
        ),
      }));

      try {
        await mobileApiClient.patch(`/api/nodes/${nodeId}/canvas`, {
          canvas_x: x,
          canvas_y: y,
        });
      } catch {
        // Fallback
      }
    },

    applyAutoLayout: (type: 'hierarchical' | 'force') => {
      const { nodes, relations } = get();
      if (nodes.length === 0) return;

      const layoutPositions = synapseCore.computeAutoLayout(nodes, relations, type);
      const posMap = new Map(layoutPositions.map((p) => [p.id, p]));

      const layoutedNodes = nodes.map((n) => {
        const p = posMap.get(n.id);
        return p ? { ...n, canvas_x: p.x, canvas_y: p.y } : n;
      });

      set({ nodes: layoutedNodes });

      // Save new coordinates to backend in parallel
      layoutedNodes.forEach((n: SynapseNode) => {
        mobileApiClient
          .patch(`/api/nodes/${n.id}/canvas`, {
            canvas_x: n.canvas_x,
            canvas_y: n.canvas_y,
          })
          .catch(() => {});
      });
    },
  };
});
