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
      {/* Active Project Dropdown Switcher */}
      <TouchableOpacity
        style={styles.projectDropdown}
        activeOpacity={0.7}
        onPress={onOpenProjectPicker}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? THEME.status.ok : THEME.status.warn },
          ]}
        />
        <Text style={styles.projectName} numberOfLines={1}>
          {activeProject ? activeProject.name : 'Select Project'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {/* Right Quick Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.7}
          onPress={onOpenCreateNode}
        >
          <Text style={styles.createButtonIcon}>＋</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  projectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border2,
    maxWidth: '75%',
    gap: 7,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  projectName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: THEME.text1,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 10,
    color: THEME.text3,
    marginLeft: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButton: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: THEME.surface3,
    borderWidth: 1,
    borderColor: THEME.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.accentBright,
    lineHeight: 18,
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.surface3,
    borderWidth: 1,
    borderColor: THEME.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text2,
  },
});
