import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MainTabType } from '../../types';
import { THEME } from '../../theme/tokens';
import {
  SectionsNavIcon,
  QuickDropNavIcon,
  IdeasNavIcon,
  SettingsNavIcon,
} from '../icons/NavIcons';

interface TabItem {
  id: MainTabType;
  label: string;
  renderIcon: (props: { color: string; focused: boolean; size: number }) => React.ReactNode;
  badge?: number;
}

interface Props {
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  nodesCount: number;
}

export const BottomTabBar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  nodesCount,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'nodes' as MainTabType,
      label: 'Architecture',
      renderIcon: (p) => <SectionsNavIcon {...p} />,
      badge: nodesCount,
    },
    {
      id: 'quickdrop',
      label: 'Quick Drop',
      renderIcon: (p) => <QuickDropNavIcon {...p} />,
    },
    {
      id: 'ideas',
      label: 'Ideas',
      renderIcon: (p) => <IdeasNavIcon {...p} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      renderIcon: (p) => <SettingsNavIcon {...p} />,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive =
            currentTab === tab.id ||
            (tab.id === 'nodes' && (currentTab === 'sections' || currentTab === 'tree' || currentTab === 'metrics'));
          const activeColor = THEME.accentBright || '#6366F1';
          const inactiveColor = '#8A8A94';
          const color = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
            >
              <View style={styles.iconWrapper}>
                {tab.renderIcon({ color, focused: isActive, size: 22 })}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.labelText,
                  isActive && styles.labelTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090D12',
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 52,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    marginBottom: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#6366F1',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A94',
    letterSpacing: 0.2,
  },
  labelTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6366F1',
  },
});
