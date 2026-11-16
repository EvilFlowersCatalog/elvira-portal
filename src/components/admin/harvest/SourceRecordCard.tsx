import { useTranslation } from 'react-i18next';
import { FiBook } from 'react-icons/fi';
import { ISourceRecord } from '../../../utils/interfaces/harvest';
import { recordAuthors, recordTitle } from './harvestFormat';

/** What a source said about one book, as a book card: the test's sample record and the records browser's detail. */
export default function SourceRecordCard({ record }: { record: ISourceRecord }) {
  const { t } = useTranslation();
  const authors = recordAuthors(record);
  const identifiers = Object.entries(record.identifiers ?? {});
  const facts: [string, string | number | null | undefined][] = [
    [t('administration.harvest.record.publisher'), record.publisher],
    [t('administration.harvest.record.published'), record.published],
    [t('administration.harvest.record.edition'), record.edition],
    [t('administration.harvest.record.language'), record.language],
    [t('administration.harvest.record.pages'), record.page_count],
    [t('administration.harvest.record.series'), [record.series, record.series_number].filter(Boolean).join(' ') || null],
  ];

  return (
    <article className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="hidden h-24 w-16 shrink-0 items-center justify-center rounded-md bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight sm:flex">
        <FiBook size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-secondary dark:text-secondaryLight">
          {recordTitle(record) || <span className="italic text-zinc-400">{t('administration.harvest.record.untitled')}</span>}
        </h3>
        {authors && <p className="text-sm text-zinc-600 dark:text-zinc-300">{authors}</p>}
        {record.deleted && (
          <p className="mt-1 text-xs font-medium text-redText dark:text-red">{t('administration.harvest.record.deletedAtSource')}</p>
        )}
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          {facts
            .filter(([, value]) => value !== null && value !== undefined && value !== '')
            .map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <dt className="text-zinc-500 dark:text-zinc-400">{label}:</dt>
                <dd className="text-zinc-800 dark:text-zinc-100">{value}</dd>
              </div>
            ))}
          {identifiers.map(([key, value]) => (
            <div key={key} className="flex gap-1.5">
              <dt className="uppercase text-zinc-500 dark:text-zinc-400">{key}:</dt>
              <dd className="break-all font-mono text-zinc-800 dark:text-zinc-100">{value}</dd>
            </div>
          ))}
          {record.record_id && (
            <div className="flex gap-1.5 sm:col-span-2">
              <dt className="text-zinc-500 dark:text-zinc-400">{t('administration.harvest.record.recordId')}:</dt>
              <dd className="break-all font-mono text-zinc-800 dark:text-zinc-100">{record.record_id}</dd>
            </div>
          )}
        </dl>
        {!!record.subjects?.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {record.subjects.slice(0, 8).map((s, i) => (
              <span key={`${s.term}-${i}`} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {s.label || s.term}
              </span>
            ))}
          </div>
        )}
        {record.summary && <p className="mt-2 line-clamp-3 text-xs text-zinc-600 dark:text-zinc-300">{record.summary}</p>}
      </div>
    </article>
  );
}
