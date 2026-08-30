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
  Modal,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { InfiniteCanvas } from '../components/canvas/InfiniteCanvas';
import { NodeDetailModal } from '../components/drawer/NodeDetailModal';
import { SearchModal } from '../components/modals/SearchModal';
import { CreateNodeModal } from '../components/modals/CreateNodeModal';
import { CanvasHUD } from '../components/layout/CanvasHUD';
import { NodeType } from '../types';
import { THEME } from '../theme/tokens';

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
    relations,
    projects,
    activeProject,
    selectProject,
    selectedNodeId,
    selectNode,
    updateNodePosition,
    applyAutoLayout,
    activeTypeFilter,
    setTypeFilter,
  } = useSynapseMobileStore();

  const [zoomScale, setZoomScale] = useState(1.0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);

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
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.7}
          onPress={() => setIsProjectPickerOpen(true)}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.brandRow}>
              <Text style={styles.appName}>Synapse</Text>
              <Text style={styles.versionBadge}>Mobile v1.0</Text>
            </View>
            <View style={styles.projectPickerRow}>
              <Text style={styles.projectName} numberOfLines={1}>
                {activeProject ? activeProject.name : 'Подключение...'}
              </Text>
              <Text style={styles.pickerChevron}>▾</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Quick Create Node Button */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setIsCreateOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.createBtnText}>＋ Узел</Text>
          </TouchableOpacity>

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
              {isConnected ? 'Live' : 'Sync'}
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
            <Text style={styles.loadingText}>Загрузка архитектурного графа...</Text>
          </View>
        ) : (
          <InfiniteCanvas
            nodes={filteredNodes}
            relations={relations}
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

      {/* Create Node Modal */}
      <CreateNodeModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Node Detail Drawer / Bottom Sheet */}
      <NodeDetailModal
        node={selectedNode}
        visible={selectedNode !== null}
        onClose={() => selectNode(null)}
      />

      {/* Project Picker Modal */}
      <Modal
        visible={isProjectPickerOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsProjectPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsProjectPickerOpen(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>ВЫБОР АРХИТЕКТУРНОГО ПРОЕКТА</Text>
            {projects.map((proj) => {
              const isCurrent = activeProject?.id === proj.id;
              return (
                <TouchableOpacity
                  key={proj.id}
                  style={[
                    styles.pickerItem,
                    isCurrent && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    selectProject(proj.id);
                    setIsProjectPickerOpen(false);
                  }}
                >
                  <View style={styles.pickerItemHead}>
                    <Text style={styles.pickerItemIcon}>📁</Text>
                    <Text style={styles.pickerItemName} numberOfLines={1}>
                      {proj.name}
                    </Text>
                  </View>
                  {proj.description ? (
                    <Text style={styles.pickerItemDesc} numberOfLines={2}>
                      {proj.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  versionBadge: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: THEME.text4,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  projectPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectName: {
    fontSize: 10,
    color: THEME.text2,
    fontWeight: '600',
    maxWidth: 130,
  },
  pickerChevron: {
    fontSize: 10,
    color: THEME.accentBright,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createBtn: {
    backgroundColor: THEME.surface3,
    borderWidth: 1,
    borderColor: THEME.border2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  createBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '600',
  },
  searchIconBtn: {
    backgroundColor: THEME.surface2,
    padding: 6,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIconText: {
    fontSize: 11,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerModal: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    padding: 16,
    gap: 10,
  },
  pickerTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    marginBottom: 4,
  },
  pickerItem: {
    backgroundColor: THEME.surface2,
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  pickerItemActive: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  pickerItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pickerItemIcon: {
    fontSize: 14,
  },
  pickerItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
    flex: 1,
  },
  pickerItemDesc: {
    fontSize: 11,
    color: THEME.text3,
    lineHeight: 15,
  },
});
