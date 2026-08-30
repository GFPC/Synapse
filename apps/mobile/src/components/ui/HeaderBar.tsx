import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Project, User } from '../../types';
import { THEME } from '../../theme/tokens';

interface Props {
  activeProject: Project | null;
  isConnected: boolean;
  serverStatus: 'online' | 'offline' | 'checking';
  currentUser: User | null;
  onOpenProjectPicker: () => void;
  onOpenCreateNode: () => void;
  onOpenAccount: () => void;
}

export const HeaderBar: React.FC<Props> = ({
  activeProject,
  isConnected,
  currentUser,
  onOpenProjectPicker,
  onOpenCreateNode,
  onOpenAccount,
}) => {
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'LA';

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
              {activeProject ? activeProject.name : 'Connecting to server...'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Actions: Create, Live Status, Profile */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.7}
          onPress={onOpenCreateNode}
        >
          <Text style={styles.createBtnIcon}>＋</Text>
          <Text style={styles.createBtnText}>Node</Text>
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

        {/* Profile Avatar Button */}
        <TouchableOpacity
          style={styles.profileAvatar}
          activeOpacity={0.75}
          onPress={onOpenAccount}
        >
          <Text style={styles.profileAvatarText}>{userInitials}</Text>
        </TouchableOpacity>
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
    maxWidth: 130,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  createBtnIcon: {
    fontSize: 11,
    color: THEME.accentBright,
    fontWeight: '700',
  },
  createBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.text1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: THEME.surface3,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.accentBright,
  },
});
