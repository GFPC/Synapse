import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSynapseStore } from '../../store/synapseStore';
import { NODE_TYPE_CONFIGS, RELATION_TYPE_CONFIGS, REACTION_EMOJIS } from '../../utils/constants';
import { canEditContent, formatRelativeTime, formatBytes } from '../../utils/helpers';
import { TypeFields } from './TypeFields';
import {
  X,
  Lock,
  Globe,
  LockKeyhole,
  Plus,
  Trash2,
  Paperclip,
  MessageSquare,
  History,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Send,
  CornerDownRight,
  Edit3,
  Eye,
  ExternalLink,
} from 'lucide-react';

export const NodeDetailDrawer: React.FC = () => {
  const selectedNodeId = useSynapseStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useSynapseStore((s) => s.setSelectedNodeId);
  const nodes = useSynapseStore((s) => s.nodes);
  const relations = useSynapseStore((s) => s.relations);
  const comments = useSynapseStore((s) => s.comments);
  const reactions = useSynapseStore((s) => s.reactions);
  const attachments = useSynapseStore((s) => s.attachments);
  const users = useSynapseStore((s) => s.users);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const presences = useSynapseStore((s) => s.presences);

  const updateNode = useSynapseStore((s) => s.updateNode);
  const deleteNode = useSynapseStore((s) => s.deleteNode);
  const deleteRelation = useSynapseStore((s) => s.deleteRelation);
  const addComment = useSynapseStore((s) => s.addComment);
  const toggleReaction = useSynapseStore((s) => s.toggleReaction);
  const deleteComment = useSynapseStore((s) => s.deleteComment);
  const addAttachment = useSynapseStore((s) => s.addAttachment);
  const uploadFileAttachment = useSynapseStore((s) => s.uploadFileAttachment);
  const deleteAttachment = useSynapseStore((s) => s.deleteAttachment);
  const setIsCreateRelationModalOpen = useSynapseStore((s) => s.setIsCreateRelationModalOpen);
  const setRelationSourceNodeId = useSynapseStore((s) => s.setRelationSourceNodeId);

  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'attachments' | 'history'>('content');
  const [markdownView, setMarkdownView] = useState<'edit' | 'preview'>('preview');
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // New attachment modal form state
  const [newAttType, setNewAttType] = useState<'image' | 'file' | 'embed'>('image');
  const [newAttFilename, setNewAttFilename] = useState('');
  const [newAttUrl, setNewAttUrl] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const node = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  if (!node) return null;

  const isEditable = canEditContent(currentUser.role);
  const config = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.note;
  const author = users.find((u) => u.id === node.author_id) || { name: 'Неизвестный', avatar_url: '' };

  // Soft lock check
  const activeEditor = presences?.find((p) => p.current_node_id === node.id && p.is_editing && p.user_id !== currentUser.id);

  // Relations
  const outboundRelations = relations.filter((r) => r.from_node_id === node.id);
  const inboundRelations = relations.filter((r) => r.to_node_id === node.id);

  // Node Comments
  const nodeComments = comments.filter((c) => c.node_id === node.id);
  const topLevelComments = nodeComments.filter((c) => !c.reply_to_id);

  // Attachments
  const nodeAttachments = attachments.filter((a) => a.node_id === node.id);

  // Handlers
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().replace(/^#/, '');
    if (!node.tags.includes(tag)) {
      updateNode(node.id, { tags: [...node.tags, tag] });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateNode(node.id, { tags: node.tags.filter((t) => t !== tagToRemove) });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(node.id, commentInput.trim(), replyingToId);
    setCommentInput('');
    setReplyingToId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileAttachment(node.id, file, file.type.startsWith('image/') ? 'image' : 'file');
    }
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttFilename.trim() && !newAttUrl.trim()) return;
    addAttachment({
      node_id: node.id,
      type: newAttType,
      filename: newAttFilename || (newAttType === 'embed' ? 'Embed Resource' : 'Uploaded File'),
      storage_path: newAttUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      embed_url: newAttType === 'embed' ? newAttUrl : undefined,
      size_bytes: 524000,
    });
    setNewAttFilename('');
    setNewAttUrl('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[680px] lg:w-[740px] bg-surface border-l border-border z-40 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Drawer Top Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface-2/60 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Type & Display ID & Visibility Bar */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xl leading-none">{config.emoji}</span>
            <span
              className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded border"
              style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderColor: `${config.color}40`,
              }}
            >
              {config.label}
            </span>

            <span className="text-xs font-mono font-bold text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
              {node.display_id}
            </span>

            {/* Visibility Toggle */}
            {isEditable ? (
              <button
                onClick={() =>
                  updateNode(node.id, {
                    visibility: node.visibility === 'shared' ? 'internal' : 'shared',
                  })
                }
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border transition-colors ${
                  node.visibility === 'shared'
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                    : 'text-text-muted border-border bg-surface'
                }`}
                title="Переключить видимость для клиентов (shared)"
              >
                {node.visibility === 'shared' ? (
                  <>
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>Shared (Видно клиентам)</span>
                  </>
                ) : (
                  <>
                    <LockKeyhole className="w-3 h-3" />
                    <span>Internal (Только команда)</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                {node.visibility === 'shared' ? <Globe className="w-3 h-3 text-emerald-400" /> : <LockKeyhole className="w-3 h-3" />}
                {node.visibility === 'shared' ? 'Shared' : 'Internal'}
              </span>
            )}
          </div>

          {/* Editable Node Title */}
          {isEditable ? (
            <input
              type="text"
              value={node.title}
              onChange={(e) => updateNode(node.id, { title: e.target.value })}
              className="w-full bg-transparent text-lg sm:text-xl font-bold text-text-main focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1"
              placeholder="Заголовок узла..."
            />
          ) : (
            <h3 className="text-lg sm:text-xl font-bold text-text-main">{node.title}</h3>
          )}
        </div>

        {/* Action buttons (Close, Delete) */}
        <div className="flex items-center gap-1 shrink-0">
          {isEditable && (
            <button
              onClick={() => {
                if (confirm(`Удалить узел «${node.display_id}: ${node.title}»?`)) {
                  deleteNode(node.id);
                }
              }}
              title="Удалить узел"
              className="p-2 text-text-muted hover:text-red-400 hover:bg-surface-3 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-2 text-text-muted hover:text-text-main hover:bg-surface-3 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Soft Lock Banner if someone else is editing */}
      {activeEditor && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 flex items-center gap-2 text-amber-300 text-xs font-semibold animate-pulse">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Внимание: {activeEditor.name} сейчас редактирует этот узел. Ваши изменения могут быть перезаписаны.</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-border bg-surface px-4 gap-2">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'content'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Описание и Специфика</span>
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'comments'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Комментарии ({nodeComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'attachments'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Вложения ({nodeAttachments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <History className="w-4 h-4" />
          <span>История</span>
        </button>
      </div>

      {/* Drawer Body Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'content' && (
          <>
            {/* 1. Type-Specific Specialized Fields */}
            <TypeFields
              node={node}
              isEditable={isEditable}
              onUpdateMeta={(newMeta) => updateNode(node.id, { meta: newMeta })}
            />

            {/* 2. Markdown Content Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Контент и Описание (Markdown):
                </label>
                {isEditable && (
                  <div className="flex items-center bg-surface-2 rounded-lg p-0.5 border border-border">
                    <button
                      onClick={() => setMarkdownView('edit')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                        markdownView === 'edit' ? 'bg-surface text-accent font-bold shadow' : 'text-text-muted'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      Редактор
                    </button>
                    <button
                      onClick={() => setMarkdownView('preview')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                        markdownView === 'preview' ? 'bg-surface text-accent font-bold shadow' : 'text-text-muted'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      Превью
                    </button>
                  </div>
                )}
              </div>

              {isEditable && markdownView === 'edit' ? (
                <textarea
                  rows={8}
                  value={node.content}
                  onChange={(e) => updateNode(node.id, { content: e.target.value })}
                  placeholder="Введите описание в формате Markdown..."
                  className="w-full font-mono text-xs bg-surface-2 border border-border rounded-xl p-3 text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                />
              ) : (
                <div className="bg-surface-2/40 border border-border rounded-xl p-4 min-h-[100px] prose prose-invert prose-xs max-w-none text-xs text-text-main">
                  {node.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.content}</ReactMarkdown>
                  ) : (
                    <p className="text-text-muted italic">Описание отсутствует.</p>
                  )}
                </div>
              )}
            </div>

            {/* 3. Relations Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Связи узла ({outboundRelations.length + inboundRelations.length}):</span>
                </label>
                {isEditable && (
                  <button
                    onClick={() => {
                      setRelationSourceNodeId(node.id);
                      setIsCreateRelationModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-light font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить связь</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {/* Outbound Relations */}
                {outboundRelations.map((rel) => {
                  const targetNode = nodes.find((n) => n.id === rel.to_node_id);
                  const relConfig = RELATION_TYPE_CONFIGS[rel.type] || RELATION_TYPE_CONFIGS.related;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between gap-3 bg-surface-2 p-2.5 rounded-lg border border-border text-xs group hover:border-zinc-500"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span
                          className="font-semibold text-[11px] px-1.5 py-0.5 rounded border shrink-0"
                          style={{
                            color: relConfig.color,
                            backgroundColor: `${relConfig.color}15`,
                            borderColor: `${relConfig.color}40`,
                          }}
                        >
                          {relConfig.label}
                        </span>
                        {targetNode ? (
                          <button
                            onClick={() => setSelectedNodeId(targetNode.id)}
                            className="text-text-main hover:text-accent font-medium truncate text-left"
                          >
                            <span className="font-mono text-text-muted mr-1">[{targetNode.display_id}]</span>
                            {targetNode.title}
                          </button>
                        ) : (
                          <span className="text-text-muted italic">Удаленный узел</span>
                        )}
                      </div>

                      {isEditable && (
                        <button
                          onClick={() => deleteRelation(rel.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 p-1 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Inbound Relations */}
                {inboundRelations.map((rel) => {
                  const sourceNode = nodes.find((n) => n.id === rel.from_node_id);
                  const relConfig = RELATION_TYPE_CONFIGS[rel.type] || RELATION_TYPE_CONFIGS.related;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between gap-3 bg-surface-2 p-2.5 rounded-lg border border-border text-xs group hover:border-zinc-500"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ArrowLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        {sourceNode ? (
                          <button
                            onClick={() => setSelectedNodeId(sourceNode.id)}
                            className="text-text-main hover:text-accent font-medium truncate text-left"
                          >
                            <span className="font-mono text-text-muted mr-1">[{sourceNode.display_id}]</span>
                            {sourceNode.title}
                          </button>
                        ) : (
                          <span className="text-text-muted italic">Удаленный узел</span>
                        )}
                        <span
                          className="font-semibold text-[11px] px-1.5 py-0.5 rounded border shrink-0 ml-1"
                          style={{
                            color: relConfig.color,
                            backgroundColor: `${relConfig.color}15`,
                            borderColor: `${relConfig.color}40`,
                          }}
                        >
                          {relConfig.label}
                        </span>
                      </div>

                      {isEditable && (
                        <button
                          onClick={() => deleteRelation(rel.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 p-1 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {outboundRelations.length === 0 && inboundRelations.length === 0 && (
                  <p className="text-xs text-text-muted italic bg-surface-2/40 p-3 rounded-lg border border-dashed border-border text-center">
                    У узла пока нет связей.
                  </p>
                )}
              </div>
            </div>

            {/* 4. Tags Section */}
            <div className="pt-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
                Теги (Tags):
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {node.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-surface-2 text-text-main text-xs px-2.5 py-1 rounded-full border border-border"
                  >
                    <span>#{tag}</span>
                    {isEditable && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-text-muted hover:text-red-400 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                {isEditable && (
                  <>
                    {isAddingTag ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTag();
                            if (e.key === 'Escape') setIsAddingTag(false);
                          }}
                          placeholder="тег..."
                          className="bg-surface-2 border border-accent rounded-full px-2.5 py-0.5 text-xs text-text-main w-24 focus:outline-none"
                        />
                        <button
                          onClick={handleAddTag}
                          className="text-xs text-accent font-semibold px-1 hover:underline"
                        >
                          ОК
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingTag(true)}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-3 px-2 py-1 rounded-full border border-border"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Добавить</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Comments List */}
            <div className="space-y-3">
              {topLevelComments.map((comment) => {
                const commentAuthor = users.find((u) => u.id === comment.author_id) || {
                  name: 'Пользователь',
                  avatar_url: '',
                };
                const replies = nodeComments.filter((c) => c.reply_to_id === comment.id);
                const commentReactions = reactions.filter((r) => r.comment_id === comment.id);

                return (
                  <div
                    key={comment.id}
                    className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={commentAuthor.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                          alt={commentAuthor.name}
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                        <span className="text-xs font-semibold text-text-main">{commentAuthor.name}</span>
                        <span className="text-[10px] text-text-muted">{formatRelativeTime(comment.created_at)}</span>
                      </div>

                      {comment.author_id === currentUser.id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-text-muted hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-text-main leading-relaxed pl-8">{comment.content}</p>

                    {/* Reaction Buttons Bar */}
                    <div className="flex items-center justify-between pl-8 pt-1">
                      <div className="flex items-center gap-1.5">
                        {REACTION_EMOJIS.map((emoji) => {
                          const count = commentReactions.filter((r) => r.emoji === emoji).length;
                          const hasReacted = commentReactions.some(
                            (r) => r.emoji === emoji && r.user_id === currentUser.id
                          );
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(comment.id, emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                                hasReacted
                                  ? 'bg-accent/20 border-accent text-accent font-bold'
                                  : 'bg-surface border-border text-text-muted hover:bg-surface-3'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span className="text-[10px]">{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setReplyingToId(comment.id)}
                        className="text-xs text-text-muted hover:text-accent font-medium flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Ответить</span>
                      </button>
                    </div>

                    {/* Nested Replies */}
                    {replies.length > 0 && (
                      <div className="ml-8 mt-2 pl-3 border-l-2 border-border space-y-2">
                        {replies.map((reply) => {
                          const replyAuthor = users.find((u) => u.id === reply.author_id) || {
                            name: 'Пользователь',
                            avatar_url: '',
                          };
                          return (
                            <div key={reply.id} className="bg-surface p-2.5 rounded-lg border border-border/70">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={replyAuthor.avatar_url}
                                    alt={replyAuthor.name}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                  <span className="text-xs font-semibold text-text-main">{replyAuthor.name}</span>
                                  <span className="text-[10px] text-text-muted">
                                    {formatRelativeTime(reply.created_at)}
                                  </span>
                                </div>
                                {reply.author_id === currentUser.id && (
                                  <button
                                    onClick={() => deleteComment(reply.id)}
                                    className="text-text-muted hover:text-red-400 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-text-main pl-6">{reply.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {nodeComments.length === 0 && (
                <p className="text-xs text-text-muted text-center py-6 border border-dashed border-border rounded-xl">
                  Пока нет комментариев. Начните обсуждение первым!
                </p>
              )}
            </div>

            {/* Comment Input Form */}
            <form onSubmit={handleSendComment} className="pt-3 border-t border-border space-y-2">
              {replyingToId && (
                <div className="flex items-center justify-between text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/30">
                  <span>Ответ на комментарий</span>
                  <button onClick={() => setReplyingToId(null)} className="text-accent hover:underline">
                    Отмена
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder={replyingToId ? 'Напишите ответ...' : 'Напишите комментарий...'}
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ATTACHMENTS TAB */}
        {activeTab === 'attachments' && (
          <div className="space-y-5">
            {/* Add Attachment Form */}
            {isEditable && (
              <form onSubmit={handleAddAttachment} className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-3">
                <h5 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-accent" />
                  <span>Добавить вложение</span>
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAttType('image')}
                    className={`py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-1 ${
                      newAttType === 'image' ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text-muted'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    Изображение
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAttType('file')}
                    className={`py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-1 ${
                      newAttType === 'file' ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text-muted'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Файл
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAttType('embed')}
                    className={`py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-1 ${
                      newAttType === 'embed' ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text-muted'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    Embed ссылка
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newAttFilename}
                    onChange={(e) => setNewAttFilename(e.target.value)}
                    placeholder="Название файла / ссылки..."
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-main focus:border-accent"
                  />
                  <input
                    type="text"
                    value={newAttUrl}
                    onChange={(e) => setNewAttUrl(e.target.value)}
                    placeholder="URL ресурса (https://...)"
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-main focus:border-accent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-surface hover:bg-surface-3 border border-border text-text-main text-xs font-semibold rounded-lg"
                  >
                    + Прикрепить по ссылке
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Загрузить файл</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </form>
            )}

            {/* Attachments List */}
            <div className="space-y-3">
              {nodeAttachments.map((att) => (
                <div
                  key={att.id}
                  className="bg-surface-2 p-3 rounded-xl border border-border flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-accent border border-border shrink-0">
                      {att.type === 'image' ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : att.type === 'embed' ? (
                        <ExternalLink className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h6 className="text-xs font-semibold text-text-main truncate">{att.filename}</h6>
                      <span className="text-[10px] text-text-muted">
                        {att.type.toUpperCase()} • {att.size_bytes ? formatBytes(att.size_bytes) : 'Online embed'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {att.embed_url ? (
                      <a
                        href={att.embed_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-surface hover:bg-surface-3 text-text-main text-xs font-medium rounded border border-border"
                      >
                        Открыть
                      </a>
                    ) : (
                      <a
                        href={att.storage_path || `http://localhost:3000/api/attachments/${att.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-surface hover:bg-surface-3 text-text-main text-xs font-medium rounded border border-border"
                      >
                        Скачать
                      </a>
                    )}
                    {isEditable && (
                      <button
                        onClick={() => deleteAttachment(att.id)}
                        className="p-1.5 text-text-muted hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {nodeAttachments.length === 0 && (
                <p className="text-xs text-text-muted text-center py-6 border border-dashed border-border rounded-xl">
                  Вложений пока нет.
                </p>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-text-muted">Автор:</span>
                <span className="font-semibold text-text-main flex items-center gap-1.5">
                  <img src={author.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                  {author.name}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-text-muted">Создан:</span>
                <span className="font-mono text-text-main">
                  {node.created_at ? new Date(node.created_at).toLocaleString('ru-RU') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-text-muted">Последнее изменение:</span>
                <span className="font-mono text-text-main">
                  {node.updated_at ? new Date(node.updated_at).toLocaleString('ru-RU') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Координаты Canvas:</span>
                <span className="font-mono text-text-main">
                  X: {Math.round(node.canvas_x)}, Y: {Math.round(node.canvas_y)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
