import { enUS, sk } from 'date-fns/locale';

/** date-fns locale matching the UI language (the portal ships Slovak and English). */
export const dateLocale = (lang: string) => (lang.startsWith('sk') ? sk : enUS);

/** Tooltip positioning shared by all charts (visx TooltipWithBounds keeps it inside the viewport). */
export const tooltipStyle = {
  position: 'absolute' as const,
  pointerEvents: 'none' as const,
  zIndex: 20,
};

const locale = () =>
  (typeof document !== 'undefined' && document.documentElement.lang) ||
  undefined;

/** 1,284 in full under 10k, compact above (12.9K). Proportional figures are a CSS concern. */
export const fmtCount = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.abs(n) < 10_000
    ? Math.round(n).toLocaleString(locale())
    : new Intl.NumberFormat(locale(), {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n);
};

export const fmtPct = (f: number | null | undefined, digits = 0): string =>
  f == null || Number.isNaN(f) ? '—' : `${(f * 100).toFixed(digits)} %`;

export const fmtRatio = (f: number | null | undefined): string =>
  f == null || Number.isNaN(f)
    ? '—'
    : f.toLocaleString(locale(), { maximumFractionDigits: 1 });

export const fmtHours = (h: number | null | undefined): string => {
  if (h == null || Number.isNaN(h)) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${(h / 24).toLocaleString(locale(), { maximumFractionDigits: 1 })} d`;
};

/** Relative change, or null when there is nothing honest to compare against. */
export const relDelta = (
  value: number | null,
  previous: number | null
): number | null =>
  value == null || previous == null || previous === 0
    ? null
    : (value - previous) / Math.abs(previous);
