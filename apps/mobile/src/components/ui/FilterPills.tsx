import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NodeType } from '../../types';
import { THEME, NODE_TYPE_CONFIG } from '../../theme/tokens';

export interface FilterItem {
  id: NodeType | 'all';
  label: string;
  count?: number;
}

interface Props {
  filters: FilterItem[];
  activeFilter: NodeType | 'all';
  onSelectFilter: (id: NodeType | 'all') => void;
}

export const FilterPills: React.FC<Props> = ({
  filters,
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          const conf = f.id !== 'all' ? NODE_TYPE_CONFIG[f.id as NodeType] : null;

          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isActive && conf ? { borderColor: conf.border, backgroundColor: conf.bg } : null,
              ]}
              activeOpacity={0.7}
              onPress={() => onSelectFilter(f.id)}
            >
              {conf && (
                <Text
                  style={[
                    styles.chipIcon,
                    { color: isActive ? conf.color : THEME.text3 },
                  ]}
                >
                  {conf.iconText}
                </Text>
              )}
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                  isActive && conf ? { color: conf.color } : null,
                ]}
              >
                {f.label}
              </Text>
              {f.count !== undefined && (
                <View
                  style={[
                    styles.countPill,
                    isActive && styles.countPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive && styles.countTextActive,
                    ]}
                  >
                    {f.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.surface1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
    height: 28,
  },
  chipActive: {
    backgroundColor: THEME.accentDim,
    borderColor: THEME.accentLine,
  },
  chipIcon: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  chipText: {
    fontSize: 11,
    color: THEME.text3,
    fontWeight: '500',
  },
  chipTextActive: {
    color: THEME.accentBright,
    fontWeight: '600',
  },
  countPill: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  countPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  countText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: THEME.text4,
    fontWeight: '700',
  },
  countTextActive: {
    color: THEME.text1,
  },
});
