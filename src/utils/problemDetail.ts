import { AxiosError } from 'axios';
import { format } from 'date-fns';

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
	notReadiumEnabled: 'not_readium_enabled',
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

/** Problem `type` of a 409 when a feed's `url_name` is already used in the catalog. */
export const FEED_URL_NAME_TAKEN_TYPE = '/feed-url-name-taken';

/** `additional_data` of a 409 `/feed-url-name-taken` (POST/PUT /api/v1/feeds). */
export interface IFeedUrlNameTakenData {
	field: 'url_name';
	url_name: string;
	/** First free `-2`, `-3`, … variant (max 50 chars); ignores the feed being edited. */
	suggested_url_name?: string;
	conflicting_feed?: { id: string; title: Record<string, string> | string; url_name: string };
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

/** Typed view of a 409 `/feed-url-name-taken` conflict (with its `detail`), or undefined. */
export const getFeedUrlNameTaken = (
	e: unknown
): { detail?: string; data: Partial<IFeedUrlNameTakenData> } | undefined => {
	const problem = getProblemDetail(e);
	if (problem?.type !== FEED_URL_NAME_TAKEN_TYPE) return undefined;
	return {
		detail: typeof problem.detail === 'string' ? problem.detail : undefined,
		data: (problem.additional_data ?? {}) as Partial<IFeedUrlNameTakenData>,
	};
};

/**
 * Stable `additional_data.code` values on license refusals: renewal denials
 * (403) and the admin activation conflict (409). Contract:
 * `docs/readium/integration-contract.md` in the catalog repo.
 */
export const LICENSE_ERROR_CODE = {
	terminalState: 'terminal_state',
	renewalCap: 'renewal_cap',
	queue: 'queue',
	embargo: 'embargo',
	exceedsMaxWindow: 'exceeds_max_window',
	endInPast: 'end_in_past',
	activationByDeviceOnly: 'activation_by_device_only',
} as const;

const KNOWN_LICENSE_CODES = new Set<string>(Object.values(LICENSE_ERROR_CODE));

/** `additional_data.code` of a problem response, if it is a string. */
export const getProblemCode = (e: unknown): string | undefined => {
	const code = getProblemDetail(e)?.additional_data?.code;
	return typeof code === 'string' ? code : undefined;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Localised reason for a refused license action, chosen by `additional_data.code`.
 * The API's `detail` is English; showing it in the Slovak UI reads as a raw
 * error. Unknown codes fall back to `problemDetailMessage`.
 */
export const licenseErrorMessage = (e: unknown, t: Translate, fallback: string): string => {
	const code = getProblemCode(e);
	if (!code || !KNOWN_LICENSE_CODES.has(code)) return problemDetailMessage(e, fallback);
	const data = getProblemDetail(e)?.additional_data ?? {};
	const params: Record<string, unknown> = { ...data, interpolation: { escapeValue: false } };
	if (typeof data.state === 'string') {
		params.state = t(`administration.loansPage.states.${data.state}`, { defaultValue: data.state });
	}
	if (code === LICENSE_ERROR_CODE.embargo) {
		const from = typeof data.renewable_from === 'string' ? new Date(data.renewable_from) : null;
		if (!from || Number.isNaN(from.getTime())) return t('license.errors.embargo_no_date');
		params.renewable_from = format(from, 'd.M.yyyy HH:mm');
	}
	return t(`license.errors.${code}`, params);
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
