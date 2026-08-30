import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MainTabType } from '../../types';
import { THEME } from '../../theme/tokens';
import {
  SectionsNavIcon,
  RelationsNavIcon,
  MetricsNavIcon,
  SearchNavIcon,
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
      id: 'sections',
      label: 'Sections',
      renderIcon: (p) => <SectionsNavIcon {...p} />,
      badge: nodesCount,
    },
    {
      id: 'tree',
      label: 'Relations',
      renderIcon: (p) => <RelationsNavIcon {...p} />,
    },
    {
      id: 'metrics',
      label: 'ADR & Metrics',
      renderIcon: (p) => <MetricsNavIcon {...p} />,
    },
    {
      id: 'search',
      label: 'Search',
      renderIcon: (p) => <SearchNavIcon {...p} />,
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
          const isActive = currentTab === tab.id;
          const activeColor = THEME.accentBright;
          const inactiveColor = THEME.text3;
          const color = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
            >
              <View style={styles.iconWrapper}>
                {tab.renderIcon({ color, focused: isActive, size: 20 })}
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
    paddingBottom: 6,
    paddingTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    position: 'relative',
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -10,
    backgroundColor: THEME.accent,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    minWidth: 14,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#000',
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '500',
    color: THEME.text3,
  },
  labelTextActive: {
    color: THEME.accentBright,
    fontWeight: '600',
  },
});
