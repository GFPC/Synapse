import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { THEME } from '../theme/tokens';
import { mobileApiClient } from '../api/client';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    clearLocalCache,
    serverStatus,
    serverLatencyMs,
    checkServerHealth,
    switchTab,
    currentUser,
  } = useSynapseMobileStore();

  const [apiUrl, setApiUrl] = useState(settings.apiBaseUrl);

  const handleSaveApiUrl = () => {
    const trimmed = apiUrl.trim();
    updateSettings({ apiBaseUrl: trimmed });
    mobileApiClient.setBaseUrl(trimmed);
    Alert.alert('Settings Saved', `API Base URL updated to ${trimmed}. Reconnect to apply.`);
  };

  const handleClearCache = async () => {
    await clearLocalCache();
    Alert.alert('Cache Cleared', 'Local schema and node cache has been wiped.');
  };

  const avatarInitials = currentUser?.name
    ? currentUser.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    : 'AM';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 0: User Profile & Cabinet Banner */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>ARCHITECT ACCOUNT</Text>
          <TouchableOpacity onPress={() => switchTab('account')}>
            <Text style={styles.headerAction}>View Cabinet →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.75}
          onPress={() => switchTab('account')}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{avatarInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{currentUser?.name || 'Alex Mercer'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email || 'alex@synapse.dev'} • Role: Owner</Text>
          </View>
          <Text style={styles.profileChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION: Developer CLI & AI MCP Integration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>DEVELOPER TOOLS & AI MCP</Text>
          <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
            <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>CONNECTED</Text>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#F0F6FC', fontSize: 13, fontWeight: '700' }}>⚡ Synapse CLI</Text>
            <Text style={{ color: THEME.accent, fontSize: 11, fontFamily: 'monospace', backgroundColor: THEME.surface3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>npx @synapse/cli</Text>
          </View>
          <Text style={{ color: '#8B949E', fontSize: 11, lineHeight: 16 }}>
            Auto-tag commits with node IDs, quick drop from terminal, switch branches.
          </Text>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 10, marginTop: 8, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#F0F6FC', fontSize: 13, fontWeight: '700' }}>🤖 Cursor & Claude (MCP)</Text>
            <Text style={{ color: '#818CF8', fontSize: 11, fontFamily: 'monospace', backgroundColor: THEME.surface3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>@synapse/mcp-server</Text>
          </View>
          <Text style={{ color: '#8B949E', fontSize: 11, lineHeight: 16 }}>
            Live architecture graph context, ADR search, and snippet drop for AI coding.
          </Text>
        </View>
      </View>

      {/* SECTION 1: Production Server & Gateway */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>SERVER & API GATEWAY</Text>
          <TouchableOpacity onPress={checkServerHealth}>
            <Text style={styles.headerAction}>Ping ({serverLatencyMs}ms)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>REST API ENDPOINT</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiUrl}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>WebSocket Live Mesh</Text>
            <Text style={styles.switchDesc}>Real-time collaboration and multi-user room sync</Text>
          </View>
          <Switch
            value={settings.enableLiveWs}
            onValueChange={(v) => updateSettings({ enableLiveWs: v })}
            trackColor={{ false: THEME.surface3, true: THEME.accent }}
          />
        </View>
      </View>

      {/* SECTION 2: Graph & Layout Preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>GRAPH & LAYOUT PREFERENCES</Text>

        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>AUTO-LAYOUT ENGINE</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleChoice,
                settings.autoLayoutAlgorithm === 'hierarchical' && styles.toggleChoiceActive,
              ]}
              onPress={() => updateSettings({ autoLayoutAlgorithm: 'hierarchical' })}
            >
              <Text
                style={[
                  styles.toggleText,
                  settings.autoLayoutAlgorithm === 'hierarchical' && styles.toggleTextActive,
                ]}
              >
                Hierarchical DAG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleChoice,
                settings.autoLayoutAlgorithm === 'force' && styles.toggleChoiceActive,
              ]}
              onPress={() => updateSettings({ autoLayoutAlgorithm: 'force' })}
            >
              <Text
                style={[
                  styles.toggleText,
                  settings.autoLayoutAlgorithm === 'force' && styles.toggleTextActive,
                ]}
              >
                Force-Directed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>CARD DENSITY</Text>
          <View style={styles.toggleRow}>
            {(['standard', 'compact', 'detailed'] as const).map((density) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.toggleChoice,
                  settings.cardDensity === density && styles.toggleChoiceActive,
                ]}
                onPress={() => updateSettings({ cardDensity: density })}
              >
                <Text
                  style={[
                    styles.toggleText,
                    settings.cardDensity === density && styles.toggleTextActive,
                  ]}
                >
                  {density.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* SECTION 3: Offline Storage & Cache */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>LOCAL STORAGE & CACHE</Text>

        <View style={styles.cacheInfoRow}>
          <View>
            <Text style={styles.cacheLabel}>SPATIAL INDEX MEMORY</Text>
            <Text style={styles.cacheValue}>12.4 MB (Active SQLite Index)</Text>
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearCache}>
            <Text style={styles.clearBtnText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>Offline Architecture Cache</Text>
            <Text style={styles.switchDesc}>Allow viewing saved schemas without network access</Text>
          </View>
          <Switch
            value={settings.offlineCacheEnabled}
            onValueChange={(v) => updateSettings({ offlineCacheEnabled: v })}
            trackColor={{ false: THEME.surface3, true: THEME.accent }}
          />
        </View>
      </View>

      {/* SECTION 4: Notifications & Live Alerts */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS & ALERTS</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>Live Node Lock Alerts</Text>
            <Text style={styles.switchDesc}>Notify when a teammate locks a node in your project</Text>
          </View>
          <Switch
            value={settings.enableNotifications}
            onValueChange={(v) => updateSettings({ enableNotifications: v })}
            trackColor={{ false: THEME.surface3, true: THEME.accent }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>Monospace Code Typography</Text>
            <Text style={styles.switchDesc}>Display node IDs and identifiers in JetBrains Mono</Text>
          </View>
          <Switch
            value={settings.monospaceCode}
            onValueChange={(v) => updateSettings({ monospaceCode: v })}
            trackColor={{ false: THEME.surface3, true: THEME.accent }}
          />
        </View>
      </View>

      {/* SECTION 5: About & Diagnostics */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>APPLICATION DIAGNOSTICS</Text>

        <View style={styles.diagGrid}>
          <View style={styles.diagItem}>
            <Text style={styles.diagLabel}>CLIENT VERSION</Text>
            <Text style={styles.diagValue}>Synapse Mobile v2.4.0 (Build 52)</Text>
          </View>

          <View style={styles.diagItem}>
            <Text style={styles.diagLabel}>CORE ENGINE</Text>
            <Text style={styles.diagValue}>C++ Spatial JSI v1.2 (Active)</Text>
          </View>

          <View style={styles.diagItem}>
            <Text style={styles.diagLabel}>BACKEND RUNTIME</Text>
            <Text style={styles.diagValue}>Go 1.22 + Echo v4 (Linux amd64)</Text>
          </View>

          <View style={styles.diagItem}>
            <Text style={styles.diagLabel}>DATABASE CLUSTER</Text>
            <Text style={styles.diagValue}>PostgreSQL 16 + pgvector & tsvector</Text>
          </View>
        </View>
      </View>
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
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.5,
  },
  headerAction: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: THEME.accentBright,
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  profileEmail: {
    fontSize: 10.5,
    color: THEME.text3,
    marginTop: 1,
  },
  profileChevron: {
    fontSize: 18,
    color: THEME.text4,
    marginRight: 4,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.text4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontFamily: 'monospace',
    color: THEME.text1,
  },
  saveBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: THEME.text1,
  },
  switchDesc: {
    fontSize: 10.5,
    color: THEME.text3,
    marginTop: 1,
  },
  optionGroup: {
    gap: 6,
  },
  optionLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.text4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 4,
  },
  toggleChoice: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleChoiceActive: {
    backgroundColor: THEME.accentDim,
    borderWidth: 1,
    borderColor: THEME.accentLine,
  },
  toggleText: {
    fontSize: 10.5,
    color: THEME.text3,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: THEME.accentBright,
    fontWeight: '700',
  },
  cacheInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cacheLabel: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
    color: THEME.text4,
  },
  cacheValue: {
    fontSize: 11.5,
    color: THEME.text1,
    fontWeight: '600',
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  clearBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  diagGrid: {
    gap: 8,
  },
  diagItem: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    padding: 9,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  diagLabel: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
    color: THEME.text4,
    marginBottom: 2,
  },
  diagValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.accentBright,
    fontWeight: '600',
  },
});
