import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { IEntryDetail, IEntryHeading } from '../../../../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';

/**
 * The publication's outline, read from its PDF by the catalog. A chapter opens
 * the PDF in the viewer at its page; entries lent through Readium LCP only list
 * their chapters (opening them goes through borrowing).
 */
export const EntryContents = ({ entry, catalogId }: { entry: IEntryDetail; catalogId?: string | null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const headings: IEntryHeading[] = entry.table_of_contents ?? [];

  const pdfIndex = entry.acquisitions.findIndex((a) => a.mime === 'application/pdf');
  const canOpen = pdfIndex >= 0 && !entry.config?.readium_enabled;

  const open = (page: number) => {
    const state: { catalogId?: string; fromPath?: string } = { fromPath: `${location.pathname}${location.search}` };
    if (catalogId) state.catalogId = catalogId;
    navigate(`${NAVIGATION_PATHS.viewer}${entry.id}/${pdfIndex}?page=${page}`, { state });
  };

  if (!headings.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('entry.detail.contents.empty')}</p>;
  }

  const topLevel = Math.min(...headings.map((h) => h.level));
  let chapter = 0;

  return (
    <ol className="flex flex-col">
      {headings.map((heading, index) => {
        const depth = Math.max(0, heading.level - topLevel);
        if (depth === 0) chapter += 1;
        const content = (
          <>
            <span className="flex-1 min-w-0">
              {depth === 0 && <span className="text-primary dark:text-primaryLight font-semibold mr-2">{chapter}.</span>}
              {heading.title}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-gray-400">{heading.page}</span>
          </>
        );
        const className = twMerge(
          'w-full flex items-baseline gap-3 py-2 text-left border-b border-gray-200 dark:border-gray-700',
          depth === 0 ? 'font-medium text-black dark:text-white text-base' : 'text-sm text-gray-600 dark:text-gray-300'
        );
        return (
          <li key={index} style={{ paddingLeft: `${Math.min(depth, 4) * 16}px` }}>
            {canOpen ? (
              <button type="button" className={twMerge(className, 'hover:text-primary dark:hover:text-primaryLight')} onClick={() => open(heading.page)}>
                {content}
              </button>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default EntryContents;
