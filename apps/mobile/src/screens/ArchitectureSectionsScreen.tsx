import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { SynapseNode, NodeType, SortField } from '../types';
import { SectionNodeCard } from '../components/nodes/SectionNodeCard';
import { FilterPills, FilterItem } from '../components/ui/FilterPills';
import { EmptyState } from '../components/ui/EmptyState';
import { THEME, NODE_TYPE_CONFIG } from '../theme/tokens';

const CATEGORY_ORDER: { type: NodeType; title: string; icon: string; color: string }[] = [
  { type: 'component', title: 'Компоненты и Сервисы', icon: '⬡', color: '#F59E0B' },
  { type: 'feature', title: 'Функции и Возможности', icon: '✦', color: '#3B82F6' },
  { type: 'decision', title: 'Архитектурные Решения (ADR)', icon: '◆', color: '#8B5CF6' },
  { type: 'benchmark', title: 'Бенчмарки и Производительность', icon: '📊', color: '#6366F1' },
  { type: 'problem', title: 'Проблемы и Инциденты', icon: '⚠️', color: '#EF4444' },
  { type: 'solution', title: 'Решения и Паттерны', icon: '✓', color: '#10B981' },
  { type: 'risk', title: 'Технические Риски', icon: '⚡', color: '#EC4899' },
  { type: 'test', title: 'Тесты и Верификация', icon: '🧪', color: '#2DD4BF' },
  { type: 'deployment', title: 'Инфраструктура и Деплой', icon: '▲', color: '#22C55E' },
  { type: 'lesson', title: 'Архитектурные Уроки', icon: '💡', color: '#C2B280' },
  { type: 'note', title: 'Заметки и Документация', icon: '📝', color: '#A1A1AA' },
  { type: 'link', title: 'Внешние Ссылки', icon: '🔗', color: '#7C8AA5' },
  { type: 'log', title: 'Журнал изменений', icon: '⏱', color: '#6B7280' },
];

export const ArchitectureSectionsScreen: React.FC = () => {
  const {
    nodes,
    relations,
    isLoading,
    activeTypeFilter,
    setTypeFilter,
    selectNode,
    openCreateNodeModal,
    openCreateRelationModal,
    sortField,
    sortOrder,
    setSorting,
  } = useSynapseMobileStore();

  const [localSearch, setLocalSearch] = useState('');
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
      { id: 'all', label: 'Все узлы', count: nodes.length },
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
        else cmp = (a.updated_at || 0) - (b.updated_at || 0);

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

      {/* Control Bar: Search, Expand/Collapse, Sort */}
      <View style={styles.controlBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Фильтр по названию, тегам, ID..."
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
              <Text style={styles.toggleBtnText}>Развернуть всё</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn} onPress={collapseAll}>
              <Text style={styles.toggleBtnText}>Свернуть</Text>
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
              Сорт: {sortField === 'updated_at' ? 'Дата ▾' : sortField === 'display_id' ? 'ID ▾' : 'Имя ▾'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Sections Scroll View */}
      {isLoading && nodes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loadingText}>Загрузка архитектурных секций...</Text>
        </View>
      ) : processedNodes.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Узлы не найдены"
          description="Попробуйте изменить запрос фильтра или создайте новый узел"
          actionText="＋ Создать узел"
          onAction={openCreateNodeModal}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                    <View
                      style={[
                        styles.catIconBox,
                        { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}40` },
                      ]}
                    >
                      <Text style={[styles.catIcon, { color: cat.color }]}>{cat.icon}</Text>
                    </View>
                    <Text style={styles.sectionTitle}>{cat.title}</Text>
                    <View style={[styles.countBadge, { backgroundColor: `${cat.color}15` }]}>
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
                        onPress={() => selectNode(node.id)}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={openCreateNodeModal}
      >
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>Создать узел</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 10,
    height: 36,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.text1,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 12,
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
    gap: 6,
  },
  toggleBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontSize: 10,
    color: THEME.text3,
    fontWeight: '600',
  },
  sortBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    padding: 14,
    paddingBottom: 90,
    gap: 14,
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
  sectionCard: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: THEME.surface2,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  catIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
  },
  countText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  chevron: {
    fontSize: 16,
    color: THEME.text3,
  },
  nodesList: {
    padding: 10,
    gap: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: THEME.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: THEME.radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
});
