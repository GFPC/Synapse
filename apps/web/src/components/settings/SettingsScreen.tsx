import React, { useState, useEffect } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import type { UserRole } from '../../types';
import { getRoleBadge } from '../../utils/helpers';
import { CustomSelect } from '../ui/CustomSelect';
import { apiKeyApi } from '../../api/apikeys';
import type { ApiKeyItem, CreateApiKeyResult } from '../../api/apikeys';
import {
  Settings,
  Users,
  UserPlus,
  Shield,
  Trash2,
  RotateCcw,
  Check,
  Mail,
  Key,
  Terminal,
  Bot,
  Copy,
  Plus,
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

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [createdKeyResult, setCreatedKeyResult] = useState<CreateApiKeyResult | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'apikeys' | 'mcp' | 'cli'>('team');

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const members = projectMembers.filter((m) => m.project_id === activeProject?.id);

  const loadKeys = async () => {
    try {
      setLoadingKeys(true);
      const keys = await apiKeyApi.list();
      setApiKeys(keys);
    } catch {
      // ignore
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await apiKeyApi.create(newKeyName.trim());
      setCreatedKeyResult(res);
      setNewKeyName('');
      setIsCreatingKey(false);
      loadKeys();
    } catch (err: any) {
      alert(`?????? ???????? ?????: ${err.message}`);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`???????? API-???? ?${name}?? ???????????, ???????????? ???, ???????? ??????.`)) return;
    try {
      await apiKeyApi.delete(id);
      loadKeys();
    } catch (err: any) {
      alert(`??????: ${err.message}`);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeProject) return;
    inviteMember(activeProject.id, inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setShowInviteSuccess(true);
    setTimeout(() => setShowInviteSuccess(false), 3000);
  };

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        synapse: {
          command: 'npx',
          args: ['-y', '@synapse/mcp-server'],
          env: {
            SYNAPSE_API_URL: 'http://87.58.204.138',
            SYNAPSE_API_KEY: createdKeyResult ? createdKeyResult.key : 'YOUR_API_KEY_HERE',
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-background p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Page Title */}
        <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-accent" />
              <span>????????? ? ??????????</span>
            </h1>
            <p className="text-xs text-text-muted mt-1">
              ?????????? ????????, ????????????? API-???????, CLI ? ??-??????????? (MCP)
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-2 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'team' ? 'bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>???????</span>
            </button>
            <button
              onClick={() => setActiveTab('apikeys')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'apikeys' ? 'bg-surface text-amber-400 shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>API ?????</span>
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'mcp' ? 'bg-surface text-indigo-400 shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Cursor & Claude (MCP)</span>
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'cli' ? 'bg-surface text-emerald-400 shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Synapse CLI</span>
            </button>
          </div>
        </div>

        {/* Modal: Show newly created API key once */}
        {createdKeyResult && (
          <div className="bg-amber-500/10 border-2 border-amber-500/40 p-5 rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>????? API-???? ??????: {createdKeyResult.api_key.name}</span>
              </h3>
              <button
                onClick={() => setCreatedKeyResult(null)}
                className="text-xs text-text-muted hover:text-text-main"
              >
                ? ???????
              </button>
            </div>
            <p className="text-xs text-text-muted">
              ?????????? ???? ????? ????? ??????. ?? ??????????? ???????????? ?? ?????? ?? ????? ??????? ? ???????? ????. ?? ??????????? ???????????? ?? ?????? ?? ????? ??????? ? ???????? ????.
            </p>
            <div className="flex items-center gap-2 bg-surface p-3 rounded-xl border border-amber-500/30">
              <code className="text-xs font-mono text-amber-300 flex-1 break-all select-all">
                {createdKeyResult.key}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdKeyResult.key);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  copiedKey ? 'bg-emerald-500 text-white' : 'bg-surface-2 hover:bg-surface text-amber-300 border border-amber-500/30'
                }`}
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? '???????????!' : '??????????'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: TEAM & PROFILE */}
        {activeTab === 'team' && (
          <>
            {/* User Profile Card */}
            <div className="bg-surface-2 p-5 sm:p-6 rounded-2xl border border-border space-y-4 shadow-card">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span>??????? ??????? ????????????</span>
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
                    ?????????: <span className="font-semibold text-text-main">{workspace.name}</span>
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
                    <span>????????? ??????? ?{activeProject?.name}?</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    ???? ?????????? ????? ?? ???????? (viewer) ? ?????????????? (editor/owner)
                  </p>
                </div>
              </div>

              {/* Invite Member Form */}
              <form onSubmit={handleInvite} className="bg-surface p-4 rounded-xl border border-border space-y-3">
                <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-accent" />
                  <span>?????????? ?????? ?????????:</span>
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
                      { value: 'editor', label: '???????? (Editor ??)' },
                      { value: 'viewer', label: '?????? (Viewer ???)' },
                      { value: 'owner', label: '???????? (Owner ??)' },
                    ]}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {showInviteSuccess ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>??????????? ??????? ??????????!</span>
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow transition-all"
                  >
                    + ?????????? ?????????
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div className="space-y-2">
                {members.map((member) => {
                  const user = users.find((u) => u.id === member.user_id) || {
                    id: member.user_id,
                    name: '????????',
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
                                ??
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
                            { value: 'owner', label: 'Owner ??' },
                            { value: 'editor', label: 'Editor ??' },
                            { value: 'viewer', label: 'Viewer ???' },
                          ]}
                        />

                        {currentUser.role === 'owner' && !isMe && (
                          <button
                            onClick={() => {
                              if (confirm(`??????? ????????? ${user.name} ?? ????????`)) {
                                removeMember(activeProject.id, member.user_id);
                              }
                            }}
                            className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-surface-2"
                            title="??????? ?????????"
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
          </>
        )}

        {/* TAB 2: API KEYS */}
        {activeTab === 'apikeys' && (
          <div className="bg-surface-2 p-5 sm:p-6 rounded-2xl border border-border space-y-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>???????????? API-?????</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  ???????????? ??? ??????????? Synapse CLI, Cursor, Claude Desktop ? CI/CD ??????????
                </p>
              </div>

              <button
                onClick={() => setIsCreatingKey(true)}
                className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>??????? ????</span>
              </button>
            </div>

            {/* Create Key Form */}
            {isCreatingKey && (
              <form onSubmit={handleCreateKey} className="bg-surface p-4 rounded-xl border border-accent/40 space-y-3">
                <h4 className="text-xs font-bold text-text-main">??? ?????? ?????:</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="????????: Cursor ?? MacBook, CI Pipeline..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-main focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl"
                  >
                    ?????????????
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingKey(false)}
                    className="px-3 py-2 bg-surface-2 hover:bg-surface text-text-muted text-xs rounded-xl"
                  >
                    ??????
                  </button>
                </div>
              </form>
            )}

            {/* Keys Table */}
            <div className="space-y-2">
              {loadingKeys ? (
                <p className="text-xs text-text-muted">???????? ??????...</p>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                  <Key className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-text-muted font-medium">??? ????????? API-??????</p>
                  <p className="text-[11px] text-text-muted mt-1">???????? ???? ??? ??????????? CLI ??? ??-??????????</p>
                </div>
              ) : (
                apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between gap-3 p-3.5 bg-surface rounded-xl border border-border"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-main">{k.name}</span>
                        <code className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {k.key_prefix}...
                        </code>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        ??????: {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at && ` ? ???????????: ${new Date(k.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteKey(k.id, k.name)}
                      className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-surface-2"
                      title="???????? ????"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MCP & CURSOR SETUP */}
        {activeTab === 'mcp' && (
          <div className="bg-surface-2 p-5 sm:p-6 rounded-2xl border border-border space-y-6 shadow-card">
            <div>
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>??????????? ??-?????????? ????? Model Context Protocol (MCP)</span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                ?????????? Cursor, Claude Desktop, Antigravity ? VS Code ???????? ? ?????? ????? ???????????, ADR ? ?????????? ? ???????? ???????.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-main">
                  ???????? ? <code className="text-accent font-mono">.cursor/mcp.json</code> ??? <code className="text-accent font-mono">claude_desktop_config.json</code>:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mcpConfigJson);
                    alert('???????????? MCP ??????????? ? ????? ??????!');
                  }}
                  className="px-2.5 py-1 bg-surface hover:bg-surface-2 border border-border text-xs text-text-main font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>?????????? JSON</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-surface border border-border text-xs font-mono text-indigo-300 overflow-x-auto">
                <code>{mcpConfigJson}</code>
              </pre>
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-400">??? ?? ?????? ?????? ?????????????:</h4>
              <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
                <li>?????? ??????? ? ?????: <code className="text-indigo-300">???????? ? Synapse, ????? ?????? ??????? ?? ??????????</code></li>
                <li>?????? ???????????? ?????? ???? ?? ????????????? ID: <code className="text-indigo-300">synapse_get_node (C-002)</code></li>
                <li>???????? ?????, ??????? ?? ?????? ??? ???????? ? ???????? ????? <code className="text-indigo-300">Quick Drop</code></li>
                <li>????????? ????? ???? ? ADR ????? ? Synapse ?? ????? ?????? ??? ????????</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: SYNAPSE CLI GUIDE */}
        {activeTab === 'cli' && (
          <div className="bg-surface-2 p-5 sm:p-6 rounded-2xl border border-border space-y-6 shadow-card">
            <div>
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>??????? ????? ? Synapse CLI</span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                ?????????? ????????????? ?????????, ???????? ? ??????? ?????? ?????? ?? ?????????
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-text-main">1. ????????????? ? ???????:</span>
                <pre className="p-3 rounded-xl bg-surface border border-border text-xs font-mono text-emerald-400">
                  <code>npx @synapse/cli init</code>
                </pre>
                <p className="text-[11px] text-text-muted">
                  ?????? Git-??????????? ? ???????? Synapse ? ????????? ??????????????? Git Hook.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-text-main">2. ???????? ???????:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
                    <code className="text-accent font-bold font-mono">synapse start</code>
                    <p className="text-text-muted text-[11px]">??????? ???? ??????????? ? ????????? ??????? ???????</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
                    <code className="text-accent font-bold font-mono">synapse status</code>
                    <p className="text-text-muted text-[11px]">????????? ?????? ??? ????? ? ???????? ??????</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
                    <code className="text-accent font-bold font-mono">synapse drop "?????"</code>
                    <p className="text-text-muted text-[11px]">????????? ????????? ??????? ?? ??????? ? ??</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
                    <code className="text-accent font-bold font-mono">synapse finish</code>
                    <p className="text-text-muted text-[11px]">????????? ???? ? ????????????? ? main</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database & Mock Reset Section */}
        <div className="bg-red-950/20 p-5 rounded-2xl border border-red-900/40 space-y-3">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>????? ?????? ??????????</span>
          </h3>
          <p className="text-xs text-text-muted">
            ?? ?????? ??????? ???? ?????? ? ??????????????? ????????????????? ?????? ????? ? ????? ??????.
          </p>
          <button
            onClick={() => {
              if (confirm('???????? ??? ????????? ? ???????????? ????????? ???-???????')) {
                resetToMockData();
                alert('???? ?????? ??????? ????????!');
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
          >
            ???????? ???? ?????? ? ?????????? ?????????
          </button>
        </div>
      </div>
    </div>
  );
};
