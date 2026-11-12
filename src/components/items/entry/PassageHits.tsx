import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { IPassage, IPassageHit } from '../../../hooks/api/entries/usePassageSearch';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import Thumbnail from './Thumbnail';
import Highlight from './Highlight';

interface IPassageHits {
  hits: IPassageHit[];
  /** Small rows for the type-ahead; cards for the results page. */
  compact?: boolean;
  /** Called after a click (closes the type-ahead). */
  onOpen?: () => void;
}

/**
 * Publications with the passages that matched a search inside books. A readable
 * passage opens the viewer at its page; a hidden one (Readium LCP, IP block)
 * opens the publication's detail instead.
 */
const PassageHits = ({ hits, compact = false, onOpen }: IPassageHits) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const openDetail = (hit: IPassageHit) => {
    const params = new URLSearchParams(searchParams);
    params.set('entry-detail-id', hit.entry_id);
    const catalogId = hit.catalog_id ?? hit.entry?.catalog_id;
    if (catalogId) params.set('entry-catalog-id', catalogId);
    setSearchParams(params);
    onOpen?.();
  };

  const openPassage = (hit: IPassageHit, passage: IPassage) => {
    if (!passage.snippet && !passage.text) {
      openDetail(hit);
      return;
    }
    // The page numbers the PDF; open the entry's PDF file, the first file otherwise.
    const index = Math.max(0, hit.entry?.acquisitions?.findIndex((a) => a.mime === 'application/pdf') ?? 0);
    const state: { catalogId?: string; fromPath: string } = { fromPath: `${location.pathname}${location.search}` };
    const catalogId = hit.catalog_id ?? hit.entry?.catalog_id;
    if (catalogId) state.catalogId = catalogId;
    navigate(`${NAVIGATION_PATHS.viewer}${hit.entry_id}/${index}?page=${passage.page}`, { state });
    onOpen?.();
  };

  const authors = (hit: IPassageHit) =>
    hit.entry?.authors?.map((a) => `${a.name} ${a.surname}`.trim()).join(', ') || '-';

  return (
    <div className={compact ? 'flex flex-col gap-1' : 'grid grid-cols-1 lg:grid-cols-2 gap-3'}>
      {hits.map((hit) => (
        <div
          key={hit.entry_id}
          className={
            compact
              ? 'flex gap-3 p-2 rounded'
              : 'flex gap-3 p-3 rounded-lg bg-white dark:bg-darkGray border border-gray-300 dark:border-gray-700'
          }
        >
          <button
            type="button"
            onClick={() => openDetail(hit)}
            className="flex-shrink-0 self-start"
            aria-label={hit.entry?.title}
          >
            <Thumbnail
              thumbnail={hit.entry?.thumbnail}
              alt={hit.entry?.title ?? ''}
              wrapperClassName={compact ? 'h-16 w-10 rounded' : 'h-24 w-16 rounded'}
            />
          </button>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => openDetail(hit)}
              className="text-left text-xs font-semibold line-clamp-2 text-secondary dark:text-white hover:underline"
            >
              {hit.entry?.title ?? t('search.unknownBook')}
            </button>
            {!compact && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{authors(hit)}</p>}
            {hit.passages.map((passage) => (
              <button
                key={passage.paragraph_id}
                type="button"
                onClick={() => openPassage(hit, passage)}
                className="text-left text-xs rounded px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-primaryText dark:text-primaryLight mr-1">
                  {t('search.pageShort', { page: passage.page })}
                </span>
                {passage.snippet || passage.text ? (
                  <Highlight
                    html={passage.snippet}
                    text={passage.text ?? ''}
                    className={`text-gray-700 dark:text-gray-300 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}
                  />
                ) : (
                  <span className="italic text-gray-500 dark:text-gray-400">{t('search.passageHidden')}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PassageHits;
