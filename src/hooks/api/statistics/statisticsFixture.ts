/**
 * DEV-ONLY fixture for `GET /api/v1/statistics`. Imported dynamically behind
 * `import.meta.env.DEV`, so it never ships in a production bundle. The numbers
 * are generated (seeded, deterministic) — the dashboard labels them "Demo data".
 */
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  format,
  parseISO,
  subDays,
} from 'date-fns';
import {
  IAdminStatistics,
  IStatisticsBucket,
  IStatisticsHeatCell,
  IStatisticsParams,
  ITitleStatistics,
} from '../../../utils/interfaces/statistics';

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const SUBJECTS = [
  'Algorithms and Data Structures',
  'Linear Algebra for Engineers',
  'Thermodynamics',
  'Structural Mechanics',
  'Digital Signal Processing',
  'Organic Chemistry',
  'Machine Learning Foundations',
  'Urban Planning Theory',
  'Fluid Dynamics',
  'Computer Networks',
  'Materials Science',
  'Probability and Statistics',
  'Control Systems',
  'Operating Systems',
  'Architectural History',
  'Electrical Circuits',
  'Numerical Methods',
  'Database Systems',
  'Geotechnical Engineering',
  'Microeconomics',
  'Software Architecture',
  'Discrete Mathematics',
  'Environmental Engineering',
  'Robotics',
  'Compiler Construction',
  'Biochemistry',
  'Heat Transfer',
  'Computer Graphics',
  'Construction Management',
  'Information Security',
  'Mathematical Analysis I',
  'Mathematical Analysis II',
  'Physics for Engineers',
  'Quantum Computing Primer',
  'Water Resources',
  'Power Electronics',
  'Human–Computer Interaction',
  'Transport Engineering',
  'Polymer Chemistry',
  'Embedded Systems',
  'Landscape Architecture',
  'Cryptography',
  'Steel Structures',
  'Concrete Structures',
  'Optimization Methods',
  'Technical Drawing',
  'Parallel Programming',
  'Food Technology',
  'Acoustics',
  'Project Management',
  'Semiconductor Devices',
  'Graph Theory',
  'Building Physics',
  'Signals and Systems',
];
const AUTHORS = [
  'Novák',
  'Horváth',
  'Kováč',
  'Varga',
  'Tóth',
  'Baláž',
  'Szabó',
  'Molnár',
  'Lukáč',
  'Kráľ',
];
const CATEGORIES = [
  'Computer Science',
  'Mathematics',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemistry',
  'Architecture',
  'Mechanical Engineering',
  'Physics',
  'Economics',
  'Environmental Science',
];

const step = (d: Date, bucket: IStatisticsParams['bucket']) =>
  bucket === 'day'
    ? addDays(d, 1)
    : bucket === 'week'
      ? addWeeks(d, 1)
      : addMonths(d, 1);

