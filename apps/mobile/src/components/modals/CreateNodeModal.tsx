import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';
import { useSynapseMobileStore } from '../../store/synapseMobileStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TYPES: NodeType[] = [
  'feature',
  'component',
  'decision',
  'solution',
  'problem',
  'risk',
  'benchmark',
  'deployment',
  'test',
  'note',
  'lesson',
  'link',
  'log',
];

export const CreateNodeModal: React.FC<Props> = ({ visible, onClose }) => {
  const { createNode } = useSynapseMobileStore();
  const [type, setType] = useState<NodeType>('feature');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const posX = 150 + Math.floor(Math.random() * 300);
      const posY = 150 + Math.floor(Math.random() * 300);

      await createNode({
        type,
        title: title.trim(),
        content: content.trim(),
        tags: tagList,
        canvas_x: posX,
        canvas_y: posY,
      });

      setTitle('');
      setContent('');
      setTags('');
      onClose();
    } catch (e) {
      console.warn('Failed to create node', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Architecture Node</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <Text style={styles.label}>NODE TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {TYPES.map((t) => {
                const conf = NODE_TYPE_CONFIG[t];
                const isSelected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? conf.bg : THEME.surface2,
                        borderColor: isSelected ? conf.color : THEME.border,
                      },
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeIcon, { color: conf.color }]}>{conf.iconText}</Text>
                    <Text
                      style={[
                        styles.typeText,
                        isSelected && { color: THEME.text1, fontWeight: '700' },
                      ]}
                    >
                      {conf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title Input */}
            <Text style={styles.label}>NODE TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. High-Throughput Raft State Machine..."
              placeholderTextColor={THEME.text4}
              value={title}
              onChangeText={setTitle}
            />

            {/* Content Input */}
            <Text style={styles.label}>DESCRIPTION & ARCHITECTURAL CONTEXT</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detail technical requirements, trade-offs, edge cases, SLOs..."
              placeholderTextColor={THEME.text4}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
            />

            {/* Tags Input */}
            <Text style={styles.label}>TAGS (COMMA SEPARATED)</Text>
            <TextInput
              style={styles.input}
              placeholder="core, grpc, consensus, cache"
              placeholderTextColor={THEME.text4}
              value={tags}
              onChangeText={setTags}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, (!title.trim() || loading) && styles.submitBtnDisabled]}
              onPress={handleCreate}
              disabled={!title.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#09090B" />
              ) : (
                <Text style={styles.submitBtnText}>⚡ Add to Architecture</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.surface1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: THEME.border2,
    maxHeight: '90%',
    paddingBottom: 30,
  },
  handleBar: {
    width: 38,
    height: 4,
    backgroundColor: THEME.surface4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: THEME.text3,
  },
  body: {
    padding: 20,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    marginRight: 8,
  },
  typeIcon: {
    fontSize: 12,
  },
  typeText: {
    fontSize: 12,
    color: THEME.text3,
    fontWeight: '500',
  },
  input: {
    backgroundColor: THEME.surface2,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.text1,
    fontSize: 13,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: THEME.accent,
    borderRadius: THEME.radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '700',
  },
});
