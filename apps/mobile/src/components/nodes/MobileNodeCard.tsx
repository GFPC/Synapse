import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SynapseNode, NodeType } from '../../types';

const TYPE_COLORS: Record<NodeType, { border: string; bg: string; text: string; label: string }> = {
  problem: { border: '#EF4444', bg: '#451A1A', text: '#FCA5A5', label: 'Problem' },
  solution: { border: '#10B981', bg: '#064E3B', text: '#6EE7B7', label: 'Solution' },
  decision: { border: '#8B5CF6', bg: '#3B0764', text: '#D8B4FE', label: 'Decision' },
  feature: { border: '#3B82F6', bg: '#172554', text: '#93C5FD', label: 'Feature' },
  component: { border: '#F59E0B', bg: '#451A03', text: '#FCD34D', label: 'Component' },
  risk: { border: '#EC4899', bg: '#500724', text: '#F9A8D4', label: 'Risk' },
  test: { border: '#14B8A6', bg: '#042F2C', text: '#5EEAD4', label: 'Test' },
  benchmark: { border: '#6366F1', bg: '#1E1B4B', text: '#A5B4FC', label: 'Benchmark' },
  note: { border: '#64748B', bg: '#1E293B', text: '#CBD5E1', label: 'Note' },
  lesson: { border: '#EAB308', bg: '#422006', text: '#FDE047', label: 'Lesson' },
  link: { border: '#06B6D4', bg: '#083344', text: '#67E8F9', label: 'Link' },
  deployment: { border: '#22C55E', bg: '#052E16', text: '#86EFAC', label: 'Deploy' },
  log: { border: '#71717A', bg: '#18181B', text: '#D4D4D8', label: 'Log' },
};

interface Props {
  node: SynapseNode;
  isSelected?: boolean;
  onPress: () => void;
}

export const MobileNodeCard: React.FC<Props> = ({ node, isSelected, onPress }) => {
  const typeStyle = TYPE_COLORS[node.type] || TYPE_COLORS.note;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: isSelected ? '#3B82F6' : '#27272A' },
        isSelected && styles.cardSelected,
      ]}
    >
      {/* Header Badge */}
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
          <Text style={[styles.typeText, { color: typeStyle.text }]}>{typeStyle.label}</Text>
        </View>
        <Text style={styles.displayId}>{node.display_id}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {node.title}
      </Text>

      {/* Content Preview */}
      {node.content ? (
        <Text style={styles.content} numberOfLines={2}>
          {node.content}
        </Text>
      ) : null}

      {/* Tags Footer */}
      {node.tags && node.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {node.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    minHeight: 120,
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  displayId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#A1A1AA',
    fontWeight: '600',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FAFAFA',
    lineHeight: 17,
    marginBottom: 4,
  },
  content: {
    fontSize: 11,
    color: '#A1A1AA',
    lineHeight: 15,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 'auto',
  },
  tagChip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    color: '#A1A1AA',
  },
});
