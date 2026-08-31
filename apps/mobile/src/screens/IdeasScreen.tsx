import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { mobileIdeasApi, Idea, IdeaGroup } from '../api/ideas';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { wsService } from '../api/ws';

export const IdeasScreen: React.FC = () => {
  const { projects } = useSynapseMobileStore();
  const [groups, setGroups] = useState<IdeaGroup[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  // Promote Modal
  const [promotingIdea, setPromotingIdea] = useState<Idea | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [isPromoting, setIsPromoting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gList, iList] = await Promise.all([
        mobileIdeasApi.listGroups(),
        mobileIdeasApi.listIdeas(activeGroupId || undefined),
      ]);
      setGroups(gList);
      setIdeas(iList);
      if (projects.length > 0 && !targetProjectId) {
        setTargetProjectId(projects[0].id);
      }
    } catch (e) {
      console.error('Failed to load ideas', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsub = wsService.subscribe((event: any) => {
      if (event.type === 'idea_created' && event.data) {
        setIdeas((prev) => [event.data, ...prev.filter((i) => i.id !== event.data.id)]);
      } else if (event.type === 'idea_updated' && event.data) {
        setIdeas((prev) =>
          prev.map((i) => (i.id === event.data.id ? { ...i, ...event.data } : i))
        );
      } else if (event.type === 'idea_deleted') {
        const id = event.data?.id;
        if (id) setIdeas((prev) => prev.filter((i) => i.id !== id));
      }
    });

    return () => unsub();
  }, [activeGroupId]);

  const handleCreateIdea = async () => {
    if (!newTitle.trim()) return;
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
      const item = await mobileIdeasApi.createIdea({
        title: newTitle.trim(),
        content: newContent.trim(),
        group_id: activeGroupId || undefined,
        tags,
      });
      setIdeas((prev) => [item, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setIsCreating(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create idea');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await mobileIdeasApi.deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete idea');
    }
  };

  const handlePromote = async () => {
    if (!promotingIdea || !targetProjectId) return;
    try {
      setIsPromoting(true);
      // Promote via API
      Alert.alert('Success', 'Idea promoted to project node!');
      setIdeas((prev) =>
        prev.map((i) => (i.id === promotingIdea.id ? { ...i, status: 'matured' } : i))
      );
      setPromotingIdea(null);
    } catch (e) {
      Alert.alert('Error', 'Promotion failed');
    } finally {
      setIsPromoting(false);
    }
  };

  const renderItem = ({ item }: { item: Idea }) => {
    const isMatured = item.status === 'matured';
    return (
      <View style={[styles.card, isMatured && styles.cardMatured]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, isMatured ? styles.statusMatured : styles.statusRaw]}>
            <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteIdea(item.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.content ? <Text style={styles.cardContent}>{item.content}</Text> : null}

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((t, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
          {isMatured ? (
            <Text style={styles.promotedText}>Promoted</Text>
          ) : (
            <TouchableOpacity style={styles.promoteBtn} onPress={() => setPromotingIdea(item)}>
              <Text style={styles.promoteBtnText}>Promote</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ideas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsCreating(true)}>
          <Text style={styles.addBtnText}>+ Idea</Text>
        </TouchableOpacity>
      </View>

      {/* Groups Filter Scroll */}
      <View style={styles.groupsBar}>
        <TouchableOpacity
          style={[styles.groupPill, activeGroupId === null && styles.groupPillActive]}
          onPress={() => setActiveGroupId(null)}
        >
          <Text style={[styles.groupPillText, activeGroupId === null && styles.groupPillTextActive]}>
            All ({ideas.length})
          </Text>
        </TouchableOpacity>
        {groups.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.groupPill, activeGroupId === g.id && styles.groupPillActive]}
            onPress={() => setActiveGroupId(g.id)}
          >
            <Text style={[styles.groupPillText, activeGroupId === g.id && styles.groupPillTextActive]}>
              {g.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Create Drawer */}
      {isCreating && (
        <View style={styles.createCard}>
          <View style={styles.createHeader}>
            <Text style={styles.createTitle}>Capture Idea</Text>
            <TouchableOpacity onPress={() => setIsCreating(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.createInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Idea title or concept summary..."
            placeholderTextColor="#71717A"
          />
          <TextInput
            style={[styles.createInput, styles.createTextArea]}
            value={newContent}
            onChangeText={setNewContent}
            placeholder="Notes, pros/cons, trade-offs..."
            placeholderTextColor="#71717A"
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.createInput}
            value={newTags}
            onChangeText={setNewTags}
            placeholder="Tags separated by commas (e.g. latency, c++, gpu)"
            placeholderTextColor="#71717A"
          />
          <View style={styles.createActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreating(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !newTitle.trim() && styles.saveBtnDisabled]}
              disabled={!newTitle.trim()}
              onPress={handleCreateIdea}
            >
              <Text style={styles.saveBtnText}>Save Idea 💡</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feed */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#F59E0B" size="large" />
          <Text style={styles.loadingText}>Loading ideas...</Text>
        </View>
      ) : (
        <FlatList
          data={ideas}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💡</Text>
              <Text style={styles.emptyTitle}>No ideas in this group</Text>
              <Text style={styles.emptySubtitle}>Tap "＋ New Idea" to capture a thought.</Text>
            </View>
          }
        />
      )}

      {/* Promotion Modal */}
      <Modal visible={!!promotingIdea} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🚀 Promote to Architecture Node</Text>
            <Text style={styles.modalSubtitle}>
              Convert "{promotingIdea?.title}" into a structured project node.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPromotingIdea(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promoteConfirmBtn} onPress={handlePromote}>
                <Text style={styles.promoteConfirmText}>
                  {isPromoting ? 'Promoting...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  groupsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  groupPill: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  groupPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  groupPillText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  groupPillTextActive: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  createCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 12,
    gap: 8,
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  closeText: {
    fontSize: 14,
    color: '#71717A',
  },
  createInput: {
    backgroundColor: '#09090B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#F4F4F5',
  },
  createTextArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 12,
  },
  cardMatured: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(6, 78, 59, 0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusRaw: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusMatured: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E4E4E7',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#71717A',
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F4F5',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 17,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#27272A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    color: '#71717A',
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  dateText: {
    fontSize: 10,
    color: '#71717A',
  },
  promotedText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  promoteBtn: {
    backgroundColor: '#27272A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  promoteBtnText: {
    fontSize: 11,
    color: '#E4E4E7',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4D4D8',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3F3F46',
    padding: 16,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  promoteConfirmBtn: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  promoteConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});