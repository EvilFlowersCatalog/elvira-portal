import { IMetadata } from './general/general';
import { IEntry } from './entry';

// Mirrors `UserActivity.ActivityAction` on the catalog (IP-016).
export type ActivityAction =
  | 'entry_downloaded'
  | 'license_downloaded'
  | 'shelf_added'
  | 'shelf_removed'
  | 'acquisition_shared'
  | 'loan_created'
  | 'loan_renewed'
  | 'loan_returned'
  | 'loan_expired'
  | 'loan_revoked'
  | 'loan_cancelled'
  | 'reservation_created'
  | 'reservation_available'
  | 'reservation_claimed'
  | 'reservation_expired'
  | 'reservation_cancelled';

export interface IActivity {
  id: string;
  action: ActivityAction;
  // How many times the action repeated in a row; the row keeps the latest timestamp.
  count: number;
  metadata: Record<string, string>;
  entry: IEntry;
  created_at: string;
  last_occurred_at: string;
}

export interface IActivityList {
  items: IActivity[];
  metadata: IMetadata;
}
