import { create } from 'zustand';
import {
  SynapseNode,
  NodeRelation,
  NodeType,
  User,
  Project,
  Comment,
  MainTabType,
  SortField,
  SortOrder,
  SearchResult,
  RelationType,
} from '../types';
import { mobileApiClient } from '../api/client';
import { nodesApi, CreateNodePayload } from '../api/nodes';
import { commentsApi } from '../api/comments';
import { synapseWS, WSEvent } from '../api/ws';
import { synapseCore } from '../native/SynapseCore';

interface SynapseMobileState {
  // Navigation & Tab
  currentTab: MainTabType;
  switchTab: (tab: MainTabType) => void;

  // System & Connection
  isConnected: boolean;
  isLoading: boolean;
  serverStatus: 'online' | 'offline' | 'checking';
  serverLatencyMs: number;
  currentUser: User | null;

  // Projects
  projects: Project[];
  activeProject: Project | null;

  // Nodes & Relations
  nodes: SynapseNode[];
  relations: NodeRelation[];
  commentsMap: Record<string, Comment[]>;
  selectedNodeId: string | null;

  // Filters & Sorting
  activeTypeFilter: NodeType | 'all';
  activeTagFilter: string | null;
  sortField: SortField;
  sortOrder: SortOrder;

  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;

  // Modals
  isCreateNodeModalOpen: boolean;
  isCreateRelationModalOpen: boolean;
  relationSourceNode: SynapseNode | null;

  // Actions
  init: () => Promise<void>;
  checkServerHealth: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  fetchNodesAndRelations: (projectId: string) => Promise<void>;

