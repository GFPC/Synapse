import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SynapseNode, NodeRelation } from '../../types';
import { MobileNodeCard } from '../nodes/MobileNodeCard';
import { RelationEdges } from './RelationEdges';
import { CanvasMinimap } from './CanvasMinimap';
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
  relations = [],
  selectedNodeId,
  scale = 1.0,
  onSelectNode,
}) => {
  const [pan, setPan] = useState({ x: 20, y: 30 });
  const lastPanRef = useRef({ x: 20, y: 30 });

  // Auto-center camera on nodes
  useEffect(() => {
    if (nodes.length > 0) {
      const minX = Math.min(...nodes.map((n) => n.canvas_x || 0));
      const minY = Math.min(...nodes.map((n) => n.canvas_y || 0));
      const targetPan = {
        x: Math.max(10, 40 - minX),
        y: Math.max(10, 40 - minY),
      };
      setPan(targetPan);
      lastPanRef.current = targetPan;
    }
  }, [nodes.length]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
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
      {/* Background Grid */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Canvas Transform Layer */}
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
        {/* Render SVG Relation Edges */}
        <RelationEdges
          nodes={nodes}
          relations={relations}
          selectedNodeId={selectedNodeId}
        />

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

      {/* Minimap in top-right */}
      <CanvasMinimap nodes={nodes} pan={pan} scale={scale} />
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
    left: 0,
    top: 0,
  },
  nodeWrapper: {
    position: 'absolute',
  },
});
