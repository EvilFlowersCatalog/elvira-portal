import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import useGetReservations from '../../hooks/api/reservations/useGetReservations';
import useUpdateReservation from '../../hooks/api/reservations/useUpdateReservation';
import { IReservation, RESERVATION_STATUS } from '../../utils/interfaces/reservation';
import { isPassphraseRequired, problemDetailMessage } from '../../utils/problemDetail';

/**
 * Claim page. The `reservation_available` email links here
 * (`/library/reservations/:id/claim`). The user is authenticated via the SPA,
 * so the claim runs with their normal token; the scoped token in the URL (used
 * by the EFC-hosted fallback page) is not needed here.
 */
type Phase = 'confirm' | 'claiming' | 'done' | 'error';

const ClaimReservation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const reservationId = params['reservation-id'];

  const getReservations = useGetReservations();
  const { claimReservation } = useUpdateReservation();

  const [reservation, setReservation] = useState<IReservation | null>(null);
  const [phase, setPhase] = useState<Phase>('confirm');
  const [error, setError] = useState<string>('');
  const [needsPassphrase, setNeedsPassphrase] = useState(false);

  // Load the reservation so we can show the title and validate it's claimable.
  // Filter to `available` server-side so a user with >50 total reservations
  // whose claimable one falls outside page 1 doesn't get a false "not found".
  useEffect(() => {
    if (!reservationId) return;
    setPhase('confirm');
    setError('');
    setNeedsPassphrase(false);
    getReservations({ status: [RESERVATION_STATUS.available] })
      .then((items) => {
        const found = items.find((r) => r.id === reservationId);
        if (!found) {
          setError(t('claim.notFound', { defaultValue: 'Reservation not found, already claimed, or the pickup window has expired.' }));
          setPhase('error');
        } else {
          setReservation(found);
        }
      })
      .catch((e) => {
        setError(problemDetailMessage(e, t('claim.loadFailed', { defaultValue: 'Could not load the reservation.' })));
        setPhase('error');
      });
  }, [reservationId]);

  const doClaim = async () => {
    if (!reservationId) return;
    setPhase('claiming');
    try {
      await claimReservation(reservationId);
      setPhase('done');
    } catch (e) {
      // The backend blocks claiming until the user has set an LCP passphrase and
      // returns a distinct PASSPHRASE_REQUIRED problem — route them to fix it
      // instead of showing a dead-end error.
      if (isPassphraseRequired(e)) {
        setNeedsPassphrase(true);
        setError(t('claim.passphraseRequired', {
          defaultValue: 'You need to set a reading passphrase before you can open borrowed books.',
        }));
      } else {
        setError(problemDetailMessage(e, t('claim.failed', { defaultValue: 'Could not claim. The window may have passed.' })));
      }
      setPhase('error');
    }
  };

  return (
    <div className="h-screen overflow-auto">
      <Breadcrumb />
      <H1>{t('claim.title', { defaultValue: 'Claim your reservation' })}</H1>
      <div className="px-4 max-w-[560px] mx-auto py-8">
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <FiAlertCircle size={56} className="text-[#c30000]" />
            <p className="text-[15px] text-secondary dark:text-secondaryLight">{error}</p>
            {needsPassphrase ? (
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  className="h-[38px] px-5 rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  {t('claim.setPassphrase', { defaultValue: 'Set reading passphrase' })}
                </button>
                <button
                  className="h-[38px] px-5 rounded-[7px] border border-darkGray dark:border-zinc-500 text-darkGray dark:text-zinc-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  onClick={() => navigate('/loans')}
                >
                  {t('claim.goToLoans', { defaultValue: 'Go to my loans' })}
                </button>
              </div>
            ) : (
              <button className="mt-2 h-[38px] px-5 rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors" onClick={() => navigate('/loans')}>
                {t('claim.goToLoans', { defaultValue: 'Go to my loans' })}
              </button>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <FiCheckCircle size={66} className="text-[#008B19]" />
            <p className="text-[16px] font-semibold text-secondary dark:text-secondaryLight">
              {t('claim.success', { defaultValue: 'Claimed! The book is now in your loans.' })}
            </p>
            <button className="mt-2 h-[38px] px-5 rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors" onClick={() => navigate('/loans')}>
              {t('claim.goToLoans', { defaultValue: 'Go to my loans' })}
            </button>
          </div>
        )}

        {(phase === 'confirm' || phase === 'claiming') && (
          <div className="flex flex-col items-center gap-5 text-center">
            {reservation ? (
              <>
                <p className="text-[15px] text-secondary dark:text-secondaryLight">
                  {t('claim.prompt', { defaultValue: 'A copy is available for you.' })}
                </p>
                <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight">
                  {reservation.entry?.title || t('license.loansPage.card.unknownTitle', { defaultValue: 'Unknown title' })}
                </p>
                {reservation.claim_deadline && (
                  <p className="text-[13px] text-[#9f6c00]">
                    {t('claim.deadline', {
                      date: new Date(reservation.claim_deadline).toLocaleString(),
                      defaultValue: `Claim before ${new Date(reservation.claim_deadline).toLocaleString()}`,
                    })}
                  </p>
                )}
                <button
                  disabled={phase === 'claiming'}
                  className="h-[40px] px-6 rounded-[7px] bg-primary text-onPrimary text-sm font-medium hover:bg-primaryDark transition-colors disabled:opacity-60"
                  onClick={doClaim}
                >
                  {phase === 'claiming'
                    ? t('claim.claiming', { defaultValue: 'Claiming…' })
                    : t('claim.confirm', { defaultValue: 'Claim now' })}
                </button>
              </>
            ) : (
              <p className="text-darkGray dark:text-zinc-400">{t('claim.loading', { defaultValue: 'Loading…' })}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimReservation;
