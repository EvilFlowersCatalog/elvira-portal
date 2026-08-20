import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiMail, FiTrash2 } from 'react-icons/fi';
import Button from '../buttons/Button';
import ElviraInput from '../inputs/ElviraInput';
import PopupInfo from './PopupInfo';
import useNotificationContactsQuery from '../../hooks/api/notification-contacts/useNotificationContactsQuery';
import useCreateNotificationContact from '../../hooks/api/notification-contacts/useCreateNotificationContact';
import useDeleteNotificationContact from '../../hooks/api/notification-contacts/useDeleteNotificationContact';
import { INotificationContact } from '../../utils/interfaces/notificationContact';
import { problemDetailMessage } from '../../utils/problemDetail';

const P = 'profile.contacts';

// Mirrors the server-side check closely enough to catch typos before the POST;
// the server remains the authority (400 /validation-error).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Profile "Notifications" section — manages the email addresses reservation and
 * loan notifications are delivered to (`/api/v1/notification-contacts`).
 * Without at least one contact the user receives no emails at all.
 */
export default function NotificationContactsSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: contacts, isLoading } = useNotificationContactsQuery();
  const createContact = useCreateNotificationContact();
  const deleteContact = useDeleteNotificationContact();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notification-contacts'] });

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast.error(t(`${P}.invalidEmail`, { defaultValue: 'Enter a valid email address.' }));
      return;
    }
    setSubmitting(true);
    try {
      // New addresses become primary right away — most users keep exactly one,
      // and the backend demotes any previous primary itself.
      await createContact({ type: 'email', value, is_primary: true });
      toast.success(t(`${P}.added`, { defaultValue: 'Email address saved.' }));
      setEmail('');
      refresh();
    } catch (err) {
      toast.error(problemDetailMessage(err, t(`${P}.addFailed`, { defaultValue: 'Could not save the email address.' })));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (contact: INotificationContact) => {
    setBusyId(contact.id);
    try {
      // Upsert semantics: re-POST of an existing value updates it in place.
      await createContact({ type: 'email', value: contact.value, is_primary: true });
      refresh();
    } catch (err) {
      toast.error(problemDetailMessage(err, t(`${P}.setPrimaryFailed`, { defaultValue: 'Could not set as primary.' })));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (contact: INotificationContact) => {
    setBusyId(contact.id);
    try {
      await deleteContact(contact.id);
      toast.success(t(`${P}.deleted`, { defaultValue: 'Email address removed.' }));
      refresh();
    } catch (err) {
      toast.error(problemDetailMessage(err, t(`${P}.deleteFailed`, { defaultValue: 'Could not remove the email address.' })));
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <section className='rounded-[7px] p-5 bg-white dark:bg-zinc-800 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] dark:shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] border border-[#e5e5e5] dark:border-zinc-700'>
      <div className='flex items-center gap-2 mb-1'>
        <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>
          {t(`${P}.title`, { defaultValue: 'Notifications' })}
        </h2>
        <PopupInfo label={t(`${P}.infoLabel`, { defaultValue: 'About notification addresses' })}>
          {t(`${P}.ldapNote`, {
            defaultValue:
              'If you sign in with a university (AIS) account, your directory email is filled in automatically on each login — an address deleted here will reappear. Manual entries are for overrides and non-university accounts.',
          })}
        </PopupInfo>
      </div>
      <p className='text-xs font-light text-secondary dark:text-zinc-400 mb-4'>
        {t(`${P}.description`, {
          defaultValue: 'Reservation and loan notifications are sent to these email addresses.',
        })}
      </p>

      {/* Contact list */}
      {isLoading ? (
        <div className='flex flex-col gap-2 mb-4'>
          <div className='h-[42px] rounded-md bg-zinc-200 dark:bg-zinc-700 animate-pulse' />
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <div className='flex items-center gap-2 rounded-md bg-[#fff4dd] dark:bg-yellow-900/30 px-3 py-3 mb-4'>
          <FiMail size={16} className='text-[#9f6c00] dark:text-yellow-400 shrink-0' />
          <p className='text-xs text-[#9f6c00] dark:text-yellow-400'>
            {t(`${P}.empty`, {
              defaultValue: "No email address — you won't receive reservation or loan notifications.",
            })}
          </p>
        </div>
      ) : (
        <div className='flex flex-col divide-y divide-zinc-100 dark:divide-zinc-700 mb-4'>
          {contacts.map((contact) => (
            <div key={contact.id} className='flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0'>
              <div className='flex items-center gap-2 min-w-0'>
                <FiMail size={16} className='text-zinc-400 shrink-0' />
                <span className='text-sm font-medium text-secondary dark:text-secondaryLight truncate'>
                  {contact.value}
                </span>
                {contact.is_primary && (
                  <span className='text-[10px] px-2 py-0.5 rounded-[4px] bg-[#e4f8e8] dark:bg-green-900/30 text-[#007a16] dark:text-green-400 font-semibold shrink-0'>
                    {t(`${P}.primary`, { defaultValue: 'Primary' })}
                  </span>
                )}
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                {!contact.is_primary && (
                  <button
                    type='button'
                    disabled={busyId === contact.id}
                    onClick={() => handleSetPrimary(contact)}
                    className='text-xs font-medium text-primary dark:text-primaryLight hover:underline disabled:opacity-50'
                  >
                    {t(`${P}.setPrimary`, { defaultValue: 'Set as primary' })}
                  </button>
                )}
                {confirmDeleteId === contact.id ? (
                  <>
                    <button
                      type='button'
                      disabled={busyId === contact.id}
                      onClick={() => handleDelete(contact)}
                      className='text-xs font-semibold text-[#c30000] dark:text-red-400 hover:underline disabled:opacity-50'
                    >
                      {t(`${P}.confirmDelete`, { defaultValue: 'Really remove?' })}
                    </button>
                    <button
                      type='button'
                      onClick={() => setConfirmDeleteId(null)}
                      className='text-xs text-zinc-500 dark:text-zinc-400 hover:underline'
                    >
                      {t(`${P}.keep`, { defaultValue: 'Keep' })}
                    </button>
                  </>
                ) : (
                  <button
                    type='button'
                    aria-label={t(`${P}.delete`, { defaultValue: 'Remove' })}
                    onClick={() => setConfirmDeleteId(contact.id)}
                    className='p-1 text-zinc-400 hover:text-[#c30000] dark:hover:text-red-400 transition-colors'
                  >
                    <FiTrash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <form className='flex flex-col sm:flex-row gap-3 sm:items-start' onSubmit={handleAdd}>
        <div className='flex-1'>
          <ElviraInput
            type='email'
            placeholder={t(`${P}.placeholder`, { defaultValue: 'Email address' })}
            invalidMessage={t(`${P}.invalidEmail`, { defaultValue: 'Enter a valid email address.' })}
            label='false'
            required
            maxLength={256}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type='submit' disabled={submitting}>
          {submitting
            ? t(`${P}.adding`, { defaultValue: 'Saving...' })
            : t(`${P}.add`, { defaultValue: 'Add' })}
        </Button>
      </form>
    </section>
  );
}
