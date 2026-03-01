import { useTranslation } from 'react-i18next';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import { BiHistory } from 'react-icons/bi';

const History = () => {
  const { t } = useTranslation();

  // Mock history data for design
  const mockHistory = [
    {
      id: '1',
      title: 'Introduction to Algorithms',
      action: 'viewed',
      timestamp: '2026-02-04T10:30:00',
      coverUrl: null,
    },
    {
      id: '2',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      action: 'bookmarked',
      timestamp: '2026-02-03T15:45:00',
    },
    {
      id: '3',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      action: 'viewed',
      timestamp: '2026-02-02T09:15:00',
    },
    {
      id: '4',
      title: 'The Pragmatic Programmer',
      action: 'removed_bookmark',
      timestamp: '2026-02-01T14:20:00',
    },
    {
      id: '5',
      title: 'Artificial Intelligence: A Modern Approach',
      action: 'viewed',
      timestamp: '2026-01-31T11:00:00',
    },
  ];

  const getActionText = (action: string) => {
    switch (action) {
      case 'viewed':
        return t('history.actions.viewed');
      case 'bookmarked':
        return t('history.actions.bookmarked');
      case 'removed_bookmark':
        return t('history.actions.removedBookmark');
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'viewed':
        return 'text-blue-600 dark:text-blue-400';
      case 'bookmarked':
        return 'text-green-600 dark:text-green-400';
      case 'removed_bookmark':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${t('history.timeAgo.minutes')}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${t('history.timeAgo.hours')}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${t('history.timeAgo.days')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <Breadcrumb />
      <H1>{t('navbarMenu.history')}</H1>
      
      <div className="px-5 pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <BiHistory size={28} className="text-primary" />
            <p className="text-gray-600 dark:text-gray-400">
              {t('history.description')}
            </p>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {mockHistory.length === 0 ? (
              <div className="text-center py-20">
                <BiHistory size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('history.empty')}
                </p>
              </div>
            ) : (
              mockHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-zinc-700"
                >
                  <div className="flex items-start gap-4">
                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right min-w-[100px]">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(item.timestamp)}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-base mb-1">
                            {item.title}
                          </h3>
                          <p className={`text-sm font-medium ${getActionColor(item.action)}`}>
                            {getActionText(item.action)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button (for future API implementation) */}
          {mockHistory.length > 0 && (
            <div className="mt-6 text-center">
              <button className="px-6 py-2 text-sm font-medium text-primary bg-primaryLight dark:bg-primaryDark rounded-lg hover:opacity-80 transition-opacity">
                {t('history.loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default History;
