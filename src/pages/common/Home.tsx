import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useEntriesQuery from '../../hooks/api/entries/useEntriesQuery';
import HomeHeader from '../../components/specific-page/home-page/HomeHeader';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import EntryDisplay from '../../components/items/entry/display/EntryDisplay';
import ThemedEntryDisplay from '../../components/items/entry/display/ThemedEntryDisplay';
import LicenseCalendar from '../../components/items/entry/details/LicenseCalendar';
import { useCachedFeedDetail } from '../../hooks/api/feeds/useGetFeedDetail';
import { localize } from '../../utils/func/localized';
import { LocalizedText } from '../../utils/interfaces/general/general';

// The first visible row of "Popular" is the LCP: on a wide screen (150px+ cards)
// it holds up to ~8 covers. They load eagerly with high priority, all others lazily.
const FIRST_ROW_COVERS = 8;

const Home = () => {
  const { t } = useTranslation();

  // The themed row's collection comes from the deployment (ELVIRA_FEATURED_FEED_ID), not the source.
  const featuredFeedId: string | undefined = import.meta.env.ELVIRA_FEATURED_FEED_ID || undefined;
  const showThemed = import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && !!featuredFeedId;

  // Home rows via React Query — each is cached/deduped and refetches when the
  // selected catalog changes (catalog id is part of the query key).
  const { data: popularData, isLoading: popularLoading } = useEntriesQuery({
    limit: 30,
    orderBy: '-popularity',
  });
  const { data: lastAddedData, isLoading: lastAddedLoading } = useEntriesQuery({
    limit: 30,
    orderBy: '-created_at',
  });
  const { data: themedData, isLoading: isThemedLoading } = useEntriesQuery(
    { limit: 30, feedId: featuredFeedId },
    { enabled: showThemed },
  );

  const popularEntries = popularData?.items ?? [];
  const lastAddedEntries = lastAddedData?.items ?? [];
  const themedEntries = themedData?.items ?? [];
  const isLoading = popularLoading || lastAddedLoading;

  // The featured collection's title (its entries come from the query above).
  const getFeedDetail = useCachedFeedDetail();
  const [themedFeedTitle, setThemedFeedTitle] = useState<LocalizedText | string>('');
  useEffect(() => {
    if (!showThemed || !featuredFeedId) return;
    let alive = true;
    getFeedDetail(featuredFeedId)
      .then((f) => alive && setThemedFeedTitle(f.title))
      .catch(() => alive && setThemedFeedTitle(''));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className='w-full h-full p-4 overflow-auto'>
        <HomeHeader />

        {/* POPULAR */}
        <div className='flex justify-between items-center mb-5 flex-wrap'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.popular')}</h2>
          <Link to="/library?order-by=-popularity" className='text-sm text-primary cursor-pointer'>{t('home.showAll')}</Link>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={popularEntries}
          limitRows={true}
          priorityCount={FIRST_ROW_COVERS}
        />


        {/* LAST ADDED */}
        <div className='flex justify-between items-center mb-5 flex-wrap mt-12'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.lastAdded')}</h2>
          <Link to="/library?order-by=-created_at" className='text-sm text-primary cursor-pointer'>{t('home.showAll')}</Link>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={lastAddedEntries}
          limitRows={true}
        />



        {/* Themed Feed */}
        {showThemed && (
          <div className='mt-12'>
            <ThemedEntryDisplay
              title={localize(themedFeedTitle)}
              color="rgba(145, 48, 169)"
              isLoading={isThemedLoading}
              entries={themedEntries}
              limitRows
            />
          </div>
        )}

      </div>
      <EntryDetail />
      <LicenseCalendar />
    </>
  );
};

export default Home;
