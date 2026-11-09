import { IMetadata } from './general/general';

/** Ratings and reviews of an entry (catalog IP-023). */

/** The rating block of an entry. The entry's `rating` is null when reviews are disabled. */
export interface IEntryRating {
  /** Average of published reviews, null without any. */
  average: number | null;
  count: number;
  /** The caller's own rating, absent for anonymous callers or without a review. */
  mine?: number | null;
}

export type ReviewState = 'published' | 'hidden';

export type ReviewOrder = '-created_at' | 'created_at' | '-rating' | 'rating';

export interface IReview {
  id: string;
  entry_id: string;
  user: { id: string; name: string; surname: string };
  rating: number;
  title: string;
  body: string;
  language_code?: string | null;
  state: ReviewState;
  created_at: string;
  updated_at: string;
  /** Present only for the author (own review) and for moderators. */
  moderated_by_id?: string | null;
  moderated_at?: string | null;
  moderation_note?: string;
}

/** `GET /api/v1/reviews` (moderators): a review with the entry it reviews. */
export interface IAdminReview extends IReview {
  entry: { id: string; title: string; catalog_id: string };
}

export interface IAdminReviewList {
  items: IAdminReview[];
  metadata: IMetadata;
}

export interface IReviewList {
  items: IReview[];
  metadata: IMetadata;
}

export interface IReviewForm {
  rating: number;
  title?: string;
  body?: string;
}
