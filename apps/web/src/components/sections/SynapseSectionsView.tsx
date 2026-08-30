import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSynapseStore } from '../../store/synapseStore';
import { NODE_TYPE_CONFIGS, RELATION_TYPE_CONFIGS } from '../../utils/constants';
import type { NodeType, SynapseNode } from '../../types';
import { isNodeVisibleForRole, canEditContent, formatRelativeTime } from '../../utils/helpers';
import {
  Search,
  Plus,
  GitBranch,
  Layers,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface TreeNode {
  id: string;
  parentId?: string;
  type: 'root' | 'category' | 'node' | 'relation';
  nodeType?: NodeType;
  label: string;
  subLabel?: string;
  emoji?: string;
  color?: string;
  displayId?: string;
  rawNode?: SynapseNode;
  childrenCount: number;
  expanded: boolean;
  x: number;
  y: number;
}

export const SynapseSectionsView: React.FC = () => {
  const activeProjectId = useSynapseStore((s) => s.activeProjectId);
  const projects = useSynapseStore((s) => s.projects);
  const allNodes = useSynapseStore((s) => s.nodes);
  const allRelations = useSynapseStore((s) => s.relations);
  const currentUser = useSynapseStore((s) => s.currentUser);
  const setSelectedNodeId = useSynapseStore((s) => s.setSelectedNodeId);
  const setIsCreateNodeModalOpen = useSynapseStore((s) => s.setIsCreateNodeModalOpen);
  const isEditable = canEditContent(currentUser.role);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const [viewStyle, setViewStyle] = useState<'tree' | 'cards'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    problem: true,
    solution: true,
    decision: true,
    feature: true,
  });
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Pan & Zoom State for the SVG Canvas
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 150 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter nodes by project and role
  const projectNodes = useMemo(() => {
    return allNodes.filter((node) => {
      if (node.project_id !== activeProjectId) return false;
      if (!isNodeVisibleForRole(node.visibility, currentUser.role)) return false;
      return true;
    });
  }, [allNodes, activeProjectId, currentUser.role]);

  // Group nodes by type
  const groupedNodes = useMemo(() => {
    const groups: Partial<Record<NodeType, SynapseNode[]>> = {};
    for (const type of Object.keys(NODE_TYPE_CONFIGS) as NodeType[]) {
      groups[type] = [];
    }
    for (const node of projectNodes) {
      if (!groups[node.type]) groups[node.type] = [];
      groups[node.type]!.push(node);
    }
    return groups;
  }, [projectNodes]);

  // Auto-expand categories if search query is active
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const newExpandedCats: Record<string, boolean> = {};
      const newExpandedNodes: Record<string, boolean> = {};

      projectNodes.forEach((node) => {
        const match =
          node.title.toLowerCase().includes(q) ||
          node.display_id.toLowerCase().includes(q) ||
          node.tags.some((t) => t.toLowerCase().includes(q));
        if (match) {
          newExpandedCats[node.type] = true;
          newExpandedNodes[node.id] = true;
        }
      });
      setExpandedCategories((prev) => ({ ...prev, ...newExpandedCats }));
      setExpandedNodes((prev) => ({ ...prev, ...newExpandedNodes }));
    }
  }, [searchQuery, projectNodes]);

  const toggleCategory = (catType: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catType]: !prev[catType] }));
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    const allCats: Record<string, boolean> = {};
    (Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).forEach((t) => {
      allCats[t] = true;
    });
    setExpandedCategories(allCats);
  };

  const collapseAll = () => {
    setExpandedCategories({});
    setExpandedNodes({});
  };

  const resetView = () => {
    setPan({ x: 80, y: 150 });
    setZoom(1);
  };

  // Build Hierarchical Layout Coordinates (D3 / OSINT Framework style)
  const treeData = useMemo(() => {
    const rootNode: TreeNode = {
      id: 'root',
      type: 'root',
      label: activeProject?.name || 'Synapse Project',
      subLabel: `${projectNodes.length} узлов знания`,
      emoji: '🧠',
      childrenCount: projectNodes.length,
      expanded: true,
      x: 180,
      y: 0, // will compute center
    };

    const categoryTypes = Object.keys(NODE_TYPE_CONFIGS) as NodeType[];
    const categoryNodes: TreeNode[] = [];
    const itemNodes: TreeNode[] = [];
    const relationNodes: TreeNode[] = [];

    let currentY = 40;
    const CATEGORY_Y_GAP = 36;
    const NODE_Y_GAP = 30;

    categoryTypes.forEach((catType) => {
      const config = NODE_TYPE_CONFIGS[catType];
      const nodesInCat = groupedNodes[catType] || [];
      const isExpanded = !!expandedCategories[catType];

      // Filter nodes in category if search active
      const filteredNodes = nodesInCat.filter((n) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.display_id.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      });

      const catNode: TreeNode = {
        id: `cat-${catType}`,
        parentId: 'root',
        type: 'category',
        nodeType: catType,
        label: config.label,
        subLabel: `${nodesInCat.length}`,
        emoji: config.emoji,
        color: config.color,
        childrenCount: nodesInCat.length,
        expanded: isExpanded,
        x: 480,
        y: currentY,
      };
      categoryNodes.push(catNode);

      if (isExpanded && filteredNodes.length > 0) {
        let childStartY = currentY - ((filteredNodes.length - 1) * NODE_Y_GAP) / 2;
        // Keep child coordinates monotonic
        if (childStartY < currentY - 10) childStartY = currentY - 10;

        filteredNodes.forEach((node, nodeIdx) => {
          const nodeY = currentY + (nodeIdx - (filteredNodes.length - 1) / 2) * NODE_Y_GAP;
          const isNodeExpanded = !!expandedNodes[node.id];

          // Outbound & Inbound relations of this node
          const nodeRels = allRelations.filter(
            (r) => r.from_node_id === node.id || r.to_node_id === node.id
          );

          const treeItemNode: TreeNode = {
            id: node.id,
            parentId: `cat-${catType}`,
            type: 'node',
            nodeType: node.type,
            label: node.title,
            displayId: node.display_id,
            color: config.color,
            rawNode: node,
            childrenCount: nodeRels.length,
            expanded: isNodeExpanded,
            x: 840,
            y: nodeY,
          };
          itemNodes.push(treeItemNode);

          // Render Relations as Level 3 branches if node is expanded!
          if (isNodeExpanded && nodeRels.length > 0) {
            nodeRels.forEach((rel, relIdx) => {
              const otherNodeId = rel.from_node_id === node.id ? rel.to_node_id : rel.from_node_id;
              const otherNode = allNodes.find((n) => n.id === otherNodeId);
              const relConf = RELATION_TYPE_CONFIGS[rel.type] || RELATION_TYPE_CONFIGS.related;
              const relY = nodeY + (relIdx - (nodeRels.length - 1) / 2) * 26;

              relationNodes.push({
                id: `rel-${rel.id}-${node.id}`,
                parentId: node.id,
                type: 'relation',
                label: otherNode ? `[${otherNode.display_id}] ${otherNode.title}` : 'Удаленный узел',
                subLabel: relConf.label,
                color: relConf.color,
                childrenCount: 0,
                expanded: false,
                rawNode: otherNode,
                x: 1220,
                y: relY,
              });
            });
          }
        });

        const addedSpace = Math.max(CATEGORY_Y_GAP, filteredNodes.length * NODE_Y_GAP + 15);
        currentY += addedSpace;
      } else {
        currentY += CATEGORY_Y_GAP;
      }
    });

    // Compute root center Y
    rootNode.y = currentY / 2;

    return {
      root: rootNode,
      categories: categoryNodes,
      nodes: itemNodes,
      relations: relationNodes,
      totalHeight: Math.max(currentY + 100, 800),
    };
  }, [
    activeProject,
    projectNodes,
    groupedNodes,
    expandedCategories,
    expandedNodes,
    allRelations,
    allNodes,
    searchQuery,
  ]);

  // Pan & Zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'tree-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.12;
    const direction = e.deltaY < 0 ? 1 : -1;
    const targetZoom = direction > 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const newZoom = Math.min(Math.max(targetZoom, 0.25), 3.0);

    if (newZoom === zoom) return;

    // Convert mouse screen position to world coordinate under cursor
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Compute new pan so that world coordinate remains under mouse cursor
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setPan({ x: newPanX, y: newPanY });
    setZoom(newZoom);
  };

  // Helper to generate bezier curves (just like in the OSINT Framework screenshot)
  const renderCurvedLink = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string = '#4A4A4A',
    highlight: boolean = false
  ) => {
    const midX = (fromX + toX) / 2;
    const pathData = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
    return (
      <path
        key={`${fromX}-${fromY}-${toX}-${toY}`}
        d={pathData}
        fill="none"
        stroke={highlight ? '#6366F1' : color}
        strokeWidth={highlight ? 2 : 1.25}
        strokeOpacity={highlight ? 0.9 : 0.45}
        className="transition-all duration-300 pointer-events-none"
      />
    );
  };

  return (
    <div className="relative w-full h-full bg-[#0F0F0F] select-none overflow-hidden flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left Actions */}
        <div className="flex items-center gap-2 pointer-events-auto bg-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-2xl">
          {/* View Switcher: Tree vs Cards */}
          <div className="flex items-center bg-surface-2 rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setViewStyle('tree')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewStyle === 'tree'
                  ? 'bg-surface text-accent shadow'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Дерево знаний (Tree 🌳)</span>
            </button>
            <button
              onClick={() => setViewStyle('cards')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewStyle === 'cards'
                  ? 'bg-surface text-accent shadow'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Карточки (Cards 📄)</span>
            </button>
          </div>

          {viewStyle === 'tree' && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <button
                onClick={expandAll}
                className="px-2.5 py-1 text-xs text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors font-medium"
                title="Развернуть все категории"
              >
                Развернуть всё
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 text-xs text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors font-medium"
                title="Свернуть все"
              >
                Свернуть всё
              </button>
              <button
                onClick={resetView}
                className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors"
                title="Сбросить масштаб и положение"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Right Search Input (OSINT Framework style search bar) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative w-64 sm:w-80 shadow-2xl">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, nodes, tags..."
              className="w-full bg-surface-2/95 backdrop-blur-xl border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent shadow-inner"
            />
          </div>

          {isEditable && (
            <button
              onClick={() => setIsCreateNodeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all pointer-events-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Создать узел</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: OSINT FRAMEWORK COLLAPSIBLE TREE (Default) */}
      {viewStyle === 'tree' ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`flex-1 w-full h-full relative overflow-hidden ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Interactive Scalable SVG Canvas */}
          <svg
            id="tree-bg"
            className="w-full h-full block"
            style={{
              backgroundColor: '#0F0F0F',
            }}
          >
            <g
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              className="transition-transform duration-75 ease-out"
            >
              {/* 1. Curved Connections from Root to Categories */}
              {treeData.categories.map((cat) =>
                renderCurvedLink(
                  treeData.root.x,
                  treeData.root.y,
                  cat.x,
                  cat.y,
                  cat.color,
                  !!expandedCategories[cat.nodeType!]
                )
              )}

              {/* 2. Curved Connections from Categories to Nodes */}
              {treeData.nodes.map((node) => {
                const parentCat = treeData.categories.find((c) => c.id === node.parentId);
                if (!parentCat) return null;
                return renderCurvedLink(parentCat.x, parentCat.y, node.x, node.y, parentCat.color, false);
              })}

              {/* 3. Curved Connections from Nodes to Relations (Level 3) */}
              {treeData.relations.map((rel) => {
                const parentNode = treeData.nodes.find((n) => n.id === rel.parentId);
                if (!parentNode) return null;
                return renderCurvedLink(parentNode.x, parentNode.y, rel.x, rel.y, rel.color, false);
              })}

              {/* 4. Render Root Node */}
              <g
                transform={`translate(${treeData.root.x}, ${treeData.root.y})`}
                className="cursor-pointer group"
              >
                <circle
                  r={8}
                  className="fill-[#1A1A1A] stroke-accent stroke-[3] transition-all group-hover:scale-125"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.7))' }}
                />
                <text
                  x={-16}
                  y={4}
                  textAnchor="end"
                  className="fill-[#F5F5F5] text-[13px] font-extrabold tracking-wide font-sans select-none pointer-events-none"
                >
                  {treeData.root.label}
                </text>
              </g>

              {/* 5. Render Category Nodes (Level 1) */}
              {treeData.categories.map((cat) => {
                const isExpanded = cat.expanded;
                const hasChildren = cat.childrenCount > 0;
                const isCatColor = cat.color || '#3B82F6';

                return (
                  <g
                    key={cat.id}
                    transform={`translate(${cat.x}, ${cat.y})`}
                    onClick={() => toggleCategory(cat.nodeType!)}
                    className="cursor-pointer group select-none"
                  >
                    {/* Category Node Circle with Glowing Ring (OSINT style) */}
                    <circle
                      r={7}
                      className="fill-[#1A1A1A] transition-all duration-200 group-hover:scale-125"
                      style={{
                        stroke: isCatColor,
                        strokeWidth: 2.5,
                        filter: isExpanded
                          ? `drop-shadow(0 0 7px ${isCatColor}90)`
                          : `drop-shadow(0 0 3px ${isCatColor}40)`,
                      }}
                    />

                    {/* Inner Dot if expanded or has children */}
                    {hasChildren && (
                      <circle
                        r={2.5}
                        fill={isExpanded ? isCatColor : '#888888'}
                        className="transition-all"
                      />
                    )}

                    {/* Text Label on the Left */}
                    <text
                      x={-14}
                      y={4}
                      textAnchor="end"
                      className={`text-xs font-semibold font-sans transition-colors ${
                        isExpanded
                          ? 'fill-[#F5F5F5] font-bold'
                          : 'fill-[#BBBBBB] group-hover:fill-white'
                      }`}
                    >
                      {cat.label} ({cat.childrenCount})
                    </text>
                  </g>
                );
              })}

              {/* 6. Render Node Items (Level 2) */}
              {treeData.nodes.map((node) => {
                const isNodeExpanded = node.expanded;
                const hasRels = node.childrenCount > 0;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer group select-none"
                  >
                    {/* Node Circle */}
                    <circle
                      r={6}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasRels) toggleNode(node.id);
                        else setSelectedNodeId(node.id);
                      }}
                      className="fill-[#1A1A1A] transition-all duration-200 group-hover:scale-125"
                      style={{
                        stroke: '#38BDF8', // Cyan/Sky ring like in OSINT screenshot
                        strokeWidth: 2,
                        filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))',
                      }}
                    />

                    {hasRels && (
                      <circle
                        r={2}
                        fill={isNodeExpanded ? '#38BDF8' : '#888888'}
                        className="transition-all"
                      />
                    )}

                    {/* Node Label on the Right (Click opens Detail Drawer!) */}
                    <text
                      x={14}
                      y={4}
                      textAnchor="start"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      className="text-[12px] font-medium fill-[#DDDDDD] group-hover:fill-white group-hover:underline transition-colors font-sans"
                    >
                      <tspan fill="#888888" className="font-mono font-bold mr-1">
                        [{node.displayId}]
                      </tspan>{' '}
                      {node.label}
                    </text>
                  </g>
                );
              })}

              {/* 7. Render Connected Relations (Level 3) */}
              {treeData.relations.map((rel) => {
                return (
                  <g
                    key={rel.id}
                    transform={`translate(${rel.x}, ${rel.y})`}
                    onClick={() => {
                      if (rel.rawNode) setSelectedNodeId(rel.rawNode.id);
                    }}
                    className="cursor-pointer group select-none"
                  >
                    <circle
                      r={4.5}
                      className="fill-[#1A1A1A] stroke-indigo-400 stroke-[1.5] transition-transform group-hover:scale-125"
                    />
                    <text
                      x={12}
                      y={3.5}
                      textAnchor="start"
                      className="text-[11px] font-normal fill-[#AAAAAA] group-hover:fill-white font-sans"
                    >
                      <tspan fill={rel.color} className="font-semibold mr-1">
                        {rel.subLabel} →
                      </tspan>{' '}
                      {rel.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Bottom Zoom & Help Indicator */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 text-[11px] text-text-muted bg-surface-2/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border">
            <span>Масштаб: {Math.round(zoom * 100)}%</span>
            <span>•</span>
            <span>Колесико — Зум, Перетаскивание — Панорамирование</span>
          </div>
        </div>
      ) : (
        /* VIEW 2: TRADITIONAL CARDS GRID VIEW */
        <div className="flex-1 w-full h-full overflow-y-auto p-6 pt-20">
          <div className="max-w-6xl mx-auto space-y-6 pb-16">
            {(Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).map((type) => {
              const config = NODE_TYPE_CONFIGS[type];
              const nodesInType = groupedNodes[type] || [];
              const isCollapsed = !expandedCategories[type];

              return (
                <div
                  key={type}
                  className="rounded-xl border border-border bg-surface/50 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => toggleCategory(type)}
                    className="w-full flex items-center justify-between p-3.5 bg-surface-2/70 hover:bg-surface-2 transition-colors border-b border-border/50 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shadow-inner"
                        style={{ backgroundColor: config.bgColor, color: config.color }}
                      >
                        {config.emoji}
                      </div>
                      <span className="font-semibold text-sm text-text-main">{config.label}</span>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded-full font-bold bg-surface border border-border text-text-muted">
                        {nodesInType.length}
                      </span>
                    </div>
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                  </button>

                  {!isCollapsed && (
                    <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {nodesInType.map((node) => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className="bg-surface-2 hover:bg-surface-3 border border-border hover:border-zinc-500 rounded-xl p-3.5 cursor-pointer transition-all shadow"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold text-text-muted">
                              {node.display_id}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {formatRelativeTime(node.updated_at)}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-text-main line-clamp-2">
                            {node.title}
                          </h4>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
