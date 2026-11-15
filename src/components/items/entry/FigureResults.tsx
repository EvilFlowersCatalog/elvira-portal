import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiImage } from 'react-icons/fi';
import { CircleLoader } from 'react-spinners';
import useFigureSearch, { FigureKind, IFigureHit } from '../../../hooks/api/entries/useFigureSearch';
import useOpenCitation from '../../../hooks/api/assistant/useOpenCitation';
import { useCropUrl } from '../../assistant/citationUi';
import { EntryFilters } from '../../../hooks/api/entries/entryFilters';
import useAppContext from '../../../hooks/contexts/useAppContext';

const KIND_FILTERS: { key: 'all' | FigureKind; kinds: FigureKind[] }[] = [
  { key: 'all', kinds: ['figure', 'table'] },
  { key: 'figure', kinds: ['figure'] },
  { key: 'table', kinds: ['table'] },
];

function FigureHitCard({ hit, query }: { hit: IFigureHit; query: string }) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const openCitation = useOpenCitation();
  const { umamiTrack } = useAppContext();
  const [failed, setFailed] = useState(false);
  const image = failed ? undefined : cropUrl(hit.crop_url);
  const text = hit.caption || hit.description;

  const open = () => {
    umamiTrack('Figure Search Open', { kind: hit.kind, entry: hit.entry_id });
    // Through the citation path: an LCP title opens its detail (borrow), others the reader at the page with the
    // region outlined.
    openCitation({
      label: '',
      entry_id: hit.entry_id,
      title: hit.title,
      page: hit.page,
      kind: hit.kind,
      region_id: hit.region_id,
    });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={open}
        className="flex h-40 items-center justify-center overflow-hidden bg-white"
        aria-label={t('search.figures.open', { title: hit.title, page: hit.page })}
      >
        {image ? (
          <img
            src={image}
            alt={text ?? ''}
            loading="lazy"
            onError={() => setFailed(true)}
            className="max-h-40 max-w-full object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-gray-400">
            <FiImage size={20} aria-hidden />
            {t('search.figures.noImage')}
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-2">
        {text ? (
          <button
            type="button"
            onClick={open}
            className="text-left text-xs font-medium text-black line-clamp-3 hover:underline dark:text-white"
            title={hit.description && hit.description !== text ? hit.description : undefined}
          >
            {text}
          </button>
        ) : null}
        <p className="mt-auto text-[11px] text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{hit.title}</span>
          {' · '}
          {t(`entry.detail.figures.kind.${hit.kind}`)} · {t('entry.detail.figures.page', { page: hit.page })}
        </p>
        {hit.downloadable && image ? (
          <a
            href={image}
            target="_blank"
            rel="noreferrer"
            download
            onClick={() => umamiTrack('Figure Search Download', { kind: hit.kind, entry: hit.entry_id, query })}
            className="inline-flex items-center gap-1 self-start text-[11px] text-primary hover:underline dark:text-primaryLight"
          >
            <FiDownload size={11} aria-hidden /> {t('search.figures.download')}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The "Figures and tables" results tab (elvira-portal#45): figure and table crops that match the search across
 * the library. A card opens the reader at its page with the region outlined; a download is offered only where the
 * catalog says the title allows it (`downloadable`: open access, printing and sharing allowed).
 */
export default function FigureResults({ query, filters }: { query: string; filters: EntryFilters }) {
  const { t } = useTranslation();
  const [kindFilter, setKindFilter] = useState<'all' | FigureKind>('all');
  const kinds = KIND_FILTERS.find((k) => k.key === kindFilter)!.kinds;
  const search = useFigureSearch(query, { kinds, filters });

  return (
    <div className="flex flex-col gap-3 px-4 pb-10">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('search.figures.kindFilter')}>
        {KIND_FILTERS.map(({ key }) => (
          <button
            key={key}
            type="button"
            aria-pressed={kindFilter === key}
            onClick={() => setKindFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs ${
              kindFilter === key
                ? 'border-primary bg-primary text-white'
                : 'border-zinc-300 text-gray-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800'
            }`}
          >
            {t(`search.figures.kinds.${key}`)}
          </button>
        ))}
        {search.data?.degraded ? (
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('search.figures.degraded')}</span>
        ) : null}
      </div>

      {search.isLoading ? (
        <div className="flex justify-center py-10">
          <CircleLoader size={32} color="#0077cc" />
        </div>
      ) : search.isError ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t('search.figures.error')}</p>
      ) : !search.data?.items.length ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t('search.figures.empty')}</p>
      ) : (
        <div
          className={`grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 transition-opacity ${
            search.isFetching ? 'opacity-60' : ''
          }`}
        >
          {search.data.items.map((hit) => (
            <FigureHitCard key={hit.region_id} hit={hit} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}
