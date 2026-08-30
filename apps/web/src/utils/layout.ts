import type { SynapseNode, NodeRelation, NodeType } from '../types';

export type LayoutDirection = 'bottom-up' | 'top-down' | 'left-to-right';

// Semantic hierarchy ranking
const TYPE_LAYER_RANK: Record<NodeType, number> = {
  problem: 0,
  solution: 1,
  lesson: 1,
  decision: 2,
  feature: 3,
  link: 3,
  deployment: 3,
  component: 4,
  test: 4,
  benchmark: 5,
  risk: 5,
  note: -1, // Side column
  log: -1,  // Side column
};

export function calculateHierarchicalLayout(
  nodes: SynapseNode[],
  relations: NodeRelation[],
  direction: LayoutDirection = 'bottom-up'
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  const CARD_WIDTH = 280;
  const SPACING_X = 340;
  const SPACING_Y = 190;
  const CENTER_X = 700;

  // Group nodes into layers
  const layers: Map<number, SynapseNode[]> = new Map();
  const sideNodes: SynapseNode[] = [];

  nodes.forEach((node) => {
    const rank = TYPE_LAYER_RANK[node.type] ?? 3;
    if (rank === -1) {
      sideNodes.push(node);
    } else {
      if (!layers.has(rank)) layers.set(rank, []);
      layers.get(rank)!.push(node);
    }
  });

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
  const maxLayerRank = Math.max(...sortedLayerKeys, 0);

  // Build adjacency map to optimize horizontal sorting (barycenter)
  const connectedNeighbors = new Map<string, string[]>();
  relations.forEach((rel) => {
    if (!connectedNeighbors.has(rel.from_node_id)) connectedNeighbors.set(rel.from_node_id, []);
    if (!connectedNeighbors.has(rel.to_node_id)) connectedNeighbors.set(rel.to_node_id, []);
    connectedNeighbors.get(rel.from_node_id)!.push(rel.to_node_id);
    connectedNeighbors.get(rel.to_node_id)!.push(rel.from_node_id);
  });

  let maxComputedX = CENTER_X + 200;

  // Layout each layer
  sortedLayerKeys.forEach((rank) => {
    const nodesInLayer = layers.get(rank)!;
    const totalInLayer = nodesInLayer.length;
    const layerWidth = (totalInLayer - 1) * SPACING_X;
    const startX = CENTER_X - layerWidth / 2;

    // Calculate Y coordinate based on direction
    let layerY = 0;
    if (direction === 'bottom-up') {
      // Problem at bottom, Benchmarks/Risks at top
      layerY = (maxLayerRank - rank) * SPACING_Y + 60;
    } else if (direction === 'top-down') {
      // Problem at top, Benchmarks at bottom
      layerY = rank * SPACING_Y + 60;
    } else {
      // Left-to-right
      layerY = rank * SPACING_X + 60;
    }

    // Sort nodes in layer by connected parent average positions if available
    const sortedNodes = [...nodesInLayer].sort((a, b) => {
      const aNeighbors = connectedNeighbors.get(a.id) || [];
      const bNeighbors = connectedNeighbors.get(b.id) || [];

      const getAvgX = (neighborIds: string[]) => {
        const placed = neighborIds.map((id) => positions.get(id)).filter(Boolean);
        if (placed.length === 0) return 0;
        return placed.reduce((sum, p) => sum + p!.x, 0) / placed.length;
      };

      const aAvg = getAvgX(aNeighbors);
      const bAvg = getAvgX(bNeighbors);
      return aAvg - bAvg;
    });

    sortedNodes.forEach((node, idx) => {
      let x = startX + idx * SPACING_X;
      let y = layerY;

      if (direction === 'left-to-right') {
        x = rank * SPACING_Y + 80;
        y = CENTER_X - layerWidth / 2 + idx * SPACING_X;
      }

      positions.set(node.id, { x: Math.round(x), y: Math.round(y) });
      if (x + CARD_WIDTH > maxComputedX) {
        maxComputedX = x + CARD_WIDTH;
      }
    });
  });

  // Place Side Column nodes (notes, logs) cleanly on the right side
  if (sideNodes.length > 0) {
    const sideX = Math.max(maxComputedX + 80, CENTER_X + 650);
    const startY = direction === 'bottom-up' ? (maxLayerRank * SPACING_Y) / 2 : 120;

    sideNodes.forEach((node, idx) => {
      const y = startY + idx * (SPACING_Y - 20);
      positions.set(node.id, { x: Math.round(sideX), y: Math.round(y) });
    });
  }

  return positions;
}
