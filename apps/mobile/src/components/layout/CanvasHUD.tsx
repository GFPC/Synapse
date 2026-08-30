import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../theme/tokens';

interface Props {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onHierarchyLayout: () => void;
  onForceLayout: () => void;
  onOpenSearch: () => void;
}

export const CanvasHUD: React.FC<Props> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onFit,
  onHierarchyLayout,
  onForceLayout,
  onOpenSearch,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.hudBar}>
        {/* Zoom Controls */}
        <TouchableOpacity style={styles.btn} onPress={onZoomIn} activeOpacity={0.7}>
          <Text style={styles.btnText}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={onZoomOut} activeOpacity={0.7}>
          <Text style={styles.btnText}>－</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={onFit} activeOpacity={0.7}>
          <Text style={styles.zoomPercent}>{Math.round(scale * 100)}%</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Layout Presets */}
        <TouchableOpacity style={styles.btnAction} onPress={onHierarchyLayout} activeOpacity={0.7}>
          <Text style={styles.btnActionText}>📐 Дерево</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnAction} onPress={onForceLayout} activeOpacity={0.7}>
          <Text style={styles.btnActionText}>🕸️ Граф</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Fast Search */}
        <TouchableOpacity style={[styles.btn, styles.searchBtn]} onPress={onOpenSearch} activeOpacity={0.7}>
          <Text style={styles.searchBtnText}>🔍 ⌘K</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
    pointerEvents: 'box-none',
  },
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 22, 25, 0.88)',
    borderWidth: 1,
    borderColor: THEME.border2,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    color: THEME.text2,
    fontWeight: '600',
  },
  zoomPercent: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.text2,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 18,
    backgroundColor: THEME.borderStrong,
    marginHorizontal: 2,
  },
  btnAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: THEME.surface3,
    borderRadius: THEME.radius.pill,
  },
  btnActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.text1,
  },
  searchBtn: {
    backgroundColor: THEME.accentDim,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  searchBtnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: THEME.accentBright,
  },
});
