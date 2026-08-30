import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { RELATION_TYPE_CONFIGS } from '../../utils/constants';
import type { RelationType } from '../../types';
import { useSynapseStore } from '../../store/synapseStore';
import { canEditContent } from '../../utils/helpers';
import { X } from 'lucide-react';

export interface SynapseEdgeData {
  relationId: string;
  relationType: RelationType;
  note?: string;
}

export const SynapseCanvasEdge = memo(({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as unknown as SynapseEdgeData;
  const relationType = edgeData?.relationType || 'related';
  const config = RELATION_TYPE_CONFIGS[relationType] || RELATION_TYPE_CONFIGS.related;
  const deleteRelation = useSynapseStore((s) => s.deleteRelation);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const isEditable = canEditContent(currentUser.role);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: config.color,
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group flex items-center gap-1 bg-surface-2/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-border text-[10px] font-medium text-text-main shadow-md transition-all hover:scale-105 hover:border-zinc-400"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span style={{ color: config.color }} className="font-semibold">
            {config.label}
          </span>

          {isEditable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (edgeData?.relationId) {
                  deleteRelation(edgeData.relationId);
                }
              }}
              title="Удалить связь"
              className="opacity-0 group-hover:opacity-100 ml-0.5 text-text-muted hover:text-red-400 transition-opacity p-0.5 rounded hover:bg-surface-3"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

SynapseCanvasEdge.displayName = 'SynapseCanvasEdge';