  // Node CRUD
  createNode: (payload: CreateNodePayload) => Promise<SynapseNode | null>;
  updateNode: (id: string, payload: Partial<CreateNodePayload>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;

  // Relation CRUD
  createRelation: (fromId: string, toId: string, type: RelationType, note?: string) => Promise<void>;
  deleteRelation: (id: string) => Promise<void>;

  // Comments & Reactions
  fetchComments: (nodeId: string) => Promise<void>;
  addComment: (nodeId: string, content: string, replyToId?: string) => Promise<void>;
  toggleReaction: (nodeId: string, commentId: string, emoji: string) => Promise<void>;

  // Search
  setSearchQuery: (q: string) => void;
  performSearch: (q: string) => Promise<void>;

  // UI state setters
  selectNode: (nodeId: string | null) => void;
  setTypeFilter: (filter: NodeType | 'all') => void;
  setTagFilter: (tag: string | null) => void;
  setSorting: (field: SortField, order?: SortOrder) => void;
  openCreateNodeModal: () => void;
  closeCreateNodeModal: () => void;
  openCreateRelationModal: (sourceNode?: SynapseNode) => void;
  closeCreateRelationModal: () => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>;
  applyAutoLayout: (type: 'hierarchical' | 'force') => void;
}

export const useSynapseMobileStore = create<SynapseMobileState>((set, get) => ({
  currentTab: 'sections',
  switchTab: (tab) => set({ currentTab: tab }),

  isConnected: false,
  isLoading: false,
  serverStatus: 'checking',
  serverLatencyMs: 0,
  currentUser: {
    id: 'user-1',
    name: 'Lead Architect',
    email: 'architect@synapse.local',
    role: 'owner',
    created_at: Date.now(),
  },

  projects: [],
  activeProject: null,
  nodes: [],
  relations: [],
  commentsMap: {},
  selectedNodeId: null,

  activeTypeFilter: 'all',
  activeTagFilter: null,
  sortField: 'updated_at',
  sortOrder: 'desc',

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  isCreateNodeModalOpen: false,
  isCreateRelationModalOpen: false,
  relationSourceNode: null,

  init: async () => {
    set({ isLoading: true });
    try {
      await get().checkServerHealth();
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

  checkServerHealth: async () => {
    const t0 = Date.now();
    try {
      const res = await mobileApiClient.get('/health');
      const latency = Date.now() - t0;
      if (res?.data?.status === 'ok' || res?.data?.db === 'ok') {
        set({ serverStatus: 'online', serverLatencyMs: latency });
      } else {
        set({ serverStatus: 'offline' });
      }
    } catch {
      set({ serverStatus: 'offline' });
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

    // Connect to Live WebSocket
    const token = mobileApiClient.getAccessToken();
    if (token) {
      synapseWS.connect(token, projectId);
      synapseWS.subscribe((event: WSEvent) => {
        if (event.type === 'node_created' && event.data) {
          const newNode = event.data;
          set((s) => ({ nodes: [newNode, ...s.nodes.filter((n) => n.id !== newNode.id)] }));
        } else if (event.type === 'node_updated' && event.data) {
          const updated = event.data;
          set((s) => ({
            nodes: s.nodes.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
          }));
        } else if (event.type === 'node_deleted' && event.data) {
          const delId = event.data.id || event.data;
          set((s) => ({ nodes: s.nodes.filter((n) => n.id !== delId) }));
        } else if (event.type === 'relation_created' && event.data) {
          const newRel = event.data;
          set((s) => ({ relations: [...s.relations, newRel] }));
        } else if (event.type === 'relation_deleted' && event.data) {
          const relId = event.data.id || event.data;
          set((s) => ({ relations: s.relations.filter((r) => r.id !== relId) }));
        }
      });
    }
  },

  createProject: async (name: string, description?: string) => {
    try {
      const res = await mobileApiClient.post('/api/projects', {
        name,
        description: description || '',
        tags: [],
      });
      const newProj = res?.data?.data || res?.data;
      if (newProj) {
        set((s) => ({ projects: [...s.projects, newProj] }));
        await get().selectProject(newProj.id);
      }
    } catch (e) {
      console.warn('Failed to create project', e);
    }
  },

  fetchNodesAndRelations: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const nodes = await nodesApi.listByProject(projectId);
      synapseCore.updateSpatialIndex(nodes);

      set({
        nodes,
        isLoading: false,
      });

      // Fetch all relations in parallel
      if (nodes.length > 0) {
        const promises = nodes.slice(0, 30).map((node) => nodesApi.getRelations(node.id));
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

  createNode: async (payload: CreateNodePayload) => {
    const { activeProject } = get();
    if (!activeProject) return null;
    try {
      const node = await nodesApi.create(activeProject.id, payload);
      set((s) => ({ nodes: [node, ...s.nodes] }));
      return node;
    } catch (e) {
      console.warn('Failed to create node', e);
      return null;
    }
  },

  updateNode: async (id: string, payload: Partial<CreateNodePayload>) => {
    try {
      const updated = await nodesApi.update(id, payload);
      set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updated } : n)),
      }));
    } catch (e) {
      console.warn('Failed to update node', e);
    }
  },

  deleteNode: async (id: string) => {
    try {
      await nodesApi.delete(id);
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        relations: s.relations.filter((r) => r.from_node_id !== id && r.to_node_id !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }));
    } catch (e) {
      console.warn('Failed to delete node', e);
    }
  },

  createRelation: async (fromId: string, toId: string, type: RelationType, note?: string) => {
    try {
      const rel = await nodesApi.createRelation(fromId, {
        from_node_id: fromId,
        to_node_id: toId,
        type,
        note,
      });
      set((s) => ({ relations: [...s.relations, rel] }));
    } catch (e) {
      console.warn('Failed to create relation', e);
    }
  },

  deleteRelation: async (id: string) => {
    try {
      await nodesApi.deleteRelation(id);
      set((s) => ({ relations: s.relations.filter((r) => r.id !== id) }));
    } catch (e) {
      console.warn('Failed to delete relation', e);
    }
  },

  fetchComments: async (nodeId: string) => {
    try {
      const comments = await commentsApi.listByNode(nodeId);
      set((s) => ({
        commentsMap: { ...s.commentsMap, [nodeId]: comments },
      }));
    } catch (e) {
      console.warn('Failed to fetch comments', e);
    }
  },

  addComment: async (nodeId: string, content: string, replyToId?: string) => {
    try {
      const comment = await commentsApi.create(nodeId, content, replyToId);
      set((s) => {
        const existing = s.commentsMap[nodeId] || [];
        return {
          commentsMap: {
            ...s.commentsMap,
            [nodeId]: [...existing, comment],
          },
        };
      });
    } catch (e) {
      console.warn('Failed to add comment', e);
    }
  },

  toggleReaction: async (nodeId: string, commentId: string, emoji: string) => {
    try {
      const res = await commentsApi.toggleReaction(commentId, emoji);
      const { currentUser } = get();
      if (!currentUser) return;

      set((s) => {
        const nodeComments = s.commentsMap[nodeId] || [];
        const updated = nodeComments.map((c) => {
          if (c.id !== commentId) return c;
          const reactions = c.reactions || [];
          let nextReactions;
          if (res.added) {
            nextReactions = [...reactions, { comment_id: commentId, user_id: currentUser.id, emoji }];
          } else {
            nextReactions = reactions.filter(
              (r) => !(r.user_id === currentUser.id && r.emoji === emoji)
            );
          }
          return { ...c, reactions: nextReactions };
        });
        return {
          commentsMap: { ...s.commentsMap, [nodeId]: updated },
        };
      });
    } catch (e) {
      console.warn('Failed to toggle reaction', e);
    }
  },

  setSearchQuery: (q: string) => set({ searchQuery: q }),

  performSearch: async (q: string) => {
    if (!q.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const { activeProject } = get();
      const projectParam = activeProject ? `&project_id=${activeProject.id}` : '';
      const res = await mobileApiClient.get<any>(
        `/api/search?q=${encodeURIComponent(q)}${projectParam}&limit=25`
      );
      const results: SearchResult[] = res.data?.data || res.data || [];
      set({ searchResults: Array.isArray(results) ? results : [], isSearching: false });
    } catch (e) {
      console.warn('Search failed', e);
      set({ searchResults: [], isSearching: false });
    }
  },

  selectNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
  setTypeFilter: (filter: NodeType | 'all') => set({ activeTypeFilter: filter }),
  setTagFilter: (tag: string | null) => set({ activeTagFilter: tag }),
  setSorting: (field: SortField, order?: SortOrder) =>
    set((s) => ({
      sortField: field,
      sortOrder: order || (s.sortField === field && s.sortOrder === 'asc' ? 'desc' : 'asc'),
    })),

  openCreateNodeModal: () => set({ isCreateNodeModalOpen: true }),
  closeCreateNodeModal: () => set({ isCreateNodeModalOpen: false }),

  openCreateRelationModal: (sourceNode?: SynapseNode) =>
    set({ isCreateRelationModalOpen: true, relationSourceNode: sourceNode || null }),
  closeCreateRelationModal: () =>
    set({ isCreateRelationModalOpen: false, relationSourceNode: null }),

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
      // Ignore
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

    layoutedNodes.forEach((n: SynapseNode) => {
      mobileApiClient
        .patch(`/api/nodes/${n.id}/canvas`, {
          canvas_x: n.canvas_x,
          canvas_y: n.canvas_y,
        })
        .catch(() => {});
    });
  },
}));
