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
import * as Clipboard from 'expo-clipboard';
import { mobileQuickDropApi, QuickDropItem } from '../api/quickdrop';
import { wsService } from '../api/ws';

export const QuickDropScreen: React.FC = () => {
  const [items, setItems] = useState<QuickDropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await mobileQuickDropApi.list();
      setItems(data);
    } catch (e) {
      console.error('Failed to load quick drops', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();

    const unsub = wsService.subscribe((event: any) => {
      if (event.type === 'quick_drop_created' && event.data) {
        setItems((prev) => [event.data, ...prev.filter((i) => i.id !== event.data.id)]);
      } else if (event.type === 'quick_drop_deleted') {
        const id = event.data?.id;
        if (id) {
          setItems((prev) => prev.filter((i) => i.id !== id));
        }
      } else if (event.type === 'quick_drop_pinned' && event.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === event.data.id ? { ...i, is_pinned: event.data.is_pinned } : i))
        );
      }
    });

    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!inputText.trim()) return;
    try {
      let detectedType: 'text' | 'code' | 'link' = 'text';
      if (inputText.startsWith('http://') || inputText.startsWith('https://')) {
        detectedType = 'link';
      } else if (inputText.includes('{') || inputText.includes('function') || inputText.includes('const ')) {
        detectedType = 'code';
      }
      const item = await mobileQuickDropApi.create({
        type: detectedType,
        content: inputText.trim(),
      });
      setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
      setInputText('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send drop');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setInputText(text);
    } catch {
      // ignore
    }
  };

  const handleCopy = async (item: QuickDropItem) => {
    try {
      await Clipboard.setStringAsync(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mobileQuickDropApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Input Card */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.textInput}
          placeholder="Drop text, code snippet, or link (syncs to PC/terminal)..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={3}
        />
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
            <Text style={styles.pasteBtnText}>??? Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
            onPress={handleCreate}
          >
            <Text style={styles.sendBtnText}>? Drop to Mesh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Drops List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>?</Text>
              <Text style={styles.emptyTitle}>Quick Drop is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Type a snippet above or run `syn drop "text"` in your terminal.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCopied = copiedId === item.id;
            const timeStr = new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View style={styles.dropCard}>
                <View style={styles.dropHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.timestamp}>{timeStr}</Text>
                </View>

                <Text
                  style={[
                    styles.dropContent,
                    item.type === 'code' && styles.dropCode,
                  ]}
                  selectable
                >
                  {item.content}
                </Text>

                <View style={styles.dropFooter}>
                  <TouchableOpacity
                    style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                    onPress={() => handleCopy(item)}
                  >
                    <Text style={[styles.copyBtnText, isCopied && styles.copyBtnSuccessText]}>
                      {isCopied ? '? Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>?</Text>
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
  inputCard: {
    backgroundColor: '#121820',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212A36',
    margin: 12,
    padding: 10,
  },
  textInput: {
    color: '#F0F6FC',
    fontSize: 13,
    minHeight: 56,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 8,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
    paddingTop: 8,
  },
  pasteBtn: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pasteBtnText: {
    color: '#8A8A94',
    fontSize: 11,
    fontWeight: '600',
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
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
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  dropCard: {
    backgroundColor: '#121820',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212A36',
    padding: 12,
    marginBottom: 8,
  },
  dropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 11,
  },
  dropContent: {
    color: '#F0F6FC',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  dropCode: {
    fontFamily: 'monospace',
    backgroundColor: '#161B22',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
    color: '#79C0FF',
  },
  dropFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
    paddingTop: 6,
  },
  copyBtn: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnSuccess: {
    backgroundColor: '#10B98125',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  copyBtnText: {
    color: '#8A8A94',
    fontSize: 11,
    fontWeight: '600',
  },
  copyBtnSuccessText: {
    color: '#10B981',
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#6B7280',
    fontSize: 12,
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
