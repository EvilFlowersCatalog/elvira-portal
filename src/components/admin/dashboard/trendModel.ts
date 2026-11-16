/**
 * Time-series analytics for the activity monitor, as plain data (no React, no date library, so it
 * can be tested on its own).
 *
 * Statistical honesty rules, because the series are short (7–30 buckets) and counts small:
 *  - the bucket still in progress is never judged or correlated; it gets a run-rate projection;
 *  - the expectation for a bucket never includes that bucket (leave-one-out), and for daily data it
 *    compares like with like (same weekday), so every Monday is not a "peak";
 *  - bands, peaks and correlations only appear above a minimum of data; below it the UI says so;
 *  - correlation is computed on bucket-to-bucket *changes*, not levels (levels all follow the
 *    semester and would all correlate), with at most ±2 buckets of lag, and is reported as
 *    "moves with", never as cause.
 */
import type { IAdminStatistics, StatsBucket } from '../../../utils/interfaces/statistics';

export type MetricKey =
  | 'visitors'
  | 'active_readers'
  | 'loans_started'
  | 'holds_placed'
  | 'reads'
  | 'loans_returned'
  | 'utilization'
  | 'hold_fulfillment'
  | 'median_wait_hours';

export type MetricKind = 'count' | 'ratio' | 'hours';

export interface Metric {
  key: MetricKey;
  kind: MetricKind;
  /** One per bucket; null = not computable for that bucket. */
  values: (number | null)[];
  /** False when the backend does not collect it yet (the whole series is missing). */
  available: boolean;
  /** Period total (counts) or period value (ratios/hours), with the previous period when known. */
  total: number | null;
  previous: number | null;
}

export const METRIC_ORDER: MetricKey[] = [
  'visitors',
  'active_readers',
  'loans_started',
  'holds_placed',
  'reads',
  'loans_returned',
  'utilization',
  'hold_fulfillment',
  'median_wait_hours',
];

const KIND: Record<MetricKey, MetricKind> = {
  visitors: 'count',
  active_readers: 'count',
  loans_started: 'count',
  holds_placed: 'count',
  reads: 'count',
  loans_returned: 'count',
  utilization: 'ratio',
  hold_fulfillment: 'ratio',
  median_wait_hours: 'hours',
};

const sum = (xs: (number | null)[]) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);

export function buildMetrics(d: IAdminStatistics): Metric[] {
  const s = d.series;
  const optional = (f: (i: number) => number | null | undefined) => {
    const values = s.map((_, i) => f(i) ?? null);
    return { values, available: values.some((v) => v != null) };
  };
  const fromSeries = (k: 'loans_started' | 'holds_placed' | 'loans_returned') => ({
    values: s.map((b) => b[k]),
    available: true,
  });
  const fromKpi = (k: keyof Pick<IAdminStatistics['kpis'], 'active_readers' | 'utilization' | 'hold_fulfillment' | 'median_wait_hours'>) => {
    const trend = d.kpis[k].trend;
    return { values: s.map((_, i) => trend[i] ?? null), available: trend.length === s.length };
  };
  const raw: Record<MetricKey, { values: (number | null)[]; available: boolean }> = {
    visitors: optional((i) => s[i].visitors),
    reads: optional((i) => s[i].reads),
    loans_started: fromSeries('loans_started'),
    holds_placed: fromSeries('holds_placed'),
    loans_returned: fromSeries('loans_returned'),
    active_readers: fromKpi('active_readers'),
    utilization: fromKpi('utilization'),
    hold_fulfillment: fromKpi('hold_fulfillment'),
    median_wait_hours: fromKpi('median_wait_hours'),
  };
  const kpiTotals: Partial<Record<MetricKey, { value: number | null; previous: number | null }>> = {
    loans_started: d.kpis.loans,
    active_readers: d.kpis.active_readers,
    utilization: d.kpis.utilization,
    hold_fulfillment: d.kpis.hold_fulfillment,
    median_wait_hours: d.kpis.median_wait_hours,
  };
  return METRIC_ORDER.map((key) => {
    const r = raw[key];
    const kpi = kpiTotals[key];
    return {
      key,
      kind: KIND[key],
      ...r,
      total: kpi ? kpi.value : r.available ? sum(r.values) : null,
      previous: kpi ? kpi.previous : null,
    };
  });
}

