import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import { NODE_TYPE_CONFIGS } from '../../utils/constants';
import type { NodeType, NodeVisibility } from '../../types';
import { X, Sparkles, Globe, LockKeyhole } from 'lucide-react';

export const CreateNodeModal: React.FC = () => {
  const isCreateNodeModalOpen = useSynapseStore((s) => s.isCreateNodeModalOpen);
  const setIsCreateNodeModalOpen = useSynapseStore((s) => s.setIsCreateNodeModalOpen);
  const createNode = useSynapseStore((s) => s.createNode);
  const activeProjectId = useSynapseStore((s) => s.activeProjectId);

  const [selectedType, setSelectedType] = useState<NodeType>('problem');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<NodeVisibility>('internal');
  const [tagsInput, setTagsInput] = useState('');

  if (!isCreateNodeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    // Initial default meta per type
    let defaultMeta: any = {};
    if (selectedType === 'solution') {
      defaultMeta = { pros: [], cons: [], status: 'considering' };
    } else if (selectedType === 'feature') {
      defaultMeta = { priority: 'medium', status: 'planned', acceptance_criteria: [] };
    } else if (selectedType === 'risk') {
      defaultMeta = { probability: 'medium', impact: 'high', status: 'open', mitigation: '' };
    } else if (selectedType === 'test') {
      defaultMeta = { expected: '', status: 'pending' };
    } else if (selectedType === 'benchmark') {
      defaultMeta = { metric_key: 'latency_ms', metric_value: 0, unit: 'ms', model: 'v1.0' };
    } else if (selectedType === 'link') {
      defaultMeta = { url: '', source: 'other' };
    } else if (selectedType === 'component') {
      defaultMeta = { tech_stack: [], responsibilities: [] };
    }

    createNode({
      type: selectedType,
      title: title.trim(),
      content: content.trim(),
      visibility,
      tags,
      meta: defaultMeta,
      project_id: activeProjectId,
    });

    setTitle('');
    setContent('');
    setTagsInput('');
    setIsCreateNodeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface-2/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Создать новый узел знания</h3>
              <p className="text-xs text-text-muted">Выберите тип и заполните базовые атрибуты</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateNodeModalOpen(false)}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-3 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Type Selector Grid */}
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
              Тип узла:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {(Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).map((t) => {
                const conf = NODE_TYPE_CONFIGS[t];
                const isSelected = selectedType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/15 shadow-glow-sm'
                        : 'border-border bg-surface-2 hover:bg-surface-3'
                    }`}
                  >
                    <span className="text-base shrink-0">{conf.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-main truncate">{conf.label}</div>
                      <div className="text-[10px] text-text-muted line-clamp-1">{conf.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Заголовок узла:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LWW синхронизация через WebSockets..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Markdown Content */}
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Описание (Markdown):
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Основной текст, спецификация или постановка задачи..."
              className="w-full font-mono bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Visibility and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Видимость:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('internal')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium ${
                    visibility === 'internal'
                      ? 'border-accent bg-accent/20 text-accent font-bold'
                      : 'border-border bg-surface-2 text-text-muted'
                  }`}
                >
                  <LockKeyhole className="w-3.5 h-3.5" />
                  <span>Internal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('shared')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium ${
                    visibility === 'shared'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                      : 'border-border bg-surface-2 text-text-muted'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Shared</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Теги (через запятую):
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="architecture, backend, websocket"
                className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateNodeModalOpen(false)}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-main text-xs font-semibold rounded-xl"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all"
            >
              Создать узел
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
