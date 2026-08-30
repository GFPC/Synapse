import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import type { UserRole } from '../../types';
import { getRoleBadge } from '../../utils/helpers';
import { CustomSelect } from '../ui/CustomSelect';
import {
  Settings,
  Users,
  UserPlus,
  Shield,
  Trash2,
  RotateCcw,
  Check,
  Mail,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const currentUser = useSynapseStore((s) => s.currentUser);
  const users = useSynapseStore((s) => s.users);
  const workspace = useSynapseStore((s) => s.workspace);
  const projects = useSynapseStore((s) => s.projects);
  const activeProjectId = useSynapseStore((s) => s.activeProjectId);
  const projectMembers = useSynapseStore((s) => s.projectMembers);
  const inviteMember = useSynapseStore((s) => s.inviteMember);
  const updateMemberRole = useSynapseStore((s) => s.updateMemberRole);
  const removeMember = useSynapseStore((s) => s.removeMember);
  const resetToMockData = useSynapseStore((s) => s.resetToMockData);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const members = projectMembers.filter((m) => m.project_id === activeProject?.id);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeProject) return;
    inviteMember(activeProject.id, inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setShowInviteSuccess(true);
    setTimeout(() => setShowInviteSuccess(false), 3000);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Page Title */}
        <div className="border-b border-border pb-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-main flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-accent" />
            <span>Настройки и Управление командой</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Управляйте правами доступа, профилем и участниками проекта
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-surface-2 p-5 sm:p-6 rounded-2xl border border-border space-y-4 shadow-card">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span>Текущий профиль пользователя</span>
          </h3>

          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/40 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-text-main">{currentUser.name}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleBadge(currentUser.role).color}`}>
                  {getRoleBadge(currentUser.role).label}
                </span>
              </div>
              <p className="text-xs text-text-muted">{currentUser.email}</p>
              <p className="text-[11px] text-text-muted">
                Воркспейс: <span className="font-semibold text-text-main">{workspace.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Management */}
        <div className="bg-surface-2 p-5 sm:p-6 rounded-2xl border border-border space-y-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Участники проекта «{activeProject?.name}»</span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Роли определяют права на просмотр (viewer) и редактирование (editor/owner)
              </p>
            </div>
          </div>

          {/* Invite Member Form */}
          <form onSubmit={handleInvite} className="bg-surface p-4 rounded-xl border border-border space-y-3">
            <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>Пригласить нового участника:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@synapse.dev..."
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main focus:border-accent"
                />
              </div>

              <CustomSelect
                value={inviteRole}
                onChange={(val) => setInviteRole(val as UserRole)}
                options={[
                  { value: 'editor', label: 'Редактор (Editor ✍️)' },
                  { value: 'viewer', label: 'Клиент (Viewer 👁️)' },
                  { value: 'owner', label: 'Владелец (Owner 👑)' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {showInviteSuccess ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Приглашение успешно отправлено!</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow transition-all"
              >
                + Отправить приглашение
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-2">
            {members.map((member) => {
              const user = users.find((u) => u.id === member.user_id) || {
                id: member.user_id,
                name: 'Участник',
                email: '',
                avatar_url: '',
              };
              const isMe = user.id === currentUser.id;

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=u'}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-border"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-main">{user.name}</span>
                        {isMe && (
                          <span className="text-[10px] bg-accent/20 text-accent font-bold px-1.5 py-0.2 rounded">
                            Вы
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-40">
                    <CustomSelect
                      value={member.role}
                      disabled={currentUser.role !== 'owner' || isMe}
                      onChange={(val) =>
                        updateMemberRole(activeProject.id, member.user_id, val as UserRole)
                      }
                      options={[
                        { value: 'owner', label: 'Owner 👑' },
                        { value: 'editor', label: 'Editor ✍️' },
                        { value: 'viewer', label: 'Viewer 👁️' },
                      ]}
                    />

                    {currentUser.role === 'owner' && !isMe && (
                      <button
                        onClick={() => {
                          if (confirm(`Удалить участника ${user.name} из проекта?`)) {
                            removeMember(activeProject.id, member.user_id);
                          }
                        }}
                        className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-surface-2"
                        title="Удалить участника"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database & Mock Reset Section */}
        <div className="bg-red-950/20 p-5 rounded-2xl border border-red-900/40 space-y-3">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Сброс данных приложения</span>
          </h3>
          <p className="text-xs text-text-muted">
            Вы можете вернуть базу данных к первоначальному демонстрационному набору моков в любой момент.
          </p>
          <button
            onClick={() => {
              if (confirm('Сбросить все изменения и восстановить начальные мок-данные?')) {
                resetToMockData();
                alert('База данных успешно сброшена!');
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
          >
            Сбросить базу данных к начальному состоянию
          </button>
        </div>
      </div>
    </div>
  );
};
