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

/** Unwrap the RFC 7807 body from an axios error, if present. */
export const getProblemDetail = (e: unknown): IProblemDetail | undefined =>
	(e as AxiosError<IProblemDetail>)?.response?.data;

/**
 * True when the failure is the backend asking the user to set an LCP passphrase
 * before the action can proceed (claim / borrow). The API returns
 * `detail_type = PASSPHRASE_REQUIRED` plus `additional_data.set_passphrase_url`.
 */
export const isPassphraseRequired = (e: unknown): boolean =>
	getProblemDetail(e)?.detail_type === PROBLEM_DETAIL_TYPE.passphraseRequired;

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
