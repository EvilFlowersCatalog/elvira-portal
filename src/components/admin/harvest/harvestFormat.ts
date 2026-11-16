import type { TFunction } from 'i18next';
import { StatusVariant } from '../StatusChip';
import { HarvestMode, HarvestRecordStatus, IHarvestReport, ISourceRecord, SyncState } from '../../../utils/interfaces/harvest';

/** Schedule presets offered next to the cron field (five-field cron; empty = manual runs only). */
export const SCHEDULE_PRESETS: { id: string; cron: string }[] = [
  { id: 'manual', cron: '' },
  { id: 'every15', cron: '*/15 * * * *' },
  { id: 'hourly', cron: '0 * * * *' },
  { id: 'nightly', cron: '0 2 * * *' },
];

const pad = (n: string) => n.padStart(2, '0');
const isNum = (v: string) => /^\d+$/.test(v);

/**
 * A cron line in words for the common shapes (`*\/15 * * * *` → "every 15 minutes", `0 2 * * *` → "daily at 02:00");
 * anything else is shown as the cron itself, which a librarian who wrote it can read.
 */
export const describeSchedule = (schedule: string | null | undefined, t: TFunction): string => {
  const cron = (schedule ?? '').trim();
  if (!cron) return t('administration.harvest.schedule.manual');
  const parts = cron.split(/\s+/);
  if (parts.length !== 5) return cron;
  const [minute, hour, dom, month, dow] = parts;
  const everyDay = dom === '*' && month === '*' && dow === '*';
  const everyMinutes = minute.match(/^\*\/(\d+)$/);
  if (everyMinutes && hour === '*' && everyDay) return t('administration.harvest.schedule.everyMinutes', { count: Number(everyMinutes[1]) });
  if (minute === '*' && hour === '*' && everyDay) return t('administration.harvest.schedule.everyMinutes', { count: 1 });
  const everyHours = hour.match(/^\*\/(\d+)$/);
  if (isNum(minute) && everyHours && everyDay)
    return t('administration.harvest.schedule.everyHours', { count: Number(everyHours[1]), minute: pad(minute) });
  if (isNum(minute) && hour === '*' && everyDay) return t('administration.harvest.schedule.hourly', { minute: pad(minute) });
  if (isNum(minute) && isNum(hour) && everyDay) return t('administration.harvest.schedule.daily', { time: `${pad(hour)}:${pad(minute)}` });
  if (isNum(minute) && isNum(hour) && dom === '*' && month === '*' && /^[0-7]$/.test(dow))
    return t('administration.harvest.schedule.weekly', {
      day: t(`administration.harvest.schedule.days.${Number(dow) % 7}`),
      time: `${pad(hour)}:${pad(minute)}`,
    });
  return cron;
};

/** "2 created · 40 matched · 3 ambiguous": the non-zero counters of a run, most telling first. */
export const summarizeReport = (report: IHarvestReport | null | undefined, t: TFunction): string | null => {
  if (!report) return null;
  const order: (keyof IHarvestReport)[] = ['created', 'enriched', 'matched', 'ambiguous', 'unmatched', 'failed', 'deleted', 'skipped'];
  const parts = order
    .filter((key) => typeof report[key] === 'number' && (report[key] as number) > 0)
    .map((key) => t(`administration.harvest.counter.${key}`, { count: report[key] as number }));
  if (!parts.length) {
    return typeof report.seen === 'number' ? t('administration.harvest.counter.seenOnly', { count: report.seen }) : null;
  }
  return parts.join(' · ');
};

export const MODE_VARIANT: Record<HarvestMode, StatusVariant> = {
  link_only: 'neutral',
  enrich: 'info',
  create: 'success',
  sync: 'warning',
};

export const RECORD_STATUS_VARIANT: Record<HarvestRecordStatus, StatusVariant> = {
  created: 'success',
  matched: 'info',
  enriched: 'info',
  ambiguous: 'warning',
  unmatched: 'warning',
  failed: 'danger',
  deleted: 'neutral',
  skipped: 'neutral',
};

export const SYNC_STATE_VARIANT: Record<SyncState, StatusVariant> = {
  in_sync: 'success',
  pending: 'info',
  conflict: 'warning',
  error: 'danger',
};

/** A source record's title with its subtitle, as `SourceRecord.full_title` builds it. */
export const recordTitle = (record: ISourceRecord | null | undefined): string => {
  if (!record) return '';
  const { title, subtitle } = record;
  if (subtitle && !(title ?? '').toLowerCase().includes(subtitle.toLowerCase())) return title ? `${title}: ${subtitle}` : subtitle;
  return title ?? '';
};

export const recordAuthors = (record: ISourceRecord | null | undefined): string =>
  (record?.authors ?? [])
    .map((a) => [a.name, a.surname].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ');

/** Fill `{record_id}` of an external system's record URL template, verbatim as the catalog does (`str.format`). */
export const recordUrl = (template: string | null | undefined, recordId: string): string | null =>
  template && recordId ? template.split('{record_id}').join(recordId) : null;
