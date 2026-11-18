import { useState } from 'react';
import { CircleLoader } from 'react-spinners';
import { RiBookmarkFill, RiBookmarkLine, RiChatQuoteLine, RiLinkM, RiShareLine, RiSparkling2Line } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import useAuthContext from '../../../../hooks/contexts/useAuthContext';
import useAddToShelf from '../../../../hooks/api/my-shelf/useAddToShelf';
import useRemoveFromShelf from '../../../../hooks/api/my-shelf/useRemoveFromShelf';
import { SHELF_ENTRY_IDS_KEY } from '../../../../hooks/api/my-shelf/useShelfEntryIds';
import { entryDetailQuery, entryLicenseQuery, httpStatus, invalidateEntry } from '../../../../hooks/api/entries/entryQueries';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';
import { IEntryDetail } from '../../../../utils/interfaces/entry';
import { ILicense, LICENSE_STATE } from '../../../../utils/interfaces/license';
import ShelfButton from '../../../buttons/ShelfButton';
import Thumbnail from '../Thumbnail';
import { TabContent, Tabs, TabsComponent, TabsHeader, TabTitle } from './EntryDetailTabs';
import { InfoGrid, InfoItem, InfoItemCustom } from './EntryGrid';
import { SummaryText } from './SummaryText';
import { StatGroup, StatItem } from './StatGroup';
import { DetailHeader } from './DetailHeader';
import { ActionsButton, ActionsWrapper } from './DetailActions';
import { AcceptedLanguage, getLanguage } from '../../../../hooks/api/languages/languages';
import AcquisitionsButton from '../../../buttons/AcqusitionsButton';
import EntryRelated from './EntryRelated';
import EntryReviews from './EntryReviews';
import { RatingStars } from './RatingStars';
import EntryFigures from './EntryFigures';
import EntryContents from './EntryContents';
import EntryChapters from './EntryChapters';
import { useEntryChapters } from '../../../../hooks/api/graph/useGraph';
import { AvailabilityBadge, AvailabilityState } from './AvailabilityBadge';
import Tooltip from '../../../primitives/Tooltip';
import { localize } from '../../../../utils/func/localized';
import { useFeature } from '../../../../features/features';
import { writeClipboard } from '../../../../utils/func/clipboard';
import { absoluteUrl, EntryTab, entryPath } from '@/lib/links/paths';
import AskAiIcon from './AskAiIcon';

export interface IEntryDetailContent {
  entryId: string;
  catalogId?: string | null;
  /** The tab in the URL; null opens the first available one. */
  tab: EntryTab | null;
  onTabChange: (tab: EntryTab) => void;
  /** `dialog` over a list, or the publication `page`. */
  variant: 'dialog' | 'page';
}

type Badge = { state: AvailabilityState; date: string | null; position?: number | null; days?: number | null };

const availability = (entry: IEntryDetail, activeLicense: ILicense | null | undefined): Badge | null => {
  if (!entry.config?.readium_enabled) return null;
  // A fresh LCP loan stays `ready` until the .lcpl is first opened in a reader; it is already the reader's loan.
  const isActiveLoan =
    (activeLicense?.state === LICENSE_STATE.active || activeLicense?.state === LICENSE_STATE.ready) &&
    (!activeLicense?.expires_at || new Date(activeLicense.expires_at) > new Date());
  if (isActiveLoan && activeLicense) return { state: 'borrowed', date: activeLicense.expires_at };
  if (entry.user_reservation_id) return { state: 'reserved', date: null, position: entry.user_position ?? null };
  if (entry.lcp_state === 'available_now') return { state: 'available', date: null };
  if (entry.lcp_state === 'available_in_days') {
    const days = entry.next_available_at
      ? Math.max(0, Math.ceil((new Date(entry.next_available_at).getTime() - Date.now()) / 86_400_000))
      : null;
    return { state: 'unavailable', date: entry.next_available_at ?? null, days };
  }
  if (entry.lcp_state === 'fully_borrowed') return { state: 'unavailable', date: null, position: entry.user_position ?? null };
  return null;
};

/**
 * A publication: cover, actions, metadata and tabs. The same body in the dialog over a list and on the
 * publication page (`/entries/:id`); both read the shared cache (`entryQueries`), so switching between them,
 * or opening the reader from here, costs no request.
 */
