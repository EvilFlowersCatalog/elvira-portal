import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import useSimilarEntries, { IEntryFigure } from '../../../../hooks/api/entries/useSimilarEntries';
import useEscapeLayer from '../../../../hooks/useEscapeLayer';

/** Every figure, table and equation of the entry's processed PDF, with its printed caption and description (IP-018 Phase 8). */
export const EntryFigures = ({ entryId }: { entryId: string }) => {
  const { t } = useTranslation();
  const { getEntryFigures } = useSimilarEntries();
  const [open, setOpen] = useState<IEntryFigure | null>(null);
  useEscapeLayer(() => setOpen(null), !!open);

  const { data: figures, isLoading } = useQuery({
    queryKey: ['entry-figures', entryId],
    queryFn: () => getEntryFigures(entryId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <CircleLoader size={32} color="#0077cc" />
      </div>
    );
  }
  if (!figures?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('entry.detail.figures.empty')}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {figures.map((figure) => {
          const caption = figure.printed_caption || figure.caption;
          return (
            <button
              key={figure.id}
              type="button"
              onClick={() => setOpen(figure)}
              className="flex flex-col gap-2 text-left rounded-md border border-gray-200 dark:border-gray-700 p-2 hover:shadow-md transition"
            >
              <div className="h-36 flex items-center justify-center bg-white rounded overflow-hidden">
                {figure.image_url ? (
                  <img src={figure.image_url} alt={caption ?? ''} loading="lazy" className="max-h-36 object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">{t('entry.detail.figures.noImage')}</span>
                )}
              </div>
              {caption && <p className="text-xs font-medium text-black dark:text-white line-clamp-3">{caption}</p>}
              {figure.description && figure.description !== caption && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{figure.description}</p>
              )}
              <p className="text-[11px] text-gray-400">
                {t(`entry.detail.figures.kind.${figure.kind}`)} · {t('entry.detail.figures.page', { page: figure.page })}
              </p>
            </button>
          );
        })}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
          role="dialog"
        >
          <div
            className="max-w-4xl max-h-full overflow-auto bg-white dark:bg-gray-900 rounded-lg p-4 flex flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            {open.image_url && <img src={open.image_url} alt={open.printed_caption ?? ''} className="max-h-[70vh] object-contain bg-white" />}
            {(open.printed_caption || open.caption) && (
              <p className="text-sm font-medium text-black dark:text-white">{open.printed_caption || open.caption}</p>
            )}
            {open.description && open.description !== (open.printed_caption || open.caption) && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{open.description}</p>
            )}
            <p className="text-xs text-gray-400">{t('entry.detail.figures.page', { page: open.page })}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default EntryFigures;
