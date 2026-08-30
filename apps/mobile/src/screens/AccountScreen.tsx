import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { THEME } from '../theme/tokens';

export const AccountScreen: React.FC = () => {
  const { currentUser, userStats, isConnected, serverLatencyMs } = useSynapseMobileStore();

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'LA';

  const handleCopyApiKey = () => {
    Alert.alert('API Key Copied', 'Personal access token copied to clipboard.');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Synapse Mobile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive' },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 1: Architect Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{userInitials}</Text>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{currentUser?.name || 'Lead Architect'}</Text>
            </View>
            <Text style={styles.userEmail}>{currentUser?.email || 'architect@synapse.local'}</Text>

            <View style={styles.roleRow}>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>ROLE: {currentUser?.role?.toUpperCase() || 'OWNER'}</Text>
              </View>
              <View style={styles.tierPill}>
                <Text style={styles.tierText}>PRO TIER</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* SECTION 2: Architecture Contributions & Activity */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ARCHITECTURE CONTRIBUTIONS</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>📐</Text>
            <Text style={styles.statValue}>{userStats.authored_nodes_count}</Text>
            <Text style={styles.statLabel}>Authored Nodes</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statIcon}>◆</Text>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
              {userStats.decisions_count}
            </Text>
            <Text style={styles.statLabel}>ADR Decisions</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statIcon}>📁</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {userStats.managed_projects_count}
            </Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statIcon}>💬</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {userStats.comments_count}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </View>

      {/* SECTION 3: JWT Security & Active Session */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>SECURITY & SESSION CREDENTIALS</Text>

        <View style={styles.securityList}>
          <View style={styles.secRow}>
            <Text style={styles.secLabel}>AUTH PROVIDER</Text>
            <Text style={styles.secValue}>Synapse Go JWT Gateway</Text>
          </View>

          <View style={styles.secRow}>
            <Text style={styles.secLabel}>TOKEN STATUS</Text>
            <View style={styles.secStatusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.secStatusText}>Dual-Token Active (HS256)</Text>
            </View>
          </View>

          <View style={styles.secRow}>
            <Text style={styles.secLabel}>ACCESS TTL / REFRESH</Text>
            <Text style={styles.secValue}>15 mins / 7 days</Text>
          </View>

          <View style={styles.secRow}>
            <Text style={styles.secLabel}>CLIENT PROTOCOL</Text>
            <Text style={styles.secValue}>HTTP/1.1 + WSS (Live Mesh)</Text>
          </View>
        </View>
      </View>

      {/* SECTION 4: Personal Access API Key */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>PERSONAL ACCESS TOKEN (CLI / SDK)</Text>
        <Text style={styles.cardSubtitle}>
          Use this token for programmatic access via the Antigravity Python SDK or Synapse CLI.
        </Text>

        <View style={styles.apiKeyBox}>
          <Text style={styles.apiKeyText}>syn_live_9a87f2e104b901ca</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyApiKey}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 5: Workspaces */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ORGANIZATION WORKSPACES</Text>

        <View style={styles.workspaceItem}>
          <View style={styles.wsIcon}>
            <Text style={styles.wsIconText}>🏢</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.wsName}>Core Engineering Workspace</Text>
            <Text style={styles.wsRole}>Owner • 8 Active Engineers</Text>
          </View>
          <View style={styles.wsActiveBadge}>
            <Text style={styles.wsActiveText}>CURRENT</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        activeOpacity={0.75}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutIcon}>🚪</Text>
        <Text style={styles.signOutText}>Sign Out from Synapse</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    padding: 14,
    gap: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#000',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.status.ok,
    borderWidth: 2,
    borderColor: THEME.surface1,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text1,
  },
  userEmail: {
    fontSize: 12,
    color: THEME.text3,
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rolePill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  tierPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: '#86EFAC',
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: THEME.text3,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text1,
  },
  statLabel: {
    fontSize: 9,
    color: THEME.text4,
    fontWeight: '600',
    textAlign: 'center',
  },
  securityList: {
    gap: 8,
  },
  secRow: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.text4,
  },
  secValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.text2,
    fontWeight: '600',
  },
  secStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.status.ok,
  },
  secStatusText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.status.ok,
    fontWeight: '700',
  },
  apiKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  apiKeyText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.accentBright,
  },
  copyBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  copyBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.text1,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
  },
  wsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsIconText: {
    fontSize: 15,
  },
  wsName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.text1,
  },
  wsRole: {
    fontSize: 10.5,
    color: THEME.text3,
  },
  wsActiveBadge: {
    backgroundColor: THEME.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.accentLine,
  },
  wsActiveText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
  },
  signOutIcon: {
    fontSize: 14,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
});
