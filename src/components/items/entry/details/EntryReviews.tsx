import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { RiDeleteBinLine, RiEditLine, RiEyeLine, RiEyeOffLine, RiInformationLine } from 'react-icons/ri';
import { twMerge } from 'tailwind-merge';
import useAuthContext from '../../../../hooks/contexts/useAuthContext';
import {
  apiErrorMessage,
  useEntryReviewList,
  useMyReview,
  useReviewMutations,
} from '../../../../hooks/api/reviews/useEntryReviews';
import { IReview, ReviewOrder, ReviewState } from '../../../../utils/interfaces/review';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';
import { fmtDate } from '../../../../utils/func/adminDate';
import Select from '../../../primitives/Select';
import { RatingInput, RatingStars } from './RatingStars';

const BUTTON =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const PRIMARY_BUTTON = twMerge(BUTTON, 'bg-primary text-white hover:bg-primaryDark');
const QUIET_BUTTON = twMerge(
  BUTTON,
  'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600'
);
const INPUT =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary';

interface IEntryReviews {
  entryId: string;
  /** Called after the caller's review or a moderation changed the entry's rating. */
  onChanged?: () => void;
}

/** "Recenzie": the caller's own rating/review and the entry's reviews (catalog IP-023). */
const EntryReviews = ({ entryId, onChanged }: IEntryReviews) => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState<ReviewOrder>('-created_at');
  const [state, setState] = useState<ReviewState | 'all'>('published');

  const userId = auth?.userId;
  const mine = useMyReview(entryId, userId);
  const list = useEntryReviewList(entryId, order, state);
  const { moderate } = useReviewMutations(entryId, onChanged);

  const reviews = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.metadata.total ?? 0;

  const onModerate = async (review: IReview, next: ReviewState) => {
    let note: string | undefined;
    if (next === 'hidden') {
      const answer = window.prompt(t('entry.detail.reviews.moderationNotePrompt'), review.moderation_note ?? '');
      if (answer === null) return; // cancelled
      note = answer;
    }
    try {
      await moderate.mutateAsync({ reviewId: review.id, state: next, note });
      toast.success(t(next === 'hidden' ? 'entry.detail.reviews.hiddenToast' : 'entry.detail.reviews.publishedToast'));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t('entry.detail.reviews.error'));
    }
  };

  return (
    <div className="flex flex-col gap-6 text-gray-700 dark:text-gray-200">
      {/* The caller's own rating and review */}
      {!auth ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-lightGray dark:bg-gray-800 p-4">
          <RiInformationLine size={20} className="text-primary dark:text-primaryLight shrink-0" />
          <span className="text-sm flex-1">{t('entry.detail.reviews.loginPrompt')}</span>
          <button
            className={PRIMARY_BUTTON}
            onClick={() => navigate(NAVIGATION_PATHS.login, { state: { from: location } })}
          >
            {t('entry.detail.reviews.login')}
          </button>
        </div>
      ) : mine.isLoading ? (
        <div className="flex justify-center py-4">
          <CircleLoader size={24} color={'var(--color-primary)'} />
        </div>
      ) : (
        <MyReview key={mine.data?.id ?? 'new'} entryId={entryId} review={mine.data ?? null} onChanged={onChanged} />
      )}

      {/* All reviews */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-semibold text-lg mr-auto">
            {t('entry.detail.reviews.listTitle')} {list.isSuccess && <span className="text-gray-500">({total})</span>}
          </h3>
          {auth?.isSuperUser && (
            <Select
              value={state}
              onChange={(value) => setState(value as ReviewState | 'all')}
              options={[
                { value: 'published', label: t('entry.detail.reviews.state.published') },
                { value: 'hidden', label: t('entry.detail.reviews.state.hidden') },
                { value: 'all', label: t('entry.detail.reviews.state.all') },
              ]}
              aria-label={t('entry.detail.reviews.stateFilter')}
              className="w-fit min-w-[140px]"
            />
          )}
          <Select
            value={order}
            onChange={(value) => setOrder(value as ReviewOrder)}
            options={[
              { value: '-created_at', label: t('entry.detail.reviews.order.newest') },
              { value: 'created_at', label: t('entry.detail.reviews.order.oldest') },
              { value: '-rating', label: t('entry.detail.reviews.order.highest') },
              { value: 'rating', label: t('entry.detail.reviews.order.lowest') },
            ]}
            aria-label={t('common.sortBy')}
            className="w-fit min-w-[160px]"
          />
        </div>

        {list.isLoading ? (
          <div className="flex justify-center py-6">
            <CircleLoader size={32} color={'var(--color-primary)'} />
          </div>
        ) : list.isError ? (
          <p className="text-sm text-red-600 dark:text-red-400 py-4">{t('entry.detail.reviews.loadError')}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
            {state === 'published' ? t('entry.detail.reviews.empty') : t('entry.detail.reviews.emptyFiltered')}
          </p>
        ) : (
          <ul>
            {reviews.map((review, index) => (
              <li
                key={review.id}
                className={twMerge('py-3', index !== reviews.length - 1 && 'border-b border-gray-200 dark:border-gray-700')}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-primary dark:text-primaryLight">
                    {review.user.name} {review.user.surname}
                    {review.user.id === userId && (
                      <span className="ml-1 font-normal text-gray-500">({t('entry.detail.reviews.you')})</span>
                    )}
                  </span>
                  <RatingStars value={review.rating} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(review.created_at)}</span>
                  {review.state === 'hidden' && (
                    <span className="text-xs font-semibold uppercase rounded px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      {t('entry.detail.reviews.state.hidden')}
                    </span>
                  )}
                  {/* Only moderators get the moderation fields in the list. */}
                  {'moderation_note' in review && (
                    <button
                      className={twMerge(QUIET_BUTTON, 'ml-auto')}
                      disabled={moderate.isPending}
                      onClick={() => onModerate(review, review.state === 'hidden' ? 'published' : 'hidden')}
                    >
                      {review.state === 'hidden' ? (
                        <>
                          <RiEyeLine size={16} />
                          {t('entry.detail.reviews.publish')}
                        </>
                      ) : (
                        <>
                          <RiEyeOffLine size={16} />
                          {t('entry.detail.reviews.hide')}
                        </>
                      )}
                    </button>
                  )}
                </div>
                {review.title && <p className="mt-1 font-semibold">{review.title}</p>}
                {review.body && <p className="mt-1 whitespace-pre-line">{review.body}</p>}
                {review.state === 'hidden' && review.moderation_note && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('entry.detail.reviews.moderationNote')}: {review.moderation_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {list.hasNextPage && (
          <div className="flex justify-center mt-3">
            <button className={QUIET_BUTTON} disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
              {t('entry.detail.reviews.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/** The caller's review: shown with edit/delete, or a form when there is none or while editing. */
const MyReview = ({
  entryId,
  review,
  onChanged,
}: {
  entryId: string;
  review: IReview | null;
  onChanged?: () => void;
}) => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { save, remove } = useReviewMutations(entryId, onChanged);

  const [editing, setEditing] = useState(!review);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [title, setTitle] = useState(review?.title ?? '');
  const [body, setBody] = useState(review?.body ?? '');

  useEffect(() => {
    setEditing(!review);
  }, [review]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) {
      toast.error(t('entry.detail.reviews.ratingRequired'));
      return;
    }
    try {
      await save.mutateAsync({ rating, title: title.trim(), body: body.trim() });
      toast.success(t(review ? 'entry.detail.reviews.updatedToast' : 'entry.detail.reviews.savedToast'));
      setEditing(false);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t('entry.detail.reviews.error'));
    }
  };

  const onDelete = async () => {
    if (!window.confirm(t('entry.detail.reviews.deleteConfirm'))) return;
    try {
      await remove.mutateAsync();
      toast.success(t('entry.detail.reviews.deletedToast'));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t('entry.detail.reviews.error'));
    }
  };

  const hidden = review?.state === 'hidden';
  const hiddenNotice = hidden && (
    <div className="rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-800 dark:text-red-200">
      <p>{t('entry.detail.reviews.hiddenNotice')}</p>
      {review?.moderation_note && (
        <p className="mt-1">
          {t('entry.detail.reviews.moderationNote')}: {review.moderation_note}
        </p>
      )}
    </div>
  );

  if (review && !editing) {
    return (
      <div className="rounded-md bg-lightGray dark:bg-gray-800 p-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold">{t('entry.detail.reviews.yourReview')}</span>
          <RatingStars value={review.rating} size={18} />
          <span className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(review.updated_at)}</span>
          <div className="ml-auto flex gap-2">
            <button className={QUIET_BUTTON} onClick={() => setEditing(true)}>
              <RiEditLine size={16} />
              {t('entry.detail.reviews.edit')}
            </button>
            <button className={QUIET_BUTTON} onClick={onDelete} disabled={remove.isPending}>
              <RiDeleteBinLine size={16} />
              {t('entry.detail.reviews.delete')}
            </button>
          </div>
        </div>
        {review.title && <p className="font-semibold">{review.title}</p>}
        {review.body && <p className="whitespace-pre-line">{review.body}</p>}
        {hiddenNotice}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-md bg-lightGray dark:bg-gray-800 p-4 flex flex-col gap-3">
      <span className="font-semibold">
        {review ? t('entry.detail.reviews.editTitle') : t('entry.detail.reviews.writeTitle')}
      </span>
      {hiddenNotice}
      <RatingInput value={rating} onChange={setRating} />
      <input
        className={INPUT}
        value={title}
        maxLength={255}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('entry.detail.reviews.titlePlaceholder')}
        aria-label={t('entry.detail.reviews.titlePlaceholder')}
      />
      <textarea
        className={twMerge(INPUT, 'min-h-[96px] resize-y')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('entry.detail.reviews.bodyPlaceholder')}
        aria-label={t('entry.detail.reviews.bodyPlaceholder')}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('entry.detail.reviews.nameNotice', { name: `${auth?.name ?? ''} ${auth?.surname ?? ''}`.trim() })}
      </p>
      <div className="flex gap-2">
        <button type="submit" className={PRIMARY_BUTTON} disabled={save.isPending || !rating}>
          {review ? t('entry.detail.reviews.update') : t('entry.detail.reviews.submit')}
        </button>
        {review && (
          <button type="button" className={QUIET_BUTTON} onClick={() => setEditing(false)}>
            {t('entry.detail.reviews.cancel')}
          </button>
        )}
      </div>
    </form>
  );
};

export default EntryReviews;
