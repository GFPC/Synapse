import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MainTabType } from '../../types';
import { THEME } from '../../theme/tokens';

interface TabItem {
  id: MainTabType;
  label: string;
  icon: string;
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
    { id: 'sections', label: 'Sections', icon: '📑', badge: nodesCount },
    { id: 'tree', label: 'Relations', icon: '🌳' },
    { id: 'metrics', label: 'ADR & Metrics', icon: '📊' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
            >
              <View style={styles.iconContainer}>
                <Text style={[styles.iconText, isActive && styles.iconTextActive]}>
                  {tab.icon}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.labelText, isActive && styles.labelTextActive]}>
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
    backgroundColor: THEME.surface1,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabButtonActive: {},
  iconContainer: {
    position: 'relative',
    marginBottom: 3,
  },
  iconText: {
    fontSize: 18,
    opacity: 0.6,
  },
  iconTextActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: THEME.accent,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#000',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '500',
    color: THEME.text3,
  },
  labelTextActive: {
    color: THEME.accentBright,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 3,
    backgroundColor: THEME.accent,
    borderRadius: 2,
  },
});
