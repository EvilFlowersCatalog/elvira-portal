import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useGetNotificationContacts from './useGetNotificationContacts';

/**
 * Post-reserve nudge: reservation emails are only delivered to users with a
 * notification contact, so after joining a queue we check the list and point
 * users without one to the profile settings. Failures are swallowed — the
 * nudge must never break the reserve flow it follows.
 */
const useContactNudge = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getNotificationContacts = useGetNotificationContacts();

  const nudgeIfNoContact = async () => {
    try {
      const contacts = await getNotificationContacts();
      if (contacts.length > 0) return;
      toast.warn(
        <div className="flex flex-col gap-1">
          <span>
            {t('profile.contacts.nudge', {
              defaultValue: 'Add an email address so we can notify you when the book is available.',
            })}
          </span>
          <button
            className="text-xs underline text-left font-semibold"
            onClick={() => navigate('/profile')}
          >
            {t('profile.contacts.nudgeAction', { defaultValue: 'Add email address' })}
          </button>
        </div>,
        { autoClose: 10000 },
      );
    } catch {
      /* non-blocking */
    }
  };

  return nudgeIfNoContact;
};

export default useContactNudge;
