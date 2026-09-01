import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { SynapseNode, NodeType } from '../types';
import { SectionNodeCard } from '../components/nodes/SectionNodeCard';
import { THEME, NODE_TYPE_CONFIG } from '../theme/tokens';

const CATEGORIES: { type: NodeType; label: string; icon: string; color: string }[] = [
  { type: 'component', label: 'Components', icon: '??', color: '#F59E0B' },
  { type: 'decision', label: 'Decisions (ADR)', icon: '??', color: '#8B5CF6' },
  { type: 'benchmark', label: 'Benchmarks', icon: '??', color: '#6366F1' },
  { type: 'solution', label: 'Solutions', icon: '??', color: '#10B981' },
  { type: 'problem', label: 'Problems', icon: '??', color: '#EF4444' },
  { type: 'risk', label: 'Risks', icon: '?', color: '#EC4899' },
  { type: 'feature', label: 'Features', icon: '?', color: '#3B82F6' },
  { type: 'test', label: 'Tests', icon: '??', color: '#2DD4BF' },
  { type: 'deployment', label: 'Deployments', icon: '??', color: '#22C55E' },
  { type: 'note', label: 'Notes', icon: '??', color: '#A1A1AA' },
];

export const ArchitectureSectionsScreen: React.FC = () => {
  const {
    nodes,
    relations,
    activeProject,
    selectNode,
    selectProject,
    activeTypeFilter,
    setTypeFilter,
  } = useSynapseMobileStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!activeProject) return;
    setRefreshing(true);
    await selectProject(activeProject.id);
    setRefreshing(false);
  }, [activeProject, selectProject]);

  // Counts by Type
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<NodeType, number>> = {};
    nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // Counts by Status
  const statusCounts = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let draft = 0;
    nodes.forEach((n) => {
      if (n.status === 'completed' || n.status === 'closed' || n.status === 'accepted') completed++;
      else if (n.status === 'in_progress') inProgress++;
      else draft++;
    });
    return { completed, inProgress, draft };
  }, [nodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      // 1. Type filter
      if (activeTypeFilter !== 'all' && n.type !== activeTypeFilter) return false;

      // 2. Status filter
      if (statusFilter) {
        if (statusFilter === 'completed' && n.status !== 'completed' && n.status !== 'closed' && n.status !== 'accepted') return false;
        if (statusFilter === 'in_progress' && n.status !== 'in_progress') return false;
        if (statusFilter === 'draft' && (n.status === 'completed' || n.status === 'in_progress' || n.status === 'closed')) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchId = n.display_id.toLowerCase().includes(q);
        const matchContent = n.content?.toLowerCase().includes(q);
        const matchTags = n.tags?.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchId || matchContent || matchTags;
      }

      return true;
    });
  }, [nodes, activeTypeFilter, statusFilter, searchQuery]);

  return (
    <View style={styles.container}>
      {/* 1. Quick Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>??</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search architecture nodes, ADRs, tags..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Horizontal Filter Pills */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPills}
        >
          <TouchableOpacity
            style={[styles.pill, activeTypeFilter === 'all' && styles.pillActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text style={[styles.pillText, activeTypeFilter === 'all' && styles.pillTextActive]}>
              All ({nodes.length})
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const count = typeCounts[cat.type] || 0;
            if (count === 0 && activeTypeFilter !== cat.type) return null;
            const isSelected = activeTypeFilter === cat.type;

            return (
              <TouchableOpacity
                key={cat.type}
                style={[
                  styles.pill,
                  isSelected && { backgroundColor: `${cat.color}25`, borderColor: cat.color },
                ]}
                onPress={() => setTypeFilter(isSelected ? 'all' : cat.type)}
              >
                <Text style={{ fontSize: 11 }}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.pillText,
                    isSelected && { color: cat.color, fontWeight: '700' },
                  ]}
                >
                  {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Status Filter Bar */}
      <View style={styles.statusBar}>
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'completed' && styles.statusChipActive]}
          onPress={() => setStatusFilter(statusFilter === 'completed' ? null : 'completed')}
        >
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statusChipText}>{statusCounts.completed} Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'in_progress' && styles.statusChipActive]}
          onPress={() => setStatusFilter(statusFilter === 'in_progress' ? null : 'in_progress')}
        >
          <View style={[styles.dot, { backgroundColor: '#38BDF8' }]} />
          <Text style={styles.statusChipText}>{statusCounts.inProgress} In Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'draft' && styles.statusChipActive]}
          onPress={() => setStatusFilter(statusFilter === 'draft' ? null : 'draft')}
        >
          <View style={[styles.dot, { backgroundColor: '#8A8A94' }]} />
          <Text style={styles.statusChipText}>{statusCounts.draft} Draft</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Node Card List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {filteredNodes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>??</Text>
            <Text style={styles.emptyTitle}>No matching nodes</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `No results for "${searchQuery}"` : 'Select a different filter or create a new node'}
            </Text>
          </View>
        ) : (
          filteredNodes.map((node) => (
            <SectionNodeCard
              key={node.id}
              node={node}
              relations={relations}
              allNodes={nodes}
              onPress={() => selectNode(node.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D12',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#212A36',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#F0F6FC',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearIcon: {
    color: '#8A8A94',
    fontSize: 12,
    paddingHorizontal: 4,
  },
  filterScrollWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
    paddingBottom: 8,
  },
  filterPills: {
    paddingHorizontal: 12,
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#212A36',
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  pillActive: {
    backgroundColor: '#6366F125',
    borderColor: '#6366F1',
  },
  pillText: {
    color: '#8A8A94',
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#F0F6FC',
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0E131A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
    gap: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  statusChipActive: {
    backgroundColor: '#212A36',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    color: '#8A8A94',
    fontSize: 11,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#F0F6FC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#8A8A94',
    fontSize: 12,
    textAlign: 'center',
  },
});
