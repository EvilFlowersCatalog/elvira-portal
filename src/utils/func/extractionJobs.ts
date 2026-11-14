import { IExtractionJobGroup, IExtractionRun } from '../interfaces/extraction';

/** `equations:0009-0016` → pages 9–16; an unbatched job (`paragraphs`) has none. */
const batchPages = (job: string): [number, number] | null => {
  const match = /:(\d+)-(\d+)$/.exec(job);
  return match ? [Number(match[1]), Number(match[2])] : null;
};

/**
 * The run's jobs grouped by kind: the catalog's `job_groups` (EvilFlowersCatalog#150), or for an
 * older catalog the same grouping done here from `jobs`, by the part of the name before `:`.
 */
export const jobGroups = (run: Pick<IExtractionRun, 'jobs' | 'job_groups'>): IExtractionJobGroup[] => {
  if (run.job_groups) return run.job_groups;

  const groups = new Map<string, IExtractionJobGroup>();
  for (const [job, status] of Object.entries(run.jobs ?? {})) {
    const kind = job.split(':')[0];
    const group = groups.get(kind) ?? { kind, total: 0, done: 0, pending: 0, failed: 0, pending_pages: null };
    group.total += 1;
    if (status === 'done' || status === 'pending' || status === 'failed') group[status] += 1;
    const pages = status === 'pending' ? batchPages(job) : null;
    if (pages) {
      group.pending_pages = group.pending_pages
        ? [Math.min(group.pending_pages[0], pages[0]), Math.max(group.pending_pages[1], pages[1])]
        : pages;
    }
    groups.set(kind, group);
  }
  return [...groups.values()].sort((a, b) => a.kind.localeCompare(b.kind));
};

/** `done`, `failed` or `pending` for the group as a whole (failed wins, then pending). */
export const groupStatus = (group: IExtractionJobGroup): 'done' | 'failed' | 'pending' =>
  group.failed > 0 ? 'failed' : group.pending > 0 ? 'pending' : 'done';
