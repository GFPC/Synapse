import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SynapseNode, NodeRelation, NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG, RELATION_CONFIG, RelationConfig } from '../../theme/tokens';

interface Props {
  nodes: SynapseNode[];
  relations: NodeRelation[];
  onSelectNode: (nodeId: string) => void;
}

interface SectionCategory {
  id: string;
  title: string;
  icon: string;
  types: NodeType[];
  accentColor: string;
}

const SECTION_CATEGORIES: SectionCategory[] = [
  {
    id: 'core',
    title: 'Ядро и Микросервисы',
    icon: '⚡',
    types: ['component', 'feature'],
    accentColor: '#F59E0B',
  },
  {
    id: 'decisions',
    title: 'Архитектурные Решения (ADR)',
    icon: '🟣',
    types: ['decision', 'lesson'],
    accentColor: '#8B5CF6',
  },
  {
    id: 'benchmarks',
    title: 'Бенчмарки и Производительность',
    icon: '📊',
    types: ['benchmark', 'test'],
    accentColor: '#6366F1',
  },
  {
    id: 'problems',
    title: 'Проблемы, Риски и Решения',
    icon: '⚡',
    types: ['problem', 'solution', 'risk'],
    accentColor: '#EF4444',
  },
  {
    id: 'infra',
    title: 'Инфраструктура и Деплой',
    icon: '❇️',
    types: ['deployment'],
    accentColor: '#22C55E',
  },
  {
    id: 'notes',
    title: 'База знаний и Ссылки',
    icon: '📝',
    types: ['note', 'link', 'log'],
    accentColor: '#94A3B8',
  },
];

