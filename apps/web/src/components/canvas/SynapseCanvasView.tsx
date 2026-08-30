import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSynapseStore } from '../../store/synapseStore';
import { SynapseCanvasNode } from './SynapseCanvasNode';
import { SynapseCanvasEdge } from './SynapseCanvasEdge';
import { NODE_TYPE_CONFIGS, RELATION_TYPE_CONFIGS } from '../../utils/constants';
import type { NodeType } from '../../types';
import { isNodeVisibleForRole, canEditContent } from '../../utils/helpers';
import { calculateHierarchicalLayout, type LayoutDirection } from '../../utils/layout';
import {
  Plus,
  Maximize2,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
} from 'lucide-react';

const nodeTypes = {
  synapseNode: SynapseCanvasNode,
};

const edgeTypes = {
  synapseEdge: SynapseCanvasEdge,
};

const CanvasInner: React.FC = () => {
  const reactFlowInstance = useReactFlow();
  const activeProjectId = useSynapseStore((s) => s.activeProjectId);
  const allNodes = useSynapseStore((s) => s.nodes);
  const allRelations = useSynapseStore((s) => s.relations);
  const presences = useSynapseStore((s) => s.presences);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const updateNodePosition = useSynapseStore((s) => s.updateNodePosition);
  const setIsCreateNodeModalOpen = useSynapseStore((s) => s.setIsCreateNodeModalOpen);
  const setIsCreateRelationModalOpen = useSynapseStore((s) => s.setIsCreateRelationModalOpen);
  const setRelationSourceNodeId = useSynapseStore((s) => s.setRelationSourceNodeId);
  const setRelationTargetNodeId = useSynapseStore((s) => s.setRelationTargetNodeId);
  const activeTypeFilter = useSynapseStore((s) => s.activeTypeFilter);
  const setActiveTypeFilter = useSynapseStore((s) => s.setActiveTypeFilter);
  const activeTagFilter = useSynapseStore((s) => s.activeTagFilter);
  const isEditable = canEditContent(currentUser.role);

  const [layoutMode, setLayoutMode] = useState<LayoutDirection>('bottom-up');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Filter nodes by project and role visibility
  const projectNodes = useMemo(() => {
    return allNodes.filter((node) => {
      if (node.project_id !== activeProjectId) return false;
      if (!isNodeVisibleForRole(node.visibility, currentUser.role)) return false;
      if (activeTypeFilter !== 'all' && node.type !== activeTypeFilter) return false;
      if (activeTagFilter && !node.tags.includes(activeTagFilter)) return false;
      return true;
    });
  }, [allNodes, activeProjectId, currentUser.role, activeTypeFilter, activeTagFilter]);

  const visibleNodeIds = useMemo(() => new Set(projectNodes.map((n) => n.id)), [projectNodes]);

  // Filter relations connecting visible nodes
  const projectRelations = useMemo(() => {
    return allRelations.filter(
      (rel) => visibleNodeIds.has(rel.from_node_id) && visibleNodeIds.has(rel.to_node_id)
    );
  }, [allRelations, visibleNodeIds]);

  // Relation count per node
  const relationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const rel of allRelations) {
      counts[rel.from_node_id] = (counts[rel.from_node_id] || 0) + 1;
      counts[rel.to_node_id] = (counts[rel.to_node_id] || 0) + 1;
    }
    return counts;
  }, [allRelations]);

  // Sync projectNodes to React Flow local nodes state
  useEffect(() => {
    setNodes(
      projectNodes.map((n) => ({
        id: n.id,
        type: 'synapseNode',
        position: { x: n.canvas_x || 100, y: n.canvas_y || 100 },
        data: {
          node: n,
          presences: presences,
          relationCount: relationCounts[n.id] || 0,
        },
      }))
    );
  }, [projectNodes, presences, relationCounts, setNodes]);

  // Sync projectRelations to React Flow local edges state with smart clean handle routing
  useEffect(() => {
    const nodePositionMap = new Map(
      projectNodes.map((n) => [n.id, { x: n.canvas_x || 0, y: n.canvas_y || 0 }])
    );

    setEdges(
      projectRelations.map((r) => {
        const relConfig = RELATION_TYPE_CONFIGS[r.type] || RELATION_TYPE_CONFIGS.related;
        const sourcePos = nodePositionMap.get(r.from_node_id);
        const targetPos = nodePositionMap.get(r.to_node_id);

        let sourceHandle = 'top-source';
        let targetHandle = 'bottom-target';

        if (sourcePos && targetPos) {
          const dy = targetPos.y - sourcePos.y;
          const dx = targetPos.x - sourcePos.x;

          if (Math.abs(dy) >= Math.abs(dx)) {
            // Primarily vertical
            if (dy < 0) {
              // Target is ABOVE Source (e.g. Problem at bottom -> Solution above)
              sourceHandle = 'top-source';
              targetHandle = 'bottom-target';
            } else {
              // Target is BELOW Source
              sourceHandle = 'bottom-source';
              targetHandle = 'top-target';
            }
          } else {
            // Primarily horizontal
            if (dx > 0) {
              sourceHandle = 'right-source';
              targetHandle = 'left-target';
            } else {
              sourceHandle = 'left-target';
              targetHandle = 'right-source';
            }
          }
        }

        return {
          id: r.id,
          source: r.from_node_id,
          target: r.to_node_id,
          sourceHandle,
          targetHandle,
          type: 'synapseEdge',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: relConfig.color,
            width: 14,
            height: 14,
          },
          data: {
            relationId: r.id,
            relationType: r.type,
            note: r.note,
          },
        };
      })
    );
  }, [projectRelations, projectNodes, setEdges]);

  // Handle Dragging
  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      updateNodePosition(node.id, Math.round(node.position.x), Math.round(node.position.y));
    },
    [updateNodePosition]
  );

  // Handle Dragging connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isEditable) return;
      if (connection.source && connection.target && connection.source !== connection.target) {
        setRelationSourceNodeId(connection.source);
        setRelationTargetNodeId(connection.target);
        setIsCreateRelationModalOpen(true);
      }
    },
    [isEditable, setRelationSourceNodeId, setRelationTargetNodeId, setIsCreateRelationModalOpen]
  );

  // Hierarchical DAG Auto-Layout Execution (Pyramid Layout)
  const applyLayout = useCallback(
    (mode: LayoutDirection) => {
      setLayoutMode(mode);
      const computedPositions = calculateHierarchicalLayout(projectNodes, projectRelations, mode);

      computedPositions.forEach((pos, nodeId) => {
        updateNodePosition(nodeId, pos.x, pos.y);
      });

      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.18, duration: 500 });
      }, 50);
    },
    [projectNodes, projectRelations, updateNodePosition, reactFlowInstance]
  );

  return (
    <div className="relative w-full h-full bg-[#0B0B0B] overflow-hidden select-none">
      {/* Top Floating Action Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap max-w-[calc(100%-250px)]">
        {isEditable && (
          <button
            onClick={() => setIsCreateNodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Добавить узел</span>
          </button>
        )}

        {/* Layout Mode Group (Pyramid / TopDown / Pipeline) */}
        <div className="flex items-center bg-surface/90 backdrop-blur-md p-1 rounded-xl border border-border shadow-md">
          <button
            onClick={() => applyLayout('bottom-up')}
            title="Пирамида решений (Проблема внизу → Решения → ADR → Фичи вверху)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'bottom-up'
                ? 'bg-accent text-white shadow'
                : 'text-text-muted hover:text-text-main hover:bg-surface-2'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Пирамида 🔺</span>
          </button>

          <button
            onClick={() => applyLayout('top-down')}
            title="Нисходящее дерево (Проблема вверху → Решения → Фичи внизу)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'top-down'
                ? 'bg-accent text-white shadow'
                : 'text-text-muted hover:text-text-main hover:bg-surface-2'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Дерево 🔻</span>
          </button>

          <button
            onClick={() => applyLayout('left-to-right')}
            title="Конвейер (Слева направо)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'left-to-right'
                ? 'bg-accent text-white shadow'
                : 'text-text-muted hover:text-text-main hover:bg-surface-2'
            }`}
          >
            <ArrowRightCircle className="w-3.5 h-3.5" />
            <span>Пайплайн ➡️</span>
          </button>
        </div>

        <button
          onClick={() => reactFlowInstance.fitView({ padding: 0.18, duration: 400 })}
          title="Вписать граф в экран"
          className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-2 text-text-main text-xs font-medium rounded-xl border border-border transition-all hover:border-zinc-500 shadow"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Вписать</span>
        </button>

        {/* Node Type Filter Pills */}
        <div className="hidden lg:flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1 rounded-xl border border-border overflow-x-auto max-w-[480px]">
          <button
            onClick={() => setActiveTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeTypeFilter === 'all'
                ? 'bg-surface-2 text-white border border-border'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Все ({projectNodes.length})
          </button>
          {(['problem', 'solution', 'decision', 'feature', 'risk', 'benchmark'] as NodeType[]).map((t) => {
            const conf = NODE_TYPE_CONFIGS[t];
            const isActive = activeTypeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTypeFilter(isActive ? 'all' : t)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'border font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
                style={{
                  color: isActive ? conf.color : undefined,
                  backgroundColor: isActive ? conf.bgColor : undefined,
                  borderColor: isActive ? conf.borderColor : undefined,
                }}
              >
                <span>{conf.emoji}</span>
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* React Flow Core Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'synapseEdge',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#202020" gap={24} size={1.2} />
        <Controls position="bottom-left" className="!bg-surface !border-border !rounded-xl !overflow-hidden" />
        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            const nodeData = n.data as any;
            return NODE_TYPE_CONFIGS[nodeData?.node?.type as NodeType]?.color || '#6366F1';
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(11, 11, 11, 0.85)"
          className="!w-44 !h-32 !rounded-xl !border !border-border !shadow-2xl"
        />
      </ReactFlow>
    </div>
  );
};

export const SynapseCanvasView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
};
