import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SynapseNode, NodeRelation, NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';
import { BenchmarkMeter } from './BenchmarkMeter';

interface Props {
  node: SynapseNode;
  relations: NodeRelation[];
  allNodes: SynapseNode[];
  onPress: () => void;
  onLongPress?: () => void;
}

export const SectionNodeCard: React.FC<Props> = ({
  node,
  relations,
  allNodes,
  onPress,
  onLongPress,
}) => {
  const conf = NODE_TYPE_CONFIG[node.type as NodeType] || {
    label: node.type,
    color: '#8A8A94',
    icon: '?',
  };
  const isBenchmark = node.type === 'benchmark';

  const nodeRelations = relations.filter(
    (r) => r.from_node_id === node.id || r.to_node_id === node.id
  );

  const statusColor =
    node.status === 'completed' || node.status === 'closed' || node.status === 'accepted'
      ? '#10B981'
      : node.status === 'in_progress'
      ? '#38BDF8'
      : node.status === 'blocked'
      ? '#EF4444'
      : '#8A8A94';

  const statusLabel =
    node.status === 'completed'
      ? 'Completed'
      : node.status === 'in_progress'
      ? 'In Progress'
      : node.status === 'blocked'
      ? 'Blocked'
      : 'Draft';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: conf.color }]}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Top Meta Line: ID badge, Type name, Status Pill */}
      <View style={styles.topRow}>
        <View style={styles.typeGroup}>
          <View style={[styles.idBadge, { backgroundColor: `${conf.color}18`, borderColor: `${conf.color}40` }]}>
            <Text style={[styles.displayId, { color: conf.color }]}>
              {node.display_id}
            </Text>
          </View>
          <Text style={styles.typeLabel}>{conf.label}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}35` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Node Title */}
      <Text style={styles.title}>{node.title}</Text>

      {/* Benchmark Latency & Throughput Meter if applicable */}
      {isBenchmark && <BenchmarkMeter meta={node.meta} />}

      {/* Content Preview */}
      {node.content ? (
        <Text style={styles.contentSnippet} numberOfLines={2}>
          {node.content.replace(/^[#*`\s-]+/gm, '').trim()}
        </Text>
      ) : null}

      {/* Bottom Footer: Tags and Relations Count */}
      <View style={styles.footerRow}>
        <View style={styles.tagsRow}>
          {node.tags && node.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag.replace(/^#/, '')}</Text>
            </View>
          ))}
        </View>

        {nodeRelations.length > 0 && (
          <View style={styles.relationChip}>
            <Text style={styles.relationChipText}>
              ??? {nodeRelations.length} {nodeRelations.length === 1 ? 'link' : 'links'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121820',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212A36',
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  displayId: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A94',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0F6FC',
    lineHeight: 19,
    marginBottom: 4,
  },
  contentSnippet: {
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 17,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tagChip: {
    backgroundColor: '#1A222D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#8A8A94',
    fontFamily: 'monospace',
  },
  relationChip: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relationChipText: {
    fontSize: 10,
    color: '#A5B4FC',
    fontWeight: '500',
  },
});