// ── Dates without a library ──────────────────────────────────────────────────────────────────────
const parseDay = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** 0 = Monday. */
export const weekdayOf = (iso: string) => (parseDay(iso).getDay() + 6) % 7;

// ── Expectation band & peaks ─────────────────────────────────────────────────────────────────────
export interface Expectation {
  expected: (number | null)[];
  lo: (number | null)[];
  hi: (number | null)[];
  /** False when there is too little data to say what "normal" is. */
  enough: boolean;
}

export interface Anomaly {
  index: number;
  metric: MetricKey;
  value: number;
  expected: number;
  /** Signed distance from expectation in band half-widths (|z| ≥ 1 = outside the band). */
  z: number;
  kind: 'peak' | 'dip';
}

/** Below this many complete buckets, or this many events in total, no band is drawn. */
export const MIN_BUCKETS = 6;
const MIN_EVENTS = 8;

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);

export function expectation(
  values: (number | null)[],
  dates: string[],
  partial: boolean[],
  bucket: StatsBucket,
  kind: MetricKind
): Expectation {
  const n = values.length;
  const usable = (i: number) => !partial[i] && values[i] != null;
  const idx = values.map((_, i) => i).filter(usable);
  const none = { expected: values.map(() => null), lo: values.map(() => null), hi: values.map(() => null), enough: false };
  if (idx.length < MIN_BUCKETS) return none;
  if (kind === 'count' && sum(idx.map((i) => values[i])) < MIN_EVENTS) return none;

  const others = (i: number) => {
    if (bucket === 'day') {
      // Same weekday elsewhere in the period; fall back to all other days when too few.
      const same = idx.filter((j) => j !== i && weekdayOf(dates[j]) === weekdayOf(dates[i]));
      if (same.length >= 2) return same;
    } else {
      // Local window: up to three buckets each side.
      const near = idx.filter((j) => j !== i && Math.abs(j - i) <= 3);
      if (near.length >= 3) return near;
    }
    return idx.filter((j) => j !== i);
  };

  const expected = values.map((_, i) => {
    const o = others(i);
    return o.length ? mean(o.map((j) => values[j]!)) : null;
  });
  const residuals = idx.map((i) => values[i]! - expected[i]!);
  const sd = Math.sqrt(mean(residuals.map((r) => r * r)));
  const half = (e: number) => {
    const statistical = 2 * sd;
    // Counts are at least as noisy as Poisson: don't call 3 vs an expected 1 a "peak".
    const poisson = kind === 'count' ? 2 * Math.sqrt(Math.max(e, 1)) : 0;
    return Math.max(statistical, poisson, kind === 'count' ? 1 : 0.01);
  };
  return {
    expected,
    lo: expected.map((e) => (e == null ? null : Math.max(0, e - half(e)))),
    hi: expected.map((e) => (e == null ? null : e + half(e))),
    enough: n > 0,
  };
}

export function anomalies(metric: Metric, exp: Expectation, partial: boolean[]): Anomaly[] {
  if (!exp.enough) return [];
  const out: Anomaly[] = [];
  metric.values.forEach((v, i) => {
    const e = exp.expected[i];
    const lo = exp.lo[i];
    const hi = exp.hi[i];
    if (partial[i] || v == null || e == null || lo == null || hi == null) return;
    const halfWidth = Math.max(hi - e, 1e-9);
    if (v > hi) out.push({ index: i, metric: metric.key, value: v, expected: e, z: (v - e) / halfWidth, kind: 'peak' });
    // A dip only matters where something was expected.
    else if (v < lo && e >= (metric.kind === 'count' ? 2 : 0)) out.push({ index: i, metric: metric.key, value: v, expected: e, z: (v - e) / halfWidth, kind: 'dip' });
  });
  return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
}

