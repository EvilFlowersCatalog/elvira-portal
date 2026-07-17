// Keep local duration validation but re-export canonical license types
export const DurationValidation = /^P(?!P)(?:(\d+Y)?(\d+M)?(\d+D)?(T(?:(\d+H)?(\d+M)?(\d+S)?))?)?$/;

export type InterfaceState = import('./licenses').LICENSE_STATE;
export type InterfaceAction = import('./licenses').LICENSE_ACTION;

export interface ILicenseAuthor {
	id: string;
	name: string;
	surname: string;
}

/**
 * The license list embeds the full entry serializer, so far more than this is
 * on the wire (summary, language, citation, categories…). Declare what we
 * actually render; add fields here rather than reaching into `any`.
 */
export interface ILicenseEntry {
	id: string;
	title: string;
	catalog_id?: string;
	thumbnail?: string;
	image?: string;
	authors?: ILicenseAuthor[];
}

/** "Surname, N. Surname" — matches how authors read elsewhere in the catalog. */
export const formatAuthors = (entry?: ILicenseEntry): string => {
	const authors = entry?.authors;
	if (!authors?.length) return '';
	return authors
		.map((a) => [a.name, a.surname].filter(Boolean).join(' ').trim())
		.filter(Boolean)
		.join(', ');
};

/**
 * Server-published renewal rules. Read these instead of hardcoding limits:
 * `evaluate_renew` on the backend enforces the same numbers, so any local copy
 * silently drifts and produces options the API refuses.
 */
export interface IRenewPolicy {
	/** `requested_end` may not exceed now + this many days. */
	max_renew_days: number;
	/** A loan cannot be renewed until this many days after acquisition. */
	embargo_days: number;
	/** Per-loan renewal cap; null = uncapped. */
	max_renewals: number | null;
}

export interface ILicense {
	id: string;
	entry_id: string;
	user_id: string;
	state: InterfaceState;
	created_at: string;
	updated_at: string;
	starts_at: string;
	expires_at: string;
	lcp_license_id?: string;
	url?: string;
	download_url?: string;
	entry?: ILicenseEntry;
	renewal_count: number;
	renewals_remaining: number | null;
	renew_policy?: IRenewPolicy;
}

export interface INewLicense {
	entry_id: string;
	state: string | InterfaceState;
	duration: string;
	starts_at?: string;
}

export interface IAvailabilityResponse {
	available: boolean;
	max_concurrent: string;
	calendar: {
		date: string;
		available_slots: number;
		total_slots: number;
		is_available: boolean;
	}[];
}

export { LICENSE_STATE, LICENSE_ACTION } from './licenses';