export const SectionsView: React.FC<Props> = ({ nodes, relations, onSelectNode }) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (secId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const nodeMap = new Map<string, SynapseNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Find incoming & outgoing relations for a node
  const getNodeRelations = (nodeId: string) => {
    return relations.filter((r) => r.from_node_id === nodeId || r.to_node_id === nodeId);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {SECTION_CATEGORIES.map((category) => {
        const categoryNodes = nodes.filter((n) => category.types.includes(n.type as NodeType));
        if (categoryNodes.length === 0) return null;

        const isCollapsed = !!collapsedSections[category.id];

        return (
          <View key={category.id} style={styles.sectionCard}>
            {/* Section Header */}
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection(category.id)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionIcon}>{category.icon}</Text>
                <Text style={styles.sectionTitle}>{category.title}</Text>
                <View style={[styles.countBadge, { backgroundColor: `${category.accentColor}20` }]}>
                  <Text style={[styles.countText, { color: category.accentColor }]}>
                    {categoryNodes.length}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>{isCollapsed ? '▸' : '▾'}</Text>
            </TouchableOpacity>

            {/* Nodes List */}
            {!isCollapsed && (
              <View style={styles.nodesList}>
                {categoryNodes.map((node) => {
                  const conf = NODE_TYPE_CONFIG[node.type as NodeType] || NODE_TYPE_CONFIG.note;
                  const isBenchmark = node.type === 'benchmark';
                  const nodeRels = getNodeRelations(node.id);

                  const statusColor =
                    node.status === 'completed' || node.status === 'closed'
                      ? THEME.status.ok
                      : node.status === 'blocked'
                      ? THEME.status.crit
                      : node.status === 'in_progress'
                      ? THEME.status.warn
                      : THEME.status.muted;

                  return (
                    <TouchableOpacity
                      key={node.id}
                      style={styles.nodeItem}
                      activeOpacity={0.75}
                      onPress={() => onSelectNode(node.id)}
                    >
                      {/* Top row: Type chip + Display ID + Status */}
                      <View style={styles.nodeTopRow}>
                        <View style={styles.nodeTypeGroup}>
                          <View
                            style={[
                              styles.typeChip,
                              { backgroundColor: conf.bg, borderColor: conf.border },
                            ]}
                          >
                            <Text style={[styles.typeIconText, { color: conf.color }]}>
                              {conf.iconText}
                            </Text>
                          </View>
                          <Text style={[styles.displayIdText, { color: conf.color }]}>
                            {node.display_id}
                          </Text>
                          <Text style={styles.nodeTypeLabel}>{conf.label}</Text>
                        </View>

                        <View style={styles.statusPill}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={styles.statusLabel}>{node.status || 'active'}</Text>
                        </View>
                      </View>

                      {/* Node Title */}
                      <Text style={styles.nodeTitle}>{node.title}</Text>

                      {/* Benchmark Progress Bar */}
                      {isBenchmark && (
                        <View style={styles.benchmarkBarBox}>
                          <View style={styles.benchTrack}>
                            <View
                              style={[styles.benchFill, { backgroundColor: conf.color }]}
                            />
                          </View>
                          <Text style={styles.benchText}>0.12ms p99 SLO</Text>
                        </View>
                      )}

                      {/* Content Snippet */}
                      {node.content ? (
                        <Text style={styles.nodeContent} numberOfLines={2}>
                          {node.content}
                        </Text>
                      ) : null}

                      {/* Connected Relations Chips */}
                      {nodeRels.length > 0 && (
                        <View style={styles.relationsRow}>
                          {nodeRels.slice(0, 2).map((rel) => {
                            const isOut = rel.from_node_id === node.id;
                            const targetNode = isOut
                              ? nodeMap.get(rel.to_node_id)
                              : nodeMap.get(rel.from_node_id);
                            const relConf: RelationConfig =
                              RELATION_CONFIG[rel.type as keyof typeof RELATION_CONFIG] ||
                              RELATION_CONFIG.related;

                            return (
                              <View
                                key={rel.id}
                                style={[
                                  styles.relChip,
                                  {
                                    borderColor: `${relConf.color}40`,
                                    backgroundColor: `${relConf.color}10`,
                                  },
                                ]}
                              >
                                <Text style={[styles.relSymbol, { color: relConf.color }]}>
                                  {isOut ? '↳' : '↲'} {relConf.label}:
                                </Text>
                                <Text
                                  style={styles.relTargetText}
                                  numberOfLines={1}
                                >
                                  {targetNode?.title || 'Узел'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Tags Footer */}
                      <View style={styles.nodeFooter}>
                        <View style={styles.tagsBox}>
                          {node.tags && node.tags.length > 0 ? (
                            node.tags.slice(0, 3).map((t, idx) => (
                              <View key={idx} style={styles.tagPill}>
                                <Text style={styles.tagText}>#{t}</Text>
                              </View>
                            ))
                          ) : (
                            <View style={styles.tagPill}>
                              <Text style={styles.tagText}>#core</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.openDetailsHint}>Открыть детали →</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text1,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  chevron: {
    fontSize: 16,
    color: THEME.text3,
    fontWeight: '600',
  },
  nodesList: {
    padding: 10,
    gap: 10,
  },
  nodeItem: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
  },
  nodeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nodeTypeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChip: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  displayIdText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  nodeTypeLabel: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.surface3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: THEME.text2,
    textTransform: 'lowercase',
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text1,
    lineHeight: 19,
    marginBottom: 6,
  },
  benchmarkBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  benchTrack: {
    flex: 1,
    height: 4,
    backgroundColor: THEME.surface4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  benchFill: {
    width: '92%',
    height: '100%',
    borderRadius: 2,
  },
  benchText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.accentBright,
    fontWeight: '600',
  },
  nodeContent: {
    fontSize: 12,
    color: THEME.text3,
    lineHeight: 17,
    marginBottom: 8,
  },
  relationsRow: {
    gap: 4,
    marginBottom: 8,
  },
  relChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  relSymbol: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
  },
  relTargetText: {
    fontSize: 11,
    color: THEME.text2,
    flex: 1,
  },
  nodeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  tagsBox: {
    flexDirection: 'row',
    gap: 4,
  },
  tagPill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: THEME.text3,
  },
  openDetailsHint: {
    fontSize: 10,
    color: THEME.accentBright,
    fontWeight: '600',
  },
});
