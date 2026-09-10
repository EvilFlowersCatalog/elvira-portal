import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { RxCalendar } from 'react-icons/rx';
import { LuDownload, LuClock, LuRepeat2 } from 'react-icons/lu';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { MdMoreTime } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { HiOutlineUsers } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { formatAuthors, ILicense, ILicenseEntry, LICENSE_STATE } from '../../../utils/interfaces/license';
import { IReservation, RESERVATION_STATUS } from '../../../utils/interfaces/reservation';
import useLicensesQuery from '../../../hooks/api/licenses/useLicensesQuery';
import useReservationsQuery from '../../../hooks/api/reservations/useReservationsQuery';
import useUpdateReservation from '../../../hooks/api/reservations/useUpdateReservation';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useDownloadLicense from '../../../hooks/api/licenses/useDownloadLicense';
import { isPassphraseRequired, problemDetailMessage } from '../../../utils/problemDetail';
import ExtendLoanModal from '../../modals/ExtendLoanModal';
import ReturnBookModal from '../../modals/ReturnBookModal';
import CancelReservationModal from '../../modals/CancelReservationModal';

/** All three cards render the same author line — the entry serializer already
 *  ships `authors`, so read it rather than printing a placeholder. */
function AuthorLine({ entry }: { entry?: ILicenseEntry }) {
  const { t } = useTranslation();
  const authors = formatAuthors(entry);
  return (
    <p className="font-light text-[12px] text-secondary dark:text-secondaryLight tracking-[0.1px] truncate">
      {authors || t('entry.detail.noAuthor')}
    </p>
  );
}

// Short helper: all keys live under license.loansPage.card
const CARD = 'license.loansPage.card';

function BorrowedDateBadge({ date }: { date: string }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#f0f8ff] dark:bg-blue-900/40 shrink-0">
      <RxCalendar size={11} className="text-[#175a97] dark:text-blue-300 shrink-0" />
      <span className="text-[10px] text-[#175a97] dark:text-blue-300 tracking-[0.1px] whitespace-nowrap">
        {t(`${CARD}.borrowedFrom`)} {date}
      </span>
    </span>
  );
}

function DaysLeftBadge({ daysLeft }: { daysLeft: number }) {
  const { t } = useTranslation();
  const isUrgent = daysLeft <= 1;
  const bgColor = isUrgent ? 'bg-[#ffe5dd] dark:bg-red-900/30' : 'bg-[#fff4dd] dark:bg-yellow-900/30';
  const textColor = isUrgent ? 'text-[#c30000] dark:text-red-400' : 'text-[#333] dark:text-yellow-400';

  return (
    <span className={`flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] ${bgColor} shrink-0`}>
      <LuClock size={11} className={`${textColor} shrink-0`} />
      <span className={`text-[10px] ${textColor} tracking-[0.1px] whitespace-nowrap`}>
        {t(`${CARD}.remaining`)} <strong>{daysLeft}</strong> {t(`${CARD}.dayUnit`, { count: daysLeft })}
      </span>
    </span>
  );
}

function RenewalBadge({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#e4f8e8] dark:bg-green-900/30 shrink-0">
      <LuRepeat2 size={11} className="text-[#007a16] dark:text-green-400 shrink-0" />
      <span className="text-[10px] text-[#007a16] dark:text-green-400 tracking-[0.1px] whitespace-nowrap">
        <strong>{count}</strong> {t(`${CARD}.renewalUnit`, { count })}
      </span>
    </span>
  );
}

