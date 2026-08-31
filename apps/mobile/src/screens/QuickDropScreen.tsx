import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { mobileQuickDropApi, QuickDropItem } from '../api/quickdrop';
import { wsService } from '../api/ws';
import { CopyNavIcon, CheckNavIcon } from '../components/icons/NavIcons';

export const QuickDropScreen: React.FC = () => {
  const [items, setItems] = useState<QuickDropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'code' | 'link'>('text');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

    // Subscribe to WS events
    const unsub = wsService.subscribe((event: any) => {
      if (event.type === 'quick_drop_created' && event.data) {
        setItems((prev) => [event.data, ...prev.filter((i) => i.id !== event.data.id)]);
      } else if (event.type === 'quick_drop_deleted') {
        const id = event.data?.id;
        if (id) {
          setItems((prev) => prev.filter((i) => i.id !== id));
        } else if (event.data?.cleared === 'unpinned') {
          setItems((prev) => prev.filter((i) => i.is_pinned));
        }
      } else if (event.type === 'quick_drop_pinned' && event.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === event.data.id ? { ...i, is_pinned: event.data.is_pinned } : i))
        );
      }
    });

    return () => unsub();
  }, []);

  const handleCreate = async (contentToSend?: string, typeToSend?: 'text' | 'code' | 'link') => {
    const text = contentToSend || inputText;
    if (!text.trim()) return;

    try {
      const item = await mobileQuickDropApi.create({
        type: typeToSend || inputType,
        content: text.trim(),
      });
      setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
      if (!contentToSend) setInputText('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send quick drop');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text) {
        Alert.alert('Clipboard Empty', 'No text found in clipboard');
        return;
      }
      let detected: 'text' | 'code' | 'link' = 'text';
      if (text.startsWith('http://') || text.startsWith('https://')) {
        detected = 'link';
      } else if (text.includes('{') || text.includes('function') || text.includes('const ') || text.includes('import ')) {
        detected = 'code';
      }
      await handleCreate(text, detected);
    } catch (e) {
      Alert.alert('Error', 'Failed to read clipboard');
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Need photo library access to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploading(true);
        const item = await mobileQuickDropApi.uploadPhoto(
          asset.uri,
          asset.fileName || 'mobile_photo.jpg',
          asset.mimeType || 'image/jpeg'
        );
        setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
      }
    } catch (e) {
      Alert.alert('Upload Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleTogglePin = async (id: string) => {
    try {
      const updated = await mobileQuickDropApi.togglePin(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (e) {
      Alert.alert('Error', 'Failed to toggle pin');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mobileQuickDropApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const renderItem = ({ item }: { item: QuickDropItem }) => {
    const isCopied = copiedId === item.id;
    return (
      <View style={[styles.card, item.is_pinned && styles.cardPinned]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.typeBadge,
                item.type === 'code' && styles.badgeCode,
                item.type === 'link' && styles.badgeLink,
                item.type === 'image' && styles.badgeImage,
              ]}
            >
              <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
            </View>
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleTogglePin(item.id)} style={styles.iconBtn}>
              <Text style={styles.iconText}>{item.is_pinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Text style={[styles.iconText, { color: '#F43F5E' }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          {item.type === 'image' ? (
            <Image
              source={{ uri: item.content.startsWith('http') ? item.content : `http://87.58.204.138${item.content}` }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          ) : item.type === 'code' ? (
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{item.content}</Text>
            </View>
          ) : (
            <Text style={styles.contentText}>{item.content}</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerCharText}>
            {item.type === 'text' || item.type === 'code' ? `${item.content.length} chars` : ''}
          </Text>

          <TouchableOpacity
            style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
            onPress={() => handleCopy(item.id, item.content)}
          >
            {isCopied ? (
              <CheckNavIcon size={14} color="#10B981" focused />
            ) : (
              <CopyNavIcon size={14} color="#A1A1AA" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quick Drop</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Quick Action Bar */}
      <View style={styles.quickBar}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handlePasteFromClipboard}>
          <Text style={styles.quickActionBtnText}>Paste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionBtn, styles.photoBtn]} onPress={handlePickImage}>
          <Text style={styles.photoBtnText}>Attach</Text>
        </TouchableOpacity>
      </View>

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Text, code, or link..."
          placeholderTextColor="#71717A"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          disabled={!inputText.trim()}
          onPress={() => handleCreate()}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Stream Feed */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#6366F1" size="small" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Quick Drop is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Tap "1-Tap Paste Clipboard" or send from PC with Ctrl+V.
              </Text>
            </View>
          }
        />
      )}
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  quickBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtn: {
    flex: 0.45,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  quickActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  photoBtnText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#18181B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#F4F4F5',
    fontSize: 13,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
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
  cardPinned: {
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(30, 27, 75, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    backgroundColor: '#27272A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCode: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeLink: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  badgeImage: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  typeBadgeText: {
    fontSize: 9,
    color: '#E4E4E7',
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10,
    color: '#71717A',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  iconText: {
    fontSize: 14,
  },
  cardBody: {
    marginVertical: 4,
  },
  contentText: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 18,
  },
  codeBlock: {
    backgroundColor: '#09090B',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6EE7B7',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#09090B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  footerCharText: {
    fontSize: 10,
    color: '#71717A',
  },
  copyBtn: {
    backgroundColor: '#27272A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  copyBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  copyBtnText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '600',
  },
  copyBtnTextSuccess: {
    color: '#10B981',
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
    textAlign: 'center',
    maxWidth: 240,
  },
});