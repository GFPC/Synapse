import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SynapseNode, NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';

interface Props {
  node: SynapseNode | null;
  visible: boolean;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<Props> = ({ node, visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'relations' | 'comments'>('overview');

  if (!node) return null;

  const config = NODE_TYPE_CONFIG[node.type as NodeType] || NODE_TYPE_CONFIG.note;

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
            <View style={styles.headerLeft}>
              <View style={[styles.typeChip, { backgroundColor: config.bg, borderColor: config.border }]}>
                <Text style={[styles.typeIcon, { color: config.color }]}>{config.iconText}</Text>
              </View>
              <Text style={[styles.displayId, { color: config.color }]}>{node.display_id}</Text>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: THEME.status.ok }]} />
                <Text style={styles.statusText}>{node.status || 'active'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Обзор
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'relations' && styles.tabBtnActive]}
              onPress={() => setActiveTab('relations')}
            >
              <Text style={[styles.tabText, activeTab === 'relations' && styles.tabTextActive]}>
                Связи графа
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'comments' && styles.tabBtnActive]}
              onPress={() => setActiveTab('comments')}
            >
              <Text style={[styles.tabText, activeTab === 'comments' && styles.tabTextActive]}>
                Обсуждение
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'overview' && (
              <>
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

                {/* Content Box */}
                <View style={styles.contentBox}>
                  <Text style={styles.sectionLabel}>КОНТЕКСТ И ОПИСАНИЕ</Text>
                  <Text style={styles.contentText}>
                    {node.content || 'Описание отсутствует.'}
                  </Text>
                </View>

                {/* Metadata Grid */}
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Координаты на холсте:</Text>
                    <Text style={styles.metaVal}>X: {Math.round(node.canvas_x)}, Y: {Math.round(node.canvas_y)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Видимость:</Text>
                    <Text style={styles.metaVal}>{node.visibility}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Тип узла:</Text>
                    <Text style={[styles.metaVal, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
              </>
            )}

            {activeTab === 'relations' && (
              <View style={styles.relationsBox}>
                <Text style={styles.sectionLabel}>АРХИТЕКТУРНЫЕ ЗАВИСИМОСТИ</Text>
                <View style={styles.relItem}>
                  <Text style={styles.relTypeBadge}>depends_on</Text>
                  <Text style={styles.relTargetText}>Edge Gateway & Reverse Proxy (Nginx)</Text>
                </View>
                <View style={styles.relItem}>
                  <Text style={styles.relTypeBadge}>implements</Text>
                  <Text style={styles.relTargetText}>Bi-directional WebSocket Room Multiplexer</Text>
                </View>
              </View>
            )}

            {activeTab === 'comments' && (
              <View style={styles.commentsBox}>
                <Text style={styles.sectionLabel}>РЕАКЦИИ И ОБСУЖДЕНИЕ</Text>
                <View style={styles.commentItem}>
                  <View style={styles.commentHead}>
                    <Text style={styles.commentAuthor}>Lead Architect</Text>
                    <Text style={styles.commentTime}>2ч назад</Text>
                  </View>
                  <Text style={styles.commentBody}>
                    Решение утверждено и согласовано на архитектурном комитете.
                  </Text>
                  <View style={styles.reactionsRow}>
                    <TouchableOpacity style={styles.reactionBtn}>
                      <Text style={styles.reactionText}>👍 4</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionBtn}>
                      <Text style={styles.reactionText}>✅ 2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionBtn}>
                      <Text style={styles.reactionText}>❤️ 1</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.surface1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: THEME.border2,
    maxHeight: '84%',
    paddingBottom: 34,
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
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  displayId: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: THEME.radius.pill,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: THEME.text2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: THEME.text3,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 6,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
  },
  tabBtnActive: {
    backgroundColor: THEME.surface3,
  },
  tabText: {
    fontSize: 12,
    color: THEME.text3,
    fontWeight: '500',
  },
  tabTextActive: {
    color: THEME.text1,
    fontWeight: '700',
  },
  body: {
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text1,
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: THEME.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tagText: {
    fontSize: 11,
    color: THEME.accentBright,
  },
  contentBox: {
    backgroundColor: THEME.bg,
    padding: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  contentText: {
    fontSize: 13,
    color: THEME.text2,
    lineHeight: 20,
  },
  metaBox: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: THEME.text3,
  },
  metaVal: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.text1,
    fontWeight: '600',
  },
  relationsBox: {
    gap: 8,
  },
  relItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.surface2,
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  relTypeBadge: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.accentBright,
    backgroundColor: THEME.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relTargetText: {
    fontSize: 12,
    color: THEME.text1,
    flex: 1,
  },
  commentsBox: {
    gap: 10,
  },
  commentItem: {
    backgroundColor: THEME.surface2,
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  commentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text1,
  },
  commentTime: {
    fontSize: 10,
    color: THEME.text4,
  },
  commentBody: {
    fontSize: 12,
    color: THEME.text2,
    lineHeight: 18,
    marginBottom: 8,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  reactionBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
  },
  reactionText: {
    fontSize: 11,
  },
});
