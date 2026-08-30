import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SynapseNode, NodeRelation, RelationType } from '../../types';
import { RELATION_CONFIG } from '../../theme/tokens';

const CARD_W = 255;
const CARD_H = 130;

interface Props {
  nodes: SynapseNode[];
  relations: NodeRelation[];
  selectedNodeId: string | null;
}

export const RelationEdges: React.FC<Props> = ({ nodes, relations, selectedNodeId }) => {
  const nodeMap = new Map<string, SynapseNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <>
      {relations.map((rel) => {
        const fromNode = nodeMap.get(rel.from_node_id);
        const toNode = nodeMap.get(rel.to_node_id);
        if (!fromNode || !toNode) return null;

        const globalX1 = (fromNode.canvas_x || 0) + CARD_W / 2;
        const globalY1 = (fromNode.canvas_y || 0) + CARD_H / 2;
        const globalX2 = (toNode.canvas_x || 0) + CARD_W / 2;
        const globalY2 = (toNode.canvas_y || 0) + CARD_H / 2;

        const padding = 24;
        const minX = Math.min(globalX1, globalX2) - padding;
        const minY = Math.min(globalY1, globalY2) - padding;
        const width = Math.max(Math.abs(globalX2 - globalX1) + padding * 2, 40);
        const height = Math.max(Math.abs(globalY2 - globalY1) + padding * 2, 40);

        const x1 = globalX1 - minX;
        const y1 = globalY1 - minY;
        const x2 = globalX2 - minX;
        const y2 = globalY2 - minY;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx1 = x1 + dx * 0.4;
        const cy1 = y1;
        const cx2 = x1 + dx * 0.6;
        const cy2 = y2;

        const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
        const config = RELATION_CONFIG[rel.type as RelationType] || RELATION_CONFIG.related;
        const isHighlight =
          selectedNodeId === rel.from_node_id || selectedNodeId === rel.to_node_id;

        return (
          <View
            key={`rel-box-${rel.id}`}
            style={[
              styles.edgeBoundingBox,
              {
                left: minX,
                top: minY,
                width: width,
                height: height,
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={width} height={height}>
              {/* Highlight Glow */}
              {isHighlight && (
                <Path
                  d={pathD}
                  stroke={config.color}
                  strokeWidth="5"
                  strokeOpacity="0.25"
                  fill="none"
                />
              )}

              {/* Main Line */}
              <Path
                d={pathD}
                stroke={config.color}
                strokeWidth={isHighlight ? 2.5 : 1.6}
                strokeOpacity={isHighlight ? 1 : 0.65}
                strokeDasharray={config.dashed ? '5, 5' : undefined}
                fill="none"
              />

              {/* Source & Target Dots */}
              <Circle cx={x1} cy={y1} r="3" fill={config.color} />
              <Circle cx={x2} cy={y2} r="4" fill={config.color} />
            </Svg>
          </View>
        );
      })}

      {/* Floating Badges in global coordinate space */}
      {relations.map((rel) => {
        const fromNode = nodeMap.get(rel.from_node_id);
        const toNode = nodeMap.get(rel.to_node_id);
        if (!fromNode || !toNode) return null;

        const midX = ((fromNode.canvas_x || 0) + (toNode.canvas_x || 0)) / 2 + CARD_W / 2 - 32;
        const midY = ((fromNode.canvas_y || 0) + (toNode.canvas_y || 0)) / 2 + CARD_H / 2 - 10;
        const config = RELATION_CONFIG[rel.type as RelationType] || RELATION_CONFIG.related;

        return (
          <View
            key={`badge-${rel.id}`}
            style={[
              styles.relBadge,
              {
                left: midX,
                top: midY,
                borderColor: `${config.color}55`,
                backgroundColor: 'rgba(15, 15, 18, 0.92)',
              },
            ]}
          >
            <Text style={[styles.relBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  edgeBoundingBox: {
    position: 'absolute',
    overflow: 'visible',
  },
  relBadge: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  relBadgeText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
