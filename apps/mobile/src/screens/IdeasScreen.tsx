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
} from 'react-native';
import { mobileIdeasApi, Idea } from '../api/ideas';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { wsService } from '../api/ws';

export const IdeasScreen: React.FC = () => {
  const { activeProject, selectProject, openCreateNodeModal } = useSynapseMobileStore();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const iList = await mobileIdeasApi.listIdeas();
      setIdeas(iList);
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
  }, []);

  const handleCreateIdea = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
      const item = await mobileIdeasApi.createIdea({
        title: newTitle.trim(),
        content: newContent.trim(),
        tags,
      });
      setIdeas((prev) => [item, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setIsCreating(false);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to create idea: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await mobileIdeasApi.deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      // ignore
    }
  };

  const handlePromote = async (idea: Idea) => {
    if (!activeProject) {
      Alert.alert('No Project', 'Please select an active project first.');
      return;
    }

    try {
      await mobileIdeasApi.promoteToNode(idea.id, activeProject.id, 'component');
      Alert.alert('Promoted', `Idea converted to architectural node in ${activeProject.name}!`);
      await selectProject(activeProject.id);
      setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    } catch (e: any) {
      Alert.alert('Error', 'Failed to promote idea: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Action */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Architectural Incubator</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setIsCreating(!isCreating)}
        >
          <Text style={styles.newBtnText}>{isCreating ? '? Cancel' : '? New Idea'}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Creation Form */}
      {isCreating && (
        <View style={styles.createCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Idea title (e.g. Lock-free ring buffer)..."
            placeholderTextColor="#6B7280"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Detailed notes, rationale, trade-offs..."
            placeholderTextColor="#6B7280"
            value={newContent}
            onChangeText={setNewContent}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.tagsInput}
            placeholder="Tags: fintech, latency, c++"
            placeholderTextColor="#6B7280"
            value={newTags}
            onChangeText={setNewTags}
          />
          <TouchableOpacity
            style={[styles.submitBtn, !newTitle.trim() && styles.submitBtnDisabled]}
            disabled={!newTitle.trim() || isSubmitting}
            onPress={handleCreateIdea}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Save Idea</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Ideas List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={ideas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>??</Text>
              <Text style={styles.emptyTitle}>No Ideas Recorded Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "+ New Idea" or run `syn idea "text"` in terminal.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <View style={styles.ideaCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.ideaTitle}>{item.title}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteIdea(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>?</Text>
                  </TouchableOpacity>
                </View>

                {item.content ? (
                  <Text style={styles.ideaContent}>{item.content}</Text>
                ) : null}

                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.map((t, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Text style={styles.tagText}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>

                  <TouchableOpacity
                    style={styles.promoteBtn}
                    onPress={() => handlePromote(item)}
                  >
                    <Text style={styles.promoteBtnText}>? Convert to Node ?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
  },
  headerTitle: {
    color: '#8A8A94',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  newBtn: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBtnText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  createCard: {
    backgroundColor: '#121820',
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212A36',
    padding: 12,
    gap: 8,
  },
  titleInput: {
    backgroundColor: '#161B22',
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '600',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  contentInput: {
    backgroundColor: '#161B22',
    color: '#F0F6FC',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tagsInput: {
    backgroundColor: '#161B22',
    color: '#F0F6FC',
    fontSize: 12,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  submitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  ideaCard: {
    backgroundColor: '#121820',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212A36',
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ideaTitle: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteBtnText: {
    color: '#6B7280',
    fontSize: 12,
  },
  ideaContent: {
    color: '#8B949E',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tagChip: {
    backgroundColor: '#1A222D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#8A8A94',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
    paddingTop: 8,
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 11,
  },
  promoteBtn: {
    backgroundColor: '#6366F115',
    borderColor: '#6366F140',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoteBtnText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#F0F6FC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#8A8A94',
    fontSize: 12,
    textAlign: 'center',
  },
});
