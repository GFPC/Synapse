import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../theme/tokens';

interface Props {
  meta?: Record<string, any>;
}

export const BenchmarkMeter: React.FC<Props> = ({ meta }) => {
  const p99 = meta?.p99_latency_ms || meta?.latency || '0.12ms';
  const throughput = meta?.throughput || meta?.ops_sec || '25k ops/sec';
  const slo = meta?.slo_target || '< 1.0ms';

  return (
    <View style={styles.container}>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>p99 LATENCY</Text>
          <Text style={styles.metricValue}>{p99}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>THROUGHPUT</Text>
          <Text style={styles.metricValue}>{throughput}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>SLO TARGET</Text>
          <Text style={[styles.metricValue, { color: THEME.status.ok }]}>{slo}</Text>
        </View>
      </View>

      {/* Latency Gauge Track */}
      <View style={styles.gaugeTrack}>
        <View style={styles.gaugeFill} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.surface3,
    borderRadius: THEME.radius.sm,
    padding: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: THEME.text4,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.accentBright,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.border,
  },
  gaugeTrack: {
    height: 4,
    backgroundColor: THEME.surface4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  gaugeFill: {
    width: '88%',
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
});
