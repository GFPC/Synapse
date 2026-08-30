import React, { useState } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import { RELATION_TYPE_CONFIGS, NODE_TYPE_CONFIGS } from '../../utils/constants';
import type { RelationType } from '../../types';
import { X, Link2 } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export const CreateRelationModal: React.FC = () => {
  const isCreateRelationModalOpen = useSynapseStore((s) => s.isCreateRelationModalOpen);
  const setIsCreateRelationModalOpen = useSynapseStore((s) => s.setIsCreateRelationModalOpen);
  const relationSourceNodeId = useSynapseStore((s) => s.relationSourceNodeId);
  const relationTargetNodeId = useSynapseStore((s) => s.relationTargetNodeId);
  const setRelationSourceNodeId = useSynapseStore((s) => s.setRelationSourceNodeId);
  const setRelationTargetNodeId = useSynapseStore((s) => s.setRelationTargetNodeId);
  const createRelation = useSynapseStore((s) => s.createRelation);
  const allNodes = useSynapseStore((s) => s.nodes);
  const activeProjectId = useSynapseStore((s) => s.activeProjectId);

  const [selectedType, setSelectedType] = useState<RelationType>('implements');
  const [note, setNote] = useState('');
  const [sourceId, setSourceId] = useState(relationSourceNodeId || '');
  const [targetId, setTargetId] = useState(relationTargetNodeId || '');

  // Keep synced with store preset values
  React.useEffect(() => {
    if (relationSourceNodeId) setSourceId(relationSourceNodeId);
    if (relationTargetNodeId) setTargetId(relationTargetNodeId);
  }, [relationSourceNodeId, relationTargetNodeId]);

  if (!isCreateRelationModalOpen) return null;

  const projectNodes = allNodes.filter((n) => n.project_id === activeProjectId);
  const sourceNode = projectNodes.find((n) => n.id === sourceId);
  const targetNode = projectNodes.find((n) => n.id === targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;

    createRelation({
      from_node_id: sourceId,
      to_node_id: targetId,
      type: selectedType,
      note: note.trim() || undefined,
    });

    setNote('');
    setRelationSourceNodeId(null);
    setRelationTargetNodeId(null);
    setIsCreateRelationModalOpen(false);
  };

  const sourceOptions = projectNodes.map((n) => ({
    value: n.id,
    label: `[${n.display_id}] ${n.title}`,
    icon: <span>{NODE_TYPE_CONFIGS[n.type]?.emoji || '📄'}</span>,
  }));

  const targetOptions = projectNodes
    .filter((n) => n.id !== sourceId)
    .map((n) => ({
      value: n.id,
      label: `[${n.display_id}] ${n.title}`,
      icon: <span>{NODE_TYPE_CONFIGS[n.type]?.emoji || '📄'}</span>,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface-2/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Создать семантическую связь</h3>
              <p className="text-xs text-text-muted">Свяжите два узла типизированным отношением</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateRelationModalOpen(false)}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-3 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Node Selectors (From -> To) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-2 p-3.5 rounded-xl border border-border">
            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                От узла (Source):
              </label>
              <CustomSelect
                value={sourceId}
                onChange={(val) => setSourceId(val)}
                placeholder="-- Выберите узел --"
                options={sourceOptions}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                К узлу (Target):
              </label>
              <CustomSelect
                value={targetId}
                onChange={(val) => setTargetId(val)}
                placeholder="-- Выберите узел --"
                options={targetOptions}
              />
            </div>
          </div>

          {/* Relation Type Picker */}
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
              Тип семантической связи:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {(Object.keys(RELATION_TYPE_CONFIGS) as RelationType[]).map((rt) => {
                const conf = RELATION_TYPE_CONFIGS[rt];
                const isSelected = selectedType === rt;
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setSelectedType(rt)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/15 shadow-glow-sm'
                        : 'border-border bg-surface-2 hover:bg-surface-3'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          color: conf.color,
                          backgroundColor: `${conf.color}15`,
                          borderColor: `${conf.color}40`,
                        }}
                      >
                        {conf.label}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">{conf.example}</span>
                    </div>
                    <p className="text-[11px] text-text-muted line-clamp-1">{conf.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Примечание (почему существует эта связь):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Модуль Canvas реализует спецификацию ADR-001..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Preview Diagram */}
          {sourceNode && targetNode && (
            <div className="p-3 bg-surface-2/60 border border-border rounded-xl flex items-center justify-between text-xs text-text-main gap-2">
              <span className="font-semibold truncate">[{sourceNode.display_id}] {sourceNode.title}</span>
              <div className="flex items-center gap-1 shrink-0 text-accent font-bold">
                <span>— {RELATION_TYPE_CONFIGS[selectedType]?.label} →</span>
              </div>
              <span className="font-semibold truncate">[{targetNode.display_id}] {targetNode.title}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateRelationModalOpen(false)}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-main text-xs font-semibold rounded-xl"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!sourceId || !targetId || sourceId === targetId}
              className="px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all"
            >
              Создать связь
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
