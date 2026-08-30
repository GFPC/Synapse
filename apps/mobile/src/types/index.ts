export type NodeType =
  | 'problem'
  | 'solution'
  | 'decision'
  | 'feature'
  | 'component'
  | 'risk'
  | 'test'
  | 'benchmark'
  | 'note'
  | 'lesson'
  | 'link'
  | 'deployment'
  | 'log';

export type RelationType =
  | 'derives_from'
  | 'supersedes'
  | 'implements'
  | 'validates'
  | 'caused_by'
  | 'depends_on'
  | 'contradicts'
  | 'references'
  | 'related';

export type UserRole = 'owner' | 'editor' | 'viewer';
export type NodeVisibility = 'internal' | 'shared';

export type MainTabType = 'sections' | 'tree' | 'metrics' | 'search' | 'settings' | 'account' | 'projects';

export type SortField = 'display_id' | 'updated_at' | 'title' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: UserRole;
  created_at: number;
}

export interface UserStats {
  authored_nodes_count: number;
  managed_projects_count: number;
  decisions_count: number;
  comments_count: number;
}

export interface AppSettings {
  apiBaseUrl: string;
  wsBaseUrl: string;
  autoLayoutAlgorithm: 'hierarchical' | 'force';
  cardDensity: 'compact' | 'standard' | 'detailed';
  themeMode: 'obsidian' | 'oled' | 'cyberpunk';
  enableLiveWs: boolean;
  enableNotifications: boolean;
  monospaceCode: boolean;
  offlineCacheEnabled: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  node_counts?: Record<NodeType, number>;
  created_at: number;
  updated_at: number;
}

export interface SynapseNode {
  id: string;
  project_id?: string;
  author_id: string;
  type: NodeType;
  title: string;
  content: string;
  meta: Record<string, any>;
  status?: string;
  visibility: NodeVisibility;
  tags: string[];
  display_id: string;
  canvas_x: number;
  canvas_y: number;
  created_at: number;
  updated_at: number;
  author?: User;
}

export interface NodeRelation {
  id: string;
  from_node_id: string;
  to_node_id: string;
  type: RelationType;
  note?: string;
  created_at: number;
  from_node?: SynapseNode;
  to_node?: SynapseNode;
}

export interface Reaction {
  comment_id: string;
  user_id: string;
  emoji: string;
}

export interface Comment {
  id: string;
  node_id: string;
  author_id: string;
  reply_to_id?: string | null;
  content: string;
  created_at: number;
  author?: User;
  replies?: Comment[];
  reactions?: Reaction[];
}

export interface Attachment {
  id: string;
  node_id: string;
  author_id: string;
  type: 'image' | 'file' | 'embed';
  filename?: string;
  storage_path?: string;
  embed_url?: string;
  mime_type?: string;
  size_bytes?: number;
  created_at: number;
}

export interface SearchResult {
  node: SynapseNode;
  snippet?: string;
  rank?: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
