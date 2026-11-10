import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { fmtDate } from '../../utils/func/adminDate';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { IAdminReview, ReviewState } from '../../utils/interfaces/review';
import useAdminReviews from '../../hooks/api/reviews/useAdminReviews';
import { apiErrorMessage, useReviewMutations } from '../../hooks/api/reviews/useEntryReviews';
import {
  ConfirmDialog,
  DataTable,
  DataTableColumn,
  IconButton,
  PageHeader,
  SearchField,
  SortState,
  StatusChip,
  UserLink,
} from '../../components/admin';
import Select from '../../components/primitives/Select';
import { RatingStars } from '../../components/items/entry/details/RatingStars';

const DEFAULT_LIMIT = 25;

/** Reviews of the catalog's publications, for moderators (IP-023). */
const AdminReviews = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const q = searchParams.get('q') || '';
  const state = (searchParams.get('state') || '') as ReviewState | '';
  const rating = searchParams.get('rating') || '';
  const orderBy = searchParams.get('order_by') || '-created_at';
  const sort: SortState = { key: orderBy.replace(/^-/, ''), dir: orderBy.startsWith('-') ? 'desc' : 'asc' };

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const { data, isFetching, isError, refetch } = useAdminReviews({ page, limit, query: q, state, rating, orderBy });
  const items = data?.items ?? [];
  const metadata = data?.metadata ?? { page: 1, limit, pages: 1, total: 0 };

  // Moderation goes through the per-review route; `entryId` only scopes the cache key there.
  const { moderate } = useReviewMutations('admin');
  const [hiding, setHiding] = useState<IAdminReview | null>(null);
  const [hideNote, setHideNote] = useState('');

  const setReviewState = async (review: IAdminReview, next: ReviewState, note?: string) => {
    try {
      await moderate.mutateAsync({ reviewId: review.id, state: next, note });
      toast.success(t(next === 'hidden' ? 'entry.detail.reviews.hiddenToast' : 'entry.detail.reviews.publishedToast'));
      setHiding(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['entry-reviews', review.entry.id] });
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t('entry.detail.reviews.error'));
    }
  };

  const columns: DataTableColumn<IAdminReview>[] = [
    {
      id: 'entry',
      header: t('administration.reviewsPage.publication'),
      hideable: false,
      cell: (r) => (
        <Link
          to={NAVIGATION_PATHS.adminEditEntries + r.entry.id}
          className="font-medium text-secondary dark:text-secondaryLight hover:underline line-clamp-2"
        >
          {r.entry.title}
        </Link>
      ),
    },
    {
      id: 'user',
      header: t('administration.reviewsPage.reviewer'),
      cell: (r) => <UserLink id={r.user.id} user={{ username: '', name: r.user.name, surname: r.user.surname }} />,
    },
    {
      id: 'rating',
      header: t('administration.reviewsPage.rating'),
      sortKey: 'rating',
      firstSortDir: 'desc',
      cell: (r) => <RatingStars value={r.rating} size={14} />,
    },
    {
      id: 'review',
      header: t('administration.reviewsPage.review'),
      cell: (r) =>
        r.title || r.body ? (
          <div className="max-w-md">
            {r.title && <p className="font-medium truncate">{r.title}</p>}
            {r.body && <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2">{r.body}</p>}
          </div>
        ) : (
          <span className="text-zinc-400">—</span>
        ),
    },
    {
      id: 'state',
      header: t('administration.reviewsPage.state'),
      cell: (r) => (
        <StatusChip variant={r.state === 'hidden' ? 'danger' : 'success'} title={r.moderation_note || undefined}>
          {t(`entry.detail.reviews.state.${r.state}`)}
        </StatusChip>
      ),
    },
    {
      id: 'created_at',
      header: t('administration.reviewsPage.createdAt'),
      sortKey: 'created_at',
      cell: (r) => fmtDate(r.created_at) ?? '—',
    },
    {
      id: 'actions',
      header: '',
      hideable: false,
      align: 'right',
      cell: (r) =>
        r.state === 'hidden' ? (
          <IconButton
            label={t('entry.detail.reviews.publish')}
            variant="ghost"
            size="sm"
            disabled={moderate.isPending}
            onClick={() => setReviewState(r, 'published')}
          >
            <FiEye size={16} />
          </IconButton>
        ) : (
          <IconButton
            label={t('entry.detail.reviews.hide')}
            variant="ghost"
            size="sm"
            onClick={() => {
              setHideNote(r.moderation_note ?? '');
              setHiding(r);
            }}
          >
            <FiEyeOff size={16} />
          </IconButton>
        ),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.reviewsPage.title')} description={t('administration.reviewsPage.description')} />

      <DataTable<IAdminReview>
        caption={t('administration.reviewsPage.title')}
        columns={columns}
        rows={items}
        getRowId={(r) => r.id}
        loading={isFetching}
        error={isError ? t('administration.reviewsPage.loadError') : undefined}
        onRetry={() => refetch()}
        emptyTitle={t('administration.reviewsPage.empty')}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-reviews"
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={q}
              onChange={(v) => patchParams({ q: v || null, page: '1' })}
              label={t('administration.reviewsPage.searchPlaceholder')}
              placeholder={t('administration.reviewsPage.searchPlaceholder')}
              className="max-w-sm"
            />
            <Select
              value={state}
              onChange={(v) => patchParams({ state: v || null, page: '1' })}
              options={[
                { value: '', label: t('entry.detail.reviews.state.all') },
                { value: 'published', label: t('entry.detail.reviews.state.published') },
                { value: 'hidden', label: t('entry.detail.reviews.state.hidden') },
              ]}
              aria-label={t('administration.reviewsPage.state')}
              className="w-fit min-w-[140px]"
            />
            <Select
              value={rating}
              onChange={(v) => patchParams({ rating: v || null, page: '1' })}
              options={[
                { value: '', label: t('administration.reviewsPage.anyRating') },
                ...['5', '4', '3', '2', '1'].map((n) => ({ value: n, label: '★'.repeat(Number(n)) })),
              ]}
              aria-label={t('administration.reviewsPage.rating')}
              className="w-fit min-w-[140px]"
            />
          </div>
        }
      />

      <ConfirmDialog
        open={hiding != null}
        title={t('entry.detail.reviews.hideTitle')}
        message={
          <div className="flex flex-col gap-2">
            <p>{t('entry.detail.reviews.hideMessage')}</p>
            <textarea
              className="w-full min-h-[72px] resize-y rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
              value={hideNote}
              onChange={(e) => setHideNote(e.target.value)}
              placeholder={t('entry.detail.reviews.moderationNotePlaceholder')}
              aria-label={t('entry.detail.reviews.moderationNote')}
            />
          </div>
        }
        confirmLabel={t('entry.detail.reviews.hide')}
        cancelLabel={t('entry.detail.reviews.cancel')}
        loading={moderate.isPending}
        onConfirm={() => hiding && setReviewState(hiding, 'hidden', hideNote.trim())}
        onCancel={() => setHiding(null)}
      />
    </div>
  );
};

export default AdminReviews;
