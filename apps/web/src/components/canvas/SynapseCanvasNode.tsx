import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { SynapseNode, UserPresence } from '../../types';
import { NODE_TYPE_CONFIGS } from '../../utils/constants';
import { useSynapseStore } from '../../store/synapseStore';
import { Lock, Eye, CheckCircle, Clock } from 'lucide-react';

export interface SynapseNodeData {
  node: SynapseNode;
  presences: UserPresence[];
  relationCount: number;
}

export const SynapseCanvasNode = memo(({ data, selected }: NodeProps) => {
  const { node, presences, relationCount } = data as unknown as SynapseNodeData;
  const setSelectedNodeId = useSynapseStore((s) => s.setSelectedNodeId);
  const config = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.note;
  const meta = (node.meta || {}) as any;

  // Check if someone is currently active on this node
  const activeEditor = presences?.find((p) => p.current_node_id === node.id && p.is_editing);
  const activeViewer = presences?.find((p) => p.current_node_id === node.id && !p.is_editing);

  return (
    <div
      onClick={() => setSelectedNodeId(node.id)}
      className={`relative group rounded-xl bg-surface border transition-all duration-200 cursor-pointer shadow-card select-none min-w-[240px] max-w-[320px] ${
        selected
          ? 'ring-2 ring-accent shadow-glow-sm'
          : 'hover:border-zinc-500 hover:shadow-lg'
      }`}
      style={{
        borderLeftColor: config.color,
        borderLeftWidth: '4px',
        borderColor: selected ? '#6366F1' : '#2E2E2E',
      }}
    >
      {/* Handles for dragging connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-accent !border-2 !border-surface hover:!scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-accent !border-2 !border-surface hover:!scale-125"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-accent !border-2 !border-surface hover:!scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-accent !border-2 !border-surface hover:!scale-125"
      />

      {/* Active Editor / Soft Lock Alert Banner */}
      {activeEditor && (
        <div className="absolute -top-3 left-2 right-2 bg-amber-500/90 text-black text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
          <Lock className="w-3 h-3" />
          <span className="truncate">{activeEditor.name} редактирует...</span>
        </div>
      )}

      {/* Active Viewer Badge */}
      {!activeEditor && activeViewer && (
        <div className="absolute -top-3 right-2 bg-indigo-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
          <Eye className="w-2.5 h-2.5" />
          <span>{activeViewer.name}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-3 pb-2 flex items-center justify-between border-b border-border/50 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none">{config.emoji}</span>
          <span
            className="text-[11px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border"
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              borderColor: `${config.color}30`,
            }}
          >
            {config.label}
          </span>
        </div>

        <span className="text-xs font-mono font-bold text-text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-border">
          {node.display_id}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3 pt-2.5">
        <h4 className="text-sm font-semibold text-text-main line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
          {node.title}
        </h4>

        {/* Dynamic type snippet preview */}
        {node.type === 'feature' && meta && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
            <span
              className={`px-1.5 py-0.2 rounded font-medium ${
                meta.priority === 'critical'
                  ? 'text-red-400 bg-red-950/40'
                  : meta.priority === 'high'
                  ? 'text-amber-400 bg-amber-950/40'
                  : 'text-blue-400 bg-blue-950/40'
              }`}
            >
              {meta.priority?.toUpperCase() || 'MEDIUM'}
            </span>
            {meta.acceptance_criteria && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                {meta.acceptance_criteria.filter((c: any) => c.done).length}/
                {meta.acceptance_criteria.length}
              </span>
            )}
          </div>
        )}

        {node.type === 'benchmark' && meta?.metric_value !== undefined && (
          <div className="mt-2 flex items-center justify-between text-[11px] bg-cyan-950/30 border border-cyan-800/40 rounded px-2 py-1">
            <span className="text-cyan-300 font-mono">{meta.metric_key}</span>
            <span className="text-cyan-400 font-bold font-mono">
              {meta.metric_value} {meta.unit}
            </span>
          </div>
        )}

        {node.type === 'test' && meta?.status && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span
              className={`px-1.5 py-0.5 rounded font-semibold ${
                meta.status === 'pass'
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                  : meta.status === 'fail'
                  ? 'text-red-400 bg-red-950/40 border border-red-800/40'
                  : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
              }`}
            >
              {meta.status === 'pass' ? '✅ PASS' : meta.status === 'fail' ? '❌ FAIL' : '⏳ PENDING'}
            </span>
            {meta.tested_at && (
              <span className="text-text-muted text-[10px] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {meta.tested_at}
              </span>
            )}
          </div>
        )}

        {/* Tags and Relations Counter Footer */}
        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-1 overflow-hidden">
            {node.tags.slice(0, 2).map((t) => (
              <span key={t} className="bg-surface-2 px-1.5 py-0.5 rounded text-[10px] border border-border/50 truncate max-w-[70px]">
                #{t}
              </span>
            ))}
            {node.tags.length > 2 && (
              <span className="text-[10px] text-text-muted">+{node.tags.length - 2}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {node.visibility === 'shared' && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/30 px-1 py-0.5 rounded border border-emerald-800/30">
                Shared
              </span>
            )}
            <span className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded border border-border/60">
              🔗 {relationCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

SynapseCanvasNode.displayName = 'SynapseCanvasNode';
