import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { SynapseNode, NodeType, SortField } from '../types';
import { SectionNodeCard } from '../components/nodes/SectionNodeCard';
import { FilterPills, FilterItem } from '../components/ui/FilterPills';
import { EmptyState } from '../components/ui/EmptyState';
import { THEME, NODE_TYPE_CONFIG } from '../theme/tokens';

const CATEGORY_ORDER: { type: NodeType; title: string; icon: string; color: string }[] = [
  { type: 'component', title: 'Components & Services', icon: '⬡', color: '#F59E0B' },
  { type: 'feature', title: 'Features & Capabilities', icon: '✦', color: '#3B82F6' },
  { type: 'decision', title: 'Architecture Decisions (ADR)', icon: '◆', color: '#8B5CF6' },
  { type: 'benchmark', title: 'Benchmarks & SLOs', icon: '📊', color: '#6366F1' },
  { type: 'problem', title: 'Problems & Incidents', icon: '⚠️', color: '#EF4444' },
  { type: 'solution', title: 'Solutions & Patterns', icon: '✓', color: '#10B981' },
  { type: 'risk', title: 'Technical Risks', icon: '⚡', color: '#EC4899' },
  { type: 'test', title: 'Tests & Verification', icon: '🧪', color: '#2DD4BF' },
  { type: 'deployment', title: 'Deployment & Infra', icon: '▲', color: '#22C55E' },
  { type: 'lesson', title: 'Lessons Learned', icon: '💡', color: '#C2B280' },
  { type: 'note', title: 'Notes & Documentation', icon: '📝', color: '#A1A1AA' },
  { type: 'link', title: 'External Links', icon: '🔗', color: '#7C8AA5' },
  { type: 'log', title: 'Audit Logs', icon: '⏱', color: '#6B7280' },
];

