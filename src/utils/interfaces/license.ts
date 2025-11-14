// Keep local duration validation but re-export canonical license types
export const DurationValidation = /^P(?!P)(?:(\d+Y)?(\d+M)?(\d+D)?(T(?:(\d+H)?(\d+M)?(\d+S)?))?)?$/;

export type InterfaceState = import('./licenses').LICENSE_STATE;

export interface ILicense {
	id: string;
	entry_id: string;
	user_id: string;
	state: InterfaceState;
	created_at: string;
	updated_at: string;
	starts_at: string;
	expires_at: string;
	// Some parts of the codebase expect either a download `url` or an
	// `lcp_license_id` field — make both optional to be compatible.
	lcp_license_id?: string;
	url: string;
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

export { LICENSE_STATE } from './licenses';
