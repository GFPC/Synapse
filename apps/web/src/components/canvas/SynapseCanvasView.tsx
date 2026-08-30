import React, { useMemo, useCallback, useEffect } from 'react';
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
import {
  Plus,
  Maximize2,
  Sparkles,
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

  // Sync projectRelations to React Flow local edges state
  useEffect(() => {
    setEdges(
      projectRelations.map((r) => {
        const relConfig = RELATION_TYPE_CONFIGS[r.type] || RELATION_TYPE_CONFIGS.related;
        return {
          id: r.id,
          source: r.from_node_id,
          target: r.to_node_id,
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
  }, [projectRelations, setEdges]);

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

  // Auto Layout Organizer (Arranges nodes by semantic stages)
  const handleAutoLayout = useCallback(() => {
    const stageOrder: Record<NodeType, number> = {
      problem: 0,
      solution: 1,
      decision: 2,
      feature: 3,
      component: 4,
      risk: 2,
      test: 4,
      benchmark: 5,
      note: 1,
      lesson: 0,
      link: 3,
      deployment: 5,
      log: 2,
    };

    const columns: Record<number, typeof projectNodes> = {};
    for (const node of projectNodes) {
      const col = stageOrder[node.type] || 0;
      if (!columns[col]) columns[col] = [];
      columns[col].push(node);
    }

    const columnXSpacing = 360;
    const rowYSpacing = 200;

    Object.entries(columns).forEach(([colIdx, nodesInCol]) => {
      const colNumber = parseInt(colIdx, 10);
      nodesInCol.forEach((node, rowIdx) => {
        const x = 100 + colNumber * columnXSpacing;
        const y = 80 + rowIdx * rowYSpacing;
        updateNodePosition(node.id, x, y);
      });
    });

    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [projectNodes, updateNodePosition, reactFlowInstance]);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden select-none">
      {/* Top Floating Action Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap max-w-[calc(100%-250px)]">
        {isEditable && (
          <button
            onClick={() => setIsCreateNodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Добавить узел</span>
          </button>
        )}

        <button
          onClick={handleAutoLayout}
          title="Авто-выравнивание узлов по этапам"
          className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-2 text-text-main text-xs font-medium rounded-lg border border-border transition-all hover:border-zinc-500 shadow"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Авто-раскладка</span>
        </button>

        <button
          onClick={() => reactFlowInstance.fitView({ padding: 0.2, duration: 300 })}
          title="Вписать в экран"
          className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-2 text-text-main text-xs font-medium rounded-lg border border-border transition-all hover:border-zinc-500 shadow"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Вписать</span>
        </button>

        {/* Node Type Filter Pills */}
        <div className="hidden lg:flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-border overflow-x-auto max-w-[500px]">
          <button
            onClick={() => setActiveTypeFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
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
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'synapseEdge',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2E2E2E" gap={20} size={1.2} />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            const nodeData = n.data as any;
            return NODE_TYPE_CONFIGS[nodeData?.node?.type as NodeType]?.color || '#6366F1';
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(15, 15, 15, 0.75)"
          className="!w-40 !h-28 !rounded-lg !border !border-border !shadow-2xl"
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