function ReservedDateBadge({ date }: { date: string }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#feeecc] dark:bg-yellow-900/30 shrink-0">
      <RxCalendar size={11} className="text-[#8a5e00] dark:text-yellow-400 shrink-0" />
      <span className="text-[10px] text-[#8a5e00] dark:text-yellow-400 tracking-[0.1px] whitespace-nowrap">
        {t(`${CARD}.reservedOn`)} {date}
      </span>
    </span>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  filled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  filled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-[10px] h-[34px] w-[100px] px-2 py-1 rounded-[6px] text-[12px] tracking-[0.1px] transition-colors shrink-0
        ${disabled
          ? 'border-[0.5px] border-[rgba(0,0,0,0.25)] dark:border-[rgba(255,255,255,0.25)] text-[rgba(0,0,0,0.25)] dark:text-[rgba(255,255,255,0.25)] cursor-default'
          : filled
            ? 'bg-lightGray dark:bg-zinc-700 border-[0.5px] border-darkGray dark:border-zinc-500 text-darkGray dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-600'
            : 'border-[0.5px] border-darkGray dark:border-zinc-500 text-darkGray dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function BorrowedCard({
  license,
  token,
  onDownload,
  onExtend,
  onReturn,
  onOpenDetail,
}: {
  license: ILicense;
  token?: string;
  onDownload: (id: string) => void;
  onExtend: (license: ILicense) => void;
  onReturn: (license: ILicense) => void;
  onOpenDetail: (entryId: string, catalogId?: string) => void;
}) {
  const { t } = useTranslation();
  const expiresAt = parseISO(license.expires_at);
  const startsAt = parseISO(license.starts_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const borrowedFrom = format(startsAt, 'dd.MM.yyyy');
  const dueDate = format(expiresAt, 'dd.MM.yyyy');

  return (
    <div className="w-full bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700 rounded-[6px] p-3 flex gap-3">
      <div
        className="w-[55px] h-[78px] flex-shrink-0 self-center rounded-[4px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetail(license.entry_id, license.entry?.catalog_id)}
      >
        <img
          alt={license.entry?.title}
          src={license.entry?.thumbnail ? `${license.entry.thumbnail}?access_token=${token}` : '/assets/thumbnail.webp'}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2 justify-between py-0.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p
              className="font-semibold text-[14px] text-secondary dark:text-secondaryLight tracking-[0.1px] truncate leading-normal cursor-pointer hover:underline"
              onClick={() => onOpenDetail(license.entry_id, license.entry?.catalog_id)}
            >
              {license.entry?.title || t(`${CARD}.unknownTitle`)}
            </p>
            <AuthorLine entry={license.entry} />
          </div>
          <div className="flex items-center gap-[11px] h-[28px] px-3 rounded-[6px] bg-[#cce6fe] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)] flex-shrink-0">
            <span className="w-[7px] h-[7px] rounded-full bg-[#175a97] shrink-0" />
            <span className="text-[13px] text-[#175a97] tracking-[0.1px] whitespace-nowrap">
              {t(`${CARD}.borrowedUntil`)} <strong>{dueDate}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-[6px]">
            <BorrowedDateBadge date={borrowedFrom} />
            <DaysLeftBadge daysLeft={daysLeft} />
            {license.renewal_count > 0 && <RenewalBadge count={license.renewal_count} />}
          </div>
          <div className="flex gap-[10px] flex-wrap">
            <ActionBtn
              icon={<MdMoreTime size={20} />}
              label={t(`${CARD}.extend`)}
              disabled={license.renewals_remaining === 0}
              onClick={() => onExtend(license)}
            />
            <ActionBtn icon={<BsArrowReturnLeft size={20} />} label={t(`${CARD}.return`)} onClick={() => onReturn(license)} />
            <ActionBtn icon={<LuDownload size={20} />} label={t(`${CARD}.download`)} filled onClick={() => onDownload(license.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationCard({
  reservation,
  token,
  claiming,
  onClaim,
  onCancel,
  onOpenDetail,
}: {
  reservation: IReservation;
  token?: string;
  claiming: boolean;
  onClaim: (reservation: IReservation) => void;
  onCancel: (reservation: IReservation) => void;
  onOpenDetail: (entryId: string, catalogId?: string) => void;
}) {
  const { t } = useTranslation();
  const isAvailable = reservation.status === RESERVATION_STATUS.available;
  const deadline = reservation.claim_deadline ? parseISO(reservation.claim_deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / 3_600_000)) : null;
  const requestedDate = format(parseISO(reservation.requested_at), 'dd.MM');
  const queueTotal = reservation.entry?.queue_length ?? reservation.position;
  const estimatedFrom = reservation.entry?.next_available_at
    ? format(parseISO(reservation.entry.next_available_at), 'dd.MM.yyyy')
    : null;

  return (
    <div className="w-full bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700 rounded-[6px] p-3 flex gap-3">
      <div
        className="w-[55px] h-[78px] flex-shrink-0 self-center rounded-[4px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetail(reservation.entry_id, reservation.entry?.catalog_id)}
      >
        <img
          alt={reservation.entry?.title}
          src={reservation.entry?.thumbnail ? `${reservation.entry.thumbnail}?access_token=${token}` : '/assets/thumbnail.webp'}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2 justify-between py-0.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p
              className="font-semibold text-[14px] text-secondary dark:text-secondaryLight tracking-[0.1px] truncate leading-normal cursor-pointer hover:underline"
              onClick={() => onOpenDetail(reservation.entry_id, reservation.entry?.catalog_id)}
            >
              {reservation.entry?.title || t(`${CARD}.unknownTitle`)}
            </p>
            <AuthorLine entry={reservation.entry} />
          </div>
          {isAvailable ? (
            <div className="flex items-center gap-[11px] h-[28px] px-3 rounded-[6px] bg-[#cfffd8] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)] flex-shrink-0">
              <span className="w-[7px] h-[7px] rounded-full bg-[#005e11] shrink-0" />
              <span className="text-[13px] text-[#005e11] tracking-[0.1px] whitespace-nowrap">{t(`${CARD}.availableForPickup`)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-[11px] h-[28px] px-3 rounded-[6px] bg-[#feeecc] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)] flex-shrink-0">
              <span className="w-[7px] h-[7px] rounded-full bg-[#8a5e00] shrink-0" />
              <span className="text-[13px] text-[#8a5e00] tracking-[0.1px] whitespace-nowrap">
                {estimatedFrom ? <>{t(`${CARD}.availableFrom`)} <strong>{estimatedFrom}</strong></> : <>{t(`${CARD}.inQueue`)}</>}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-[6px]">
            {isAvailable ? (
              // Only show the pickup countdown when a real deadline exists; an
              // available reservation without a claim_deadline must NOT render a
              // queue-position badge (it is claimable, not still queued).
              hoursLeft !== null && (
                <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#ffe5dd] dark:bg-red-900/30 shrink-0">
                  <LuClock size={11} className="text-[#c30000] dark:text-red-400 shrink-0" />
                  <span className="text-[10px] text-[#c30000] dark:text-red-400 tracking-[0.1px] whitespace-nowrap">
                    {t(`${CARD}.pickUpWithin`)} <strong>{hoursLeft} h</strong>
                  </span>
                </span>
              )
            ) : (
              <>
                <ReservedDateBadge date={requestedDate} />
                <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#feeecc] dark:bg-yellow-900/30 shrink-0">
                  <HiOutlineUsers size={11} className="text-[#8a5e00] dark:text-yellow-400 shrink-0" />
                  <span className="text-[10px] text-[#8a5e00] dark:text-yellow-400 tracking-[0.1px] whitespace-nowrap">
                    {t(`${CARD}.queuePosition`)} <strong>{reservation.position}.</strong> /{queueTotal}
                  </span>
                </span>
              </>
            )}
          </div>
          <div className="flex gap-[10px] flex-wrap">
            {isAvailable && (
              <ActionBtn
                icon={<LuDownload size={20} />}
                label={claiming ? t(`${CARD}.pickingUp`) : t(`${CARD}.pickUp`)}
                filled
                disabled={claiming}
                onClick={() => onClaim(reservation)}
              />
            )}
            <ActionBtn icon={<IoClose size={20} />} label={t(`${CARD}.cancel`)} onClick={() => onCancel(reservation)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact, catalog-style card for previously-borrowed titles. Replaces the old
// full-width list row: a scannable cover-first card whose primary action is
// "Borrow again" (which opens the entry detail / borrow flow). Rendered in a
// responsive grid so the history no longer dominates the page vertically.
function PastCard({
  license,
  token,
  onBorrowAgain,
}: {
  license: ILicense;
  token?: string;
  onBorrowAgain: (entryId: string, catalogId?: string) => void;
}) {
  const { t } = useTranslation();
  const from = format(parseISO(license.starts_at), 'dd.MM.yyyy');
  const to = format(parseISO(license.expires_at), 'dd.MM.yyyy');
  const title = license.entry?.title || t(`${CARD}.unknownTitle`);
  const open = () => onBorrowAgain(license.entry_id, license.entry?.catalog_id);

  return (
    <div className="group flex flex-col bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700 rounded-[8px] overflow-hidden shadow-[0px_2px_4px_0px_rgba(0,0,0,0.06)] hover:shadow-[0px_6px_16px_0px_rgba(0,0,0,0.14)] transition-shadow duration-300">
      <button
        type="button"
        onClick={open}
        aria-label={`${t(`${CARD}.borrowAgain`)}: ${title}`}
        className="relative block w-full aspect-[3/4] overflow-hidden"
      >
        <img
          alt={title}
          src={license.entry?.thumbnail ? `${license.entry.thumbnail}?access_token=${token}` : '/assets/thumbnail.webp'}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
        />
      </button>

      <div className="flex flex-col gap-1 p-2 flex-1">
        <button
          type="button"
          onClick={open}
          className="text-left font-semibold text-[13px] leading-[16px] text-secondary dark:text-secondaryLight line-clamp-2 hover:underline"
        >
          {title}
        </button>
        <AuthorLine entry={license.entry} />
        <span className="mt-1 inline-flex items-center gap-[5px] self-start h-[16px] px-2 rounded-[4px] bg-[#f0f0f0] dark:bg-zinc-700">
          <RxCalendar size={10} className="text-[#666] dark:text-zinc-400 shrink-0" />
          <span className="text-[9px] text-[#666] dark:text-zinc-400 whitespace-nowrap">{from} – {to}</span>
        </span>
        <button
          type="button"
          onClick={open}
          className="mt-auto flex items-center justify-center gap-1.5 h-[30px] rounded-[6px] text-[12px] font-medium bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight hover:opacity-80 transition-opacity"
        >
          <LuRepeat2 size={14} aria-hidden="true" />
          {t(`${CARD}.borrowAgain`)}
        </button>
      </div>
    </div>
  );
}

function LoanRowSkeleton() {
  return (
    <div className="w-full bg-zinc-300 dark:bg-darkGray rounded-[6px] p-3 flex gap-3 animate-pulse">
      <div className="w-[55px] h-[78px] flex-shrink-0 rounded-[4px] bg-zinc-300 dark:bg-strongDarkGray" />
      <div className="flex-1 min-w-0 flex flex-col gap-2 justify-between py-0.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="h-4 w-40 rounded-md bg-zinc-300 dark:bg-strongDarkGray" />
            <div className="h-3 w-24 rounded-md bg-zinc-300 dark:bg-strongDarkGray" />
          </div>
          <div className="h-[28px] w-[150px] rounded-[6px] bg-zinc-300 dark:bg-strongDarkGray" />
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-[6px]">
            <div className="h-[16px] w-[110px] rounded-[4px] bg-zinc-300 dark:bg-strongDarkGray" />
            <div className="h-[16px] w-[90px] rounded-[4px] bg-zinc-300 dark:bg-strongDarkGray" />
          </div>
          <div className="flex gap-[10px]">
            <div className="h-[34px] w-[100px] rounded-[6px] bg-zinc-300 dark:bg-strongDarkGray" />
            <div className="h-[34px] w-[100px] rounded-[6px] bg-zinc-300 dark:bg-strongDarkGray" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid-card skeleton, matching PastCard's cover-first shape.
function LoanCardSkeleton() {
  return (
    <div className="flex flex-col bg-zinc-300 dark:bg-darkGray rounded-[8px] overflow-hidden animate-pulse">
      <div className="w-full aspect-[3/4] bg-zinc-300 dark:bg-strongDarkGray" />
      <div className="flex flex-col gap-2 p-2">
        <div className="h-3.5 w-full rounded-md bg-zinc-300 dark:bg-strongDarkGray" />
        <div className="h-3.5 w-2/3 rounded-md bg-zinc-300 dark:bg-strongDarkGray" />
        <div className="h-3 w-1/2 rounded-md bg-zinc-300 dark:bg-strongDarkGray" />
        <div className="h-[30px] w-full rounded-[6px] bg-zinc-300 dark:bg-strongDarkGray mt-1" />
      </div>
    </div>
  );
}

export default function LoansCardView() {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { claimReservation } = useUpdateReservation();
  const { openInThorium, downloadDirect } = useDownloadLicense();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Licences and reservations are React Query reads keyed on the user (NOT on the
  // URL), so opening an entry-detail modal no longer refetches the whole page,
  // and a background refetch after claim/return keeps the current cards visible
  // instead of flashing the "loading" state.
  const licensesQuery = useLicensesQuery({ page: 1, limit: 50 });
  const reservationsQuery = useReservationsQuery({
    status: [RESERVATION_STATUS.queued, RESERVATION_STATUS.available],
  });

  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [extendLicense, setExtendLicense] = useState<ILicense | null>(null);
  const [returnLicense, setReturnLicense] = useState<ILicense | null>(null);
  const [cancelTarget, setCancelTarget] = useState<IReservation | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);
  // Collapse the history to ~two grid rows by default so it never dominates the page.
  const PAST_COLLAPSE = 12;

  // Only the first load (no cached data yet) shows the loading text; subsequent
  // refetches keep the previous cards on screen.
  const loading = licensesQuery.isLoading;

  const { borrowed, past } = useMemo(() => {
    const items = licensesQuery.data?.items ?? [];
    const now = new Date();
    const startsAt = (l: ILicense) => new Date(l.starts_at);
    const expiresAt = (l: ILicense) => new Date(l.expires_at);

    // `ready` = licence issued, downloadable, no device registered yet;
    // `active` = a device registered. Both are live loans. (The queue lives in
    // the separate Reservation model — not in licence state.)
    const isLiveState = (l: ILicense) => l.state === LICENSE_STATE.ready || l.state === LICENSE_STATE.active;
    const isTerminalState = (l: ILicense) =>
      [LICENSE_STATE.cancelled, LICENSE_STATE.returned, LICENSE_STATE.expired, LICENSE_STATE.revoked].includes(l.state);

    const borrowed = items.filter((l) => isLiveState(l) && startsAt(l) <= now && expiresAt(l) > now);

    // "Previously borrowed" is a per-book re-borrow shortcut, but licences are
    // per-loan — the same title borrowed twice yields two terminal licences.
    // Collapse to one card per entry, keeping the most recent loan, newest first.
    const pastLicenses = items.filter((l) => isTerminalState(l) || (isLiveState(l) && expiresAt(l) <= now));
    const latestByEntry = new Map<string, ILicense>();
    for (const l of pastLicenses) {
      const prev = latestByEntry.get(l.entry_id);
      if (!prev || expiresAt(l) > expiresAt(prev)) latestByEntry.set(l.entry_id, l);
    }
    const past = [...latestByEntry.values()].sort((a, b) => expiresAt(b).getTime() - expiresAt(a).getTime());

    return { borrowed, past };
  }, [licensesQuery.data]);

  // Non-terminal reservations = the user's live queue entries (queued/available).
  const reservations = useMemo(
    () => [...(reservationsQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [reservationsQuery.data]
  );

  const openEntryDetail = (entryId: string, catalogId?: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('entry-detail-id', entryId);
      if (catalogId) p.set('entry-catalog-id', catalogId);
      return p;
    });
  };

  // Refresh both lists after a mutation (background refetch — cards stay visible).
  const loadAll = () => {
    licensesQuery.refetch();
    reservationsQuery.refetch();
  };

  const handleClaimReservation = async (reservation: IReservation) => {
    setClaimingId(reservation.id);
    try {
      await claimReservation(reservation.id);
      toast.success(t(`${CARD}.claimSuccess`, { defaultValue: 'Claimed! The book is now in your loans.' }));
      loadAll();
    } catch (e) {
      // Backend requires a reading passphrase before the first claim — offer the fix.
      if (isPassphraseRequired(e)) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span>{t(`${CARD}.passphraseRequired`, { defaultValue: 'Set a reading passphrase before opening borrowed books.' })}</span>
            <button className="text-xs underline text-left font-semibold" onClick={() => navigate('/profile')}>
              {t(`${CARD}.setPassphrase`, { defaultValue: 'Set passphrase' })}
            </button>
          </div>,
          { autoClose: 8000 },
        );
      } else {
        toast.error(problemDetailMessage(e, t(`${CARD}.claimFailed`, { defaultValue: 'Could not claim. The window may have passed.' })));
      }
    } finally {
      setClaimingId(null);
    }
  };

  const handleDownload = (licenseId: string) => {
    const ref = { id: licenseId };
    openInThorium(ref);
    toast.info(
      <div className="flex flex-col gap-1">
        <span>{t('notifications.license.download.thoriumOpened', { defaultValue: 'Opening in Thorium...' })}</span>
        <button className="text-xs underline text-left" onClick={() => downloadDirect(ref)}>
          {t('notifications.license.download.fallback', { defaultValue: 'Not opening? Download file directly' })}
        </button>
      </div>,
      { autoClose: 8000 },
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-[20px] py-[20px]">
          <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
            {t('license.loansPage.card.borrowedSection')}
          </p>
          <div className="flex flex-col gap-[12px] w-full">
            {Array.from({ length: 1 }).map((_, i) => (
              <LoanRowSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[20px] py-[20px]">
          <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
            {t(`${CARD}.pastSection`)}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoanCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full">
        {/* Borrowed section */}
        <div className="flex flex-col gap-[20px] py-[20px]">
          <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
            {t('license.loansPage.card.borrowedSection')} <span className="text-[16px] font-light text-secondary dark:text-secondaryLight">({borrowed.length})</span>
          </p>
          <div className="flex flex-col gap-[12px] w-full">
            {borrowed.length === 0 ? (
              <p className="text-[14px] text-darkGray dark:text-zinc-400">{t('license.loansPage.card.noBorrowed')}</p>
            ) : (
              borrowed.map((license) => (
                <BorrowedCard
                  key={license.id}
                  license={license}
                  token={auth?.token}
                  onDownload={handleDownload}
                  onExtend={setExtendLicense}
                  onReturn={setReturnLicense}
                  onOpenDetail={openEntryDetail}
                />
              ))
            )}
          </div>
        </div>

        {/* Reservations (queue) section */}
        {reservations.length > 0 && (
          <div className="flex flex-col gap-[20px] py-[20px]">
            <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
              {t('license.loansPage.card.reservedSection')} <span className="text-[16px] font-light text-secondary dark:text-secondaryLight">({reservations.length})</span>
            </p>
            <div className="flex flex-col gap-[12px] w-full">
              {reservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  token={auth?.token}
                  claiming={claimingId === reservation.id}
                  onClaim={handleClaimReservation}
                  onCancel={setCancelTarget}
                  onOpenDetail={openEntryDetail}
                />
              ))}
            </div>
          </div>
        )}

        {/* Previously borrowed — compact "borrow again" grid, collapsed by default */}
        {past.length > 0 && (
          <div className="flex flex-col gap-[20px] py-[20px]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
                {t(`${CARD}.pastSection`)} <span className="text-[16px] font-light text-secondary dark:text-secondaryLight">({past.length})</span>
              </p>
              {past.length > PAST_COLLAPSE && (
                <button
                  type="button"
                  onClick={() => setShowAllPast((v) => !v)}
                  className="text-[14px] font-medium text-primaryText dark:text-primaryLight hover:underline shrink-0"
                >
                  {showAllPast ? t(`${CARD}.showLess`) : t(`${CARD}.showAll`)}
                </button>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 w-full">
              {(showAllPast ? past : past.slice(0, PAST_COLLAPSE)).map((license) => (
                <PastCard key={license.id} license={license} token={auth?.token} onBorrowAgain={openEntryDetail} />
              ))}
            </div>
          </div>
        )}
      </div>

      {extendLicense && (
        <ExtendLoanModal
          license={extendLicense}
          onClose={() => setExtendLicense(null)}
          onSuccess={loadAll}
        />
      )}

      {returnLicense && (
        <ReturnBookModal
          license={returnLicense}
          onClose={() => setReturnLicense(null)}
          onSuccess={loadAll}
        />
      )}

      {cancelTarget && (
        <CancelReservationModal
          reservation={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={loadAll}
        />
      )}
    </>
  );
}
