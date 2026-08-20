import { INotificationContact, INotificationContactList } from '../../../utils/interfaces/notificationContact';
import useAxios from '../useAxios';

/** Fetch the caller's notification contacts (email delivery addresses). */
const useGetNotificationContacts = () => {
  const axios = useAxios();

  const getNotificationContacts = async (): Promise<INotificationContact[]> => {
    const params = new URLSearchParams();
    params.set('paginate', 'true');
    params.set('page', '1');
    params.set('limit', '50');

    const { data } = await axios.get<INotificationContactList>(
      `/api/v1/notification-contacts?${params.toString()}`,
    );
    return data.items ?? [];
  };

  return getNotificationContacts;
};

export default useGetNotificationContacts;
