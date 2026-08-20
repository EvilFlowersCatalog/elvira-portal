import { IMetadata } from './general/general';

/**
 * A delivery address for reservation/license notification emails
 * (`/api/v1/notification-contacts`). Currently `type` is always `"email"`.
 * Without at least one contact the backend silently sends nothing, which is
 * why the reserve flow nudges users who have none.
 */
export interface INotificationContact {
  id: string;
  type: 'email';
  value: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface INotificationContactList {
  items: INotificationContact[];
  metadata: IMetadata;
}

export interface INewNotificationContact {
  type: 'email';
  value: string;
  is_primary: boolean;
}
