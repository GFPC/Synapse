import React, { useMemo } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import { NODE_TYPE_CONFIGS } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/helpers';
import {
  Sparkles,
  Layers,
  Link2,
  FolderOpen,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  BarChart3,
  Globe,
} from 'lucide-react';

interface DashboardScreenProps {
  onOpenProject: (projectId: string) => void;
  onOpenCreateProject: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenProject,
  onOpenCreateProject,
}) => {
  const projects = useSynapseStore((s) => s.projects);
  const nodes = useSynapseStore((s) => s.nodes);
  const relations = useSynapseStore((s) => s.relations);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const users = useSynapseStore((s) => s.users);
  const setSelectedNodeId = useSynapseStore((s) => s.setSelectedNodeId);
  const setActiveProjectId = useSynapseStore((s) => s.setActiveProjectId);
  const setIsCreateNodeModalOpen = useSynapseStore((s) => s.setIsCreateNodeModalOpen);

  // Recent nodes sorted by updated_at
  const recentNodes = useMemo(() => {
    const getTime = (d: string | number | undefined) => (typeof d === 'string' ? new Date(d).getTime() : d || 0);
    return [...nodes].sort((a, b) => getTime(b.updated_at) - getTime(a.updated_at)).slice(0, 7);
  }, [nodes]);

  // Statistics
  const totalNodes = nodes.length;
  const totalRelations = relations.length;
  const totalDecisions = nodes.filter((n) => n.type === 'decision').length;
  const totalBenchmarks = nodes.filter((n) => n.type === 'benchmark').length;

  return (
    <div className="w-full h-full overflow-y-auto bg-background p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-surface-2 via-surface to-indigo-950/40 p-6 sm:p-8 border border-border overflow-hidden shadow-card">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synapse Knowledge Graph Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
              Добро пожаловать в Synapse, {currentUser.name}!
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Командная база знаний с графом узлов и структурированными карточками.
              Связывайте проблемы с решениями, фиксируйте архитектурные решения (ADR) и отслеживайте прогресс в реальном времени.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  const defaultProj = projects[0]?.id;
                  if (defaultProj) onOpenProject(defaultProj);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/25 transition-all"
              >
                <span>Открыть граф проекта</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenCreateProject}
                className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-main text-xs font-semibold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 text-accent" />
                <span>Новый проект</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold">Всего узлов</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-text-main">{totalNodes}</div>
            <div className="text-[11px] text-text-muted">по 13 типам знаний</div>
          </div>

          <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold">Связей в графе</span>
              <Link2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-text-main">{totalRelations}</div>
            <div className="text-[11px] text-text-muted">семантических стрелок</div>
          </div>

          <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold">Решений (ADR)</span>
              <CheckCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-text-main">{totalDecisions}</div>
            <div className="text-[11px] text-text-muted">утвержденных решений</div>
          </div>

          <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold">Бенчмарков</span>
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-text-main">{totalBenchmarks}</div>
            <div className="text-[11px] text-text-muted">замеров производительности</div>
          </div>
        </div>

        {/* Two-Column: Active Projects & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Column */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-accent" />
                <span>Проекты ({projects.length})</span>
              </h3>
              <button
                onClick={onOpenCreateProject}
                className="text-xs text-accent hover:underline font-semibold"
              >
                + Создать
              </button>
            </div>

            <div className="space-y-2.5">
              {projects.map((proj) => {
                const projNodes = nodes.filter((n) => n.project_id === proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => onOpenProject(proj.id)}
                    className="p-4 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-zinc-500 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-main group-hover:text-accent transition-colors">
                        {proj.name}
                      </h4>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                        {proj.type}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border/50">
                      <span>{projNodes.length} узлов</span>
                      <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Открыть →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Column */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span>Недавние изменения в графе</span>
              </h3>
              <button
                onClick={() => setIsCreateNodeModalOpen(true)}
                className="text-xs text-accent hover:underline font-semibold"
              >
                + Добавить узел
              </button>
            </div>

            <div className="bg-surface-2 rounded-xl border border-border divide-y divide-border/60">
              {recentNodes.map((node) => {
                const config = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.note;
                const author = users.find((u) => u.id === node.author_id);
                const proj = projects.find((p) => p.id === node.project_id);

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      if (node.project_id) setActiveProjectId(node.project_id);
                      setSelectedNodeId(node.id);
                    }}
                    className="p-3.5 hover:bg-surface-3 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg leading-none shrink-0">{config.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[11px] font-bold text-text-muted bg-surface px-1.5 py-0.2 rounded border border-border">
                            {node.display_id}
                          </span>
                          <span className="text-xs font-semibold text-text-main truncate group-hover:text-accent transition-colors">
                            {node.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          {proj && <span className="text-indigo-400">{proj.name}</span>}
                          <span>•</span>
                          <span>{author?.name || 'Автор'}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(node.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {node.visibility === 'shared' && (
                        <span title="Shared">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded border uppercase"
                        style={{
                          color: config.color,
                          backgroundColor: config.bgColor,
                          borderColor: `${config.color}30`,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
