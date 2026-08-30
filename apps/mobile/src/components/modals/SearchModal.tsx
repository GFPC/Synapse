import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SynapseNode, NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';
import { mobileApiClient } from '../../api/client';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const SearchModal: React.FC<Props> = ({ visible, onClose, onSelectNode }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SynapseNode[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await mobileApiClient.get<any>(`/api/search?q=${encodeURIComponent(text)}`);
      const items = res.data?.data || res.data || [];
      const nodes = items.map((it: any) => it.node || it);
      setResults(nodes);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Search Input Bar */}
          <View style={styles.inputRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.input}
              placeholder="Поиск по графу знаний (Postgres FTS)..."
              placeholderTextColor={THEME.text4}
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>ESC</Text>
            </TouchableOpacity>
          </View>

          {/* Results List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={THEME.accent} />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                query.length >= 2 ? (
                  <Text style={styles.emptyText}>Ничего не найдено по запросу «{query}»</Text>
                ) : (
                  <Text style={styles.hintText}>Введите минимум 2 символа для полнотекстового поиска</Text>
                )
              }
              renderItem={({ item }) => {
                const conf = NODE_TYPE_CONFIG[item.type as NodeType] || NODE_TYPE_CONFIG.note;
                return (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => {
                      onSelectNode(item.id);
                      onClose();
                    }}
                  >
                    <View style={[styles.typeBadge, { backgroundColor: conf.bg }]}>
                      <Text style={[styles.typeIcon, { color: conf.color }]}>{conf.iconText}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.display_id} · {conf.label} · {item.status || 'draft'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: THEME.surface1,
    borderWidth: 1,
    borderColor: THEME.border2,
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    maxHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.text1,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 12,
    color: THEME.text4,
  },
  closeBtn: {
    backgroundColor: THEME.surface2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  closeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.text3,
  },
  listContent: {
    padding: 8,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: THEME.radius.md,
    gap: 10,
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text1,
    marginBottom: 2,
  },
  itemMeta: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.text3,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.text3,
    fontSize: 12,
    padding: 20,
  },
  hintText: {
    textAlign: 'center',
    color: THEME.text4,
    fontSize: 11,
    padding: 20,
  },
});
