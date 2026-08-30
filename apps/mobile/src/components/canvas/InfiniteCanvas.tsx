import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SynapseNode, NodeRelation } from '../../types';
import { MobileNodeCard } from '../nodes/MobileNodeCard';
import { THEME } from '../../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  nodes: SynapseNode[];
  relations?: NodeRelation[];
  selectedNodeId: string | null;
  scale?: number;
  onSelectNode: (nodeId: string) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
}

export const InfiniteCanvas: React.FC<Props> = ({
  nodes,
  selectedNodeId,
  scale = 1.0,
  onSelectNode,
}) => {
  const [pan, setPan] = useState({ x: SCREEN_WIDTH / 2, y: 150 });
  const lastPanRef = useRef({ x: SCREEN_WIDTH / 2, y: 150 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        lastPanRef.current = { ...pan };
      },
      onPanResponderMove: (_, gestureState) => {
        setPan({
          x: lastPanRef.current.x + gestureState.dx,
          y: lastPanRef.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        lastPanRef.current = { ...pan };
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background Dot Matrix Grid */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Canvas Transform View */}
      <View
        style={[
          styles.canvasArea,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
            ],
          },
        ]}
      >
        {/* Render Node Cards */}
        {nodes.map((node) => {
          const x = node.canvas_x || 0;
          const y = node.canvas_y || 0;
          const isSelected = selectedNodeId === node.id;

          return (
            <View
              key={node.id}
              style={[
                styles.nodeWrapper,
                {
                  left: x,
                  top: y,
                },
              ]}
            >
              <MobileNodeCard
                node={node}
                isSelected={isSelected}
                onPress={() => onSelectNode(node.id)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  canvasArea: {
    position: 'absolute',
    width: 6000,
    height: 6000,
    left: -3000,
    top: -3000,
  },
  nodeWrapper: {
    position: 'absolute',
  },
});
