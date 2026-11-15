import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';
import { CircleLoader } from 'react-spinners';
import useAxios from '../../hooks/api/useAxios';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import { readablePdfIndex } from '../../hooks/useOpenPublication';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { ILocator } from '../../utils/interfaces/locator';
import type { IViewerLocationState } from '../../hooks/api/assistant/useOpenInViewer';

/**
 * `/cite/:entryId/:key` (elvira-portal#46): a citation link from a chat, an e-mail or an agent transcript. The
 * catalog resolves the locator (EvilFlowersCatalog#171) to a page and boxes in the current extraction; the reader
 * opens there with the sentence highlighted. A reader without access gets the publication's detail (borrow) instead;
 * an unknown or hidden publication the not-found page. Every outcome replaces this route, so Back skips it.
 */
const Cite = () => {
  const { entryId, key } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const axios = useAxios();
  const { getEntryDetail } = useGetEntryDetail();

  useEffect(() => {
    if (!entryId || !key) {
      navigate(NAVIGATION_PATHS.notFound, { replace: true });
      return;
    }
    let cancelled = false;

    const openDetail = (catalogId?: string) => {
      const params = new URLSearchParams({ 'entry-detail-id': entryId });
      if (catalogId) params.set('entry-catalog-id', catalogId);
      navigate(`${NAVIGATION_PATHS.library}?${params.toString()}`, { replace: true });
    };

    (async () => {
      let locator: ILocator | null = null;
      try {
        const { data } = await axios.get<{ response: ILocator }>(
          `/api/v1/locators/${encodeURIComponent(entryId)}/${encodeURIComponent(key)}`,
        );
        locator = data.response;
      } catch (error) {
        if (cancelled) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 403) {
          // No access (e.g. outside the entry's IP ranges): the publication's detail, where borrowing lives.
          openDetail();
          return;
        }
        if (status !== 404) toast.error(t('cite.failed'));
        navigate(NAVIGATION_PATHS.notFound, { replace: true });
        return;
      }
      if (cancelled) return;

      const entry = await getEntryDetail(entryId).catch(() => null);
      if (cancelled) return;
      if (!entry) {
        navigate(NAVIGATION_PATHS.notFound, { replace: true });
        return;
      }

      // Readium LCP titles are borrowed and read in a Readium app, never here: their detail (borrow) instead.
      const index = readablePdfIndex(entry);
      if (!locator.page || index < 0) {
        openDetail(entry.catalog_id);
        return;
      }

      if (locator.resolution === 'relocated') toast.info(t('cite.relocated'));
      else if (locator.resolution === 'page_only') toast.info(t('cite.pageOnly'));

      const target =
        locator.resolution !== 'page_only' && (locator.bbox || locator.quads?.length)
          ? { bbox: locator.bbox ?? undefined, quads: locator.quads ?? undefined }
          : undefined;
      const state: IViewerLocationState = { catalogId: entry.catalog_id, ...(target ? { target } : {}) };
      navigate(`${NAVIGATION_PATHS.viewer}${entryId}/${index}?page=${locator.page}`, { replace: true, state });
    })();

    return () => {
      cancelled = true;
    };
    // One resolution per link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, key]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4" aria-live="polite">
      <CircleLoader size={40} color="#0077cc" />
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('cite.opening')}</p>
    </div>
  );
};

export default Cite;
