import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../theme/tokens';

export interface BenchmarkMetricItem {
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  status?: 'ok' | 'warn' | 'crit' | 'neutral';
  percent?: number; // 0-100 for gauge
}

interface Props {
  meta?: Record<string, any>;
}

export const BenchmarkMeter: React.FC<Props> = ({ meta }) => {
  if (!meta || Object.keys(meta).length === 0) return null;

  // Extract structured metrics or parse dynamic keys from meta
  const metrics: BenchmarkMetricItem[] = [];

  // If explicit structured metrics array exists
  if (Array.isArray(meta.metrics) && meta.metrics.length > 0) {
    meta.metrics.forEach((m: any) => {
      metrics.push({
        label: (m.label || m.name || 'METRIC').toUpperCase(),
        value: m.value,
        unit: m.unit,
        target: m.target || m.slo,
        status: m.status || 'ok',
        percent: m.percent,
      });
    });
  } else {
    // Dynamically discover all benchmark metrics from meta fields
    const knownKeys: Array<{ key: string; label: string; unit?: string; status?: 'ok' | 'warn' | 'crit' }> = [
      // Latency dimensions
      { key: 'p99_latency_ms', label: 'p99 LATENCY', unit: 'ms' },
      { key: 'p999_latency_ms', label: 'p99.9 LATENCY', unit: 'ms' },
      { key: 'p50_latency_ms', label: 'p50 LATENCY', unit: 'ms' },
      { key: 'max_latency_ms', label: 'MAX LATENCY', unit: 'ms' },
      { key: 'latency', label: 'LATENCY' },
      { key: 'jitter', label: 'JITTER' },

      // Throughput & Scale
      { key: 'throughput', label: 'THROUGHPUT' },
      { key: 'ops_sec', label: 'THROUGHPUT', unit: 'ops/s' },
      { key: 'tps', label: 'SETTLEMENT', unit: 'TPS' },
      { key: 'rps', label: 'REQUESTS', unit: 'req/s' },
      { key: 'bandwidth', label: 'BANDWIDTH' },

      // Memory & Resource Utilization
      { key: 'memory_mb', label: 'MEMORY (RSS)', unit: 'MB' },
      { key: 'peak_ram_mb', label: 'PEAK RAM', unit: 'MB' },
      { key: 'cpu_usage_pct', label: 'CPU LOAD', unit: '%' },
      { key: 'gc_pause_ms', label: 'GC PAUSE', unit: 'ms' },
      { key: 'disk_iops', label: 'DISK IOPS', unit: 'iops' },
      { key: 'allocs_per_op', label: 'ALLOCS/OP', unit: 'B/op' },

      // Reliability & Errors
      { key: 'error_rate', label: 'ERROR RATE', status: 'crit' },
      { key: 'packet_loss', label: 'PACKET LOSS', status: 'crit' },
      { key: 'concurrency', label: 'CONCURRENCY', unit: 'clients' },
      { key: 'compression_ratio', label: 'COMPRESSION' },
      { key: 'slo_target', label: 'SLO TARGET', status: 'ok' },
    ];

    knownKeys.forEach(({ key, label, unit, status }) => {
      if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') {
        metrics.push({
          label,
          value: meta[key],
          unit,
          status: status || 'ok',
        });
      }
    });

    // Also pick up any custom key-values in meta that weren't in knownKeys
    const knownSet = new Set([
      ...knownKeys.map((k) => k.key),
      // Exclude meta-control keys that are not displayable metrics
      'benchmark_type',
      'env',
      'gauge_pct',
      'status',
    ]);
    Object.keys(meta).forEach((k) => {
      if (!knownSet.has(k) && typeof meta[k] !== 'object' && meta[k] !== '') {
        metrics.push({
          label: k.replace(/_/g, ' ').toUpperCase(),
          value: meta[k],
          status: 'neutral',
        });
      }
    });
  }

  if (metrics.length === 0) return null;

  // Display in groups of 2 or 3 items
  const displayMetrics = metrics.slice(0, 4);

  return (
    <View style={styles.container}>
      {/* Benchmark Category Badge if available */}
      {meta.benchmark_type && (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryLabel}>
            BENCHMARK: {String(meta.benchmark_type).toUpperCase()}
          </Text>
          {meta.env && <Text style={styles.envTag}>ENV: {meta.env}</Text>}
        </View>
      )}

      <View style={styles.metricsRow}>
        {displayMetrics.map((item, idx) => {
          const isLast = idx === displayMetrics.length - 1;
          const isOk = item.status === 'ok';
          const isCrit = item.status === 'crit';
          const valueColor = isCrit
            ? THEME.status.crit
            : isOk
            ? THEME.accentBright
            : THEME.text1;

          return (
            <React.Fragment key={idx}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>
                  {item.value} {item.unit && !String(item.value).includes(item.unit) ? item.unit : ''}
                </Text>
              </View>
              {!isLast && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* Dynamic Telemetry Track Bar */}
      <View style={styles.gaugeTrack}>
        <View
          style={[
            styles.gaugeFill,
            {
              width: meta.gauge_pct ? `${meta.gauge_pct}%` : '85%',
              backgroundColor:
                meta.status === 'failed'
                  ? THEME.status.crit
                  : meta.status === 'warn'
                  ? THEME.status.warn
                  : '#6366F1',
            },
          ]}
        />
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  categoryLabel: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.5,
  },
  envTag: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: THEME.text4,
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
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontFamily: 'monospace',
    fontSize: 7.5,
    color: THEME.text4,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: THEME.border,
  },
  gaugeTrack: {
    height: 3,
    backgroundColor: THEME.surface4,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
