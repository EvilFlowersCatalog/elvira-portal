import { useTranslation } from 'react-i18next';
import Thumbnail from '../items/entry/Thumbnail';

export interface IReaderLoaderBook {
  title: string;
  authors: string;
  thumbnail?: string | null;
}

interface IReaderLoaderProps {
  /** Known once the entry detail has arrived; until then the cover and title are placeholders. */
  book: IReaderLoaderBook | null;
  /** `preparing`: entry, licence and copy; `opening`: the viewer is loading and painting page 1. */
  stage: 'preparing' | 'opening';
  /** Fades out, then the parent unmounts it. */
  leaving: boolean;
}

/**
 * The reader's one loading screen (elvira-portal#63). It covers everything from the click to the first
 * painted page, the viewer's own spinner included, so the reader sees a single calm transition: the book
 * they opened and what is happening. The line is indeterminate on purpose: with range loading the first
 * page paints after a small part of the file, so a byte percentage would mislead.
 */
export default function ReaderLoader({ book, stage, leaving }: IReaderLoaderProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      aria-label={t('readerLoading.label')}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 dark:bg-darkGray transition-opacity duration-300 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-6 px-6 text-center">
        {book ? (
          <Thumbnail
            thumbnail={book.thumbnail}
            alt=""
            priority
            wrapperClassName="h-48 w-36 rounded-md shadow-lg ring-1 ring-black/5 dark:ring-white/10"
          />
        ) : (
          <div className="h-48 w-36 rounded-md bg-zinc-200 dark:bg-strongDarkGray motion-safe:animate-pulse" />
        )}

        <div className="flex min-h-[3.5rem] w-full flex-col items-center gap-1">
          {book ? (
            <>
              <p className="line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                {book.title}
              </p>
              {book.authors && (
                <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{book.authors}</p>
              )}
            </>
          ) : (
            <>
              <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-strongDarkGray motion-safe:animate-pulse" />
              <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-strongDarkGray motion-safe:animate-pulse" />
            </>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="reader-loader-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-primary" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(stage === 'opening' ? 'readerLoading.opening' : 'readerLoading.preparing')}
          </p>
        </div>
      </div>
    </div>
  );
}
