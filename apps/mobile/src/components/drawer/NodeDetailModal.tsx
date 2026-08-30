import React, { useState, useEffect } from 'react';
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
    fetchComments,
    addComment,
    toggleReaction,
    openCreateRelationModal,
    selectNode,
  } = useSynapseMobileStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'relations' | 'comments' | 'meta'>('overview');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (visible && node) {
      fetchComments(node.id);
    }
  }, [visible, node?.id]);

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

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

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
                  <Text style={styles.title}>{node.title}</Text>

                  {isBenchmark && <BenchmarkMeter meta={node.meta} />}

                  <View style={styles.cardBox}>
                    <Text style={styles.boxTitle}>DESCRIPTION & ARCHITECTURAL CONTEXT</Text>
                    <Text style={styles.contentText}>
                      {node.content || 'No architectural description provided for this node.'}
                    </Text>
                  </View>

                  {/* Tags Section */}
                  <View style={styles.cardBox}>
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
                  </View>

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
    flex: 1,
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
  boxTitle: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.5,
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
