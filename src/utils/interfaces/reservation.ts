import { ILicenseEntry } from './license';

export enum RESERVATION_STATUS {
  queued = 'queued',
  available = 'available',
  claimed = 'claimed',
  expired = 'expired',
  cancelled = 'cancelled',
}

/** The real backend Reservation (queue) row — distinct from a License. */
export interface IReservation {
  id: string;
  entry_id: string;
  user_id: string;
  position: number;
  status: RESERVATION_STATUS;
  requested_at: string;
  available_at: string | null;
  /** When `available`, the user must claim before this or the slot passes on. */
  claim_deadline: string | null;
  claimed_license_id: string | null;
  created_at: string;
  updated_at: string;
  /** Present on the list/detail (Detailed serializer) so the queue UI can render. */
  entry?: ILicenseEntry;
}

export interface IReservationList {
  items: IReservation[];
  metadata: { page: number; limit: number; pages: number; total: number };
}

export const NON_TERMINAL_RESERVATION_STATUSES = [
  RESERVATION_STATUS.queued,
  RESERVATION_STATUS.available,
];
