import { INewNotificationContact, INotificationContact } from '../../../utils/interfaces/notificationContact';
import useAxios from '../useAxios';

/**
 * Create (or upsert) a notification contact. The backend updates in place when
 * the same value already exists, and saving a primary demotes any previous
 * primary of the same type — so "set as primary" is just a re-POST of the
 * existing value with `is_primary: true`.
 */
const useCreateNotificationContact = () => {
  const axios = useAxios();

  const createNotificationContact = async (
    contact: INewNotificationContact,
  ): Promise<INotificationContact> => {
    const { data } = await axios.post<{ response: INotificationContact } & Partial<INotificationContact>>(
      '/api/v1/notification-contacts',
      contact,
    );
    return data.response ?? (data as INotificationContact);
  };

  return createNotificationContact;
};

export default useCreateNotificationContact;
