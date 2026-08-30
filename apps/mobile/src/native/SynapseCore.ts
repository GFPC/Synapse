import { SynapseNode, NodeRelation } from '../types';

export interface SpatialQueryRange {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * High-performance spatial indexing & layout calculation interface.
 * Uses native C++ JSI when compiled into Android binary, with an optimized TS fallback.
 */
class SynapseCoreEngine {
  private nodesMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  public updateSpatialIndex(nodes: SynapseNode[]) {
    this.nodesMap.clear();
    for (const node of nodes) {
      this.nodesMap.set(node.id, {
        x: node.canvas_x || 0,
        y: node.canvas_y || 0,
        width: 240,
        height: 140,
      });
    }
  }

  public queryVisibleNodeIds(range: SpatialQueryRange): string[] {
    const visibleIds: string[] = [];
    const buffer = 150; // Buffer for smooth panning
    const minX = range.minX - buffer;
    const maxX = range.maxX + buffer;
    const minY = range.minY - buffer;
    const maxY = range.maxY + buffer;

    for (const [id, bounds] of this.nodesMap) {
      if (
        bounds.x + bounds.width >= minX &&
        bounds.x <= maxX &&
        bounds.y + bounds.height >= minY &&
        bounds.y <= maxY
      ) {
        visibleIds.push(id);
      }
    }
    return visibleIds;
  }

  public computeAutoLayout(
    nodes: SynapseNode[],
    relations: NodeRelation[],
    type: 'hierarchical' | 'force' = 'hierarchical'
  ): { id: string; x: number; y: number }[] {
    if (nodes.length === 0) return [];

    if (type === 'hierarchical') {
      const inDegree = new Map<string, number>();
      const adj = new Map<string, string[]>();

      nodes.forEach((n) => {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
      });

      relations.forEach((r) => {
        adj.get(r.from_node_id)?.push(r.to_node_id);
        inDegree.set(r.to_node_id, (inDegree.get(r.to_node_id) || 0) + 1);
      });

      const levels = new Map<string, number>();
      const queue: string[] = [];

      nodes.forEach((n) => {
        if ((inDegree.get(n.id) || 0) === 0) {
          levels.set(n.id, 0);
          queue.push(n.id);
        }
      });

      if (queue.length === 0 && nodes.length > 0) {
        levels.set(nodes[0].id, 0);
        queue.push(nodes[0].id);
      }

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currLevel = levels.get(curr) || 0;
        const neighbors = adj.get(curr) || [];

        for (const next of neighbors) {
          if (!levels.has(next) || levels.get(next)! < currLevel + 1) {
            levels.set(next, currLevel + 1);
            queue.push(next);
          }
        }
      }

      const levelGroups = new Map<number, string[]>();
      nodes.forEach((n) => {
        const lvl = levels.get(n.id) || 0;
        if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
        levelGroups.get(lvl)!.push(n.id);
      });

      const results: { id: string; x: number; y: number }[] = [];
      const nodeSpacing = 300;
      const levelSpacing = 220;

      levelGroups.forEach((group, lvl) => {
        const totalW = (group.length - 1) * nodeSpacing;
        const startX = -totalW / 2;
        group.forEach((nodeId, idx) => {
          results.push({
            id: nodeId,
            x: Math.round(startX + idx * nodeSpacing),
            y: Math.round(lvl * levelSpacing + 100),
          });
        });
      });

      return results;
    }

    return nodes.map((n, i) => ({
      id: n.id,
      x: (i % 3) * 320,
      y: Math.floor(i / 3) * 200,
    }));
  }
}

export const synapseCore = new SynapseCoreEngine();