export const buildStatisticsFixture = (
  p: IStatisticsParams
): IAdminStatistics => {
  const rnd = mulberry32(42);
  const from = parseISO(p.from);
  const to = parseISO(p.to);
  const days = differenceInCalendarDays(to, from) + 1;

  // Daily demand curve: weekday rhythm + a mid-semester swell + noise.
  const daily = (d: Date) => {
    const dow = (d.getDay() + 6) % 7;
    const weekday = dow < 5 ? 1 : 0.45;
    const month = d.getMonth();
    const semester = [
      0.9, 1.1, 1.25, 1.3, 1.15, 0.7, 0.35, 0.3, 0.8, 1.3, 1.35, 1.1,
    ][month];
    return Math.max(0, Math.round(11 * weekday * semester + (rnd() - 0.5) * 5));
  };

  const series: IStatisticsBucket[] = [];
  for (let b = from; b <= to; b = step(b, p.bucket)) {
    const end = step(b, p.bucket);
    let started = 0;
    for (let d = b; d < end && d <= to; d = addDays(d, 1)) started += daily(d);
    series.push({
      t: format(b, 'yyyy-MM-dd'),
      // `to` is today, so its bucket is always still in progress.
      partial: end > to,
      loans_started: started,
      loans_returned: Math.round(started * (0.35 + rnd() * 0.1)),
      loans_expired: Math.round(started * (0.5 + rnd() * 0.1)),
      holds_placed: Math.round(started * (0.18 + rnd() * 0.12)),
    });
  }
  const loans = series.reduce((s, b) => s + b.loans_started, 0);

  // Titles: Zipf-like popularity, a handful of saturated ones with queues, a tail that never moves.
  const titles: ITitleStatistics[] = SUBJECTS.map((subject, i) => {
    const copies =
      i < 6
        ? 2 + Math.floor(rnd() * 3)
        : 1 + Math.floor(rnd() * (i > 40 ? 6 : 3));
    // Popularity → utilization: a few saturated titles, a long busy-ish middle, a dormant tail.
    const target =
      i > 44
        ? 0
        : Math.min(
            0.99,
            Math.max(
              0.04,
              (1.06 - 0.17 * Math.log2(i + 1)) * (0.85 + rnd() * 0.3)
            )
          );
    const avgLoan = 9 + rnd() * 8;
    const loanDays = Math.round(target * copies * days);
    const titleLoans = target ? Math.max(1, Math.round(loanDays / avgLoan)) : 0;
    const utilization = copies * days ? loanDays / (copies * days) : 0;
    const inUse = Math.min(
      copies,
      Math.round(copies * utilization * (0.85 + rnd() * 0.3))
    );
    const queued =
      inUse >= copies && utilization > 0.75
        ? Math.round(1 + rnd() * 2 * copies + (i < 3 ? 4 : 0))
        : 0;
    return {
      entry_id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      title: subject,
      authors: [
        `${AUTHORS[i % AUTHORS.length]}, ${String.fromCharCode(65 + ((i * 7) % 26))}.`,
      ],
      copies,
      in_use: inUse,
      queued,
      loans: titleLoans,
      loan_days: loanDays,
      utilization,
      holds_ratio: queued / copies,
      turnover: titleLoans / copies,
      avg_loan_days: titleLoans ? avgLoan : null,
      added_at: subDays(
        to,
        i === 52 || i === 53 ? 10 : 200 + Math.floor(rnd() * 600)
      ).toISOString(),
      last_loan_at: titleLoans
        ? subDays(to, Math.floor(rnd() * 5)).toISOString()
        : i % 3 === 0
          ? subDays(to, 400).toISOString()
          : null,
    };
  }).sort((a, b) => b.utilization - a.utilization);

  const copiesTotal = titles.reduce((s, t) => s + t.copies, 0);
  const inUseNow = titles.reduce((s, t) => s + t.in_use, 0);
  const loanDaysTotal = titles.reduce((s, t) => s + t.loan_days, 0);

  const heatmap: IStatisticsHeatCell[] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      const weekday = dow < 5 ? 1 : 0.5;
      const morning = Math.exp(-((hour - 10.5) ** 2) / 6);
      const evening =
        Math.exp(-((hour - 20.5) ** 2) / 4) * (dow === 6 ? 1.3 : 0.85);
      const night = hour < 6 ? 0.04 : 0;
      heatmap.push({
        dow,
        hour,
        loans: Math.round(
          loans *
            0.012 *
            weekday *
            (morning + evening + night) *
            (0.8 + rnd() * 0.4)
        ),
      });
    }
  }

  const trend = (f: (b: IStatisticsBucket) => number) => series.map(f);
  const placed = series.reduce((s, b) => s + b.holds_placed, 0);
  const claimed = Math.round(placed * 0.61);
  const expired = Math.round(placed * 0.14);
  const cancelled = Math.round(placed * 0.11);

  return {
    generated_at: new Date().toISOString(),
    period: {
      from: p.from,
      to: p.to,
      previous_from: format(subDays(from, days), 'yyyy-MM-dd'),
      previous_to: format(subDays(from, 1), 'yyyy-MM-dd'),
      bucket: p.bucket,
      tz: p.tz,
    },
    attention: {
      encryption_failed: 2,
      encryption_stuck: 1,
      lcp_not_lendable: 4,
      claims_expiring_24h: 3,
      saturated_with_queue: titles.filter(
        (t) => t.in_use >= t.copies && t.queued > 0
      ).length,
    },
    kpis: {
      loans: {
        value: loans,
        previous: Math.round(loans * 0.86),
        trend: trend((b) => b.loans_started),
      },
      active_readers: {
        value: Math.round(loans * 0.58),
        previous: Math.round(loans * 0.55),
        trend: trend((b) => Math.round(b.loans_started * 0.7)),
      },
      utilization: {
        value: loanDaysTotal / (copiesTotal * days),
        previous: (loanDaysTotal / (copiesTotal * days)) * 0.93,
        trend: trend((b) => b.loans_started / Math.max(1, copiesTotal)),
      },
      hold_fulfillment: {
        value: claimed / (claimed + expired + cancelled),
        previous: 0.74,
        trend: trend(() => 0.65 + rnd() * 0.2),
      },
      median_wait_hours: {
        value: 41,
        previous: 52,
        trend: trend(() => 30 + rnd() * 30),
      },
      copies_in_use_now: inUseNow,
      copies_total: copiesTotal,
      lcp_titles: titles.length,
    },
    series,
    heatmap,
    titles,
    titles_truncated: false,
    hold_outcomes: {
      placed,
      claimed,
      expired_unclaimed: expired,
      cancelled,
      still_waiting: placed - claimed - expired - cancelled,
    },
    loan_outcomes: {
      returned_early: Math.round(loans * 0.34),
      ran_to_expiry: Math.round(loans * 0.48),
      revoked: Math.round(loans * 0.01),
      cancelled: Math.round(loans * 0.03),
      still_active:
        loans -
        Math.round(loans * 0.34) -
        Math.round(loans * 0.48) -
        Math.round(loans * 0.01) -
        Math.round(loans * 0.03),
    },
    categories: CATEGORIES.map((title, i) => ({
      category_id: `10000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      title,
      loans: Math.round((loans * 0.3) / Math.pow(i + 1, 0.8)),
    })),
  };
};
