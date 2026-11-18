import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IPassage, IPassageHit } from '../../../hooks/api/entries/usePassageSearch';
import useEntryDialog from '../../../hooks/useEntryDialog';
import { readerPath } from '@/lib/links/paths';
import { prefetchEntry } from '../../../hooks/api/entries/entryQueries';
import { preloadReader } from '../../../routes/pages';
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
  const dialog = useEntryDialog();

  const openDetail = (hit: IPassageHit) => {
    dialog.open(hit.entry_id, { catalogId: hit.catalog_id ?? hit.entry?.catalog_id });
    onOpen?.();
  };

  const openPassage = (hit: IPassageHit, passage: IPassage) => {
    if (!passage.snippet && !passage.text) {
      openDetail(hit);
      return;
    }
    // The page numbers the PDF; the reader opens the publication's readable PDF at it, at the paragraph.
    navigate(
      readerPath(hit.entry_id, {
        page: passage.page,
        p: passage.paragraph_id,
        catalogId: hit.catalog_id ?? hit.entry?.catalog_id,
      }),
    );
    onOpen?.();
  };

  return (
    <div className={compact ? 'flex flex-col gap-1' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1'}>
      {hits.map((hit) => (
        <div
          key={hit.entry_id}
          className="flex gap-3 p-2 rounded min-w-0"
          onMouseEnter={() => {
            prefetchEntry(hit.entry_id, hit.catalog_id ?? hit.entry?.catalog_id);
            preloadReader();
          }}
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
              wrapperClassName="h-16 w-10 rounded"
            />
          </button>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => openDetail(hit)}
              className="text-left text-xs font-semibold line-clamp-1 text-secondary dark:text-white hover:underline"
            >
              {hit.entry?.title ?? t('search.unknownBook')}
            </button>
            {hit.passages.map((passage) => (
              <button
                key={passage.paragraph_id}
                type="button"
                onClick={() => openPassage(hit, passage)}
                className="text-left text-xs rounded px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors line-clamp-2"
              >
                <span className="font-semibold text-primaryText dark:text-primaryLight mr-1">
                  {t('search.pageShort', { page: passage.page })}
                </span>
                {passage.snippet || passage.text ? (
                  <Highlight
                    html={passage.snippet}
                    text={passage.text ?? ''}
                    className="text-gray-700 dark:text-gray-300"
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
