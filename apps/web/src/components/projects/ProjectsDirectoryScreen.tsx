import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import type { ProjectType } from '../../types';
import {
  FolderOpen,
  Plus,
  Search,
  Layers,
  Users,
  Trash2,
} from 'lucide-react';

interface ProjectsDirectoryScreenProps {
  onOpenProject: (projectId: string) => void;
  onOpenCreateProject: () => void;
}

export const ProjectsDirectoryScreen: React.FC<ProjectsDirectoryScreenProps> = ({
  onOpenProject,
  onOpenCreateProject,
}) => {
  const projects = useSynapseStore((s) => s.projects);
  const nodes = useSynapseStore((s) => s.nodes);
  const projectMembers = useSynapseStore((s) => s.projectMembers);
  const deleteProject = useSynapseStore((s) => s.deleteProject);
  const currentUser = useSynapseStore((s) => s.currentUser);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');

  const filteredProjects = projects.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ? p.description.toLowerCase().includes(q) : false) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="w-full h-full overflow-y-auto bg-background p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main flex items-center gap-2.5">
              <FolderOpen className="w-6 h-6 text-accent" />
              <span>Проекты базы знаний</span>
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Всего проектов: <span className="font-bold text-text-main">{projects.length}</span>
            </p>
          </div>

          <button
            onClick={onOpenCreateProject}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Создать проект</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по проектам и тегам..."
              className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'all' ? 'bg-surface text-accent font-bold shadow' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterType('software')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'software' ? 'bg-surface text-accent font-bold shadow' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Software 💻
            </button>
            <button
              onClick={() => setFilterType('hardware')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'hardware' ? 'bg-surface text-accent font-bold shadow' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Hardware 🔌
            </button>
            <button
              onClick={() => setFilterType('hybrid')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'hybrid' ? 'bg-surface text-accent font-bold shadow' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Hybrid ⚡
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const projNodes = nodes.filter((n) => n.project_id === proj.id);
            const members = projectMembers.filter((m) => m.project_id === proj.id);

            return (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="bg-surface-2 hover:bg-surface-3 border border-border hover:border-zinc-500 rounded-2xl p-5 cursor-pointer transition-all shadow-card hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-surface border border-border text-indigo-400 font-bold">
                      {proj.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        proj.status === 'active'
                          ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                          : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-main group-hover:text-accent transition-colors mb-2">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-text-muted line-clamp-3 leading-relaxed mb-4">
                    {proj.description || 'Описание проекта отсутствует.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {proj.tags.map((t) => (
                      <span key={t} className="bg-surface text-[10px] text-text-muted px-2 py-0.5 rounded border border-border">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      {projNodes.length} узлов
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {members.length} участников
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser.role === 'owner' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Удалить проект «${proj.name}»?`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        className="p-1 text-text-muted hover:text-red-400 rounded transition-colors"
                        title="Удалить проект"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-accent font-semibold group-hover:translate-x-1 transition-transform">
                      Открыть →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
