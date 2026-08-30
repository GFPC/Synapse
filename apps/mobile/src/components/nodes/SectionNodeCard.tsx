import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SynapseNode, NodeRelation, NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG, RELATION_CONFIG, RelationConfig } from '../../theme/tokens';
import { BenchmarkMeter } from './BenchmarkMeter';

interface Props {
  node: SynapseNode;
  relations: NodeRelation[];
  allNodes: SynapseNode[];
  onPress: () => void;
  onDoublePress?: () => void;
  onAddRelation?: () => void;
}

export const SectionNodeCard: React.FC<Props> = ({
  node,
  relations,
  allNodes,
  onPress,
  onDoublePress,
  onAddRelation,
}) => {
  const conf = NODE_TYPE_CONFIG[node.type as NodeType] || NODE_TYPE_CONFIG.note;
  const isBenchmark = node.type === 'benchmark';

  const nodeMap = new Map<string, SynapseNode>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));

  const nodeRelations = relations.filter(
    (r) => r.from_node_id === node.id || r.to_node_id === node.id
  );

  const statusColor =
    node.status === 'completed' || node.status === 'closed' || node.status === 'accepted'
      ? THEME.status.ok
      : node.status === 'blocked'
      ? THEME.status.crit
      : node.status === 'in_progress'
      ? THEME.status.warn
      : THEME.status.muted;

  const authorInitials = node.author?.name
    ? node.author.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'LA';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onDoublePress || onAddRelation}
    >
      {/* Top Meta Line: ID, Type Label, Status */}
      <View style={styles.topRow}>
        <View style={styles.typeGroup}>
          <Text style={[styles.displayId, { color: conf.color }]}>
            {node.display_id}
          </Text>
          <Text style={styles.typeLabel}>{conf.label}</Text>
        </View>

        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{node.status || 'active'}</Text>
        </View>
      </View>

      {/* Node Title */}
      <Text style={styles.title}>{node.title}</Text>

      {/* Benchmark Latency & Throughput Meter */}
      {isBenchmark && <BenchmarkMeter meta={node.meta} />}

      {/* Content Preview */}
      {node.content ? (
        <Text style={styles.contentSnippet} numberOfLines={2}>
          {node.content}
        </Text>
      ) : null}

      {/* Connected Relations Chips */}
      {nodeRelations.length > 0 && (
        <View style={styles.relationsContainer}>
          {nodeRelations.slice(0, 2).map((rel) => {
            const isOut = rel.from_node_id === node.id;
            const target = isOut ? nodeMap.get(rel.to_node_id) : nodeMap.get(rel.from_node_id);
            const relConf: RelationConfig =
              RELATION_CONFIG[rel.type as keyof typeof RELATION_CONFIG] || RELATION_CONFIG.related;

            return (
              <View
                key={rel.id}
                style={[
                  styles.relChip,
                  {
                    borderColor: `${relConf.color}33`,
                    backgroundColor: `${relConf.color}0D`,
                  },
                ]}
              >
                <Text style={[styles.relSymbol, { color: relConf.color }]}>
                  {isOut ? '↳' : '↲'} {relConf.label}:
                </Text>
                <Text style={styles.relTargetTitle} numberOfLines={1}>
                  {target ? `[${target.display_id}] ${target.title}` : 'Graph Node'}
                </Text>
              </View>
            );
          })}
          {nodeRelations.length > 2 && (
            <Text style={styles.moreRelsText}>
              + {nodeRelations.length - 2} more
            </Text>
          )}
        </View>
      )}

      {/* Card Footer: Tags & Author */}
      <View style={styles.footer}>
        <View style={styles.tagsRow}>
          {node.tags && node.tags.length > 0 ? (
            node.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>#system</Text>
            </View>
          )}
        </View>

        <Text style={styles.authorText}>{authorInitials}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  typeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayId: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 10.5,
    color: THEME.text3,
    fontWeight: '500',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: THEME.text3,
    textTransform: 'lowercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text1,
    lineHeight: 17,
  },
  contentSnippet: {
    fontSize: 11,
    color: THEME.text3,
    lineHeight: 15,
    marginTop: 2,
  },
  relationsContainer: {
    gap: 3,
    marginTop: 4,
  },
  relChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  relSymbol: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  relTargetTitle: {
    fontSize: 10,
    color: THEME.text2,
    flex: 1,
  },
  moreRelsText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: THEME.accentBright,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  tagPill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: THEME.text4,
  },
  authorText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: THEME.text4,
  },
});
