import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SynapseNode } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';

const MAP_WIDTH = 110;
const MAP_HEIGHT = 80;

interface Props {
  nodes: SynapseNode[];
  pan: { x: number; y: number };
  scale: number;
}

export const CanvasMinimap: React.FC<Props> = ({ nodes }) => {
  if (nodes.length === 0) return null;

  const minX = Math.min(...nodes.map((n) => n.canvas_x || 0));
  const maxX = Math.max(...nodes.map((n) => (n.canvas_x || 0) + 260));
  const minY = Math.min(...nodes.map((n) => n.canvas_y || 0));
  const maxY = Math.max(...nodes.map((n) => (n.canvas_y || 0) + 140));

  const rangeX = Math.max(maxX - minX, 400);
  const rangeY = Math.max(maxY - minY, 300);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.mapBox}>
        {/* Render Mini Node Dots */}
        {nodes.map((n) => {
          const config = NODE_TYPE_CONFIG[n.type] || NODE_TYPE_CONFIG.note;
          const x = (( (n.canvas_x || 0) - minX ) / rangeX) * (MAP_WIDTH - 14) + 7;
          const y = (( (n.canvas_y || 0) - minY ) / rangeY) * (MAP_HEIGHT - 14) + 7;

          return (
            <View
              key={`mini-${n.id}`}
              style={[
                styles.nodeDot,
                {
                  left: x,
                  top: y,
                  backgroundColor: config.color,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },
  mapBox: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: 'rgba(15, 15, 18, 0.82)',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nodeDot: {
    position: 'absolute',
    width: 6,
    height: 4,
    borderRadius: 1.5,
  },
});
