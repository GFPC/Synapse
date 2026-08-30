import { NodeType, RelationType } from '../types';

export const THEME = {
  // Ground & Surfaces
  bg: '#09090B',
  surface1: '#161619',
  surface2: '#1F1F23',
  surface3: '#27272A',
  surface4: '#323238',

  // Hairline Borders
  border: 'rgba(255, 255, 255, 0.08)',
  border2: 'rgba(255, 255, 255, 0.14)',
  borderStrong: '#3F3F46',

  // Typography Colors
  text1: '#FAFAFA',
  text2: '#B4B4BD',
  text3: '#8A8A94',
  text4: '#5E5E68',

  // Brand Chrome Accent
  accent: '#818CF8',
  accentBright: '#A5B4FC',
  accentDim: 'rgba(129, 140, 248, 0.16)',
  accentLine: 'rgba(129, 140, 248, 0.34)',

  // Status Indicators
  status: {
    ok: '#22C55E',
    warn: '#F59E0B',
    crit: '#EF4444',
    info: '#818CF8',
    muted: '#71717A',
  },

  // Radii
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 999,
  },
};

export interface NodeTypeConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
  prefix: string;
  iconText: string;
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  component: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.38)',
    label: 'Component',
    prefix: 'C',
    iconText: '⬡',
  },
  feature: {
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(59, 130, 246, 0.38)',
    label: 'Feature',
    prefix: 'F',
    iconText: '✦',
  },
  decision: {
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.38)',
    label: 'ADR Decision',
    prefix: 'D',
    iconText: '◆',
  },
  benchmark: {
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.14)',
    border: 'rgba(99, 102, 241, 0.38)',
    label: 'Benchmark',
    prefix: 'B',
    iconText: '📊',
  },
  problem: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.38)',
    label: 'Problem',
    prefix: 'P',
    iconText: '⚠️',
  },
  solution: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.38)',
    label: 'Solution',
    prefix: 'S',
    iconText: '✓',
  },
  risk: {
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.14)',
    border: 'rgba(236, 72, 153, 0.38)',
    label: 'Risk',
    prefix: 'R',
    iconText: '⚡',
  },
  test: {
    color: '#2DD4BF',
    bg: 'rgba(45, 212, 191, 0.12)',
    border: 'rgba(45, 212, 191, 0.3)',
    label: 'Test Case',
    prefix: 'T',
    iconText: '🧪',
  },
  deployment: {
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(34, 197, 94, 0.38)',
    label: 'Deployment',
    prefix: 'M',
    iconText: '▲',
  },
  lesson: {
    color: '#C2B280',
    bg: 'rgba(194, 178, 128, 0.12)',
    border: 'rgba(194, 178, 128, 0.3)',
    label: 'Lesson',
    prefix: 'L',
    iconText: '💡',
  },
  note: {
    color: '#A1A1AA',
    bg: 'rgba(161, 161, 170, 0.12)',
    border: 'rgba(161, 161, 170, 0.3)',
    label: 'Note',
    prefix: 'N',
    iconText: '📝',
  },
  link: {
    color: '#7C8AA5',
    bg: 'rgba(124, 138, 165, 0.12)',
    border: 'rgba(124, 138, 165, 0.3)',
    label: 'Link',
    prefix: 'K',
    iconText: '🔗',
  },
  log: {
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.3)',
    label: 'Change Log',
    prefix: 'G',
    iconText: '⏱',
  },
};

export interface RelationConfig {
  color: string;
  label: string;
  dashed?: boolean;
}

export const RELATION_CONFIG: Record<RelationType, RelationConfig> = {
  depends_on: { color: '#818CF8', label: 'depends on' },
  implements: { color: '#10B981', label: 'implements' },
  validates: { color: '#06B6D4', label: 'validates' },
  derives_from: { color: '#F59E0B', label: 'derives from' },
  caused_by: { color: '#EF4444', label: 'caused by' },
  contradicts: { color: '#EC4899', label: 'contradicts', dashed: true },
  supersedes: { color: '#8B5CF6', label: 'supersedes' },
  references: { color: '#94A3B8', label: 'references', dashed: true },
  related: { color: '#71717A', label: 'related' },
};
