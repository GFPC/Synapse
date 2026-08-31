import React, { useState, useEffect } from 'react';
import { ideasApi } from '../../api/ideas';
import type { Idea, IdeaGroup } from '../../api/ideas';
import { useSynapseStore } from '../../store/synapseStore';
import type { NodeType } from '../../types';
import { synapseWs } from '../../api/websocket';
import type { WsEvent } from '../../api/websocket';

export const IdeasBoardView: React.FC = () => {
  const { projects } = useSynapseStore();
  const [groups, setGroups] = useState<IdeaGroup[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Promotion modal
  const [promotingIdea, setPromotingIdea] = useState<Idea | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [targetNodeType, setTargetNodeType] = useState<NodeType>('feature');
  const [isPromoting, setIsPromoting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gList, iList] = await Promise.all([
        ideasApi.listGroups(),
        ideasApi.listIdeas(activeGroupId || undefined),
      ]);
      setGroups(gList);
      setIdeas(iList);
      if (projects.length > 0 && !targetProjectId) {
        setTargetProjectId(projects[0].id);
      }
    } catch (e) {
      console.error('Failed to load ideas', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsub = synapseWs.subscribe((event: WsEvent) => {
      if (event.type === 'idea_created' && event.data) {
        setIdeas((prev) => [event.data, ...prev.filter((i) => i.id !== event.data.id)]);
      } else if (event.type === 'idea_updated' && event.data) {
        setIdeas((prev) =>
          prev.map((i) => (i.id === event.data.id ? { ...i, ...event.data } : i))
        );
      } else if (event.type === 'idea_deleted') {
        const id = event.data?.id;
        if (id) setIdeas((prev) => prev.filter((i) => i.id !== id));
      }
    });

    return () => unsub();
  }, [activeGroupId]);

  const handleCreateIdea = async () => {
    if (!newTitle.trim()) return;
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
      const item = await ideasApi.createIdea({
        title: newTitle.trim(),
        content: newContent.trim(),
        group_id: activeGroupId || undefined,
        tags,
      });
      setIdeas((prev) => [item, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setIsCreating(false);
    } catch (e) {
      console.error('Failed to create idea', e);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const g = await ideasApi.createGroup(newGroupName.trim());
      setGroups((prev) => [...prev, g]);
      setActiveGroupId(g.id);
      setNewGroupName('');
      setIsCreatingGroup(false);
    } catch (e) {
      console.error('Failed to create group', e);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await ideasApi.deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error('Failed to delete idea', e);
    }
  };

  const handlePromote = async () => {
    if (!promotingIdea || !targetProjectId) return;
    try {
      setIsPromoting(true);
      await ideasApi.promoteIdea(promotingIdea.id, targetProjectId, targetNodeType);
      setIdeas((prev) =>
        prev.map((i) => (i.id === promotingIdea.id ? { ...i, status: 'matured' } : i))
      );
      setPromotingIdea(null);
    } catch (e) {
      console.error('Failed to promote idea', e);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] text-zinc-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-950/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            💡
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Free-Ride Notes & Ideas
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Mindspace
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Unstructured thoughts, concept clusters & brainstorming</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          ＋ New Idea
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Groups */}
        <div className="w-64 border-r border-zinc-800/80 bg-zinc-950/40 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clusters</span>
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              ＋ Group
            </button>
          </div>

          {isCreatingGroup && (
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900 flex flex-col gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                className="bg-zinc-950 text-xs px-2.5 py-1.5 rounded border border-zinc-800 text-zinc-200 outline-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="px-2.5 py-1 text-[11px] bg-indigo-600 rounded text-white font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveGroupId(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                activeGroupId === null
                  ? 'bg-zinc-800 text-white border border-zinc-700/60'
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🌟</span> All Ideas
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{ideas.length}</span>
            </button>

            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                  activeGroupId === g.id
                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{g.icon || '💡'}</span> {g.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Quick Create Drawer / Box */}
          {isCreating && (
            <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-zinc-900/80 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">Capture New Idea</span>
                <button onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-zinc-200 text-sm">
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Idea title or concept summary..."
                className="w-full bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-100 outline-none focus:border-amber-500/50"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Markdown description, architectural hypotheses, pros/cons..."
                rows={4}
                className="w-full bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-amber-500/50 resize-none font-mono"
              />
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags separated by commas (e.g. low-latency, c++, cache)"
                className="w-full bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-300 outline-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIdea}
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-medium text-white transition"
                >
                  Save Idea 💡
                </button>
              </div>
            </div>
          )}

          {/* Ideas Cards Grid */}
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">Loading ideas...</div>
          ) : ideas.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <div className="text-4xl mb-2">💡</div>
              <h3 className="text-sm font-medium text-zinc-300">No ideas in this cluster</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Capture quick concepts, trade-off notes, and draft ideas before promoting them to projects.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-600/30 transition"
              >
                ＋ Add First Idea
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => {
                const isMatured = idea.status === 'matured';
                return (
                  <div
                    key={idea.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                      isMatured
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                            isMatured
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {idea.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1 text-xs transition"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-100 mb-1.5 leading-snug">{idea.title}</h3>
                      {idea.content ? (
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4 font-mono mb-3">
                          {idea.content}
                        </p>
                      ) : null}

                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {idea.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between mt-2">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </span>

                      {isMatured ? (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          ✓ Promoted to Node
                        </span>
                      ) : (
                        <button
                          onClick={() => setPromotingIdea(idea)}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1"
                        >
                          🚀 Promote to Node
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Promotion Modal */}
      {promotingIdea && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              🚀 Promote Idea to Architecture Node
            </h2>
            <p className="text-xs text-zinc-400">
              Convert <strong className="text-zinc-200 font-semibold">{promotingIdea.title}</strong> into a structured node inside an architecture project.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Target Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Node Type</label>
                <select
                  value={targetNodeType}
                  onChange={(e) => setTargetNodeType(e.target.value as NodeType)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
                >
                  <option value="feature">Feature</option>
                  <option value="component">Component</option>
                  <option value="decision">ADR Decision</option>
                  <option value="solution">Solution</option>
                  <option value="problem">Problem</option>
                  <option value="benchmark">Benchmark</option>
                  <option value="risk">Risk</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setPromotingIdea(null)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={isPromoting}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition flex items-center gap-1.5"
              >
                {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};