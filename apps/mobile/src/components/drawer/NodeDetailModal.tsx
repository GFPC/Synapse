import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SynapseNode } from '../../types';

interface Props {
  node: SynapseNode | null;
  visible: boolean;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<Props> = ({ node, visible, onClose }) => {
  if (!node) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleArea}>
              <Text style={styles.displayId}>{node.display_id}</Text>
              <Text style={styles.typeBadge}>{node.type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.title}>{node.title}</Text>

            {/* Tags */}
            {node.tags && node.tags.length > 0 && (
              <View style={styles.tagsArea}>
                {node.tags.map((t, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Content / Markdown */}
            <View style={styles.contentBox}>
              <Text style={styles.sectionLabel}>ОПИСАНИЕ И КОНТЕКСТ</Text>
              <Text style={styles.contentText}>
                {node.content || 'Нет описания для этого узла.'}
              </Text>
            </View>

            {/* Coordinates / Metadata */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Координаты:</Text>
              <Text style={styles.metaValue}>
                X: {Math.round(node.canvas_x)}, Y: {Math.round(node.canvas_y)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Видимость:</Text>
              <Text style={styles.metaValue}>{node.visibility}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    maxHeight: '80%',
    paddingBottom: 30,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayId: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#3B82F6',
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#27272A',
    color: '#A1A1AA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  body: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 12,
  },
  tagsArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#60A5FA',
  },
  contentBox: {
    backgroundColor: '#09090B',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  contentText: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  metaLabel: {
    fontSize: 12,
    color: '#71717A',
  },
  metaValue: {
    fontSize: 12,
    color: '#D4D4D8',
    fontFamily: 'monospace',
  },
});
