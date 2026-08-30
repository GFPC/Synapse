import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { THEME, NODE_TYPE_CONFIG } from '../theme/tokens';
import { NodeType, SearchResult } from '../types';
import { EmptyState } from '../components/ui/EmptyState';

const QUICK_TAGS = ['#accounting', '#raft', '#disruptor', '#fts', '#jwt', '#mutex', '#gin'];

export const GlobalSearchScreen: React.FC = () => {
  const {
    searchQuery,
    searchResults,
    isSearching,
    performSearch,
    setSearchQuery,
    selectNode,
  } = useSynapseMobileStore();

  const [selectedType, setSelectedType] = useState<NodeType | 'all'>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredResults = searchResults.filter((r: SearchResult) => {
    if (selectedType === 'all') return true;
    return r.node?.type === selectedType;
  });

  return (
    <View style={styles.container}>
      {/* Top Search Input */}
      <View style={styles.header}>
        <View style={styles.inputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search ADRs, components, benchmarks..."
            placeholderTextColor={THEME.text4}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Quick Tags Bar */}
      <View style={styles.quickTagsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickTagsScroll}
        >
          {QUICK_TAGS.map((tag: string) => (
            <TouchableOpacity
              key={tag}
              style={styles.quickTag}
              onPress={() => setSearchQuery(tag.replace('#', ''))}
            >
              <Text style={styles.quickTagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results or Empty State */}
      {isSearching ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loadingText}>Full-text PostgreSQL tsvector search...</Text>
        </View>
      ) : searchQuery.trim().length < 2 ? (
        <EmptyState
          icon="⚡"
          title="Instant Architecture Search"
          description="Type keywords, ADR numbers, or microservice component names to search"
        />
      ) : filteredResults.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Results Found"
          description={`No matching knowledge nodes found for "${searchQuery}"`}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            FOUND {filteredResults.length} MATCHING NODES
          </Text>

          {filteredResults.map((item: SearchResult, idx: number) => {
            const node = item.node;
            if (!node) return null;
            const conf = NODE_TYPE_CONFIG[node.type as NodeType] || NODE_TYPE_CONFIG.note;

            return (
              <TouchableOpacity
                key={node.id || idx}
                style={styles.resultCard}
                activeOpacity={0.75}
                onPress={() => selectNode(node.id)}
              >
                <View style={styles.resultTopRow}>
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
                  <Text style={[styles.displayId, { color: conf.color }]}>
                    [{node.display_id}]
                  </Text>
                  <Text style={styles.typeLabel}>{conf.label}</Text>
                  {item.rank && (
                    <View style={styles.rankPill}>
                      <Text style={styles.rankText}>
                        rank: {item.rank.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.resultTitle}>{node.title}</Text>

                {item.snippet ? (
                  <Text style={styles.resultSnippet} numberOfLines={2}>
                    {item.snippet.replace(/<[^>]+>/g, '')}
                  </Text>
                ) : node.content ? (
                  <Text style={styles.resultSnippet} numberOfLines={2}>
                    {node.content}
                  </Text>
                ) : null}

                {node.tags && node.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {node.tags.map((t: string, i: number) => (
                      <View key={i} style={styles.tagPill}>
                        <Text style={styles.tagText}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: THEME.border2,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: THEME.text1,
  },
  clearBtn: {
    fontSize: 14,
    color: THEME.text3,
    paddingHorizontal: 6,
  },
  quickTagsBar: {
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  quickTagsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  quickTag: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickTagText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: THEME.accentBright,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: THEME.text3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 10,
  },
  resultsCount: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.text4,
    marginBottom: 4,
  },
  resultCard: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  typeBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 10,
    fontWeight: '700',
  },
  displayId: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 11,
    color: THEME.text3,
    flex: 1,
  },
  rankPill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    color: THEME.text4,
  },
  resultTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: THEME.text1,
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 11.5,
    color: THEME.text3,
    lineHeight: 16,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tagPill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9.5,
    color: THEME.text3,
  },
});
