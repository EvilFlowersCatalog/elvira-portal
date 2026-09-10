import useAxios from '../useAxios';

/** Delete one of the caller's notification contacts. 404 = not the caller's. */
const useDeleteNotificationContact = () => {
  const axios = useAxios();

  const deleteNotificationContact = async (contactId: string): Promise<void> => {
    await axios.delete(`/api/v1/notification-contacts/${contactId}`);
  };

  return deleteNotificationContact;
};

export default useDeleteNotificationContact;
