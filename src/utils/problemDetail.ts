import { AxiosError } from 'axios';

/** RFC 7807 problem-details, as returned by the catalog API. */
export interface IProblemDetail {
	title?: string;
	detail?: string;
	type?: string | null;
	/** Machine-readable discriminator the API sets for special cases. */
	detail_type?: string;
	/** Extra structured payload for actionable errors (e.g. a URL to fix the problem). */
	additional_data?: Record<string, unknown> & { set_passphrase_url?: string };
}

/** Known `detail_type` discriminators we branch on in the UI. */
export const PROBLEM_DETAIL_TYPE = {
	passphraseRequired: 'PASSPHRASE_REQUIRED',
} as const;

/** Machine-readable borrow-conflict reasons carried in a 409's `additional_data`. */
export const CONFLICT_REASON = {
	noAvailableSlots: 'no_available_slots',
	alreadyBorrowed: 'already_borrowed',
} as const;

/** `additional_data` of a 409 `no_available_slots` borrow conflict. */
export interface INoSlotsConflictData {
	reason_code: typeof CONFLICT_REASON.noAvailableSlots;
	entry_id: string;
	queue_length: number;
	next_available_at: string | null;
	/** Non-null when the caller already queued (e.g. a race with another tab). */
	user_reservation_id: string | null;
	reservations_url: string;
}

/** Unwrap the RFC 7807 body from an axios error, if present. */
export const getProblemDetail = (e: unknown): IProblemDetail | undefined =>
	(e as AxiosError<IProblemDetail>)?.response?.data;

/**
 * True when the failure is the backend asking the user to set an LCP passphrase
 * before the action can proceed (claim / borrow). The API returns
 * `detail_type = PASSPHRASE_REQUIRED` plus `additional_data.set_passphrase_url`.
 */
export const isPassphraseRequired = (e: unknown): boolean =>
	getProblemDetail(e)?.detail_type === PROBLEM_DETAIL_TYPE.passphraseRequired ||
	getProblemDetail(e)?.type === '/passphrase-required';

/** Borrow-conflict discriminator from a 409's `additional_data.reason_code`. */
export const getConflictReasonCode = (e: unknown): string | undefined => {
	const code = getProblemDetail(e)?.additional_data?.reason_code;
	return typeof code === 'string' ? code : undefined;
};

/** Typed view of a 409 `no_available_slots` conflict, or undefined. */
export const getNoSlotsConflict = (e: unknown): INoSlotsConflictData | undefined => {
	const data = getProblemDetail(e)?.additional_data;
	return data?.reason_code === CONFLICT_REASON.noAvailableSlots
		? (data as unknown as INoSlotsConflictData)
		: undefined;
};

/**
 * Pull the human-readable reason out of an API error.
 *
 * The catalog answers failures with RFC 7807, where `detail` carries the
 * actionable reason — e.g. "License acquired within the last 7 days cannot be
 * renewed yet". Replacing that with a generic "it failed, try again" throws away
 * the only thing the user could act on, and makes a policy refusal look like an
 * outage. Prefer `detail`, fall back to `title`, and only then to our own copy.
 *
 * Guards against a non-string `detail` (some validation errors return an
 * object/array) so we never render "[object Object]".
 */
export const problemDetailMessage = (e: unknown, fallback: string): string => {
	const data = getProblemDetail(e);
	const detail = typeof data?.detail === 'string' ? data.detail : undefined;
	return detail || data?.title || fallback;
};
