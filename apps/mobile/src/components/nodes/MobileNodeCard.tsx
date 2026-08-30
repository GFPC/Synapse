import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SynapseNode } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';

interface Props {
  node: SynapseNode;
  isSelected?: boolean;
  isLocked?: boolean;
  lockedBy?: string;
  onPress: () => void;
}

export const MobileNodeCard: React.FC<Props> = ({
  node,
  isSelected,
  isLocked,
  lockedBy,
  onPress,
}) => {
  const config = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.note;
  const isBenchmark = node.type === 'benchmark';

  // Status mapping
  const statusColor =
    node.status === 'completed' || node.status === 'closed'
      ? THEME.status.ok
      : node.status === 'blocked'
      ? THEME.status.crit
      : node.status === 'in_progress'
      ? THEME.status.warn
      : THEME.status.muted;

  const authorInitials = node.author?.name
    ? node.author.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'LA';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: isSelected ? config.color : THEME.border,
          backgroundColor: isSelected ? `${config.color}15` : THEME.surface1,
        },
        isSelected && styles.cardSelected,
        isLocked && styles.cardLocked,
      ]}
    >
      {/* Soft Lock Badge */}
      {isLocked && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>🔒 {lockedBy || 'Редактирует коллега'}</Text>
        </View>
      )}

      {/* Header: Type icon + Display ID + Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeChip, { backgroundColor: config.bg, borderColor: config.border }]}>
            <Text style={[styles.typeIcon, { color: config.color }]}>{config.iconText}</Text>
          </View>
          <View style={[styles.idBadge, { backgroundColor: `${config.color}18` }]}>
            <Text style={[styles.idText, { color: config.color }]}>{node.display_id}</Text>
          </View>
          <Text style={styles.typeLabel}>{config.label}</Text>
        </View>

        {/* Status dot */}
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusLabel}>{node.status || 'draft'}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {node.title}
      </Text>

      {/* Benchmark Smart Bar */}
      {isBenchmark && (
        <View style={styles.benchmarkBox}>
          <View style={styles.benchBarTrack}>
            <View style={[styles.benchBarFill, { backgroundColor: config.color }]} />
          </View>
          <Text style={styles.benchValText}>0.12ms p99</Text>
        </View>
      )}

      {/* Content Preview */}
      {node.content ? (
        <Text style={styles.content} numberOfLines={2}>
          {node.content}
        </Text>
      ) : null}

      {/* Footer: Tags & Author Avatar */}
      <View style={styles.footer}>
        <View style={styles.tagsContainer}>
          {node.tags && node.tags.length > 0 ? (
            node.tags.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>#core</Text>
            </View>
          )}
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{authorInitials}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 255,
    minHeight: 130,
    borderRadius: THEME.radius.lg,
    borderWidth: 1.2,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  cardSelected: {
    borderWidth: 1.8,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 9,
  },
  cardLocked: {
    borderStyle: 'dashed',
    borderColor: THEME.status.warn,
  },
  lockBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: THEME.status.warn,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
    zIndex: 10,
  },
  lockText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
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
  typeIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
  idBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 10,
    color: THEME.text3,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 6,
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
    color: THEME.text3,
    textTransform: 'lowercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text1,
    lineHeight: 17,
    marginBottom: 4,
  },
  benchmarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  benchBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: THEME.surface3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  benchBarFill: {
    width: '85%',
    height: '100%',
    borderRadius: 2,
  },
  benchValText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: THEME.accentBright,
    fontWeight: '600',
  },
  content: {
    fontSize: 11,
    color: THEME.text3,
    lineHeight: 15,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tagChip: {
    backgroundColor: THEME.surface2,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    color: THEME.text3,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.accentDim,
    borderWidth: 1,
    borderColor: THEME.accentLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.accentBright,
  },
});
