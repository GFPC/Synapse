import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import { NODE_TYPE_CONFIGS } from '../../utils/constants';
import type { NodeType } from '../../types';
import { isNodeVisibleForRole } from '../../utils/helpers';
import { CustomSelect } from '../ui/CustomSelect';
import {
  Search,
  X,
  ArrowRight,
  Globe,
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const isSearchModalOpen = useSynapseStore((s) => s.isSearchModalOpen);
  const setIsSearchModalOpen = useSynapseStore((s) => s.setIsSearchModalOpen);
  const allNodes = useSynapseStore((s) => s.nodes);
  const projects = useSynapseStore((s) => s.projects);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const setActiveProjectId = useSynapseStore((s) => s.setActiveProjectId);
  const setSelectedNodeId = useSynapseStore((s) => s.setSelectedNodeId);

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NodeType | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<string | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  // Perform search scoring
  const searchResults = useMemo(() => {
    if (!isSearchModalOpen) return [];
    const q = query.trim().toLowerCase();

    return allNodes
      .filter((node) => {
        if (!isNodeVisibleForRole(node.visibility, currentUser.role)) return false;
        if (selectedType !== 'all' && node.type !== selectedType) return false;
        if (selectedProject !== 'all' && node.project_id !== selectedProject) return false;

        if (!q) return true; // show all matching filters if query is empty

        const matchesTitle = node.title.toLowerCase().includes(q);
        const matchesDisplayId = node.display_id.toLowerCase().includes(q);
        const matchesContent = node.content.toLowerCase().includes(q);
        const matchesTags = node.tags.some((t) => t.toLowerCase().includes(q));

        return matchesTitle || matchesDisplayId || matchesContent || matchesTags;
      })
      .slice(0, 20);
  }, [allNodes, query, selectedType, selectedProject, currentUser.role, isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const handleSelectNode = (node: (typeof allNodes)[0]) => {
    if (node.project_id) {
      setActiveProjectId(node.project_id);
    }
    setSelectedNodeId(node.id);
    setIsSearchModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border bg-surface-2/60 flex items-center gap-3">
          <Search className="w-5 h-5 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заголовку, контенту, ID (F-001) или тегам (#go)..."
            className="w-full bg-transparent text-sm text-text-main placeholder-text-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-text-muted hover:text-text-main">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-text-muted bg-surface border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Filters Bar */}
        <div className="p-3 border-b border-border bg-surface flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                selectedType === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-muted hover:text-text-main'
              }`}
            >
              Все типы
            </button>
            {(['problem', 'solution', 'decision', 'feature', 'risk', 'benchmark', 'lesson'] as NodeType[]).map(
              (t) => {
                const conf = NODE_TYPE_CONFIGS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      selectedType === t
                        ? 'border-accent bg-accent/20 text-accent font-bold'
                        : 'border-border bg-surface-2 text-text-muted hover:text-text-main'
                    }`}
                  >
                    <span>{conf.emoji}</span>
                    <span>{conf.label}</span>
                  </button>
                );
              }
            )}
          </div>

          <div className="w-48">
            <CustomSelect
              value={selectedProject}
              onChange={(val) => setSelectedProject(val)}
              options={[
                { value: 'all', label: 'Все проекты' },
                ...projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  subLabel: (p.type || 'software').toUpperCase(),
                })),
              ]}
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {searchResults.map((node) => {
            const config = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.note;
            const project = projects.find((p) => p.id === node.project_id);
            return (
              <div
                key={node.id}
                onClick={() => handleSelectNode(node)}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-zinc-500 cursor-pointer transition-all group"
                style={{
                  borderLeftColor: config.color,
                  borderLeftWidth: '3px',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg leading-none">{config.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                        {node.display_id}
                      </span>
                      <span className="text-xs font-semibold text-text-main truncate group-hover:text-accent transition-colors">
                        {node.title}
                      </span>
                      {node.visibility === 'shared' && (
                        <span title="Shared">
                          <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      {project && <span className="text-indigo-400 font-medium">{project.name}</span>}
                      {node.tags.map((t) => (
                        <span key={t} className="bg-surface px-1.5 py-0.2 rounded text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-text-muted group-hover:text-accent">
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}

          {searchResults.length === 0 && (
            <div className="py-12 text-center text-text-muted">
              <Search className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs">Ничего не найдено по вашему запросу.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
