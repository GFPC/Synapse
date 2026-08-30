import { create } from 'zustand';
import type {
  User,
  Workspace,
  Project,
  ProjectMember,
  SynapseNode,
  NodeRelation,
  Comment,
  CommentReaction,
  Attachment,
  UserPresence,
  UserRole,
  NodeType,
  ReactionEmoji,
} from '../types';
import {
  MOCK_USERS,
  MOCK_WORKSPACE,
  MOCK_PROJECTS,
  MOCK_PROJECT_MEMBERS,
  MOCK_NODES,
  MOCK_RELATIONS,
  MOCK_COMMENTS,
  MOCK_REACTIONS,
  MOCK_ATTACHMENTS,
  MOCK_PRESENCE,
} from '../mock/seedData';
import { authApi } from '../api/auth';
import { projectsApi } from '../api/projects';
import { nodesApi } from '../api/nodes';
import { commentsApi } from '../api/comments';
import { attachmentsApi } from '../api/attachments';
import { synapseWs } from '../api/websocket';
import { apiClient } from '../api/client';

interface SynapseState {
  // Backend Status & Auth
  backendConnected: boolean;
  isBackendLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  initBackend: () => Promise<void>;
  loginUser: (email: string, pass: string) => Promise<void>;
  registerUser: (name: string, email: string, pass: string) => Promise<void>;
  logoutUser: () => void;

  // Authentication & Role
  currentUser: User;
  users: User[];
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentUser: (userId: string) => void;

  // Workspace & Projects
  workspace: Workspace;
  projects: Project[];
  activeProjectId: string;
  projectMembers: ProjectMember[];
  setActiveProjectId: (id: string) => void;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  inviteMember: (projectId: string, email: string, role: UserRole) => Promise<void>;
  updateMemberRole: (projectId: string, userId: string, role: UserRole) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;