export const ArchitectureSectionsScreen: React.FC = () => {
  const {
    nodes,
    relations,
    isLoading,
    activeProject,
    activeTypeFilter,
    setTypeFilter,
    selectNode,
    selectProject,
    openCreateNodeModal,
    openCreateRelationModal,
    sortField,
    sortOrder,
    setSorting,
  } = useSynapseMobileStore();

  const [localSearch, setLocalSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!activeProject) return;
    setRefreshing(true);
    await selectProject(activeProject.id);
    setRefreshing(false);
  }, [activeProject, selectProject]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (typeKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [typeKey]: !prev[typeKey],
    }));
  };

  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    CATEGORY_ORDER.forEach((c) => (all[c.type] = true));
    setCollapsedCategories(all);
  };

  // Build Filter Pills with live counts
  const filterItems: FilterItem[] = useMemo(() => {
    const counts: Partial<Record<NodeType, number>> = {};
    nodes.forEach((n: SynapseNode) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });

    const items: FilterItem[] = [
      { id: 'all', label: 'All', count: nodes.length },
    ];

    CATEGORY_ORDER.forEach((cat) => {
      const c = counts[cat.type] || 0;
      if (c > 0) {
        items.push({
          id: cat.type,
          label: NODE_TYPE_CONFIG[cat.type].label,
          count: c,
        });
      }
    });

    return items;
  }, [nodes]);

  // Filter & Sort Nodes
  const processedNodes = useMemo(() => {
    return nodes
      .filter((n: SynapseNode) => {
        if (activeTypeFilter !== 'all' && n.type !== activeTypeFilter) return false;
        if (localSearch.trim()) {
          const q = localSearch.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchId = n.display_id.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTags = n.tags?.some((t: string) => t.toLowerCase().includes(q));
          return matchTitle || matchId || matchContent || matchTags;
        }
        return true;
      })
      .sort((a: SynapseNode, b: SynapseNode) => {
        let cmp = 0;
        if (sortField === 'display_id') cmp = a.display_id.localeCompare(b.display_id);
        else if (sortField === 'title') cmp = a.title.localeCompare(b.title);
        else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '');
        else {
          const tA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
          const tB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
          cmp = tA - tB;
        }

        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [nodes, activeTypeFilter, localSearch, sortField, sortOrder]);

  // Group nodes by category
  const groupedByCategory = useMemo(() => {
    const map = new Map<NodeType, SynapseNode[]>();
    processedNodes.forEach((n: SynapseNode) => {
      if (!map.has(n.type)) map.set(n.type, []);
      map.get(n.type)!.push(n);
    });
    return map;
  }, [processedNodes]);

  return (
    <View style={styles.container}>
      {/* Category Pills Carousel */}
      <FilterPills
        filters={filterItems}
        activeFilter={activeTypeFilter}
        onSelectFilter={setTypeFilter}
      />

      {/* Sleek Search & Controls Bar */}
      <View style={styles.controlBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search nodes, tags, IDs..."
            placeholderTextColor={THEME.text4}
            value={localSearch}
            onChangeText={setLocalSearch}
            clearButtonMode="while-editing"
          />
          {localSearch ? (
            <TouchableOpacity onPress={() => setLocalSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <View style={styles.toggleButtons}>
            <TouchableOpacity style={styles.toggleBtn} onPress={expandAll}>
              <Text style={styles.toggleBtnText}>Expand</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn} onPress={collapseAll}>
              <Text style={styles.toggleBtnText}>Collapse</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => {
              const nextSort: SortField =
                sortField === 'updated_at'
                  ? 'display_id'
                  : sortField === 'display_id'
                  ? 'title'
                  : 'updated_at';
              setSorting(nextSort);
            }}
          >
            <Text style={styles.sortBtnText}>
              Sort: {sortField === 'updated_at' ? 'Date' : sortField === 'display_id' ? 'ID' : 'Name'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Sections Scroll View */}
      {isLoading && nodes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={THEME.accent} />
          <Text style={styles.loadingText}>Loading architecture...</Text>
        </View>
      ) : processedNodes.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Nodes Found"
          description="Adjust your filter or create a new node"
          actionText="＋ Create Node"
          onAction={openCreateNodeModal}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.accent}
              colors={[THEME.accent]}
            />
          }
        >
          {CATEGORY_ORDER.map((cat) => {
            const catNodes = groupedByCategory.get(cat.type) || [];
            if (catNodes.length === 0) return null;

            const isCollapsed = !!collapsedCategories[cat.type];

            return (
              <View key={cat.type} style={styles.sectionCard}>
                {/* Section Header */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleCategory(cat.type)}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Text style={[styles.catIcon, { color: cat.color }]}>{cat.icon}</Text>
                    <Text style={styles.sectionTitle}>{cat.title}</Text>
                    <View style={styles.countBadge}>
                      <Text style={[styles.countText, { color: cat.color }]}>
                        {catNodes.length}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.chevron}>{isCollapsed ? '▸' : '▾'}</Text>
                </TouchableOpacity>

                {/* Node Cards List */}
                {!isCollapsed && (
                  <View style={styles.nodesList}>
                    {catNodes.map((node: SynapseNode) => (
                      <SectionNodeCard
                        key={node.id}
                        node={node}
                        relations={relations}
                        allNodes={nodes}
                        onPress={() => selectNode(node.id, 'view')}
                        onDoublePress={() => selectNode(node.id, 'edit')}
                        onAddRelation={() => openCreateRelationModal(node)}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Sleek Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={openCreateNodeModal}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  controlBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface2,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 32,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIcon: {
    fontSize: 11,
    marginRight: 6,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: THEME.text1,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 11,
    color: THEME.text3,
    paddingHorizontal: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleBtn: {
    backgroundColor: THEME.surface2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleBtnText: {
    fontSize: 10,
    color: THEME.text3,
    fontWeight: '500',
  },
  sortBtn: {
    backgroundColor: THEME.surface2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sortBtnText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: THEME.accentBright,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 80,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: THEME.text3,
  },
  sectionCard: {
    backgroundColor: THEME.surface1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  catIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text1,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: THEME.surface3,
  },
  countText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  chevron: {
    fontSize: 12,
    color: THEME.text4,
  },
  nodesList: {
    padding: 8,
    gap: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: -2,
  },
});
