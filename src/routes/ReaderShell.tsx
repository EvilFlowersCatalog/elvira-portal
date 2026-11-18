import { lazy, Suspense } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ReaderLoader from '../components/viewer/ReaderLoader';
import { cachedReaderBook } from '../components/viewer/readerBook';
import type { IReaderRouteData } from './loaders';
import { loadViewer } from './pages';

const Viewer = lazy(loadViewer);

/**
 * `/entries/:entryId/read`, eagerly loaded and tiny: the route commits as soon as its loader has answered
 * (usually from cache), and the reader's loading screen (cover, title) shows at once while the viewer's
 * chunk, which the loader started downloading, finishes. One reader per publication file (keyed), so going
 * from one book to another inside the reader starts clean.
 */
export default function ReaderShell() {
  const route = useLoaderData() as IReaderRouteData;
  const queryClient = useQueryClient();
  return (
    <Suspense fallback={<ReaderLoader book={cachedReaderBook(queryClient, route.entryId)} stage="preparing" leaving={false} />}>
      <Viewer key={`${route.entryId}/${route.file ?? ''}/${route.catalogId ?? ''}`} route={route} />
    </Suspense>
  );
}
