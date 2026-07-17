import { AxiosError } from 'axios';

/** RFC 7807 problem-details, as returned by the catalog API. */
export interface IProblemDetail {
	title?: string;
	detail?: string;
	type?: string | null;
}

/**
 * Pull the human-readable reason out of an API error.
 *
 * The catalog answers failures with RFC 7807, where `detail` carries the
 * actionable reason — e.g. "License acquired within the last 7 days cannot be
 * renewed yet". Replacing that with a generic "it failed, try again" throws away
 * the only thing the user could act on, and makes a policy refusal look like an
 * outage. Prefer `detail`, fall back to `title`, and only then to our own copy.
 */
export const problemDetailMessage = (e: unknown, fallback: string): string => {
	const data = (e as AxiosError<IProblemDetail>)?.response?.data;
	return data?.detail || data?.title || fallback;
};
