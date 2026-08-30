import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import { SynapseNode } from '../../types';
import { MobileNodeCard } from '../nodes/MobileNodeCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  nodes: SynapseNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
}

export const InfiniteCanvas: React.FC<Props> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const [pan, setPan] = useState({ x: SCREEN_WIDTH / 2, y: 150 });
  const [scale, setScale] = useState(1.0);

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
      {/* Canvas Transform Container */}
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
    backgroundColor: '#09090B',
    overflow: 'hidden',
  },
  canvasArea: {
    position: 'absolute',
    width: 5000,
    height: 5000,
    left: -2500,
    top: -2500,
  },
  nodeWrapper: {
    position: 'absolute',
  },
});
