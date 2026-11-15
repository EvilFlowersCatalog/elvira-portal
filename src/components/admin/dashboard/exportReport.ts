import { IAdminStatistics } from '../../../utils/interfaces/statistics';

/**
 * Exports for basic reporting. Built from the raw statistics, never from the on-screen
 * table twins: those hold display strings ("45 %", "3/5", "last loan 2 days ago") that
 * spreadsheets misread. Numbers stay plain decimals (ratios 0..1), dates stay ISO.
 */

type Cell = string | number | boolean | null | undefined;

/**
 * Spreadsheets read CSV with the OS list separator: Slovak Excel expects `;` and a decimal
 * comma, English `,` and a decimal point. The dialect follows the UI language; JSON stays
 * the locale-free machine format.
 */
export interface CsvDialect {
  sep: ',' | ';';
  decimal: '.' | ',';
}
export const dialectFor = (lang: string): CsvDialect =>
  lang.startsWith('sk')
    ? { sep: ';', decimal: ',' }
    : { sep: ',', decimal: '.' };

/** Quote every text field; neutralise a leading = + - @ so a title can't run as a spreadsheet formula. */
const cell = (v: Cell, d: CsvDialect): string => {
  if (v == null) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    const s = String(Math.round(v * 1e6) / 1e6);
    return d.decimal === ',' ? s.replace('.', ',') : s;
  }
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export interface ReportMeta {
  catalog: string;
  demo: boolean;
}

/** Provenance rows, written BELOW the data so row 1 stays the column header. */
const footerLines = (
  data: IAdminStatistics,
  meta: ReportMeta,
  what: string
): Cell[][] => [
  ['# Elvira lending report', what],
  ['# catalog', meta.catalog],
  ['# period', `${data.period.from} .. ${data.period.to}`],
  [
    '# previous period',
    `${data.period.previous_from} .. ${data.period.previous_to}`,
  ],
  ['# bucket', data.period.bucket],
  ['# timezone', data.period.tz],
  ['# generated_at', data.generated_at],
  ...(meta.demo
    ? [
        [
          '# WARNING',
          'DEMO DATA - generated for development, not real lending',
        ] as Cell[],
      ]
    : []),
];

export const toCsv = (rows: Cell[][], d: CsvDialect): string =>
  // BOM so Excel opens Slovak diacritics as UTF-8.
  '﻿' +
  rows.map((r) => r.map((v) => cell(v, d)).join(d.sep)).join('\r\n') +
  '\r\n';

export type CsvKind =
  'kpis' | 'titles' | 'series' | 'categories' | 'heatmap' | 'outcomes';
export const CSV_KINDS: CsvKind[] = [
  'kpis',
  'titles',
  'series',
  'categories',
  'heatmap',
  'outcomes',
];

const body = (data: IAdminStatistics, kind: CsvKind): Cell[][] => {
  switch (kind) {
    case 'kpis': {
      const k = data.kpis;
      return [
        ['metric', 'value', 'previous'],
        ['loans', k.loans.value, k.loans.previous],
        ['active_readers', k.active_readers.value, k.active_readers.previous],
        ['utilization', k.utilization.value, k.utilization.previous],
        [
          'hold_fulfillment',
          k.hold_fulfillment.value,
          k.hold_fulfillment.previous,
        ],
        [
          'median_wait_hours',
          k.median_wait_hours.value,
          k.median_wait_hours.previous,
        ],
        ['copies_in_use_now', k.copies_in_use_now, null],
        ['copies_total', k.copies_total, null],
        ['lcp_titles', k.lcp_titles, null],
        [],
        ['attention', 'now', ''],
        ...Object.entries(data.attention).map(
          ([key, v]) => [key, v, null] as Cell[]
        ),
      ];
    }
    case 'titles':
      return [
        [
          'entry_id',
          'title',
          'authors',
          'copies',
          'in_use_now',
          'queued_now',
          'loans',
          'loan_days',
          'utilization',
          'holds_ratio',
          'turnover',
          'avg_loan_days',
          'added_at',
          'last_loan_at',
        ],
        ...data.titles.map((d) => [
          d.entry_id,
          d.title,
          d.authors.join('; '),
          d.copies,
          d.in_use,
          d.queued,
          d.loans,
          d.loan_days,
          d.utilization,
          d.holds_ratio,
          d.turnover,
          d.avg_loan_days,
          d.added_at,
          d.last_loan_at,
        ]),
        ...(data.titles_truncated
          ? [['# NOTE', 'truncated to the 1,000 busiest LCP titles'] as Cell[]]
          : []),
      ];
    case 'series':
      return [
        [
          'bucket_start',
          'partial',
          'loans_started',
          'loans_returned',
          'loans_expired',
          'holds_placed',
        ],
        ...data.series.map((b) => [
          b.t,
          b.partial,
          b.loans_started,
          b.loans_returned,
          b.loans_expired,
          b.holds_placed,
        ]),
      ];
    case 'categories':
      return [
        ['category_id', 'title', 'loans'],
        ...data.categories.map((c) => [c.category_id, c.title, c.loans]),
      ];
    case 'heatmap':
      return [
        ['weekday_0_is_monday', 'hour', 'loans'],
        ...[...data.heatmap]
          .sort((a, b) => a.dow - b.dow || a.hour - b.hour)
          .map((c) => [c.dow, c.hour, c.loans]),
      ];
    case 'outcomes':
      return [
        ['kind', 'outcome', 'count'],
        ...Object.entries(data.hold_outcomes).map(
          ([k, v]) => ['holds', k, v] as Cell[]
        ),
        ...Object.entries(data.loan_outcomes).map(
          ([k, v]) => ['loans', k, v] as Cell[]
        ),
      ];
  }
};

export const buildCsv = (
  data: IAdminStatistics,
  meta: ReportMeta,
  kind: CsvKind,
  d: CsvDialect
) => toCsv([...body(data, kind), [], ...footerLines(data, meta, kind)], d);

export const fileStem = (data: IAdminStatistics, meta: ReportMeta) =>
  `elvira-${meta.demo ? 'DEMO-' : ''}lending-${data.period.from}_${data.period.to}`;

export const downloadText = (text: string, filename: string, mime: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadCsv = (
  data: IAdminStatistics,
  meta: ReportMeta,
  kind: CsvKind,
  d: CsvDialect
) =>
  downloadText(
    buildCsv(data, meta, kind, d),
    `${fileStem(data, meta)}-${kind}.csv`,
    'text/csv;charset=utf-8'
  );

export const downloadJson = (data: IAdminStatistics, meta: ReportMeta) =>
  downloadText(
    JSON.stringify(
      { ...meta, exported_at: new Date().toISOString(), statistics: data },
      null,
      2
    ),
    `${fileStem(data, meta)}.json`,
    'application/json'
  );
