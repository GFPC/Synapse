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
  'component',
  'feature',
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

const STATUSES = ['in_progress', 'completed', 'blocked', 'draft', 'accepted'];

export const CreateNodeModal: React.FC<Props> = ({ visible, onClose }) => {
  const { createNode } = useSynapseMobileStore();
  const [type, setType] = useState<NodeType>('component');
  const [status, setStatus] = useState<string>('in_progress');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Benchmark specific fields
  const [latency, setLatency] = useState('');
  const [throughput, setThroughput] = useState('');
  const [slo, setSlo] = useState('');

  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags('');
    setLatency('');
    setThroughput('');
    setSlo('');
    setStatus('in_progress');
    setType('component');
  };

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

      const meta: Record<string, any> = {};
      if (type === 'benchmark') {
        if (latency.trim()) meta.p99_latency_ms = latency.trim();
        if (throughput.trim()) meta.throughput = throughput.trim();
        if (slo.trim()) meta.slo_target = slo.trim();
      }

      await createNode({
        type,
        status,
        title: title.trim(),
        content: content.trim(),
        tags: tagList,
        meta,
        canvas_x: posX,
        canvas_y: posY,
      });

      resetForm();
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
            <Text style={styles.headerTitle}>CREATE ARCHITECTURE NODE</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <Text style={styles.label}>NODE TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
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

            {/* Status Selector */}
            <Text style={styles.label}>STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
              {STATUSES.map((s) => {
                const isSelected = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusChip,
                      isSelected && styles.statusChipActive,
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isSelected && styles.statusChipTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title Input */}
            <Text style={styles.label}>NODE TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Distributed In-Memory Key-Value Store"
              placeholderTextColor={THEME.text4}
              value={title}
              onChangeText={setTitle}
            />

            {/* Benchmark Specific Fields */}
            {type === 'benchmark' && (
              <View style={styles.benchmarkBox}>
                <Text style={styles.boxTitle}>SLO & BENCHMARK METRICS</Text>
                <View style={styles.benchInputsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>p99 LATENCY</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.15ms"
                      placeholderTextColor={THEME.text4}
                      value={latency}
                      onChangeText={setLatency}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>THROUGHPUT</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="120k ops/sec"
                      placeholderTextColor={THEME.text4}
                      value={throughput}
                      onChangeText={setThroughput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>SLO TARGET</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="< 1.0ms"
                      placeholderTextColor={THEME.text4}
                      value={slo}
                      onChangeText={setSlo}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Content Input */}
            <Text style={styles.label}>DESCRIPTION & ARCHITECTURAL CONTEXT</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Technical implementation details, constraints, design tradeoffs, dependencies..."
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
              placeholder="grpc, storage, latency, raft"
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
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>⚡ Create Node</Text>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border2,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: THEME.surface4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text3,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 14,
    color: THEME.text3,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 6,
  },
  horizontalRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  typeIcon: {
    fontSize: 11,
  },
  typeText: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '500',
  },
  statusChip: {
    backgroundColor: THEME.surface2,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  statusChipActive: {
    backgroundColor: THEME.accentDim,
    borderColor: THEME.accentLine,
  },
  statusChipText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.text3,
  },
  statusChipTextActive: {
    color: THEME.accentBright,
    fontWeight: '700',
  },
  benchmarkBox: {
    backgroundColor: THEME.surface2,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 8,
    gap: 6,
  },
  boxTitle: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  benchInputsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: THEME.text4,
    marginBottom: 3,
  },
  input: {
    backgroundColor: THEME.surface2,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: THEME.text1,
    fontSize: 12.5,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
});
