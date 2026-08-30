import React from 'react';
import {
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Bookmark,
  Cpu,
  AlertTriangle,
  FlaskConical,
  BarChart3,
  FileText,
  Sparkles,
  Link2,
  Rocket,
  Calendar,
  Layers,
} from 'lucide-react';
import type { NodeType, NodeVisibility, UserRole } from '../types';
import { NODE_TYPE_CONFIGS } from './constants';

export const getNodeIcon = (type: NodeType, className: string = 'w-4 h-4'): React.ReactElement => {
  switch (type) {
    case 'problem':
      return <AlertCircle className={className} style={{ color: NODE_TYPE_CONFIGS.problem.color }} />;
    case 'solution':
      return <Lightbulb className={className} style={{ color: NODE_TYPE_CONFIGS.solution.color }} />;
    case 'decision':
      return <CheckCircle2 className={className} style={{ color: NODE_TYPE_CONFIGS.decision.color }} />;
    case 'feature':
      return <Bookmark className={className} style={{ color: NODE_TYPE_CONFIGS.feature.color }} />;
    case 'component':
      return <Cpu className={className} style={{ color: NODE_TYPE_CONFIGS.component.color }} />;
    case 'risk':
      return <AlertTriangle className={className} style={{ color: NODE_TYPE_CONFIGS.risk.color }} />;
    case 'test':
      return <FlaskConical className={className} style={{ color: NODE_TYPE_CONFIGS.test.color }} />;
    case 'benchmark':
      return <BarChart3 className={className} style={{ color: NODE_TYPE_CONFIGS.benchmark.color }} />;
    case 'note':
      return <FileText className={className} style={{ color: NODE_TYPE_CONFIGS.note.color }} />;
    case 'lesson':
      return <Sparkles className={className} style={{ color: NODE_TYPE_CONFIGS.lesson.color }} />;
    case 'link':
      return <Link2 className={className} style={{ color: NODE_TYPE_CONFIGS.link.color }} />;
    case 'deployment':
      return <Rocket className={className} style={{ color: NODE_TYPE_CONFIGS.deployment.color }} />;
    case 'log':
      return <Calendar className={className} style={{ color: NODE_TYPE_CONFIGS.log.color }} />;
    default:
      return <Layers className={className} />;
  }
};

export const formatRelativeTime = (timestamp?: string | number): string => {
  if (!timestamp) return 'недавно';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const diff = Date.now() - (isNaN(time) ? Date.now() : time);
  const seconds = Math.floor(Math.max(0, diff) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} д назад`;
  return new Date(time).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'owner':
      return { label: 'Владелец', color: 'text-amber-400 bg-amber-400/10 border-amber-500/20' };
    case 'editor':
      return { label: 'Редактор', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20' };
    case 'viewer':
      return { label: 'Клиент / Читатель', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' };
  }
};

export const canEditContent = (role: UserRole): boolean => {
  return role === 'owner' || role === 'editor';
};

export const isNodeVisibleForRole = (visibility: NodeVisibility, role: UserRole): boolean => {
  if (role === 'viewer') {
    return visibility === 'shared';
  }
  return true;
};
