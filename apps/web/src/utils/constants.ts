import type { NodeType, RelationType, ReactionEmoji } from '../types';

export interface NodeTypeConfig {
  type: NodeType;
  emoji: string;
  label: string;
  description: string;
  prefix: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  problem: {
    type: 'problem',
    emoji: '🔴',
    label: 'Проблема',
    description: 'Боль, баг, вызов или нерешенная потребность',
    prefix: 'P',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  solution: {
    type: 'solution',
    emoji: '🟡',
    label: 'Решение',
    description: 'Вариант или концепт решения проблемы',
    prefix: 'S',
    color: '#EAB308',
    bgColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.3)',
  },
  decision: {
    type: 'decision',
    emoji: '🟢',
    label: 'Решение (ADR)',
    description: 'Окончательно утвержденное архитектурное решение',
    prefix: 'D',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.3)',
  },
  feature: {
    type: 'feature',
    emoji: '📌',
    label: 'Фича',
    description: 'Требование, функция или пользовательская история',
    prefix: 'F',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  component: {
    type: 'component',
    emoji: '⚙️',
    label: 'Компонент',
    description: 'Модуль, микросервис, плата или блок системы',
    prefix: 'C',
    color: '#9CA3AF',
    bgColor: 'rgba(156, 163, 175, 0.12)',
    borderColor: '#6B7280',
    glowColor: 'rgba(156, 163, 175, 0.3)',
  },
  risk: {
    type: 'risk',
    emoji: '⚠️',
    label: 'Риск',
    description: 'Технический, организационный или бизнес-риск',
    prefix: 'R',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  test: {
    type: 'test',
    emoji: '🧪',
    label: 'Тест',
    description: 'Тест-кейс, проверка гипотезы или приемочный тест',
    prefix: 'T',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
  },
  benchmark: {
    type: 'benchmark',
    emoji: '📊',
    label: 'Бенчмарк',
    description: 'Замер производительности, скор или метрика',
    prefix: 'B',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
  note: {
    type: 'note',
    emoji: '📝',
    label: 'Заметка',
    description: 'Свободная мысль, черновик или памятка',
    prefix: 'N',
    color: '#E5E7EB',
    bgColor: 'rgba(229, 231, 235, 0.12)',
    borderColor: '#9CA3AF',
    glowColor: 'rgba(229, 231, 235, 0.3)',
  },
  lesson: {
    type: 'lesson',
    emoji: '💡',
    label: 'Урок',
    description: 'Извлеченный опыт, postmortem или ценный вывод',
    prefix: 'L',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  link: {
    type: 'link',
    emoji: '🔗',
    label: 'Ссылка',
    description: 'Внешний ресурс (Notion, Miro, Figma, Docs)',
    prefix: 'K',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: '#64748B',
    glowColor: 'rgba(100, 116, 139, 0.3)',
  },
  deployment: {
    type: 'deployment',
    emoji: '🚀',
    label: 'Деплой',
    description: 'Шаг внедрения, релиз или этап развертывания',
    prefix: 'M',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#0284C7',
    glowColor: 'rgba(56, 189, 248, 0.3)',
  },
  log: {
    type: 'log',
    emoji: '📅',
    label: 'Лог работы',
    description: 'Рабочая запись, затраченное время или журнал',
    prefix: 'G',
    color: '#94A3B8',
    bgColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: '#475569',
    glowColor: 'rgba(148, 163, 184, 0.3)',
  },
};

export interface RelationTypeConfig {
  type: RelationType;
  label: string;
  fromLabel: string;
  toLabel: string;
  description: string;
  example: string;
  color: string;
}

export const RELATION_TYPE_CONFIGS: Record<RelationType, RelationTypeConfig> = {
  derives_from: {
    type: 'derives_from',
    label: 'вытекает из',
    fromLabel: 'Решение',
    toLabel: 'Проблема',
    description: 'Решение вытекает из исходной проблемы',
    example: 'solution → problem',
    color: '#EAB308',
  },
  supersedes: {
    type: 'supersedes',
    label: 'заменяет',
    fromLabel: 'Решение (ADR)',
    toLabel: 'Черновое решение',
    description: 'Финальное решение отменяет или заменяет предыдущий вариант',
    example: 'decision → solution',
    color: '#22C55E',
  },
  implements: {
    type: 'implements',
    label: 'реализует',
    fromLabel: 'Фича',
    toLabel: 'Решение',
    description: 'Фича реализует утвержденное решение',
    example: 'feature → decision',
    color: '#3B82F6',
  },
  validates: {
    type: 'validates',
    label: 'проверяет',
    fromLabel: 'Тест / Бенчмарк',
    toLabel: 'Фича / Решение',
    description: 'Тест или бенчмарк подтверждает работоспособность фичи',
    example: 'test/benchmark → feature/decision',
    color: '#A855F7',
  },
  caused_by: {
    type: 'caused_by',
    label: 'вызвано',
    fromLabel: 'Урок',
    toLabel: 'Проблема',
    description: 'Извлеченный урок возник из-за случившейся проблемы',
    example: 'lesson → problem',
    color: '#F59E0B',
  },
  depends_on: {
    type: 'depends_on',
    label: 'зависит от',
    fromLabel: 'Компонент',
    toLabel: 'Компонент',
    description: 'Один компонент или модуль опирается на другой',
    example: 'component → component',
    color: '#6B7280',
  },
  contradicts: {
    type: 'contradicts',
    label: 'угрожает / противоречит',
    fromLabel: 'Риск',
    toLabel: 'Фича / Решение',
    description: 'Риск угрожает успешной реализации фичи или решения',
    example: 'risk → feature',
    color: '#EF4444',
  },
  references: {
    type: 'references',
    label: 'ссылается на',
    fromLabel: 'Узел',
    toLabel: 'Внешняя ссылка',
    description: 'Узел ссылается на внешнюю документацию или доску',
    example: 'node → link',
    color: '#64748B',
  },
  related: {
    type: 'related',
    label: 'связан с',
    fromLabel: 'Любой узел',
    toLabel: 'Любой узел',
    description: 'Свободная ассоциативная связь',
    example: 'any → any',
    color: '#818CF8',
  },
};

export const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '✅', '❓', '❤️'];