// ── Run-rate for the bucket in progress ──────────────────────────────────────────────────────────
/** Share of the last bucket that has elapsed at `generatedAt` (0..1), or null if it is complete. */
export function elapsedShare(lastStart: string, bucket: StatsBucket, partial: boolean, generatedAt: string, periodTo: string): number | null {
  if (!partial) return null;
  const start = parseDay(lastStart);
  const now = new Date(generatedAt);
  const end = new Date(start);
  if (bucket === 'day') end.setDate(end.getDate() + 1);
  else if (bucket === 'week') end.setDate(end.getDate() + 7);
  else end.setMonth(end.getMonth() + 1);
  // A bucket cut by the end of the range (not by "now") is not in progress: no projection.
  const to = parseDay(periodTo);
  to.setDate(to.getDate() + 1);
  if (to < end && to <= now) return null;
  const share = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  return share > 0.05 && share < 1 ? share : null;
}

// ── What moves together ──────────────────────────────────────────────────────────────────────────
export interface Comovement {
  a: MetricKey;
  b: MetricKey;
  /** Pearson r of bucket-to-bucket changes. */
  r: number;
  /** b shifted by this many buckets: >0 means a moves first. */
  lag: number;
  pairs: number;
}

/** Minimum paired changes for a correlation to be reported at all. */
export const MIN_PAIRS = 8;
const MIN_R = 0.5;

const pearson = (x: number[], y: number[]) => {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i += 1) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
};

const changes = (values: (number | null)[], partial: boolean[]) =>
  values.map((v, i) => {
    const p = values[i - 1];
    return i === 0 || partial[i] || partial[i - 1] || v == null || p == null ? null : v - p;
  });

/**
 * Only pairs whose relation means something to a librarian. Utilization is loan-days ÷ copy-days,
 * so it moves with loans by construction; pairing them would "discover" arithmetic.
 */
const MEANINGFUL: [MetricKey, MetricKey][] = [
  ['visitors', 'loans_started'],
  ['visitors', 'reads'],
  ['visitors', 'active_readers'],
  ['holds_placed', 'loans_started'],
  ['active_readers', 'loans_started'],
  ['reads', 'loans_started'],
  ['holds_placed', 'median_wait_hours'],
  ['loans_returned', 'holds_placed'],
];

export function comovements(metrics: Metric[], partial: boolean[]): Comovement[] {
  const live = metrics.filter((m) => m.available);
  const wanted = (a: MetricKey, b: MetricKey) => MEANINGFUL.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const out: Comovement[] = [];
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      if (!wanted(live[i].key, live[j].key)) continue;
      const da = changes(live[i].values, partial);
      const db = changes(live[j].values, partial);
      let best: Comovement | null = null;
      for (let lag = -2; lag <= 2; lag += 1) {
        const x: number[] = [];
        const y: number[] = [];
        da.forEach((v, t) => {
          const w = db[t + lag];
          if (v != null && w != null) {
            x.push(v);
            y.push(w);
          }
        });
        if (x.length < MIN_PAIRS) continue;
        const r = pearson(x, y);
        if (Number.isNaN(r)) continue;
        // Prefer no lag unless a lag is clearly better.
        const score = Math.abs(r) - (lag === 0 ? 0 : 0.1);
        if (!best || score > Math.abs(best.r) - (best.lag === 0 ? 0 : 0.1))
          best = { a: live[i].key, b: live[j].key, r, lag, pairs: x.length };
      }
      if (best && Math.abs(best.r) >= MIN_R) out.push(best);
    }
  }
  return out.sort((p, q) => Math.abs(q.r) - Math.abs(p.r));
}

/** Indexed to the period mean of complete buckets = 100, for overlaying series of any scale on one axis. */
export const indexed = (values: (number | null)[], partial: boolean[]) => {
  const base = mean(values.filter((v, i): v is number => v != null && !partial[i]));
  return values.map((v) => (v == null || !base ? null : (v / base) * 100));
};
