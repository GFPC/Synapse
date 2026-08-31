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
    : 'AM';

  return (
    <View style={styles.header}>
      {/* Active Project Selector */}
      <TouchableOpacity
        style={styles.projectSelector}
        activeOpacity={0.75}
        onPress={onOpenProjectPicker}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
          ]}
        />
        <Text style={styles.projectName} numberOfLines={1}>
          {activeProject ? activeProject.name : 'Select Project'}
        </Text>
        <Text style={styles.chevron}>?</Text>
      </TouchableOpacity>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={onOpenCreateNode}
        >
          <Text style={styles.addButtonIcon}>?</Text>
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
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#090D12',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#212A36',
    maxWidth: '78%',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  projectName: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  chevron: {
    color: '#8A8A94',
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '700',
  },
});
