import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { SynapseNode, NodeType, Comment } from '../../types';
import { THEME, NODE_TYPE_CONFIG, RELATION_CONFIG, RelationConfig } from '../../theme/tokens';
import { useSynapseMobileStore } from '../../store/synapseMobileStore';
import { BenchmarkMeter } from '../nodes/BenchmarkMeter';

interface Props {
  node: SynapseNode | null;
  visible: boolean;
  onClose: () => void;
}

const TYPES: NodeType[] = [
  'benchmark',
  'component',
  'feature',
  'decision',
  'solution',
  'problem',
  'risk',
  'deployment',
  'test',
  'note',
  'lesson',
  'link',
  'log',
];

const STATUSES = ['in_progress', 'completed', 'blocked', 'draft', 'accepted', 'closed'];

type BenchCategory = 'throughput' | 'latency' | 'resources' | 'reliability' | 'custom';

const formatDate = (val?: string | number | null): string => {
  if (!val) return 'Recently';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Recently';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}.${m}.${y}`;
  } catch {
    return 'Recently';
  }
};

const formatTime = (val?: string | number | null): string => {
  if (!val) return 'Just now';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Just now';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return 'Just now';
  }
};

export const NodeDetailModal: React.FC<Props> = ({ node, visible, onClose }) => {
  const {
    nodes,
    relations,
    commentsMap,
    nodeModalMode,
    fetchComments,
    addComment,
    toggleReaction,
    openCreateRelationModal,
    selectNode,
    updateNode,
    deleteNode,
  } = useSynapseMobileStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'relations' | 'comments' | 'meta'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<NodeType>('component');
  const [editStatus, setEditStatus] = useState('in_progress');
  const [editTags, setEditTags] = useState('');

  // Benchmark specific states
  const [benchCat, setBenchCat] = useState<BenchCategory>('latency');
  const [latencyP50, setLatencyP50] = useState('');
  const [latencyP99, setLatencyP99] = useState('');
  const [latencySlo, setLatencySlo] = useState('');
  const [throughputOps, setThroughputOps] = useState('');
  const [throughputTps, setThroughputTps] = useState('');
  const [throughputConcurrency, setThroughputConcurrency] = useState('');
  const [memoryMb, setMemoryMb] = useState('');
  const [cpuUsage, setCpuUsage] = useState('');
  const [gcPause, setGcPause] = useState('');
  const [errorRate, setErrorRate] = useState('');
  const [packetLoss, setPacketLoss] = useState('');
  const [availability, setAvailability] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customVal, setCustomVal] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Double tap detection inside modal
  const lastTapRef = useRef<number>(0);
  const handleDoubleTapToEdit = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 350;
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      setIsEditing(true);
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    if (visible && node) {
      fetchComments(node.id);
      setIsEditing(nodeModalMode === 'edit');
      setEditTitle(node.title || '');
      setEditContent(node.content || '');
      setEditType((node.type as NodeType) || 'component');
      setEditStatus(node.status || 'in_progress');
      setEditTags((node.tags || []).join(', '));

      const meta = node.meta || {};
      const cat = (meta.benchmark_type as BenchCategory) || 'latency';
      setBenchCat(cat);
      setLatencyP50(meta.p50_latency_ms || '');
      setLatencyP99(meta.p99_latency_ms || meta.latency || '');
      setLatencySlo(meta.slo_target || '');
      setThroughputOps(meta.throughput || meta.ops_sec || '');
      setThroughputTps(meta.tps || '');
      setThroughputConcurrency(meta.concurrency || '');
      setMemoryMb(meta.memory_mb || meta.peak_ram_mb || '');
      setCpuUsage(meta.cpu_usage_pct || '');
      setGcPause(meta.gc_pause_ms || '');
      setErrorRate(meta.error_rate || '');
      setPacketLoss(meta.packet_loss || '');
      setAvailability(meta.availability || '');

      // Restore custom metric: find any key that isn't in standard known keys
      const standardKeys = new Set([
        'benchmark_type', 'p50_latency_ms', 'p99_latency_ms', 'latency', 'slo_target',
        'throughput', 'ops_sec', 'tps', 'concurrency', 'memory_mb', 'peak_ram_mb',
        'cpu_usage_pct', 'gc_pause_ms', 'error_rate', 'packet_loss', 'availability',
        'env', 'gauge_pct', 'status',
      ]);
      const customEntry = Object.entries(meta).find(([k]) => !standardKeys.has(k));
      if (customEntry) {
        const [key, rawVal] = customEntry;
        const strVal = String(rawVal);
        // Try to split off the unit (last token separated by space)
        const parts = strVal.trim().split(/\s+/);
        const unit = parts.length > 1 ? parts[parts.length - 1] : '';
        const value = parts.length > 1 ? parts.slice(0, -1).join(' ') : strVal;
        setCustomKey(key.replace(/_/g, ' '));
        setCustomVal(value);
        setCustomUnit(unit);
      } else {
        setCustomKey('');
        setCustomVal('');
        setCustomUnit('');
      }
    }
  }, [visible, node?.id, nodeModalMode]);

  const conf = node
    ? NODE_TYPE_CONFIG[node.type as NodeType] || NODE_TYPE_CONFIG.note
    : NODE_TYPE_CONFIG.note;
  const isBenchmark = node?.type === 'benchmark';

  const nodeMap = new Map<string, SynapseNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const nodeRelations = node
    ? relations.filter((r) => r.from_node_id === node.id || r.to_node_id === node.id)
    : [];

  const comments: Comment[] = node ? commentsMap[node.id] || [] : [];

  const handleSaveEdit = async () => {
    if (!node || !editTitle.trim()) return;
    setIsSaving(true);
    try {
      const tagList = editTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const meta: Record<string, any> = { ...(node.meta || {}) };
      if (editType === 'benchmark') {
        meta.benchmark_type = benchCat;
        if (benchCat === 'latency') {
          if (latencyP50.trim()) meta.p50_latency_ms = latencyP50.trim();
          if (latencyP99.trim()) meta.p99_latency_ms = latencyP99.trim();
          if (latencySlo.trim()) meta.slo_target = latencySlo.trim();
        } else if (benchCat === 'throughput') {
          if (throughputOps.trim()) meta.throughput = throughputOps.trim();
          if (throughputTps.trim()) meta.tps = throughputTps.trim();
          if (throughputConcurrency.trim()) meta.concurrency = throughputConcurrency.trim();
        } else if (benchCat === 'resources') {
          if (memoryMb.trim()) meta.memory_mb = memoryMb.trim();
          if (cpuUsage.trim()) meta.cpu_usage_pct = cpuUsage.trim();
          if (gcPause.trim()) meta.gc_pause_ms = gcPause.trim();
        } else if (benchCat === 'reliability') {
          if (errorRate.trim()) meta.error_rate = errorRate.trim();
          if (packetLoss.trim()) meta.packet_loss = packetLoss.trim();
          if (availability.trim()) meta.slo_target = availability.trim();
        } else if (benchCat === 'custom') {
          if (customKey.trim() && customVal.trim()) {
            meta[customKey.trim().toLowerCase().replace(/\s+/g, '_')] = `${customVal.trim()} ${customUnit.trim()}`.trim();
          }
        }
      }

      await updateNode(node.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        type: editType,
        status: editStatus,
        tags: tagList,
        meta,
      });

      setIsEditing(false);
    } catch (e) {
      console.warn('Failed to update node', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!node) return;
    Alert.alert(
      'Delete Architecture Node',
      `Are you sure you want to delete [${node.display_id}] ${node.title}? This will also delete related links.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await deleteNode(node.id);
            setIsDeleting(false);
            onClose();
          },
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!node || !commentText.trim()) return;
    setIsSubmittingComment(true);
    await addComment(node.id, commentText.trim());
    setCommentText('');
    setIsSubmittingComment(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {node ? (
          <View style={styles.inner}>
            {/* Header Bar */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: conf.bg, borderColor: conf.border },
                  ]}
                >
                  <Text style={[styles.typeIcon, { color: conf.color }]}>
                    {conf.iconText}
                  </Text>
                </View>
                <View>
                  <View style={styles.idRow}>
                    <Text style={[styles.displayId, { color: conf.color }]}>
                      {node.display_id}
                    </Text>
                    <Text style={styles.typeLabel}>{conf.label}</Text>
                  </View>
                  <Text style={styles.statusLabel}>status: {node.status || 'in_progress'}</Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      style={styles.cancelHeaderBtn}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      onPress={() => setIsEditing(false)}
                    >
                      <Text style={styles.cancelHeaderBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveHeaderBtn, (!editTitle.trim() || isSaving) && styles.btnDisabled]}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      onPress={handleSaveEdit}
                      disabled={!editTitle.trim() || isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.saveHeaderBtnText}>Done</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.closeBtn}
                    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    onPress={onClose}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* EDIT MODE */}
            {isEditing ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.editHeaderTitle}>EDIT NODE SPECIFICATION</Text>

                {/* Type Picker */}
                <Text style={styles.fieldLabel}>NODE TYPE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
                  {TYPES.map((t) => {
                    const c = NODE_TYPE_CONFIG[t];
                    const isSelected = editType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeChip,
                          {
                            backgroundColor: isSelected ? c.bg : THEME.surface2,
                            borderColor: isSelected ? c.color : THEME.border,
                          },
                        ]}
                        onPress={() => setEditType(t)}
                      >
                        <Text style={[styles.typeIcon, { color: c.color }]}>{c.iconText}</Text>
                        <Text style={[styles.typeText, isSelected && { color: THEME.text1, fontWeight: '700' }]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Status Picker */}
                <Text style={styles.fieldLabel}>LIFECYCLE STATUS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
                  {STATUSES.map((s) => {
                    const isSelected = editStatus === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusChip, isSelected && styles.statusChipActive]}
                        onPress={() => setEditStatus(s)}
                      >
                        <Text style={[styles.statusChipText, isSelected && styles.statusChipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Title Input */}
                <Text style={styles.fieldLabel}>TITLE *</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Node title..."
                  placeholderTextColor={THEME.text4}
                />

                {/* BENCHMARK DYNAMIC METRICS BUILDER */}
                {editType === 'benchmark' && (
                  <View style={styles.benchmarkBox}>
                    <Text style={styles.benchHeaderTitle}>BENCHMARK METRIC CATEGORY</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.benchCatRow}>
                      {[
                        { id: 'latency', label: '⏱️ Latency & SLO' },
                        { id: 'throughput', label: '⚡ Throughput & TPS' },
                        { id: 'resources', label: '💾 Memory & CPU' },
                        { id: 'reliability', label: '🛡️ Reliability & Errors' },
                        { id: 'custom', label: '⚙️ Custom Metric' },
                      ].map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.benchCatChip,
                            benchCat === cat.id && styles.benchCatChipActive,
                          ]}
                          onPress={() => setBenchCat(cat.id as BenchCategory)}
                        >
                          <Text
                            style={[
                              styles.benchCatText,
                              benchCat === cat.id && styles.benchCatTextActive,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Latency Mode Inputs */}
                    {benchCat === 'latency' && (
                      <View style={styles.benchInputsRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>p50 LATENCY</Text>
                          <TextInput
                            style={styles.input}
                            value={latencyP50}
                            onChangeText={setLatencyP50}
                            placeholder="0.05ms"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>p99 LATENCY</Text>
                          <TextInput
                            style={styles.input}
                            value={latencyP99}
                            onChangeText={setLatencyP99}
                            placeholder="0.12ms"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>SLO TARGET</Text>
                          <TextInput
                            style={styles.input}
                            value={latencySlo}
                            onChangeText={setLatencySlo}
                            placeholder="< 1.0ms"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                      </View>
                    )}

                    {/* Throughput Mode Inputs */}
                    {benchCat === 'throughput' && (
                      <View style={styles.benchInputsRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>OPS / SEC</Text>
                          <TextInput
                            style={styles.input}
                            value={throughputOps}
                            onChangeText={setThroughputOps}
                            placeholder="6,000,000 ops/s"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>TPS (SETTLEMENT)</Text>
                          <TextInput
                            style={styles.input}
                            value={throughputTps}
                            onChangeText={setThroughputTps}
                            placeholder="450,000 TPS"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>CONCURRENCY</Text>
                          <TextInput
                            style={styles.input}
                            value={throughputConcurrency}
                            onChangeText={setThroughputConcurrency}
                            placeholder="1,000 clients"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                      </View>
                    )}

                    {/* Resource Mode Inputs */}
                    {benchCat === 'resources' && (
                      <View style={styles.benchInputsRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>PEAK RAM (RSS)</Text>
                          <TextInput
                            style={styles.input}
                            value={memoryMb}
                            onChangeText={setMemoryMb}
                            placeholder="128 MB"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>CPU LOAD %</Text>
                          <TextInput
                            style={styles.input}
                            value={cpuUsage}
                            onChangeText={setCpuUsage}
                            placeholder="18.5%"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>GC PAUSE (MAX)</Text>
                          <TextInput
                            style={styles.input}
                            value={gcPause}
                            onChangeText={setGcPause}
                            placeholder="0.02ms"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                      </View>
                    )}

                    {/* Reliability Mode Inputs */}
                    {benchCat === 'reliability' && (
                      <View style={styles.benchInputsRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>ERROR RATE</Text>
                          <TextInput
                            style={styles.input}
                            value={errorRate}
                            onChangeText={setErrorRate}
                            placeholder="0.0001%"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>PACKET LOSS</Text>
                          <TextInput
                            style={styles.input}
                            value={packetLoss}
                            onChangeText={setPacketLoss}
                            placeholder="0.0%"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>AVAILABILITY</Text>
                          <TextInput
                            style={styles.input}
                            value={availability}
                            onChangeText={setAvailability}
                            placeholder="99.999%"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                      </View>
                    )}

                    {/* Custom Key-Value Inputs */}
                    {benchCat === 'custom' && (
                      <View style={styles.benchInputsRow}>
                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.subLabel}>METRIC NAME</Text>
                          <TextInput
                            style={styles.input}
                            value={customKey}
                            onChangeText={setCustomKey}
                            placeholder="Compression Ratio"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>VALUE</Text>
                          <TextInput
                            style={styles.input}
                            value={customVal}
                            onChangeText={setCustomVal}
                            placeholder="4.8"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                        <View style={{ flex: 0.8 }}>
                          <Text style={styles.subLabel}>UNIT</Text>
                          <TextInput
                            style={styles.input}
                            value={customUnit}
                            onChangeText={setCustomUnit}
                            placeholder="x"
                            placeholderTextColor={THEME.text4}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Content / Architectural Context */}
                <Text style={styles.fieldLabel}>DESCRIPTION & ARCHITECTURAL CONTEXT</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="Detailed architectural context..."
                  placeholderTextColor={THEME.text4}
                  multiline
                  numberOfLines={5}
                />

                {/* System Tags */}
                <Text style={styles.fieldLabel}>TAGS (COMMA SEPARATED)</Text>
                <TextInput
                  style={styles.input}
                  value={editTags}
                  onChangeText={setEditTags}
                  placeholder="fintech, grpc, lmax"
                  placeholderTextColor={THEME.text4}
                />

                {/* Actions: Save & Delete */}
                <View style={styles.editActionsRow}>
                  <TouchableOpacity
                    style={[styles.saveBtn, (!editTitle.trim() || isSaving) && styles.btnDisabled]}
                    onPress={handleSaveEdit}
                    disabled={!editTitle.trim() || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Text style={styles.deleteBtnText}>Delete Node</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <>
                {/* Tab Navigation */}
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'overview' ? styles.tabBtnActive : null]}
                    onPress={() => setActiveTab('overview')}
                  >
                    <Text style={[styles.tabText, activeTab === 'overview' ? styles.tabTextActive : null]}>
                      Overview
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'relations' ? styles.tabBtnActive : null]}
                    onPress={() => setActiveTab('relations')}
                  >
                    <Text style={[styles.tabText, activeTab === 'relations' ? styles.tabTextActive : null]}>
                      Relations ({nodeRelations.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'comments' ? styles.tabBtnActive : null]}
                    onPress={() => setActiveTab('comments')}
                  >
                    <Text style={[styles.tabText, activeTab === 'comments' ? styles.tabTextActive : null]}>
                      Discussion ({comments.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'meta' ? styles.tabBtnActive : null]}
                    onPress={() => setActiveTab('meta')}
                  >
                    <Text style={[styles.tabText, activeTab === 'meta' ? styles.tabTextActive : null]}>
                      Meta JSON
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Main Content Area */}
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <View style={styles.tabSection}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleDoubleTapToEdit}
                      >
                        <Text style={styles.title}>{node.title}</Text>
                      </TouchableOpacity>

                      {isBenchmark && <BenchmarkMeter meta={node.meta} />}

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleDoubleTapToEdit}
                        style={styles.cardBox}
                      >
                        <View style={styles.boxHeaderRow}>
                          <Text style={styles.boxTitle}>DESCRIPTION & ARCHITECTURAL CONTEXT</Text>
                          <Text style={styles.doubleTapHint}>DOUBLE-TAP TO EDIT</Text>
                        </View>
                        <Text style={styles.contentText}>
                          {node.content || 'No architectural description provided for this node.'}
                        </Text>
                      </TouchableOpacity>

                      {/* Tags Section */}
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleDoubleTapToEdit}
                        style={styles.cardBox}
                      >
                        <Text style={styles.boxTitle}>SYSTEM TAGS</Text>
                        <View style={styles.tagsWrap}>
                          {node.tags && node.tags.length > 0 ? (
                            node.tags.map((t, i) => (
                              <View key={i} style={styles.tagPill}>
                                <Text style={styles.tagText}>#{t}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.noDataText}>No tags assigned</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Author & Timestamps */}
                      <View style={styles.metaRow}>
                        <Text style={styles.metaItem}>
                          Author: {node.author?.name || 'Lead Architect'}
                        </Text>
                        <Text style={styles.metaItem}>
                          Updated: {formatDate(node.updated_at)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* TAB 2: RELATIONS */}
                  {activeTab === 'relations' && (
                    <View style={styles.tabSection}>
                      <View style={styles.relHeaderRow}>
                        <Text style={styles.boxTitle}>CONNECTED GRAPH NODES</Text>
                        <TouchableOpacity
                          style={styles.addRelBtn}
                          onPress={() => openCreateRelationModal(node)}
                        >
                          <Text style={styles.addRelBtnText}>＋ Add Relation</Text>
                        </TouchableOpacity>
                      </View>

                      {nodeRelations.length === 0 ? (
                        <View style={styles.emptyRelBox}>
                          <Text style={styles.emptyRelText}>
                            This node has no active graph relationships yet.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.relsList}>
                          {nodeRelations.map((rel) => {
                            const isOut = rel.from_node_id === node.id;
                            const target = isOut ? nodeMap.get(rel.to_node_id) : nodeMap.get(rel.from_node_id);
                            const relConf: RelationConfig =
                              RELATION_CONFIG[rel.type as keyof typeof RELATION_CONFIG] ||
                              RELATION_CONFIG.related;

                            return (
                              <TouchableOpacity
                                key={rel.id}
                                style={styles.relationCard}
                                activeOpacity={0.75}
                                onPress={() => target && selectNode(target.id)}
                              >
                                <View style={styles.relBadgeBox}>
                                  <Text style={[styles.relDirectionText, { color: relConf.color }]}>
                                    {isOut ? 'OUTGOING' : 'INCOMING'}
                                  </Text>
                                  <View
                                    style={[
                                      styles.relTypePill,
                                      { backgroundColor: `${relConf.color}20`, borderColor: relConf.color },
                                    ]}
                                  >
                                    <Text style={[styles.relTypeTitle, { color: relConf.color }]}>
                                      {relConf.label}
                                    </Text>
                                  </View>
                                </View>

                                <Text style={styles.relTargetTitle}>
                                  {target ? `[${target.display_id}] ${target.title}` : 'Remote Node'}
                                </Text>

                                {rel.note ? (
                                  <Text style={styles.relNoteText}>Note: {rel.note}</Text>
                                ) : null}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}

                  {/* TAB 3: COMMENTS & REACTIONS */}
                  {activeTab === 'comments' && (
                    <View style={styles.tabSection}>
                      <Text style={styles.boxTitle}>ARCHITECTURE PEER REVIEW</Text>

                      {/* Add Comment Input */}
                      <View style={styles.addCommentBox}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Add your architectural feedback..."
                          placeholderTextColor={THEME.text4}
                          value={commentText}
                          onChangeText={setCommentText}
                          multiline
                        />
                        <TouchableOpacity
                          style={[
                            styles.sendCommentBtn,
                            !commentText.trim() ? styles.btnDisabled : null,
                          ]}
                          disabled={!commentText.trim() || isSubmittingComment}
                          onPress={handleAddComment}
                        >
                          {isSubmittingComment ? (
                            <ActivityIndicator size="small" color="#000" />
                          ) : (
                            <Text style={styles.sendCommentText}>Post Review</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Comments Thread */}
                      {comments.length === 0 ? (
                        <View style={styles.emptyRelBox}>
                          <Text style={styles.emptyRelText}>
                            No discussion reviews yet. Be the first to comment!
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.commentsList}>
                          {comments.map((comm) => (
                            <View key={comm.id} style={styles.commentItem}>
                              <View style={styles.commentHead}>
                                <View style={styles.commentAvatar}>
                                  <Text style={styles.commentAvatarText}>LA</Text>
                                </View>
                                <View>
                                  <Text style={styles.commentAuthor}>
                                    {comm.author?.name || 'Lead Architect'}
                                  </Text>
                                  <Text style={styles.commentDate}>
                                    {formatTime(comm.created_at)}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.commentBody}>{comm.content}</Text>

                              {/* Emoji Reactions Row */}
                              <View style={styles.reactionsRow}>
                                {['👍', '✅', '❓', '❤️'].map((emoji) => {
                                  const count =
                                    comm.reactions?.filter((r) => r.emoji === emoji).length || 0;
                                  return (
                                    <TouchableOpacity
                                      key={emoji}
                                      style={[
                                        styles.emojiBtn,
                                        count > 0 ? styles.emojiBtnActive : null,
                                      ]}
                                      onPress={() => toggleReaction(node.id, comm.id, emoji)}
                                    >
                                      <Text style={styles.emojiText}>{emoji}</Text>
                                      {count > 0 && (
                                        <Text style={styles.emojiCount}>{count}</Text>
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* TAB 4: META JSON */}
                  {activeTab === 'meta' && (
                    <View style={styles.tabSection}>
                      <Text style={styles.boxTitle}>RAW NODE METADATA (JSON)</Text>
                      <View style={styles.jsonBox}>
                        <Text style={styles.jsonText}>
                          {JSON.stringify(node.meta || {}, null, 2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME.accent} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  inner: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    zIndex: 10,
  },
  cancelHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: THEME.surface2,
  },
  cancelHeaderBtnText: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '600',
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: THEME.accent,
  },
  saveHeaderBtnText: {
    fontSize: 11,
    color: '#000',
    fontWeight: '700',
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 15,
    fontWeight: '700',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayId: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 12,
    color: THEME.text3,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: THEME.text4,
  },
  closeBtn: {
    backgroundColor: THEME.surface2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: THEME.text2,
  },
  editHeaderTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: THEME.accentBright,
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.5,
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
    gap: 8,
  },
  benchHeaderTitle: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  benchCatRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  benchCatChip: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  benchCatChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  benchCatText: {
    fontSize: 10,
    color: THEME.text3,
    fontWeight: '600',
  },
  benchCatTextActive: {
    color: '#818CF8',
    fontWeight: '700',
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
    height: 90,
    textAlignVertical: 'top',
  },
  editActionsRow: {
    marginTop: 20,
    marginBottom: 30,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.accent,
  },
  tabText: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '500',
  },
  tabTextActive: {
    color: THEME.accentBright,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabSection: {
    gap: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text1,
    lineHeight: 20,
  },
  cardBox: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    gap: 8,
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxTitle: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.5,
  },
  doubleTapHint: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700',
    color: THEME.accentBright,
    letterSpacing: 0.4,
    opacity: 0.7,
  },
  contentText: {
    fontSize: 12.5,
    color: THEME.text2,
    lineHeight: 18,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: THEME.accentBright,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 12,
    color: THEME.text4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  metaItem: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: THEME.text4,
  },
  relHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addRelBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addRelBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  emptyRelBox: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    padding: 16,
    alignItems: 'center',
  },
  emptyRelText: {
    fontSize: 12,
    color: THEME.text3,
    textAlign: 'center',
  },
  relsList: {
    gap: 8,
  },
  relationCard: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    gap: 6,
  },
  relBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relDirectionText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
  },
  relTypePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  relTypeTitle: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
  },
  relTargetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  relNoteText: {
    fontSize: 11,
    color: THEME.text3,
  },
  addCommentBox: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    gap: 8,
  },
  commentInput: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    padding: 8,
    fontSize: 12,
    color: THEME.text1,
    minHeight: 50,
  },
  sendCommentBtn: {
    backgroundColor: THEME.accent,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sendCommentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  commentsList: {
    gap: 8,
  },
  commentItem: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    gap: 6,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: THEME.text2,
  },
  commentAuthor: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.text1,
  },
  commentDate: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: THEME.text4,
  },
  commentBody: {
    fontSize: 12,
    color: THEME.text2,
    lineHeight: 16,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  emojiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
  },
  emojiBtnActive: {
    backgroundColor: THEME.accentDim,
    borderWidth: 1,
    borderColor: THEME.accentLine,
  },
  emojiText: {
    fontSize: 11,
  },
  emojiCount: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: THEME.accentBright,
    fontWeight: '700',
  },
  jsonBox: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.accentBright,
    lineHeight: 15,
  },
});
