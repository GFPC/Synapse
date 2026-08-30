import React, { useEffect } from 'react';
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
import { NodeType } from '../types';

const FILTER_TYPES: { id: NodeType | 'all'; label: string }[] = [
  { id: 'all', label: 'Все узлы' },
  { id: 'component', label: 'Компоненты' },
  { id: 'feature', label: 'Функции' },
  { id: 'problem', label: 'Проблемы' },
  { id: 'solution', label: 'Решения' },
  { id: 'decision', label: 'Решения' },
  { id: 'benchmark', label: 'Бенчмарки' },
  { id: 'deployment', label: 'Деплой' },
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
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.appName}>Synapse Mobile</Text>
            <Text style={styles.projectName} numberOfLines={1}>
              {activeProject ? activeProject.name : 'Подключение к API...'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Status Indicator */}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: isConnected ? '#064E3B' : '#451A03' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? '#6EE7B7' : '#FCD34D' },
              ]}
            >
              {isConnected ? 'API Online' : 'Connecting'}
            </Text>
          </View>

          {/* Auto Layout Button */}
          <TouchableOpacity
            style={styles.layoutBtn}
            onPress={() => applyAutoLayout('hierarchical')}
          >
            <Text style={styles.layoutBtnText}>📐 Сетка</Text>
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
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Загрузка графа архитектуры...</Text>
          </View>
        ) : (
          <InfiniteCanvas
            nodes={filteredNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={selectNode}
            onNodeMove={updateNodePosition}
          />
        )}
      </View>

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
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#18181B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
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
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  projectName: {
    fontSize: 11,
    color: '#A1A1AA',
    maxWidth: 160,
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
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  layoutBtn: {
    backgroundColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  layoutBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  filterBar: {
    backgroundColor: '#18181B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FAFAFA',
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
    color: '#A1A1AA',
  },
});
