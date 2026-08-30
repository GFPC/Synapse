export type UserRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole; // current simulated role in active project
  created_at?: string | number;
  updated_at?: string | number;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string | number;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
}

export type ProjectStatus = 'active' | 'paused' | 'done' | 'archived';
export type ProjectType = 'software' | 'hardware' | 'hybrid' | 'research';

export interface Project {
  id: string;
  workspace_id?: string;
  name: string;
  status?: ProjectStatus;
  type?: ProjectType;
  description?: string;
  tags: string[];
  role?: UserRole;
  created_at?: string | number;
  updated_at?: string | number;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  role: UserRole;
  invited_by?: string;
  invited_at?: string | number;
}

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

export type NodeVisibility = 'internal' | 'shared';

export interface ProblemMeta {
  target_audience?: string;
  value?: string;
}

export interface SolutionMeta {
  pros: string[];
  cons: string[];
  status: 'considering' | 'accepted' | 'rejected';
  rejection_reason?: string;
}

export interface DecisionMeta {
  rationale?: string;
  decided_at?: string;
}

export interface AcceptanceCriterion {
  id: string;
  text: string;
  done: boolean;
}

export interface FeatureMeta {
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planned' | 'in_progress' | 'done';
  acceptance_criteria: AcceptanceCriterion[];
}

export interface ComponentMeta {
  tech_stack: string[];
  responsibilities: string[];
}

export interface RiskMeta {
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
  status: 'open' | 'mitigated' | 'closed';
}

export interface TestMeta {
  expected: string;
  actual?: string;
  status: 'pass' | 'fail' | 'pending';
  tested_at?: string;
}

export interface BenchmarkMeta {
  model: string;
  version: string;
  metric_key: string;
  metric_value: number;
  unit: string;
  hardware: string;
  dataset: string;
}

export interface LessonMeta {
  problem_encountered: string;
  root_cause: string;
  solution_applied: string;
}

export interface LinkMeta {
  url: string;
  source: 'notion' | 'miro' | 'figma' | 'gdocs' | 'telegram' | 'other';
  preview_url?: string;
}

export interface DeploymentMeta {
  stage: string;
  instructions: string;
  status: 'pending' | 'done';
}

export interface LogMeta {
  duration_min: number;
  category?: string;
}

export type NodeMeta =
  | ProblemMeta
  | SolutionMeta
  | DecisionMeta
  | FeatureMeta
  | ComponentMeta
  | RiskMeta
  | TestMeta
  | BenchmarkMeta
  | LessonMeta
  | LinkMeta
  | DeploymentMeta
  | LogMeta
  | Record<string, any>;

export interface SynapseNode {
  id: string;
  project_id: string | null;
  author_id?: string;
  type: NodeType;
  title: string;
  content: string;
  meta: NodeMeta;
  status?: string;
  visibility: NodeVisibility;
  tags: string[];
  display_id: string;
  canvas_x: number;
  canvas_y: number;
  created_at?: string | number;
  updated_at?: string | number;
}

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

export interface NodeRelation {
  id: string;
  from_node_id: string;
  to_node_id: string;
  type: RelationType;
  note?: string;
  author_id?: string;
  created_at?: string | number;
}

export type ReactionEmoji = '👍' | '✅' | '❓' | '❤️';

export interface CommentReaction {
  comment_id: string;
  user_id: string;
  emoji: ReactionEmoji;
}

export interface Comment {
  id: string;
  node_id: string;
  author_id?: string;
  reply_to_id?: string | null;
  content: string;
  edited_at?: string | number | null;
  created_at?: string | number;
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  node_id: string;
  author_id?: string;
  type: 'image' | 'file' | 'embed';
  filename?: string;
  storage_path?: string;
  embed_url?: string;
  mime_type?: string;
  size_bytes?: number;
  created_at?: string | number;
}

export interface UserPresence {
  user_id: string;
  name: string;
  avatar_url?: string;
  node_id?: string;
  current_node_id?: string;
  is_editing?: boolean;
  last_seen?: string | number;
}
