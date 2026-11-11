/**
 * Contract for `GET /api/v1/statistics` — the operational analytics behind the
 * admin dashboard. This file is the source of truth; the backend issue quotes
 * it verbatim.
 *
 * Conventions
 *  - Every count is scoped to `catalog_id` and to what the caller may manage
 *    (superuser: everything; otherwise catalogs with a MANAGE grant).
 *  - Aggregates only. No reader is ever named or ranked.
 *  - `null` means "cannot be computed" (e.g. a ratio with a zero denominator,
 *    no previous period). `0` means "computed, and it is zero".
 *  - Ratios are fractions 0..1 (or above 1 for holds ratio), never percents.
 *  - A copy is "in use" when its License is `ready`/`active` with
 *    `expires_at > now`, OR an AVAILABLE reservation holds it for a claim —
 *    the same definition `ReservationService._slots_in_use` lends against.
 */

export type StatsBucket = 'day' | 'week' | 'month';

export interface IStatisticsParams {
  catalog_id: string;
  /** Inclusive local date, `YYYY-MM-DD`. */
  from: string;
  /** Inclusive local date, `YYYY-MM-DD`. */
  to: string;
  bucket: StatsBucket;
  /** IANA zone used for bucket edges and the weekday × hour grid. */
  tz: string;
}

/** A headline figure with its comparison to the immediately preceding period of equal length. */
export interface IKpi {
  value: number | null;
  previous: number | null;
  /** One value per `series` bucket, same order — drives the tile sparkline. */
  trend: (number | null)[];
}

export interface IStatisticsPeriod {
  from: string;
  to: string;
  previous_from: string;
  previous_to: string;
  bucket: StatsBucket;
  tz: string;
}

/** Things an operator should act on today. Point-in-time (now), not period-bound. */
export interface IStatisticsAttention {
  /** EncryptedContent `failed` — the title cannot be lent until requeued. */
  encryption_failed: number;
  /** EncryptedContent `pending` whose last dispatch (or creation) is older than 1 hour. */
  encryption_stuck: number;
  /** LCP-enabled entries with no `registered` EncryptedContent (includes the two above). */
  lcp_not_lendable: number;
  /** Reservations `available` whose `claim_deadline` falls within the next 24 hours. */
  claims_expiring_24h: number;
  /** LCP titles with every copy in use AND at least one queued reservation. */
  saturated_with_queue: number;
}

export interface IStatisticsKpis {
  /** Licenses created in the period (any final state). */
  loans: IKpi;
  /** Distinct users holding a license whose [starts_at, expires_at] overlaps the period. */
  active_readers: IKpi;
  /** Copy utilization: Σ loan-days inside the period ÷ Σ (copies × days) over LCP titles. 0..1. */
  utilization: IKpi;
  /** Of reservations that resolved in the period: claimed ÷ (claimed + expired + cancelled). 0..1. */
  hold_fulfillment: IKpi;
  /** Median hours from `requested_at` to `available_at` for reservations promoted in the period. */
  median_wait_hours: IKpi;
  /** Point-in-time context for the utilization tile. */
  copies_in_use_now: number;
  copies_total: number;
  lcp_titles: number;
}

/**
 * One zero-filled bucket. `t` is the bucket start as a local date `YYYY-MM-DD`,
 * calendar-aligned (day; ISO week starting Monday; first of month).
 */
export interface IStatisticsBucket {
  t: string;
  /**
   * The bucket is cut by `from`/`to`, or is still in progress (it ends after
   * `generated_at` — today, this week, this month). Its totals are not comparable
   * with full buckets; charts de-emphasise it.
   */
  partial: boolean;
  loans_started: number;
  loans_returned: number;
  loans_expired: number;
  holds_placed: number;
}

/** Licenses created in the period, by local weekday (0 = Monday) and hour. Always 168 cells. */
export interface IStatisticsHeatCell {
  dow: number;
  hour: number;
  loans: number;
}

/** One LCP-enabled title (readium_amount ≥ 1). */
export interface ITitleStatistics {
  entry_id: string;
  title: string;
  authors: string[];
  /** `readium_amount`. */
  copies: number;
  /** Copies in use right now (see definition above). */
  in_use: number;
  /** Reservations currently `queued`. */
  queued: number;
  /** Licenses created in the period. */
  loans: number;
  /** Loan-days that fall inside the period. */
  loan_days: number;
  /** loan_days ÷ (copies × days in period). */
  utilization: number;
  /** queued ÷ copies — OverDrive's "holds ratio". */
  holds_ratio: number;
  /** loans ÷ copies — collection turnover (ISO 11620 B.6). */
  turnover: number;
  /** Mean actual loan length in days for licenses that ended in the period. */
  avg_loan_days: number | null;
  /** When the entry was created, ISO 8601. Lets the UI exclude brand-new titles from "dormant". */
  added_at: string;
  /** Most recent license `created_at`, ever. null = never borrowed. */
  last_loan_at: string | null;
}

/** What became of reservations placed in the period. Parts sum to `placed`. */
export interface IHoldOutcomes {
  placed: number;
  claimed: number;
  expired_unclaimed: number;
  cancelled: number;
  still_waiting: number;
}

/** How licenses created in the period ended. Parts sum to the period's `loans`. */
export interface ILoanOutcomes {
  returned_early: number;
  ran_to_expiry: number;
  revoked: number;
  cancelled: number;
  still_active: number;
}

export interface ICategoryStatistics {
  category_id: string;
  title: string;
  loans: number;
}

export interface IAdminStatistics {
  generated_at: string;
  period: IStatisticsPeriod;
  attention: IStatisticsAttention;
  kpis: IStatisticsKpis;
  series: IStatisticsBucket[];
  heatmap: IStatisticsHeatCell[];
  /** Every LCP title in scope, sorted by utilization desc. Capped at 1,000 (`titles_truncated`). */
  titles: ITitleStatistics[];
  titles_truncated: boolean;
  hold_outcomes: IHoldOutcomes;
  loan_outcomes: ILoanOutcomes;
  /** Top 10 categories by loans in the period. */
  categories: ICategoryStatistics[];
}
