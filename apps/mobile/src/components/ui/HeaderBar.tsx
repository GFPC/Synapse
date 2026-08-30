import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Project } from '../../types';
import { THEME } from '../../theme/tokens';

interface Props {
  activeProject: Project | null;
  isConnected: boolean;
  serverStatus: 'online' | 'offline' | 'checking';
  onOpenProjectPicker: () => void;
  onOpenCreateNode: () => void;
}

export const HeaderBar: React.FC<Props> = ({
  activeProject,
  isConnected,
  serverStatus,
  onOpenProjectPicker,
  onOpenCreateNode,
}) => {
  return (
    <View style={styles.header}>
      {/* Brand & Project Switcher */}
      <TouchableOpacity
        style={styles.headerLeft}
        activeOpacity={0.7}
        onPress={onOpenProjectPicker}
      >
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <View style={styles.titleColumn}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>Synapse</Text>
            <Text style={styles.versionPill}>v2.4 Mobile</Text>
          </View>
          <View style={styles.projectRow}>
            <Text style={styles.projectName} numberOfLines={1}>
              {activeProject ? activeProject.name : 'Подключение к серверу...'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Actions: Create & Status */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.7}
          onPress={onOpenCreateNode}
        >
          <Text style={styles.createBtnIcon}>＋</Text>
          <Text style={styles.createBtnText}>Узел</Text>
        </TouchableOpacity>

        {/* Live Server Indicator */}
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: isConnected ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)',
              backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? THEME.status.ok : THEME.status.warn },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isConnected ? '#86EFAC' : '#FCD34D' },
            ]}
          >
            {isConnected ? 'Live' : 'Sync'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 16,
  },
  titleColumn: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  versionPill: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: THEME.text4,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectName: {
    fontSize: 11,
    color: THEME.text2,
    fontWeight: '600',
    maxWidth: 145,
  },
  chevron: {
    fontSize: 10,
    color: THEME.accentBright,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.surface3,
    borderWidth: 1,
    borderColor: THEME.border2,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
  },
  createBtnIcon: {
    fontSize: 12,
    color: THEME.accentBright,
    fontWeight: '700',
  },
  createBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
});
