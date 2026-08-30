import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { InfiniteCanvas } from '../components/canvas/InfiniteCanvas';
import { NodeDetailModal } from '../components/drawer/NodeDetailModal';
import { SearchModal } from '../components/modals/SearchModal';
import { CanvasHUD } from '../components/layout/CanvasHUD';
import { NodeType } from '../types';
import { THEME, NODE_TYPE_CONFIG } from '../theme/tokens';

const FILTER_TYPES: { id: NodeType | 'all'; label: string }[] = [
  { id: 'all', label: 'Все узлы' },
  { id: 'component', label: 'Компоненты' },
  { id: 'feature', label: 'Функции' },
  { id: 'problem', label: 'Проблемы' },
  { id: 'solution', label: 'Решения' },
  { id: 'decision', label: 'ADR Решения' },
  { id: 'benchmark', label: 'Бенчмарки' },
  { id: 'deployment', label: 'Деплой' },
  { id: 'test', label: 'Тесты' },
];

export const CanvasScreen: React.FC = () => {
  const {
    init,
    isLoading,
    isConnected,
    nodes,
    activeProject,
    selectedNodeId,
    selectNode,
    updateNodePosition,
    applyAutoLayout,
    activeTypeFilter,
    setTypeFilter,
  } = useSynapseMobileStore();

  const [zoomScale, setZoomScale] = useState(1.0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const filteredNodes = nodes.filter((n) => {
    if (activeTypeFilter === 'all') return true;
    return n.type === activeTypeFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.appName}>Synapse</Text>
              <Text style={styles.versionBadge}>Mobile v1.0</Text>
            </View>
            <Text style={styles.projectName} numberOfLines={1}>
              {activeProject ? activeProject.name : 'Подключение к Go API...'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Status Indicator */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                borderColor: isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? THEME.status.ok : THEME.status.warn },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? '#86EFAC' : '#FCD34D' },
              ]}
            >
              {isConnected ? 'API Online' : 'Connecting'}
            </Text>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchIconBtn}
            onPress={() => setIsSearchOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchIconText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Horizontal Carousel */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TYPES.map((filter) => {
            const isActive = activeTypeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setTypeFilter(filter.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Canvas Area */}
      <View style={styles.canvasContainer}>
        {isLoading && nodes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text style={styles.loadingText}>Загрузка графа архитектуры...</Text>
          </View>
        ) : (
          <InfiniteCanvas
            nodes={filteredNodes}
            selectedNodeId={selectedNodeId}
            scale={zoomScale}
            onSelectNode={selectNode}
            onNodeMove={updateNodePosition}
          />
        )}
      </View>

      {/* Floating Canvas HUD */}
      <CanvasHUD
        scale={zoomScale}
        onZoomIn={() => setZoomScale((s) => Math.min(2.5, s + 0.15))}
        onZoomOut={() => setZoomScale((s) => Math.max(0.4, s - 0.15))}
        onFit={() => setZoomScale(1.0)}
        onHierarchyLayout={() => applyAutoLayout('hierarchical')}
        onForceLayout={() => applyAutoLayout('force')}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal
        visible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNode={(nodeId) => selectNode(nodeId)}
      />

      {/* Node Detail Drawer / Bottom Sheet */}
      <NodeDetailModal
        node={selectedNode}
        visible={selectedNode !== null}
        onClose={() => selectNode(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text1,
  },
  versionBadge: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: THEME.text4,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  projectName: {
    fontSize: 11,
    color: THEME.text3,
    maxWidth: 150,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600',
  },
  searchIconBtn: {
    backgroundColor: THEME.surface2,
    padding: 7,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIconText: {
    fontSize: 12,
  },
  filterBar: {
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterChip: {
    backgroundColor: THEME.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterChipActive: {
    backgroundColor: THEME.accentDim,
    borderColor: THEME.accentLine,
  },
  filterChipText: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: THEME.accentBright,
    fontWeight: '700',
  },
  canvasContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.text3,
  },
});
