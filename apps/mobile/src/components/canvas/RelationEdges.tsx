import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, Marker, Circle } from 'react-native-svg';
import { SynapseNode, NodeRelation, RelationType } from '../../types';
import { RELATION_CONFIG } from '../../theme/tokens';

const CARD_WIDTH = 255;
const CARD_HEIGHT = 140;

interface Props {
  nodes: SynapseNode[];
  relations: NodeRelation[];
  selectedNodeId: string | null;
}

export const RelationEdges: React.FC<Props> = ({ nodes, relations, selectedNodeId }) => {
  const nodeMap = new Map<string, SynapseNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFillObject}>
        <Defs>
          {Object.entries(RELATION_CONFIG).map(([type, config]) => (
            <Marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <Path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={config.color} />
            </Marker>
          ))}
        </Defs>

        {relations.map((rel) => {
          const fromNode = nodeMap.get(rel.from_node_id);
          const toNode = nodeMap.get(rel.to_node_id);
          if (!fromNode || !toNode) return null;

          const x1 = (fromNode.canvas_x || 0) + CARD_WIDTH / 2;
          const y1 = (fromNode.canvas_y || 0) + CARD_HEIGHT / 2;
          const x2 = (toNode.canvas_x || 0) + CARD_WIDTH / 2;
          const y2 = (toNode.canvas_y || 0) + CARD_HEIGHT / 2;

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
            <React.Fragment key={rel.id}>
              {/* Outer Glow Path */}
              {isHighlight && (
                <Path
                  d={pathD}
                  stroke={config.color}
                  strokeWidth="6"
                  strokeOpacity="0.3"
                  fill="none"
                />
              )}

              {/* Main Line */}
              <Path
                d={pathD}
                stroke={config.color}
                strokeWidth={isHighlight ? 2.5 : 1.6}
                strokeOpacity={isHighlight ? 1 : 0.65}
                strokeDasharray={config.dashed ? '6, 6' : undefined}
                fill="none"
                markerEnd={`url(#arrow-${rel.type})`}
              />

              {/* Source node dot */}
              <Circle
                cx={x1}
                cy={y1}
                r="3.5"
                fill={config.color}
                fillOpacity={0.8}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Floating Relation Badges */}
      {relations.map((rel) => {
        const fromNode = nodeMap.get(rel.from_node_id);
        const toNode = nodeMap.get(rel.to_node_id);
        if (!fromNode || !toNode) return null;

        const midX = ((fromNode.canvas_x || 0) + (toNode.canvas_x || 0)) / 2 + CARD_WIDTH / 2 - 36;
        const midY = ((fromNode.canvas_y || 0) + (toNode.canvas_y || 0)) / 2 + CARD_HEIGHT / 2 - 10;
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
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  relBadgeText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
