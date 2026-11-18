import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import i18next from 'i18next';
import { useEffect } from 'react';
import { reportRenderError } from '../../lib/telemetry';
import NotFound from '../../pages/common/NotFound';

/**
 * A route that failed to load (a loader error, a chunk that didn't download) inside the app's chrome, so
 * the navigation stays usable. A 404 response is the not-found page; anything else offers a reload.
 */
const RouteError = () => {
  const error = useRouteError();

  useEffect(() => {
    if (!isRouteErrorResponse(error)) reportRenderError(error, undefined);
  }, [error]);

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;

  const message = error instanceof Error ? error.message : String(error ?? '');
  const isChunkError = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(message);
  const t = (key: string) => i18next.t(`errorBoundary.${key}`);

  return (
    <div role="alert" className="flex flex-1 h-full flex-col items-center justify-center gap-4 p-6 text-center text-black dark:text-white">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{t(isChunkError ? 'chunk' : 'render')}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onPrimary transition-opacity hover:opacity-90"
      >
        {t('reload')}
      </button>
    </div>
  );
};

export default RouteError;
