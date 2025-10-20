export type InterfaceState = "ready" | "active" | "returned" | "expired" | "revoked" | "cancelled";
export const DurationValidation = /^P(?!P)(?:(\d+Y)?(\d+M)?(\d+D)?(T(?:(\d+H)?(\d+M)?(\d+S)?))?)?$/;

export interface ILicense {
    id: string;
    entry_id: string;
    user_id: string;
    state: InterfaceState;
    created_at: string;
    updated_at: string;
    starts_at: string;
    expires_at: string;
    lcp_license_id: string;
}

export interface INewLicense {
    entry_id: string;
    state: InterfaceState;
    duration: string; // ISO 8601 duration, e.g. "P1Y2M10DT2H30M"
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
