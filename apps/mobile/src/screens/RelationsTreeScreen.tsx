import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { SynapseNode, NodeType, NodeRelation } from '../types';
import { THEME, NODE_TYPE_CONFIG, RELATION_CONFIG, RelationConfig } from '../theme/tokens';
import { EmptyState } from '../components/ui/EmptyState';

export const RelationsTreeScreen: React.FC = () => {
  const {
    nodes,
    relations,
    activeProject,
    selectNode,
  } = useSynapseMobileStore();

  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    component: true,
    decision: true,
    feature: true,
    benchmark: true,
    problem: true,
  });
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const nodeMap = useMemo(() => {
    const map = new Map<string, SynapseNode>();
    nodes.forEach((n: SynapseNode) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const toggleCategory = (type: string) => {
    setExpandedCategories((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allCats: Record<string, boolean> = {};
    const allNds: Record<string, boolean> = {};
    nodes.forEach((n: SynapseNode) => {
      allCats[n.type] = true;
      allNds[n.id] = true;
    });
    setExpandedCategories(allCats);
    setExpandedNodes(allNds);
  };

  const collapseAll = () => {
    setExpandedCategories({});
    setExpandedNodes({});
  };

  // Group nodes by category
  const categoriesWithNodes = useMemo(() => {
    const map = new Map<NodeType, SynapseNode[]>();
    nodes.forEach((n: SynapseNode) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          n.title.toLowerCase().includes(q) ||
          n.display_id.toLowerCase().includes(q) ||
          n.tags?.some((t: string) => t.toLowerCase().includes(q));
        if (!match) return;
      }
      if (!map.has(n.type)) map.set(n.type, []);
      map.get(n.type)!.push(n);
    });
    return Array.from(map.entries());
  }, [nodes, search]);

  const getNodeRelations = (nodeId: string): NodeRelation[] => {
    return relations.filter((r: NodeRelation) => r.from_node_id === nodeId || r.to_node_id === nodeId);
  };

  return (
    <View style={styles.container}>
      {/* Control Header */}
      <View style={styles.controlHeader}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по дереву связей..."
            placeholderTextColor={THEME.text4}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={expandAll}>
            <Text style={styles.ctrlBtnText}>Развернуть все</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={collapseAll}>
            <Text style={styles.ctrlBtnText}>Свернуть</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tree Content Scroll View */}
      {categoriesWithNodes.length === 0 ? (
        <EmptyState
          icon="🌳"
          title="Связи не найдены"
          description="В текущем проекте пока нет связей или запрос не вернул результатов"
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Root Project Branch */}
          <View style={styles.rootNodeBox}>
            <View style={styles.rootIconBox}>
              <Text style={styles.rootIcon}>🧠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rootTitle}>
                {activeProject ? activeProject.name : 'Synapse Architecture'}
              </Text>
              <Text style={styles.rootSubtitle}>
                {nodes.length} узлов знания • {relations.length} связей
              </Text>
            </View>
          </View>

          {/* Level 1: Categories */}
          {categoriesWithNodes.map(([type, catNodes]) => {
            const conf = NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG.note;
            const isCatExpanded = !!expandedCategories[type];

            return (
              <View key={type} style={styles.categoryBranch}>
                {/* Category Header Row */}
                <TouchableOpacity
                  style={styles.categoryRow}
                  activeOpacity={0.7}
                  onPress={() => toggleCategory(type)}
                >
                  <View style={styles.branchLineVertical} />
                  <View style={styles.branchLineHorizontal} />
                  <View
                    style={[
                      styles.catDot,
                      { backgroundColor: conf.bg, borderColor: conf.color },
                    ]}
                  >
                    <Text style={[styles.catIconText, { color: conf.color }]}>
                      {conf.iconText}
                    </Text>
                  </View>
                  <Text style={[styles.categoryLabel, isCatExpanded && styles.categoryLabelActive]}>
                    {conf.label}
                  </Text>
                  <View style={[styles.catCountBadge, { backgroundColor: `${conf.color}20` }]}>
                    <Text style={[styles.catCountText, { color: conf.color }]}>
                      {catNodes.length}
                    </Text>
                  </View>
                  <Text style={styles.catChevron}>{isCatExpanded ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {/* Level 2: Nodes */}
                {isCatExpanded && (
                  <View style={styles.nodesBranchList}>
                    {catNodes.map((node: SynapseNode) => {
                      const isNodeExpanded = !!expandedNodes[node.id];
                      const nodeRels = getNodeRelations(node.id);
                      const hasRels = nodeRels.length > 0;

                      return (
                        <View key={node.id} style={styles.nodeBranchItem}>
                          {/* Node Row */}
                          <View style={styles.nodeRow}>
                            <View style={styles.nodeBranchLineV} />
                            <View style={styles.nodeBranchLineH} />

                            {/* Node Expand Toggle Circle */}
                            <TouchableOpacity
                              style={[
                                styles.nodeToggleCircle,
                                isNodeExpanded && styles.nodeToggleCircleActive,
                              ]}
                              onPress={() => hasRels && toggleNode(node.id)}
                            >
                              <Text style={styles.nodeToggleIcon}>
                                {hasRels ? (isNodeExpanded ? '−' : '＋') : '•'}
                              </Text>
                            </TouchableOpacity>

                            {/* Node Label (tap opens detail) */}
                            <TouchableOpacity
                              style={styles.nodeLabelBtn}
                              activeOpacity={0.7}
                              onPress={() => selectNode(node.id)}
                            >
                              <Text style={[styles.displayId, { color: conf.color }]}>
                                [{node.display_id}]
                              </Text>
                              <Text style={styles.nodeTitle} numberOfLines={1}>
                                {node.title}
                              </Text>
                              {hasRels && (
                                <View style={styles.relCountPill}>
                                  <Text style={styles.relCountText}>
                                    {nodeRels.length}
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>

                          {/* Level 3: Relations */}
                          {isNodeExpanded && hasRels && (
                            <View style={styles.relationsBranchList}>
                              {nodeRels.map((rel: NodeRelation) => {
                                const isOut = rel.from_node_id === node.id;
                                const target = isOut
                                  ? nodeMap.get(rel.to_node_id)
                                  : nodeMap.get(rel.from_node_id);
                                const relConf: RelationConfig =
                                  RELATION_CONFIG[rel.type as keyof typeof RELATION_CONFIG] ||
                                  RELATION_CONFIG.related;

                                return (
                                  <TouchableOpacity
                                    key={rel.id}
                                    style={styles.relRow}
                                    activeOpacity={0.7}
                                    onPress={() => target && selectNode(target.id)}
                                  >
                                    <View style={styles.relLineV} />
                                    <View style={styles.relLineH} />
                                    <View
                                      style={[
                                        styles.relDot,
                                        { backgroundColor: relConf.color },
                                      ]}
                                    />
                                    <Text
                                      style={[
                                        styles.relTypeLabel,
                                        { color: relConf.color },
                                      ]}
                                    >
                                      {isOut ? '↳' : '↲'} {relConf.label}:
                                    </Text>
                                    <Text
                                      style={styles.relTargetText}
                                      numberOfLines={1}
                                    >
                                      {target ? `[${target.display_id}] ${target.title}` : 'Удаленный узел'}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  controlHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  btnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ctrlBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ctrlBtnText: {
    fontSize: 10.5,
    color: THEME.text3,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  rootNodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.surface2,
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border2,
    marginBottom: 14,
  },
  rootIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.accentDim,
    borderWidth: 1,
    borderColor: THEME.accentLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootIcon: {
    fontSize: 16,
  },
  rootTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  rootSubtitle: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: THEME.text3,
    marginTop: 1,
  },
  categoryBranch: {
    position: 'relative',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  branchLineVertical: {
    position: 'absolute',
    left: -8,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: THEME.border,
  },
  branchLineHorizontal: {
    position: 'absolute',
    left: -8,
    top: 20,
    width: 8,
    height: 2,
    backgroundColor: THEME.border,
  },
  catDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  catIconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: THEME.text2,
    flex: 1,
  },
  categoryLabelActive: {
    color: THEME.text1,
    fontWeight: '700',
  },
  catCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
    marginRight: 6,
  },
  catCountText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  catChevron: {
    fontSize: 14,
    color: THEME.text3,
  },
  nodesBranchList: {
    marginLeft: 20,
    paddingLeft: 10,
    borderLeftWidth: 1.5,
    borderLeftColor: THEME.border2,
    marginTop: 4,
    gap: 4,
  },
  nodeBranchItem: {
    marginVertical: 2,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  nodeBranchLineV: {
    position: 'absolute',
    left: -10,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: THEME.border,
  },
  nodeBranchLineH: {
    position: 'absolute',
    left: -10,
    top: 14,
    width: 10,
    height: 1.5,
    backgroundColor: THEME.border,
  },
  nodeToggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.surface3,
    borderWidth: 1,
    borderColor: THEME.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  nodeToggleCircleActive: {
    backgroundColor: THEME.accentDim,
    borderColor: THEME.accent,
  },
  nodeToggleIcon: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  nodeLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: THEME.surface2,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  displayId: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '700',
  },
  nodeTitle: {
    fontSize: 12,
    color: THEME.text1,
    fontWeight: '600',
    flex: 1,
  },
  relCountPill: {
    backgroundColor: THEME.surface4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  relCountText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    color: THEME.text3,
    fontWeight: '700',
  },
  relationsBranchList: {
    marginLeft: 26,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: THEME.border,
    marginTop: 4,
    gap: 3,
  },
  relRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  relLineV: {
    position: 'absolute',
    left: -8,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: THEME.border,
  },
  relLineH: {
    position: 'absolute',
    left: -8,
    top: 11,
    width: 8,
    height: 1,
    backgroundColor: THEME.border,
  },
  relDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 6,
  },
  relTypeLabel: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    marginRight: 4,
  },
  relTargetText: {
    fontSize: 11,
    color: THEME.text2,
    flex: 1,
  },
});
