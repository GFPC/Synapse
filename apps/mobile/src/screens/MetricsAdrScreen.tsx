import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { THEME } from '../theme/tokens';
import { BenchmarkMeter } from '../components/nodes/BenchmarkMeter';
import { EmptyState } from '../components/ui/EmptyState';
import { SynapseNode } from '../types';

export const MetricsAdrScreen: React.FC = () => {
  const { nodes, selectNode, openCreateNodeModal } = useSynapseMobileStore();

  const [activeTab, setActiveTab] = useState<'all' | 'adr' | 'benchmarks' | 'risks'>('all');

  const adrNodes = nodes.filter((n: SynapseNode) => n.type === 'decision');
  const benchmarkNodes = nodes.filter((n: SynapseNode) => n.type === 'benchmark' || n.type === 'test');
  const riskNodes = nodes.filter((n: SynapseNode) => n.type === 'risk' || n.type === 'problem');

  return (
    <View style={styles.container}>
      {/* Top Segmented Selector */}
      <View style={styles.segmentBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentScroll}
        >
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.segmentText, activeTab === 'all' && styles.segmentTextActive]}>
              All Metrics ({adrNodes.length + benchmarkNodes.length + riskNodes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'adr' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('adr')}
          >
            <Text style={[styles.segmentText, activeTab === 'adr' && styles.segmentTextActive]}>
              ◆ ADR Decisions ({adrNodes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'benchmarks' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('benchmarks')}
          >
            <Text style={[styles.segmentText, activeTab === 'benchmarks' && styles.segmentTextActive]}>
              📊 Benchmarks ({benchmarkNodes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'risks' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('risks')}
          >
            <Text style={[styles.segmentText, activeTab === 'risks' && styles.segmentTextActive]}>
              ⚡ Risks & Hazards ({riskNodes.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: Architecture Decisions (ADR) */}
        {(activeTab === 'all' || activeTab === 'adr') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.sectionIcon}>🟣</Text>
                <Text style={styles.sectionTitle}>Architecture Decision Records (ADR)</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{adrNodes.length}</Text>
              </View>
            </View>

            {adrNodes.length === 0 ? (
              <EmptyState
                icon="◆"
                title="No ADR Decisions"
                description="Create the first architecture decision record for this project"
                actionText="＋ Create ADR"
                onAction={openCreateNodeModal}
              />
            ) : (
              <View style={styles.cardsList}>
                {adrNodes.map((node: SynapseNode) => (
                  <TouchableOpacity
                    key={node.id}
                    style={styles.adrCard}
                    activeOpacity={0.75}
                    onPress={() => selectNode(node.id)}
                  >
                    <View style={styles.adrTopRow}>
                      <Text style={styles.adrDisplayId}>[{node.display_id}]</Text>
                      <View style={styles.adrStatusPill}>
                        <Text style={styles.adrStatusText}>
                          {node.status || 'accepted'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.adrTitle}>{node.title}</Text>
                    {node.content ? (
                      <Text style={styles.adrContent} numberOfLines={2}>
                        {node.content}
                      </Text>
                    ) : null}
                    <View style={styles.adrFooter}>
                      <Text style={styles.adrAuthor}>
                        Author: {node.author?.name || 'Lead Architect'}
                      </Text>
                      <Text style={styles.openHint}>Details →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* SECTION 2: Benchmarks & Performance */}
        {(activeTab === 'all' || activeTab === 'benchmarks') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.sectionIcon}>📊</Text>
                <Text style={styles.sectionTitle}>Performance Benchmarks & Load Tests</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{benchmarkNodes.length}</Text>
              </View>
            </View>

            {benchmarkNodes.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No Benchmark Results"
                description="Add latency p99 and throughput test benchmarks"
              />
            ) : (
              <View style={styles.cardsList}>
                {benchmarkNodes.map((node: SynapseNode) => (
                  <TouchableOpacity
                    key={node.id}
                    style={styles.benchCard}
                    activeOpacity={0.75}
                    onPress={() => selectNode(node.id)}
                  >
                    <View style={styles.benchTopRow}>
                      <Text style={styles.benchDisplayId}>[{node.display_id}]</Text>
                      <Text style={styles.benchTypeTag}>SLO METRIC</Text>
                    </View>
                    <Text style={styles.benchTitle}>{node.title}</Text>
                    <BenchmarkMeter meta={node.meta} />
                    {node.content ? (
                      <Text style={styles.benchDesc} numberOfLines={2}>
                        {node.content}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: Technical Risks & Incidents */}
        {(activeTab === 'all' || activeTab === 'risks') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.sectionIcon}>⚡</Text>
                <Text style={styles.sectionTitle}>Technical Risks & Failure Modes</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={[styles.countText, { color: '#EF4444' }]}>{riskNodes.length}</Text>
              </View>
            </View>

            {riskNodes.length === 0 ? (
              <EmptyState
                icon="🛡️"
                title="No Active Critical Risks"
                description="All identified architectural hazards have been mitigated"
              />
            ) : (
              <View style={styles.cardsList}>
                {riskNodes.map((node: SynapseNode) => (
                  <TouchableOpacity
                    key={node.id}
                    style={styles.riskCard}
                    activeOpacity={0.75}
                    onPress={() => selectNode(node.id)}
                  >
                    <View style={styles.riskTopRow}>
                      <Text style={styles.riskDisplayId}>[{node.display_id}]</Text>
                      <View style={styles.riskBadge}>
                        <Text style={styles.riskBadgeText}>HAZARD</Text>
                      </View>
                    </View>
                    <Text style={styles.riskTitle}>{node.title}</Text>
                    {node.content ? (
                      <Text style={styles.riskContent} numberOfLines={2}>
                        {node.content}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  segmentBar: {
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  segmentScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  segmentBtn: {
    backgroundColor: THEME.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  segmentBtnActive: {
    backgroundColor: THEME.accentDim,
    borderColor: THEME.accentLine,
  },
  segmentText: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: THEME.accentBright,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  countBadge: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
  },
  countText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: THEME.accentBright,
  },
  cardsList: {
    gap: 8,
  },
  adrCard: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 12,
  },
  adrTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adrDisplayId: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  adrStatusPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adrStatusText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#C4B5FD',
    textTransform: 'uppercase',
  },
  adrTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
    marginBottom: 4,
  },
  adrContent: {
    fontSize: 11.5,
    color: THEME.text3,
    lineHeight: 16,
    marginBottom: 8,
  },
  adrFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 6,
  },
  adrAuthor: {
    fontSize: 10,
    color: THEME.text4,
  },
  openHint: {
    fontSize: 10,
    color: THEME.accentBright,
    fontWeight: '600',
  },
  benchCard: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    padding: 12,
  },
  benchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  benchDisplayId: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  benchTypeTag: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
    color: THEME.accentBright,
    backgroundColor: THEME.surface3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  benchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
    marginBottom: 2,
  },
  benchDesc: {
    fontSize: 11,
    color: THEME.text3,
    lineHeight: 15,
  },
  riskCard: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
  },
  riskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riskDisplayId: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  riskBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#FCA5A5',
  },
  riskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
    marginBottom: 4,
  },
  riskContent: {
    fontSize: 11.5,
    color: THEME.text3,
    lineHeight: 16,
  },
});