  // Nodes
  nodes: SynapseNode[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  createNode: (node: Partial<SynapseNode> & { type: NodeType; title: string; project_id?: string }) => Promise<SynapseNode>;
  updateNode: (id: string, updates: Partial<SynapseNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  updateNodePosition: (id: string, canvas_x: number, canvas_y: number) => Promise<void>;
  lockNode: (id: string) => Promise<void>;
  unlockNode: (id: string) => Promise<void>;

  // Relations
  relations: NodeRelation[];
  createRelation: (relation: Omit<NodeRelation, 'id' | 'created_at' | 'author_id'>) => Promise<NodeRelation>;
  deleteRelation: (id: string) => Promise<void>;

  // Comments & Reactions
  comments: Comment[];
  reactions: CommentReaction[];
  addComment: (nodeId: string, content: string, replyToId?: string | null) => Promise<Comment>;
  toggleReaction: (commentId: string, emoji: ReactionEmoji) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;

  // Attachments
  attachments: Attachment[];
  addAttachment: (attachment: Omit<Attachment, 'id' | 'created_at' | 'author_id'>) => Promise<Attachment>;
  uploadFileAttachment: (nodeId: string, file: File, type?: 'image' | 'file') => Promise<Attachment>;
  deleteAttachment: (id: string) => Promise<void>;

  // Real-time Presence
  presences: UserPresence[];
  setUserNodePresence: (nodeId: string | undefined, isEditing?: boolean) => void;

  // UI States
  viewMode: 'canvas' | 'sections';
  setViewMode: (mode: 'canvas' | 'sections') => void;
  activeTypeFilter: NodeType | 'all';
  setActiveTypeFilter: (type: NodeType | 'all') => void;
  activeTagFilter: string | null;
  setActiveTagFilter: (tag: string | null) => void;
  activeStatusFilter: string | 'all';
  setActiveStatusFilter: (status: string | 'all') => void;
  isCreateNodeModalOpen: boolean;
  setIsCreateNodeModalOpen: (open: boolean) => void;
  isCreateRelationModalOpen: boolean;
  setIsCreateRelationModalOpen: (open: boolean) => void;
  relationSourceNodeId: string | null;
  setRelationSourceNodeId: (id: string | null) => void;
  relationTargetNodeId: string | null;
  setRelationTargetNodeId: (id: string | null) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  // Reset to Mock
  resetToMockData: () => void;
}

export const useSynapseStore = create<SynapseState>((set, get) => ({
  // Backend & Auth
  backendConnected: false,
  isBackendLoading: false,
  isAuthModalOpen: false,
  setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  // Initial State from Mocks
  currentUser: MOCK_USERS[0],
  users: MOCK_USERS,
  workspace: MOCK_WORKSPACE,
  projects: MOCK_PROJECTS,
  activeProjectId: MOCK_PROJECTS[0].id,
  projectMembers: MOCK_PROJECT_MEMBERS,
  nodes: MOCK_NODES,
  selectedNodeId: null,
  relations: MOCK_RELATIONS,
  comments: MOCK_COMMENTS,
  reactions: MOCK_REACTIONS,
  attachments: MOCK_ATTACHMENTS,
  presences: MOCK_PRESENCE,

  // UI
  viewMode: 'canvas',
  activeTypeFilter: 'all',
  activeTagFilter: null,
  activeStatusFilter: 'all',
  isCreateNodeModalOpen: false,
  isCreateRelationModalOpen: false,
  relationSourceNodeId: null,
  relationTargetNodeId: null,
  isSearchModalOpen: false,

  // ── INIT BACKEND ──────────────────────────────────────────────────────────
  initBackend: async () => {
    set({ isBackendLoading: true });
    try {
      const isAlive = await authApi.checkHealth();
      if (!isAlive) {
        set({ backendConnected: false, isBackendLoading: false });
        return;
      }

      set({ backendConnected: true });

      // Try fetching current user profile or auto-login demo
      let user: User | null = null;
      if (apiClient.getAccessToken()) {
        try {
          user = await authApi.getMe();
        } catch {
          // Token expired or invalid
        }
      }

      if (!user) {
        // Auto-login or register demo user
        try {
          const loginRes = await authApi.login('alex@synapse.dev', 'password123');
          user = loginRes.user;
        } catch {
          try {
            const regRes = await authApi.register('Alex Mercer', 'alex@synapse.dev', 'password123');
            user = regRes.user;
          } catch {
            // failed to auto-auth
          }
        }
      }

      if (user) {
        set({ currentUser: { ...user, role: 'owner' } });
      }

      // Fetch projects from backend
      try {
        const { projects } = await projectsApi.listProjects();
        if (projects && projects.length > 0) {
          set({ projects, activeProjectId: projects[0].id });

          // Fetch nodes for first project
          const { nodes } = await nodesApi.listNodes(projects[0].id);
          if (nodes && nodes.length > 0) {
            set({ nodes });
          }
        } else {
          // If backend has no projects yet, seed initial project
          const newProj = await projectsApi.createProject({
            name: 'Synapse Engine & Canvas',
            type: 'software',
            description: 'Основное ядро платформы базы знаний Synapse и движок графа',
            tags: ['core', 'graph', 'canvas', 'engine'],
          });
          set({ projects: [newProj], activeProjectId: newProj.id });

          // Seed first sample node on backend
          await nodesApi.createNode(newProj.id, {
            type: 'problem',
            title: 'Потеря контекста при смене контекста разработчиков',
            content: 'При переключении между фичами и задачами теряется до 40% инженерного контекста.',
            tags: ['context', 'team'],
            visibility: 'shared',
            canvas_x: 100,
            canvas_y: 120,
            meta: { target_audience: 'Full-stack & Backend Engineers' },
          });

          const { nodes } = await nodesApi.listNodes(newProj.id);
          set({ nodes });
        }
      } catch (err) {
        console.error('Failed to load initial backend data:', err);
      }

      // Connect WebSocket for live updates
      const activeProjId = get().activeProjectId;
      synapseWs.connect(activeProjId);

      // Subscribe to WebSocket live events
      synapseWs.subscribe((event) => {
        const state = get();
        switch (event.type) {
          case 'node_created':
            if (event.data?.id && !state.nodes.some((n) => n.id === event.data.id)) {
              set({ nodes: [event.data, ...state.nodes] });
            }
            break;
          case 'node_updated':
            if (event.data?.id) {
              set({
                nodes: state.nodes.map((n) => (n.id === event.data.id ? { ...n, ...event.data } : n)),
              });
            }
            break;
          case 'node_deleted':
            if (event.data?.id) {
              set({
                nodes: state.nodes.filter((n) => n.id !== event.data.id),
                selectedNodeId: state.selectedNodeId === event.data.id ? null : state.selectedNodeId,
              });
            }
            break;
          case 'relation_created':
            if (event.data?.id && !state.relations.some((r) => r.id === event.data.id)) {
              set({ relations: [...state.relations, event.data] });
            }
            break;
          case 'comment_added':
            if (event.data?.id && !state.comments.some((c) => c.id === event.data.id)) {
              set({ comments: [...state.comments, event.data] });
            }
            break;
          case 'node_locked':
            if (event.data?.node_id) {
              const editingUser = state.users.find((u) => u.email === event.data.user_name) || {
                id: 'remote-user',
                name: event.data.user_name || 'Участник',
                email: event.data.user_name,
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
                role: 'editor' as UserRole,
                created_at: new Date().toISOString(),
              };
              set({
                presences: [
                  ...state.presences.filter((p) => p.node_id !== event.data.node_id),
                  {
                    user_id: editingUser.id,
                    name: editingUser.name,
                    avatar_url: editingUser.avatar_url,
                    node_id: event.data.node_id,
                    is_editing: true,
                    last_seen: new Date().toISOString(),
                  },
                ],
              });
            }
            break;
          case 'node_unlocked':
            if (event.data?.node_id) {
              set({
                presences: state.presences.filter((p) => p.node_id !== event.data.node_id),
              });
            }
            break;
        }
      });
    } catch (err) {
      console.error('Backend init failed:', err);
      set({ backendConnected: false });
    } finally {
      set({ isBackendLoading: false });
    }
  },

  loginUser: async (email, password) => {
    const res = await authApi.login(email, password);
    set({
      currentUser: { ...res.user, role: 'owner' },
      isAuthModalOpen: false,
    });
    get().initBackend();
  },

  registerUser: async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    set({
      currentUser: { ...res.user, role: 'owner' },
      isAuthModalOpen: false,
    });
    get().initBackend();
  },

  logoutUser: () => {
    authApi.logout();
    synapseWs.disconnect();
    set({
      currentUser: MOCK_USERS[0],
      backendConnected: false,
    });
  },

  // ── USER ROLES ────────────────────────────────────────────────────────────
  setCurrentUserRole: (role: UserRole) => {
    set((state) => ({
      currentUser: { ...state.currentUser, role },
    }));
  },

  setCurrentUser: (userId: string) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  setActiveProjectId: async (id: string) => {
    set({ activeProjectId: id, selectedNodeId: null });
    synapseWs.joinProject(id);

    if (get().backendConnected) {
      try {
        const { nodes } = await nodesApi.listNodes(id);
        if (nodes) {
          set({ nodes });
        }
      } catch (err) {
        console.error('Failed to load nodes for project:', err);
      }
    }
  },

  createProject: async (projectData) => {
    if (get().backendConnected) {
      try {
        const created = await projectsApi.createProject({
          name: projectData.name,
          type: projectData.type,
          description: projectData.description,
          tags: projectData.tags,
        });
        set((state) => ({
          projects: [created, ...state.projects],
          activeProjectId: created.id,
        }));
        synapseWs.joinProject(created.id);
        return created;
      } catch (err) {
        console.error('Backend create project failed, fallback to local:', err);
      }
    }

    const newProject: Project = {
      ...projectData,
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      projects: [newProject, ...state.projects],
      activeProjectId: newProject.id,
    }));
    return newProject;
  },

  updateProject: async (id, updates) => {
    if (get().backendConnected) {
      try {
        await projectsApi.updateProject(id, updates);
      } catch (err) {
        console.error('Backend update project failed:', err);
      }
    }
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ),
    }));
  },

  deleteProject: async (id) => {
    if (get().backendConnected) {
      try {
        await projectsApi.deleteProject(id);
      } catch (err) {
        console.error('Backend delete project failed:', err);
      }
    }
    set((state) => {
      const remaining = state.projects.filter((p) => p.id !== id);
      return {
        projects: remaining,
        activeProjectId: remaining[0]?.id || '',
      };
    });
  },

  inviteMember: async (projectId, email, role) => {
    if (get().backendConnected) {
      try {
        await projectsApi.inviteMember(projectId, email, role);
      } catch (err) {
        console.error('Backend invite member failed:', err);
      }
    }
  },

  updateMemberRole: async (projectId, userId, role) => {
    if (get().backendConnected) {
      try {
        await projectsApi.updateMemberRole(projectId, userId, role);
      } catch (err) {
        console.error('Backend update member role failed:', err);
      }
    }
  },

  removeMember: async (projectId, userId) => {
    if (get().backendConnected) {
      try {
        await projectsApi.removeMember(projectId, userId);
      } catch (err) {
        console.error('Backend remove member failed:', err);
      }
    }
  },

  // ── NODES ─────────────────────────────────────────────────────────────────
  setSelectedNodeId: (id) => {
    const prevSelected = get().selectedNodeId;
    if (prevSelected && prevSelected !== id && get().backendConnected) {
      nodesApi.unlockNode(prevSelected).catch(() => {});
    }
    set({ selectedNodeId: id });
    if (id && get().backendConnected) {
      nodesApi.lockNode(id).catch(() => {});
    }
  },

  createNode: async (nodeData) => {
    const projectId = nodeData.project_id || get().activeProjectId;

    if (get().backendConnected) {
      try {
        const created = await nodesApi.createNode(projectId, {
          type: nodeData.type,
          title: nodeData.title,
          content: nodeData.content || '',
          meta: nodeData.meta || {},
          status: nodeData.status,
          visibility: nodeData.visibility || 'internal',
          tags: nodeData.tags || [],
          canvas_x: nodeData.canvas_x || 200,
          canvas_y: nodeData.canvas_y || 200,
        });
        set((state) => ({
          nodes: [created, ...state.nodes],
          selectedNodeId: created.id,
        }));
        return created;
      } catch (err) {
        console.error('Backend createNode failed, fallback:', err);
      }
    }

    const newNode: SynapseNode = {
      id: 'node_' + Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      type: nodeData.type,
      title: nodeData.title,
      content: nodeData.content || '',
      meta: nodeData.meta || {},
      status: nodeData.status || 'draft',
      visibility: nodeData.visibility || 'internal',
      tags: nodeData.tags || [],
      display_id: `${nodeData.type.charAt(0).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      canvas_x: nodeData.canvas_x || 200,
      canvas_y: nodeData.canvas_y || 200,
      author_id: get().currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      nodes: [newNode, ...state.nodes],
      selectedNodeId: newNode.id,
    }));
    return newNode;
  },

  updateNode: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n
      ),
    }));

    if (get().backendConnected) {
      try {
        await nodesApi.updateNode(id, updates);
      } catch (err) {
        console.error('Backend updateNode failed:', err);
      }
    }
  },

  deleteNode: async (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      relations: state.relations.filter((r) => r.from_node_id !== id && r.to_node_id !== id),
    }));

    if (get().backendConnected) {
      try {
        await nodesApi.deleteNode(id);
      } catch (err) {
        console.error('Backend deleteNode failed:', err);
      }
    }
  },

  updateNodePosition: async (id, canvas_x, canvas_y) => {
    // Optimistic position update in store
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, canvas_x, canvas_y } : n)),
    }));

    if (get().backendConnected) {
      try {
        await nodesApi.updateCanvas(id, canvas_x, canvas_y);
      } catch (err) {
        console.error('Backend updateCanvas failed:', err);
      }
    }
  },

  lockNode: async (id) => {
    if (get().backendConnected) {
      try {
        await nodesApi.lockNode(id);
      } catch (err) {
        console.error('Backend lockNode failed:', err);
      }
    }
  },

  unlockNode: async (id) => {
    if (get().backendConnected) {
      try {
        await nodesApi.unlockNode(id);
      } catch (err) {
        console.error('Backend unlockNode failed:', err);
      }
    }
  },

  // ── RELATIONS ─────────────────────────────────────────────────────────────
  createRelation: async (relationData) => {
    if (get().backendConnected) {
      try {
        const created = await nodesApi.createRelation(
          relationData.from_node_id,
          relationData.to_node_id,
          relationData.type,
          relationData.note
        );
        set((state) => ({
          relations: [...state.relations, created],
        }));
        return created;
      } catch (err) {
        console.error('Backend createRelation failed, fallback:', err);
      }
    }

    const newRel: NodeRelation = {
      ...relationData,
      id: 'rel_' + Math.random().toString(36).substr(2, 9),
      author_id: get().currentUser.id,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      relations: [...state.relations, newRel],
    }));
    return newRel;
  },

  deleteRelation: async (id) => {
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== id),
    }));

    if (get().backendConnected) {
      try {
        await nodesApi.deleteRelation(id);
      } catch (err) {
        console.error('Backend deleteRelation failed:', err);
      }
    }
  },

  // ── COMMENTS ──────────────────────────────────────────────────────────────
  addComment: async (nodeId, content, replyToId) => {
    if (get().backendConnected) {
      try {
        const created = await commentsApi.createComment(nodeId, content, replyToId || undefined);
        set((state) => ({
          comments: [...state.comments, created],
        }));
        return created;
      } catch (err) {
        console.error('Backend addComment failed, fallback:', err);
      }
    }

    const newComment: Comment = {
      id: 'comm_' + Math.random().toString(36).substr(2, 9),
      node_id: nodeId,
      author_id: get().currentUser.id,
      content,
      reply_to_id: replyToId,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      comments: [...state.comments, newComment],
    }));
    return newComment;
  },

  toggleReaction: async (commentId, emoji) => {
    const userId = get().currentUser.id;
    set((state) => {
      const exists = state.reactions.some(
        (r) => r.comment_id === commentId && r.user_id === userId && r.emoji === emoji
      );
      if (exists) {
        return {
          reactions: state.reactions.filter(
            (r) => !(r.comment_id === commentId && r.user_id === userId && r.emoji === emoji)
          ),
        };
      } else {
        return {
          reactions: [
            ...state.reactions,
            { comment_id: commentId, user_id: userId, emoji, created_at: new Date().toISOString() },
          ],
        };
      }
    });

    if (get().backendConnected) {
      try {
        await commentsApi.toggleReaction(commentId, emoji);
      } catch (err) {
        console.error('Backend toggleReaction failed:', err);
      }
    }
  },

  deleteComment: async (id) => {
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== id),
      reactions: state.reactions.filter((r) => r.comment_id !== id),
    }));

    if (get().backendConnected) {
      try {
        await commentsApi.deleteComment(id);
      } catch (err) {
        console.error('Backend deleteComment failed:', err);
      }
    }
  },

  // ── ATTACHMENTS ───────────────────────────────────────────────────────────
  addAttachment: async (attData) => {
    if (get().backendConnected && attData.type === 'embed' && attData.embed_url) {
      try {
        const created = await attachmentsApi.addEmbed(attData.node_id, attData.embed_url);
        set((state) => ({
          attachments: [...state.attachments, created],
        }));
        return created;
      } catch (err) {
        console.error('Backend addEmbed failed, fallback:', err);
      }
    }

    const newAtt: Attachment = {
      ...attData,
      id: 'att_' + Math.random().toString(36).substr(2, 9),
      author_id: get().currentUser.id,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      attachments: [...state.attachments, newAtt],
    }));
    return newAtt;
  },

  uploadFileAttachment: async (nodeId, file, type = 'file') => {
    if (get().backendConnected) {
      try {
        const created = await attachmentsApi.uploadFile(nodeId, file, type);
        set((state) => ({
          attachments: [...state.attachments, created],
        }));
        return created;
      } catch (err) {
        console.error('Backend uploadFile failed, fallback:', err);
      }
    }

    const localAtt: Attachment = {
      id: 'att_' + Math.random().toString(36).substr(2, 9),
      node_id: nodeId,
      author_id: get().currentUser.id,
      type,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      attachments: [...state.attachments, localAtt],
    }));
    return localAtt;
  },

  deleteAttachment: async (id) => {
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    }));

    if (get().backendConnected) {
      try {
        await attachmentsApi.deleteAttachment(id);
      } catch (err) {
        console.error('Backend deleteAttachment failed:', err);
      }
    }
  },

  // ── PRESENCE ──────────────────────────────────────────────────────────────
  setUserNodePresence: (nodeId, isEditing = false) => {
    const user = get().currentUser;
    set((state) => {
      const otherPresences = state.presences.filter((p) => p.user_id !== user.id);
      if (!nodeId) return { presences: otherPresences };

      return {
        presences: [
          ...otherPresences,
          {
            user_id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            node_id: nodeId,
            is_editing: isEditing,
            last_seen: new Date().toISOString(),
          },
        ],
      };
    });
  },

  // ── UI STATE SETTERS ──────────────────────────────────────────────────────
  setViewMode: (viewMode) => set({ viewMode }),
  setActiveTypeFilter: (activeTypeFilter) => set({ activeTypeFilter }),
  setActiveTagFilter: (activeTagFilter) => set({ activeTagFilter }),
  setActiveStatusFilter: (activeStatusFilter) => set({ activeStatusFilter }),
  setIsCreateNodeModalOpen: (isCreateNodeModalOpen) => set({ isCreateNodeModalOpen }),
  setIsCreateRelationModalOpen: (isCreateRelationModalOpen) => set({ isCreateRelationModalOpen }),
  setRelationSourceNodeId: (relationSourceNodeId) => set({ relationSourceNodeId }),
  setRelationTargetNodeId: (relationTargetNodeId) => set({ relationTargetNodeId }),
  setIsSearchModalOpen: (isSearchModalOpen) => set({ isSearchModalOpen }),

  // ── RESET ─────────────────────────────────────────────────────────────────
  resetToMockData: () => {
    set({
      currentUser: MOCK_USERS[0],
      users: MOCK_USERS,
      workspace: MOCK_WORKSPACE,
      projects: MOCK_PROJECTS,
      activeProjectId: MOCK_PROJECTS[0].id,
      projectMembers: MOCK_PROJECT_MEMBERS,
      nodes: MOCK_NODES,
      selectedNodeId: null,
      relations: MOCK_RELATIONS,
      comments: MOCK_COMMENTS,
      reactions: MOCK_REACTIONS,
      attachments: MOCK_ATTACHMENTS,
      presences: MOCK_PRESENCE,
    });
  },
}));