const EntryDetailContent = ({ entryId, catalogId, tab, onTabChange, variant }: IEntryDetailContent) => {
  const { setShowAiAssistant, umamiTrack } = useAppContext();
  const { auth } = useAuthContext();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const detail = useQuery(entryDetailQuery(entryId, catalogId));
  const license = useQuery(entryLicenseQuery(entryId, auth?.userId));
  const entry = detail.data;
  const activeLicense = license.data ?? null;

  // Library graph (#41): the Chapters tab exists only when the graph knows this publication's sections.
  const graphOn = useFeature('graph');
  const insightsOn = useFeature('contentInsights');
  const assistantOn = useFeature('assistant');
  const { data: chapterMap } = useEntryChapters(graphOn && entry?.id ? entry.id : undefined);
  const hasChapters = !!chapterMap?.sections.length;

  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();

  const refresh = () => invalidateEntry(entryId);

  const shelfChanged = (isOnShelf: boolean, shelfRecordId: string | null) => {
    void refresh();
    // The shelf page lists by these ids; cards elsewhere listen for the event.
    void queryClient.invalidateQueries({ queryKey: SHELF_ENTRY_IDS_KEY });
    document.dispatchEvent(
      new CustomEvent('shelf-updated', { detail: { id: entryId, isOnShelf, shelf_record_id: shelfRecordId } }),
    );
  };

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      const created = await addToShelf(entryId);
      shelfChanged(true, created.response.id);
      toast.success(t('notifications.myShelf.add.success'));
    } catch {
      toast.error(t('notifications.myShelf.add.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!entry) return;
    setIsLoading(true);
    try {
      await removeFromShelf(entry.shelf_record_id);
      shelfChanged(false, null);
      toast.success(t('notifications.myShelf.remove.success'));
    } catch {
      toast.error(t('notifications.myShelf.remove.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // A metadata value (author, category, publisher…) narrows the library to it.
  const handleParamClick = (name: string, value: string) => {
    if (location.pathname === NAVIGATION_PATHS.library) {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      setSearchParams(params);
    } else {
      navigate({ pathname: NAVIGATION_PATHS.library, search: new URLSearchParams({ [name]: value }).toString() });
    }
  };

  const copyCite = () => {
    const cite = entry?.citation;
    if (!cite) {
      toast.error(t('notifications.citation.noCite'));
      return;
    }
    writeClipboard(cite).then(
      () => toast.success(t('notifications.citation.copySuccess')),
      () => toast.error(t('notifications.citation.copyError')),
    );
  };

  // The publication's own address, never the list it was opened over (docs/semantic-urls.md §5).
  const canonical = () => absoluteUrl(entryPath(entryId, { tab, catalogId: entry?.catalog_id ?? catalogId }));

  const copyLink = () => {
    umamiTrack('Entry Detail Copy Link Button');
    // navigator.clipboard needs a secure context; writeClipboard falls back (#62).
    writeClipboard(canonical()).then(
      () => toast.success(t('links.copied')),
      () => undefined,
    );
  };

  const share = () => {
    umamiTrack('Entry Detail Share Button');
    if (navigator.share) {
      navigator.share({ title: entry?.title || '', url: canonical() }).catch(() => undefined);
      return;
    }
    copyLink();
  };

  const askAi = () => {
    setShowAiAssistant(true);
    const params = new URLSearchParams(searchParams);
    params.set('dialog-priority', 'ai-assistant');
    params.set('assistant-entry-id', entryId);
    setSearchParams(params, { preventScrollReset: true });
  };

  if (detail.isPending) {
    return (
      <div className="flex justify-center h-full min-h-[50vh] items-center">
        <CircleLoader color={'var(--color-primary)'} size={50} />
      </div>
    );
  }

  if (!entry) {
    const status = httpStatus(detail.error);
    const message = status === 404 ? t('links.notFound') : status === 403 ? t('links.forbidden') : t('links.loadFailed');
    return (
      <div className="flex flex-col h-full min-h-[50vh] items-center justify-center gap-4 p-8 text-center">
        <p className="text-secondary dark:text-secondaryLight">{message}</p>
        {variant === 'page' && (
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onPrimary hover:opacity-90"
            onClick={() => navigate(NAVIGATION_PATHS.library)}
          >
            {t('links.backToLibrary')}
          </button>
        )}
      </div>
    );
  }

  const availabilityBadge = availability(entry, activeLicense);
  // The catalog sends `rating: null` when reviews are disabled (and no `rating` before IP-023).
  const reviewsEnabled = !!entry.rating;

  // Tabs: reviews whenever the catalog has them; contents, related and figures need the extraction index,
  // chapters the library graph (Administration › Features).
  const available: EntryTab[] = [
    ...(insightsOn ? (['contents'] as const) : []),
    ...(reviewsEnabled ? (['reviews'] as const) : []),
    ...(graphOn && hasChapters ? (['chapters'] as const) : []),
    ...(insightsOn ? (['related', 'figures'] as const) : []),
  ];
  // A linked tab that isn't (yet) available here — chapters still loading, a feature off — opens the first one.
  const activeTab = tab && available.includes(tab) ? tab : available[0] ?? null;

  return (
    <div className={variant === 'dialog' ? 'flex h-full flex-col mdlg:flex-row' : 'flex flex-col mdlg:flex-row min-h-full'}>
      {/* Fixed-width left column: the tab content on the right must never change it. */}
      <div
        className={
          'p-8 bg-lightGray dark:bg-darkGray w-full mdlg:w-[400px] mdlg:flex-none flex flex-col ' +
          (variant === 'dialog' ? 'h-full' : 'mdlg:sticky mdlg:top-0 mdlg:self-start mdlg:h-screen')
        }
      >
        <Thumbnail
          thumbnail={entry.thumbnail}
          alt="Entry Thumbnail"
          wrapperClassName="w-full flex justify-center border rounded-md flex-shrink h-full"
          priority
        />

        {entry.config?.readium_enabled && (
          <div className="flex justify-center mt-2">
            {availabilityBadge ? (
              <AvailabilityBadge
                state={availabilityBadge.state}
                date={availabilityBadge.date}
                position={availabilityBadge.position}
                days={availabilityBadge.days}
              />
            ) : (
              <div className="w-full h-[24px] rounded-md bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            )}
          </div>
        )}

        <ActionsWrapper>
          <div className="col-span-2">
            <AcquisitionsButton
              acquisitions={entry.acquisitions}
              entry={entry}
              activeLicense={license.isPending && !!auth?.userId ? undefined : activeLicense}
              onRefresh={() => void refresh()}
            />
          </div>
          <ShelfButton
            isLoading={isLoading}
            entryId={entryId}
            handleAdd={handleAdd}
            handleRemove={handleRemove}
            shelfId={entry.shelf_record_id}
          >
            <ActionsButton>
              {entry.shelf_record_id ? (
                <>
                  <RiBookmarkFill className="fill-primary dark:fill-primaryLight" size={24} />
                  {t('entry.detail.remove')}
                </>
              ) : (
                <>
                  <RiBookmarkLine size={24} />
                  {t('entry.detail.add')}{' '}
                </>
              )}
            </ActionsButton>
          </ShelfButton>
          {entry.citation && (
            <ActionsButton onClick={copyCite}>
              <RiChatQuoteLine size={24} />
              {t('entry.detail.cite')}
            </ActionsButton>
          )}
          <ActionsButton onClick={copyLink}>
            <RiLinkM size={24} />
            {t('links.copyLink')}
          </ActionsButton>
          {assistantOn && variant === 'page' && (
            <ActionsButton onClick={askAi}>
              <RiSparkling2Line size={24} />
              {t('entry.detail.askAi')}
            </ActionsButton>
          )}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <ActionsButton onClick={share}>
              <RiShareLine size={24} />
              {t('entry.detail.share')}
            </ActionsButton>
          )}
        </ActionsWrapper>
      </div>

      <div
        className={
          'p-4 pt-8 bg-white dark:bg-darkGray pb-20 w-full min-w-0 mdlg:flex-1 ' +
          (variant === 'dialog' ? 'mdlg:overflow-y-auto h-full' : '')
        }
      >
        <DetailHeader entry={entry} handleParamClick={handleParamClick} umamiTrack={umamiTrack} />

        <StatGroup>
          {!!entry.page_count && <StatItem value={entry.page_count} label={t('entry.detail.pages')} />}
          {!!entry.rating?.count && entry.rating.average != null && (
            <StatItem
              value={
                <span className="inline-flex items-center gap-2">
                  {entry.rating.average.toFixed(1)}
                  <RatingStars value={entry.rating.average} size={18} />
                </span>
              }
              label={t('entry.detail.ratingCount', { count: entry.rating.count })}
            />
          )}
          <StatItem value={entry.popularity} label={t('entry.detail.views')} />
        </StatGroup>

        <SummaryText html={entry.summary} readMoreText={t('entry.detail.readMore')} readLessText={t('entry.detail.readLess')} />

        <InfoGrid>
          <InfoItem label={t('entry.detail.publisher')}>{entry.publisher || '-'}</InfoItem>
          <InfoItem label={t('entry.detail.publishDate')}>
            {entry.published_at ? new Date(entry.published_at).toLocaleDateString('sk-SK', { year: 'numeric' }) : '-'}
          </InfoItem>
          <InfoItem label={t('entry.detail.lang')}>
            {getLanguage(entry.language?.alpha2 || '')?.name[i18n.language as AcceptedLanguage] || '-'}
          </InfoItem>

          {/* Loan capacity (readium_amount), LCP entries only. `over_saturated`: more live loans than the cap. */}
          {entry.lcp_state !== 'not_lcp' && (
            <>
              <InfoItem label={t('entry.detail.activeSlots')}>
                <span className={entry.over_saturated ? 'text-red-600 dark:text-red-400 font-bold' : undefined}>
                  {entry.active_count} / {entry.total_slots}
                </span>
              </InfoItem>
              <InfoItem label={t('entry.detail.availableSlots')}>{entry.available_slots}</InfoItem>
            </>
          )}

          <InfoItemCustom label={t('entry.detail.categories')}>
            <div className="flex flex-col gap-1">
              {entry.categories.length === 0 ? (
                <span className="text-secondary dark:text-secondaryLight">-</span>
              ) : (
                entry.categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className="w-fit text-left text-secondary dark:text-secondaryLight font-extrabold cursor-pointer"
                    onClick={() => {
                      umamiTrack('Entry Detail Category Button Param', { feedId: category.id, entryId });
                      handleParamClick('category-id', category.id);
                    }}
                  >
                    {localize(category.label) || category.term}
                  </button>
                ))
              )}
            </div>
          </InfoItemCustom>
        </InfoGrid>

        {/* In the dialog, a floating button; on the page the portal's own launcher holds that corner, so
            "Ask AI" is one of the actions there. */}
        {assistantOn && variant === 'dialog' && (
          <Tooltip content={t('entry.detail.askAi')} placement="left">
            <button
              type="button"
              aria-label={t('entry.detail.askAi')}
              className="absolute right-6 bottom-4 z-10 p-3 rounded-full bg-primary text-white font-semibold hover:bg-primaryDark transition-colors duration-150 hidden mdlg:block"
              onClick={askAi}
            >
              <AskAiIcon />
            </button>
          </Tooltip>
        )}

        {activeTab && (
          <TabsComponent activeTab={activeTab} onTabChange={(id) => onTabChange(id as EntryTab)}>
            <TabsHeader>
              {available.map((id) => (
                <TabTitle key={id} id={id}>
                  {t(`entry.detail.tabs.${id}`)}
                  {id === 'reviews' && !!entry.rating?.count && <span className="ml-1 font-normal">({entry.rating.count})</span>}
                </TabTitle>
              ))}
            </TabsHeader>
            <Tabs>
              <TabContent id="contents">
                <EntryContents entry={entry} catalogId={catalogId} />
              </TabContent>
              <TabContent id="reviews">
                <EntryReviews entryId={entry.id} onChanged={() => void refresh()} />
              </TabContent>
              <TabContent id="chapters">
                <EntryChapters entry={entry} />
              </TabContent>
              <TabContent id="related">
                <EntryRelated entryId={entry.id} />
              </TabContent>
              <TabContent id="figures">
                <EntryFigures entryId={entry.id} />
              </TabContent>
            </Tabs>
          </TabsComponent>
        )}
      </div>
    </div>
  );
};

export default EntryDetailContent;
