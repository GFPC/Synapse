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
  Alert,
} from 'react-native';
import { SynapseNode, NodeType, Comment, NodeRelation } from '../../types';
import { THEME, NODE_TYPE_CONFIG, RELATION_CONFIG } from '../../theme/tokens';
import { useSynapseMobileStore } from '../../store/synapseMobileStore';
import { BenchmarkMeter } from '../nodes/BenchmarkMeter';

interface Props {
  node: SynapseNode | null;
  visible: boolean;
  onClose: () => void;
}

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
    updateNode,
    deleteNode,
  } = useSynapseMobileStore();

  const [activeTab, setActiveTab] = useState<'spec' | 'relations' | 'comments'>('spec');
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (node) {
      setEditTitle(node.title || '');
      setEditContent(node.content || '');
      setEditTags(node.tags ? node.tags.join(', ') : '');
      setIsEditing(false);
      fetchComments(node.id);
    }
  }, [node?.id]);

  if (!node) return null;

  const conf = NODE_TYPE_CONFIG[node.type as NodeType] || {
    label: node.type,
    color: '#8A8A94',
    icon: '??',
  };

  const nodeComments = commentsMap[node.id] || [];

  const nodeRelations = relations.filter(
    (r) => r.from_node_id === node.id || r.to_node_id === node.id
  );

  const nodeMap = new Map<string, SynapseNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateNode(node.id, { status: newStatus });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      const tags = editTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
      await updateNode(node.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        tags,
      });
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save node: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addComment(node.id, commentText.trim());
      setCommentText('');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Node', `Are you sure you want to delete [${node.display_id}]?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNode(node.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* 1. Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.idChip, { backgroundColor: `${conf.color}20`, borderColor: `${conf.color}50` }]}>
                <Text style={[styles.idText, { color: conf.color }]}>{node.display_id}</Text>
              </View>
              <Text style={styles.typeLabel}>{conf.label}</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Text style={styles.headerBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Title & Status Bar */}
          <View style={styles.titleSection}>
            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Node title"
                placeholderTextColor="#6B7280"
              />
            ) : (
              <Text style={styles.titleText}>{node.title}</Text>
            )}

            {/* Status Selector Pills */}
            <View style={styles.statusRow}>
              {[
                { id: 'draft', label: 'Draft', color: '#8A8A94' },
                { id: 'in_progress', label: 'In Progress', color: '#38BDF8' },
                { id: 'completed', label: 'Completed', color: '#10B981' },
              ].map((s) => {
                const isActive = (node.status || 'draft') === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.statusSelectPill,
                      isActive && { backgroundColor: `${s.color}25`, borderColor: s.color },
                    ]}
                    onPress={() => handleStatusChange(s.id)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                    <Text
                      style={[
                        styles.statusSelectText,
                        isActive && { color: s.color, fontWeight: '700' },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Sub-Tabs */}
          <View style={styles.tabNav}>
            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'spec' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('spec')}
            >
              <Text style={[styles.tabNavText, activeTab === 'spec' && styles.tabNavTextActive]}>
                Specification
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'relations' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('relations')}
            >
              <Text style={[styles.tabNavText, activeTab === 'relations' && styles.tabNavTextActive]}>
                Relations ({nodeRelations.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'comments' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('comments')}
            >
              <Text style={[styles.tabNavText, activeTab === 'comments' && styles.tabNavTextActive]}>
                Comments ({nodeComments.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. Tab Content */}
          <ScrollView style={styles.tabBody} contentContainerStyle={styles.tabBodyContent}>
            {activeTab === 'spec' && (
              <View style={styles.specTab}>
                {/* Benchmark metrics meter */}
                {node.type === 'benchmark' && (
                  <View style={styles.metricCard}>
                    <BenchmarkMeter meta={node.meta} />
                  </View>
                )}

                {/* Description Body */}
                {isEditing ? (
                  <View style={styles.editSection}>
                    <Text style={styles.sectionLabel}>DESCRIPTION & DETAILS</Text>
                    <TextInput
                      style={styles.contentInput}
                      value={editContent}
                      onChangeText={setEditContent}
                      placeholder="Write architecture notes or specifications..."
                      placeholderTextColor="#6B7280"
                      multiline
                      numberOfLines={6}
                    />

                    <Text style={styles.sectionLabel}>TAGS (COMMA-SEPARATED)</Text>
                    <TextInput
                      style={styles.tagsInput}
                      value={editTags}
                      onChangeText={setEditTags}
                      placeholder="c++, lock-free, lmax"
                      placeholderTextColor="#6B7280"
                    />

                    <TouchableOpacity
                      style={styles.saveButton}
                      disabled={isSaving}
                      onPress={handleSaveEdit}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.descriptionText}>
                      {node.content || 'No detailed description provided.'}
                    </Text>

                    {/* Tags */}
                    {node.tags && node.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {node.tags.map((tag, idx) => (
                          <View key={idx} style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>#{tag.replace(/^#/, '')}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Meta info */}
                    <View style={styles.metaFooter}>
                      <Text style={styles.metaText}>
                        Updated: {new Date(node.updated_at || node.created_at).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity onPress={handleDelete}>
                        <Text style={styles.deleteText}>Delete Node</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'relations' && (
              <View style={styles.relationsTab}>
                <View style={styles.relationsHeader}>
                  <Text style={styles.sectionLabel}>CONNECTED ARCHITECTURE NODES</Text>
                  <TouchableOpacity
                    style={styles.addRelBtn}
                    onPress={() => openCreateRelationModal(node)}
                  >
                    <Text style={styles.addRelBtnText}>+ Add Relation</Text>
                  </TouchableOpacity>
                </View>

                {nodeRelations.length === 0 ? (
                  <Text style={styles.emptyText}>No relations connected to this node.</Text>
                ) : (
                  nodeRelations.map((rel) => {
                    const isOut = rel.from_node_id === node.id;
                    const targetId = isOut ? rel.to_node_id : rel.from_node_id;
                    const targetNode = nodeMap.get(targetId);
                    const relConf = RELATION_CONFIG[rel.type as keyof typeof RELATION_CONFIG] || {
                      label: rel.type,
                      color: '#8A8A94',
                    };

                    return (
                      <TouchableOpacity
                        key={rel.id}
                        style={styles.relCard}
                        onPress={() => targetNode && selectNode(targetNode.id)}
                      >
                        <View style={[styles.relTypeBadge, { backgroundColor: `${relConf.color}20`, borderColor: relConf.color }]}>
                          <Text style={[styles.relTypeText, { color: relConf.color }]}>
                            {relConf.label}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.relTargetId}>
                            [{targetNode ? targetNode.display_id : '...'}] {targetNode ? targetNode.title : targetId}
                          </Text>
                        </View>
                        <Text style={styles.chevron}>?</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {activeTab === 'comments' && (
              <View style={styles.commentsTab}>
                {nodeComments.length === 0 ? (
                  <Text style={styles.emptyText}>No comments yet. Start a discussion below.</Text>
                ) : (
                  nodeComments.map((c) => (
                    <View key={c.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{c.author?.name || 'Architect'}</Text>
                        <Text style={styles.commentDate}>
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.commentContent}>{c.content}</Text>
                      <View style={styles.reactionsRow}>
                        {['??', '??', '?'].map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            style={styles.reactionBtn}
                            onPress={() => toggleReaction(node.id, c.id, emoji)}
                          >
                            <Text style={styles.reactionText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          {/* 5. Fixed Comment Input when on Comments Tab */}
          {activeTab === 'comments' && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#6B7280"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={styles.sendCommentBtn}
                disabled={isSubmittingComment || !commentText.trim()}
                onPress={handleAddComment}
              >
                <Text style={styles.sendCommentBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0E131A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#212A36',
    maxHeight: '92%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  idText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A94',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  headerBtnText: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#8A8A94',
    fontSize: 16,
    fontWeight: '700',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F0F6FC',
    marginBottom: 10,
    lineHeight: 22,
  },
  titleInput: {
    backgroundColor: '#161B22',
    color: '#F0F6FC',
    fontSize: 15,
    fontWeight: '600',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#212A36',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusSelectText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A94',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#090D12',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
  },
  tabNavItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavItemActive: {
    borderBottomColor: '#6366F1',
  },
  tabNavText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A94',
  },
  tabNavTextActive: {
    color: '#F0F6FC',
    fontWeight: '700',
  },
  tabBody: {
    flex: 1,
  },
  tabBodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  specTab: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#121820',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#212A36',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#D1D5DB',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    backgroundColor: '#161B22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#212A36',
  },
  tagBadgeText: {
    color: '#8A8A94',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  metaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
  },
  metaText: {
    color: '#6B7280',
    fontSize: 11,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  editSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A94',
    letterSpacing: 0.5,
  },
  contentInput: {
    backgroundColor: '#161B22',
    color: '#F0F6FC',
    fontSize: 13,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagsInput: {
    backgroundColor: '#161B22',
    color: '#F0F6FC',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  relationsTab: {
    gap: 10,
  },
  relationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addRelBtn: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addRelBtnText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  relCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#212A36',
    gap: 8,
  },
  relTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  relTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  relTargetId: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    color: '#8A8A94',
    fontSize: 14,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
  },
  commentsTab: {
    gap: 10,
  },
  commentItem: {
    backgroundColor: '#121820',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#212A36',
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '700',
  },
  commentDate: {
    color: '#6B7280',
    fontSize: 10,
  },
  commentContent: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  reactionBtn: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reactionText: {
    fontSize: 11,
  },
  commentInputRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#090D12',
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#F0F6FC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  sendCommentBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sendCommentBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
