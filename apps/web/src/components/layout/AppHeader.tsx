import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import type { UserRole } from '../../types';
import { getRoleBadge } from '../../utils/helpers';
import {
  Sparkles,
  Search,
  Plus,
  Layers,
  Map,
  RotateCcw,
  ChevronDown,
  FolderOpen,
  Server,
} from 'lucide-react';

interface AppHeaderProps {
  currentScreen: 'dashboard' | 'projects' | 'project-view' | 'search' | 'settings';
  setCurrentScreen: (screen: 'dashboard' | 'projects' | 'project-view' | 'search' | 'settings') => void;
  onOpenCreateProject: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentScreen,
  setCurrentScreen,
  onOpenCreateProject,
}) => {
  const projects = useSynapseStore((s) => s.projects);
  const activeProjectId = useSynapseStore((s) => s.activeProjectId);
  const setActiveProjectId = useSynapseStore((s) => s.setActiveProjectId);
  const viewMode = useSynapseStore((s) => s.viewMode);
  const setViewMode = useSynapseStore((s) => s.setViewMode);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const users = useSynapseStore((s) => s.users);
  const setCurrentUserRole = useSynapseStore((s) => s.setCurrentUserRole);
  const setCurrentUser = useSynapseStore((s) => s.setCurrentUser);
  const presences = useSynapseStore((s) => s.presences);
  const setIsSearchModalOpen = useSynapseStore((s) => s.setIsSearchModalOpen);
  const resetToMockData = useSynapseStore((s) => s.resetToMockData);
  const backendConnected = useSynapseStore((s) => s.backendConnected);
  const setIsAuthModalOpen = useSynapseStore((s) => s.setIsAuthModalOpen);

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between gap-3 select-none z-30 relative shrink-0">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="flex items-center gap-2.5 group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-glow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-text-main group-hover:text-accent transition-colors">
              SYNAPSE
            </span>
            <span className="text-[9px] font-mono block text-text-muted leading-none">
              v1.0 Knowledge Graph
            </span>
          </div>
        </button>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-text-main transition-colors max-w-[220px]"
          >
            <FolderOpen className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">{activeProject?.name || 'Выберите проект'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 glass-dropdown rounded-xl border border-border p-1.5 shadow-2xl z-50 animate-in fade-in">
              <div className="text-[10px] font-bold text-text-muted uppercase px-2 py-1">
                Проекты ({projects.length})
              </div>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setIsProjectDropdownOpen(false);
                      setCurrentScreen('project-view');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                      p.id === activeProjectId
                        ? 'bg-accent/20 text-accent font-bold'
                        : 'hover:bg-surface-3 text-text-main'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] uppercase text-text-muted font-mono">{p.type}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    onOpenCreateProject();
                  }}
                  className="w-full flex items-center gap-1.5 p-2 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать проект</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Switcher (Canvas / Sections) when on project view */}
        {currentScreen === 'project-view' && (
          <div className="hidden sm:flex items-center bg-surface-2 rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'canvas'
                  ? 'bg-surface text-accent font-bold shadow'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Canvas 🗺️</span>
            </button>
            <button
              onClick={() => setViewMode('sections')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'sections'
                  ? 'bg-surface text-accent font-bold shadow'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sections 📄</span>
            </button>
          </div>
        )}
      </div>

      {/* Center / Nav Items */}
      <nav className="hidden lg:flex items-center gap-1">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'dashboard'
              ? 'bg-surface-2 text-accent font-bold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          Дашборд
        </button>
        <button
          onClick={() => setCurrentScreen('projects')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'projects'
              ? 'bg-surface-2 text-accent font-bold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          Все проекты
        </button>
        <button
          onClick={() => setCurrentScreen('project-view')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'project-view'
              ? 'bg-surface-2 text-accent font-bold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          Граф / Холст
        </button>
        <button
          onClick={() => setCurrentScreen('settings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'settings'
              ? 'bg-surface-2 text-accent font-bold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          Команда и настройки
        </button>
      </nav>

      {/* Right Controls: Search, Backend Status, Presence, Role Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Backend Connection Status Pill */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            backendConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
          title={backendConnected ? 'Go Backend Подключен (Порт 3000)' : 'Офлайн режим (Кликните для подключения)'}
        >
          <Server className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{backendConnected ? 'Go API :3000' : 'Offline'}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendConnected ? 'bg-emerald-400 shadow-glow-sm animate-pulse' : 'bg-amber-400'
            }`}
          />
        </button>

        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border rounded-lg text-xs text-text-muted hover:text-text-main transition-colors"
          title="Глобальный поиск (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Поиск...</span>
          <kbd className="hidden md:inline px-1 py-0.2 bg-surface text-[10px] font-mono rounded border border-border">
            ⌘K
          </kbd>
        </button>

        {/* Online Presence Avatars */}
        <div className="hidden sm:flex items-center -space-x-1.5">
          {presences.slice(0, 3).map((p) => (
            <div
              key={p.user_id}
              className="relative group"
              title={`${p.name} онлайн ${p.is_editing ? '(редактирует узел)' : ''}`}
            >
              <img
                src={p.avatar_url}
                alt={p.name}
                className={`w-7 h-7 rounded-full object-cover border-2 transition-transform group-hover:scale-110 ${
                  p.is_editing ? 'border-amber-400' : 'border-surface'
                }`}
              />
              <span
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-surface ${
                  p.is_editing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
            </div>
          ))}
        </div>

        {/* User & Role Switcher Simulator */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-colors"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-text-main leading-tight">
                {currentUser.name}
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleBadge.color}`}
              >
                {roleBadge.label}
              </span>
            </div>
            <img
              src={currentUser.avatar_url}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-border"
            />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 glass-dropdown rounded-xl border border-border p-2 shadow-2xl z-50 animate-in fade-in">
              <div className="text-[11px] font-bold text-text-muted uppercase px-2 py-1">
                Симуляция роли (Тест прав):
              </div>
              <div className="space-y-1 mb-2">
                {[
                  {
                    role: 'owner' as UserRole,
                    title: 'Владелец (Owner)',
                    desc: 'Полный доступ ко всем узлам и настройкам',
                  },
                  {
                    role: 'editor' as UserRole,
                    title: 'Редактор (Editor)',
                    desc: 'Создание и редактирование узлов',
                  },
                  {
                    role: 'viewer' as UserRole,
                    title: 'Клиент / Viewer',
                    desc: 'Только чтение shared-узлов',
                  },
                ].map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setCurrentUserRole(r.role);
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      currentUser.role === r.role
                        ? 'bg-accent/20 text-accent font-bold'
                        : 'hover:bg-surface-3 text-text-main'
                    }`}
                  >
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-[10px] text-text-muted">{r.desc}</div>
                  </button>
                ))}
              </div>

              <div className="border-t border-border pt-1">
                <div className="text-[10px] font-bold text-text-muted uppercase px-2 py-1">
                  Сменить пользователя:
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u.id);
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-surface-3 text-left"
                  >
                    <img src={u.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border mt-2 pt-2">
                <button
                  onClick={() => {
                    if (confirm('Сбросить данные к первоначальным мокам?')) {
                      resetToMockData();
                      setIsUserDropdownOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-1.5 p-1.5 rounded text-xs text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить мок-данные</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
