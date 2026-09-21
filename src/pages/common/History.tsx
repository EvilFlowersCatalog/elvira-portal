import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BiHistory } from 'react-icons/bi';
import { CircleLoader } from 'react-spinners';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import AiAssistant from '../../components/dialogs/AiAssistant';
import LicenseCalendar from '../../components/items/entry/details/LicenseCalendar';
import useGetActivity from '../../hooks/api/activity/useGetActivity';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { ActivityAction, IActivity } from '../../utils/interfaces/activity';
import { withAccessToken } from '../../utils/func/functions';

const ACTION_COLORS: Record<ActivityAction, string> = {
  entry_downloaded: 'text-blue-600 dark:text-blue-400',
  license_downloaded: 'text-blue-600 dark:text-blue-400',
  shelf_added: 'text-green-600 dark:text-green-400',
  shelf_removed: 'text-red-600 dark:text-red-400',
  acquisition_shared: 'text-teal-600 dark:text-teal-400',
  loan_created: 'text-purple-600 dark:text-purple-400',
  loan_renewed: 'text-purple-600 dark:text-purple-400',
  loan_returned: 'text-gray-600 dark:text-gray-400',
  loan_expired: 'text-gray-600 dark:text-gray-400',
  loan_revoked: 'text-red-600 dark:text-red-400',
  loan_cancelled: 'text-red-600 dark:text-red-400',
  reservation_created: 'text-amber-600 dark:text-amber-400',
  reservation_available: 'text-green-600 dark:text-green-400',
  reservation_claimed: 'text-purple-600 dark:text-purple-400',
  reservation_expired: 'text-gray-600 dark:text-gray-400',
  reservation_cancelled: 'text-red-600 dark:text-red-400',
};

const PAGE_SIZE = 30;

const History = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const getActivity = useGetActivity();

  const list = useInfiniteItemContainer<IActivity>(['activity'], (page) =>
    getActivity({ page, limit: PAGE_SIZE })
  );

  // Every history row is about one entry; the detail popup already shows its loan / reservation state.
  const openEntryDetail = (item: IActivity) => {
    const params = new URLSearchParams(searchParams);
    params.set('entry-detail-id', item.entry.id);
    params.set('entry-catalog-id', item.entry.catalog_id);
    setSearchParams(params);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('history.timeAgo.justNow');
    } else if (diffMins < 60) {
      return `${diffMins} ${t('history.timeAgo.minutes')}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${t('history.timeAgo.hours')}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${t('history.timeAgo.days')}`;
    }
    return date.toLocaleDateString();
  };

  const hasMore = list.page < list.maxPage;

  return (
    <>
      <Breadcrumb />
      <H1>{t('navbarMenu.history')}</H1>

      <div className="px-5 pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <BiHistory size={28} className="text-primaryText dark:text-primaryLight" />
            <p className="text-gray-600 dark:text-gray-400">{t('history.description')}</p>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {list.isLoading ? (
              <div className="flex justify-center py-20">
                <CircleLoader color={'var(--color-primary)'} size={50} />
              </div>
            ) : list.isError ? (
              <p className="text-center py-20 text-red-600 dark:text-red-400">{t('history.error')}</p>
            ) : list.items.length === 0 ? (
              <div className="text-center py-20">
                <BiHistory size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">{t('history.empty')}</p>
              </div>
            ) : (
              list.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openEntryDetail(item)}
                  className="w-full text-left bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-4">
                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right min-w-[100px]">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(item.last_occurred_at)}
                      </p>
                    </div>

                    {/* Thumbnail */}
                    <img
                      src={withAccessToken(item.entry.thumbnail, auth?.token) ?? '/assets/thumbnail.webp'}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/thumbnail.webp';
                      }}
                      alt=""
                      className="flex-shrink-0 w-10 h-14 object-cover rounded"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base mb-1 truncate">{item.entry.title}</h3>
                      <p className={`text-sm font-medium ${ACTION_COLORS[item.action] ?? 'text-gray-600 dark:text-gray-400'}`}>
                        {t(`history.actions.${item.action}`)}
                        {item.count > 1 && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {t('history.count', { count: item.count })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={list.loadingNext}
                onClick={() => list.setPage(list.page + 1)}
                className="px-6 py-2 text-sm font-medium text-primaryText dark:text-primaryLight bg-primaryLight dark:bg-primaryDark rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {t('history.loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>

      <EntryDetail />
      <AiAssistant />
      <LicenseCalendar />
    </>
  );
};

export default History;
