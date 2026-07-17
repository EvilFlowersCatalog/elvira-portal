import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { RxCalendar } from 'react-icons/rx';
import { LuDownload, LuClock } from 'react-icons/lu';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { MdMoreTime } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { RiBookmarkLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { ILicense, LICENSE_STATE } from '../../../utils/interfaces/license';
import useGetLicenses from '../../../hooks/api/licenses/useGetLicenses';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useDownloadLicense from '../../../hooks/api/licenses/useDownloadLicense';
import ExtendLoanModal from '../../modals/ExtendLoanModal';
import ReturnBookModal from '../../modals/ReturnBookModal';
import CancelReservationModal from '../../modals/CancelReservationModal';

function BorrowedDateBadge({ date }: { date: string }) {
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#f0f8ff] dark:bg-blue-900/40 shrink-0">
      <RxCalendar size={11} className="text-[#1e6cb4] dark:text-blue-300 shrink-0" />
      <span className="text-[10px] text-[#1e6cb4] dark:text-blue-300 tracking-[0.1px] whitespace-nowrap">
        Požičané od: {date}
      </span>
    </span>
  );
}

function DaysLeftBadge({ daysLeft }: { daysLeft: number }) {
  const isUrgent = daysLeft <= 1;
  const bgColor = isUrgent ? 'bg-[#ffe5dd] dark:bg-red-900/30' : 'bg-[#fff4dd] dark:bg-yellow-900/30';
  const textColor = isUrgent ? 'text-[#c30000] dark:text-red-400' : 'text-[#333] dark:text-yellow-400';
  const dayWord = daysLeft === 1 ? 'deň' : daysLeft >= 2 && daysLeft <= 4 ? 'dni' : 'dní';

  return (
    <span className={`flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] ${bgColor} shrink-0`}>
      <LuClock size={11} className={`${textColor} shrink-0`} />
      <span className={`text-[10px] ${textColor} tracking-[0.1px] whitespace-nowrap`}>
        Zostáva: <strong>{daysLeft}</strong> {dayWord}
      </span>
    </span>
  );
}

function ReservedDateBadge({ date }: { date: string }) {
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#feeecc] dark:bg-yellow-900/30 shrink-0">
      <RxCalendar size={11} className="text-[#9f6c00] dark:text-yellow-400 shrink-0" />
      <span className="text-[10px] text-[#9f6c00] dark:text-yellow-400 tracking-[0.1px] whitespace-nowrap">
        Rezervované: {date}
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
              {license.entry?.title || 'Neznámy titul'}
            </p>
            <p className="font-light text-[12px] text-secondary dark:text-secondaryLight tracking-[0.1px]">Autor</p>
          </div>
          <div className="flex items-center gap-[11px] h-[28px] px-3 rounded-[6px] bg-[#cce6fe] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)] flex-shrink-0">
            <span className="w-[7px] h-[7px] rounded-full bg-[#1e6cb4] shrink-0" />
            <span className="text-[13px] text-[#1e6cb4] tracking-[0.1px] whitespace-nowrap">
              Požičané do: <strong>{dueDate}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-[6px]">
            <BorrowedDateBadge date={borrowedFrom} />
            <DaysLeftBadge daysLeft={daysLeft} />
          </div>
          <div className="flex gap-[10px] flex-wrap">
            <ActionBtn icon={<MdMoreTime size={20} />} label="Predĺžiť" onClick={() => onExtend(license)} />
            <ActionBtn icon={<BsArrowReturnLeft size={20} />} label="Vrátiť" onClick={() => onReturn(license)} />
            <ActionBtn icon={<LuDownload size={20} />} label="Stiahnuť" filled onClick={() => onDownload(license.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservedCard({
  license,
  token,
  onCancel,
  onOpenDetail,
}: {
  license: ILicense;
  token?: string;
  onCancel: (license: ILicense) => void;
  onOpenDetail: (entryId: string, catalogId?: string) => void;
}) {
  const startsAt = parseISO(license.starts_at);
  const expiresAt = parseISO(license.expires_at);
  const reservedDate = format(startsAt, 'dd.MM');
  const availableFrom = format(expiresAt, 'dd.MM.yyyy');

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
              {license.entry?.title || 'Neznámy titul'}
            </p>
            <p className="font-light text-[12px] text-secondary dark:text-secondaryLight tracking-[0.1px]">Autor</p>
          </div>
          <div className="flex items-center gap-[11px] h-[28px] px-3 rounded-[6px] bg-[#feeecc] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)] flex-shrink-0">
            <span className="w-[7px] h-[7px] rounded-full bg-[#9f6c00] shrink-0" />
            <span className="text-[13px] text-[#9f6c00] tracking-[0.1px] whitespace-nowrap">
              Dostupné od: <strong>{availableFrom}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-[6px]">
            <ReservedDateBadge date={reservedDate} />
          </div>
          <ActionBtn icon={<IoClose size={20} />} label="Zrušiť" onClick={() => onCancel(license)} />
        </div>
      </div>
    </div>
  );
}

function PastCard({
  license,
  token,
  onViewDetail,
}: {
  license: ILicense;
  token?: string;
  onViewDetail: (entryId: string, catalogId?: string) => void;
}) {
  const { t } = useTranslation();
  const startsAt = parseISO(license.starts_at);
  const expiresAt = parseISO(license.expires_at);
  const from = format(startsAt, 'dd.MM.yyyy');
  const to = format(expiresAt, 'dd.MM.yyyy');

  return (
    <div className="w-full bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-zinc-700 rounded-[6px] p-3 flex gap-3 opacity-75">
      <div className="w-[55px] h-[78px] flex-shrink-0 self-center rounded-[4px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] overflow-hidden grayscale">
        <img
          alt={license.entry?.title}
          src={license.entry?.thumbnail ? `${license.entry.thumbnail}?access_token=${token}` : '/assets/thumbnail.webp'}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2 justify-between py-0.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-[14px] text-secondary dark:text-secondaryLight tracking-[0.1px] truncate leading-normal">
              {license.entry?.title || 'Neznámy titul'}
            </p>
            <p className="font-light text-[12px] text-secondary dark:text-secondaryLight tracking-[0.1px]">Autor</p>
          </div>
          <button
            onClick={() => onViewDetail(license.entry_id, license.entry?.catalog_id)}
            className="flex items-center gap-[6px] h-[28px] px-3 rounded-[6px] text-[12px] tracking-[0.1px] whitespace-nowrap border-[0.5px] border-darkGray dark:border-zinc-500 text-darkGray dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
          >
            <RiBookmarkLine size={14} />
            {t('license.loansPage.card.viewDetail')}
          </button>
        </div>

        <div className="flex flex-wrap gap-[6px]">
          <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#f0f0f0] dark:bg-zinc-700 shrink-0">
            <RxCalendar size={11} className="text-[#666] dark:text-zinc-400 shrink-0" />
            <span className="text-[10px] text-[#666] dark:text-zinc-400 tracking-[0.1px] whitespace-nowrap">{from} – {to}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoansCardView() {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const getLicenses = useGetLicenses();
  const { openInThorium, downloadDirect } = useDownloadLicense();
  const [searchParams, setSearchParams] = useSearchParams();

  const [borrowed, setBorrowed] = useState<ILicense[]>([]);
  const [reserved, setReserved] = useState<ILicense[]>([]);
  const [past, setPast] = useState<ILicense[]>([]);
  const [loading, setLoading] = useState(true);

  const [extendLicense, setExtendLicense] = useState<ILicense | null>(null);
  const [returnLicense, setReturnLicense] = useState<ILicense | null>(null);
  const [cancelLicense, setCancelLicense] = useState<ILicense | null>(null);

  const openEntryDetail = (entryId: string, catalogId?: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('entry-detail-id', entryId);
      if (catalogId) p.set('entry-catalog-id', catalogId);
      return p;
    });
  };

  const loadLicenses = () => {
    setLoading(true);
    getLicenses({ page: 1, limit: 50 })
      .then(({ items }) => {
        items.sort((a, b) => {
          const aDate = a.expires_at ? new Date(a.expires_at) : new Date(0);
          const bDate = b.expires_at ? new Date(b.expires_at) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        const now = new Date();
        const startsAt = (l: ILicense) => new Date(l.starts_at);
        const expiresAt = (l: ILicense) => new Date(l.expires_at);

        // `ready` means the LCP license is issued and downloadable but no device
        // has registered against it yet; `active` means one has. Both are live
        // loans — a loan only ends when it reaches a terminal state or its
        // window closes. Treating `ready` as a reservation hid every fresh loan.
        const isLiveState = (l: ILicense) => l.state === LICENSE_STATE.ready || l.state === LICENSE_STATE.active;
        const isTerminalState = (l: ILicense) =>
          [
            LICENSE_STATE.cancelled,
            LICENSE_STATE.returned,
            LICENSE_STATE.expired,
            LICENSE_STATE.revoked,
          ].includes(l.state);

        setBorrowed(items.filter((l) => isLiveState(l) && startsAt(l) <= now && expiresAt(l) > now));
        // Only a future-dated loan is a genuine "reservation" on this screen.
        setReserved(items.filter((l) => l.state === LICENSE_STATE.ready && startsAt(l) > now));
        setPast(items.filter((l) => isTerminalState(l) || (isLiveState(l) && expiresAt(l) <= now)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLicenses();
  }, [searchParams]);

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
    return <div className="py-8 text-center text-darkGray dark:text-zinc-400">Načítavam...</div>;
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

        {/* Reserved section */}
        {reserved.length > 0 && (
          <div className="flex flex-col gap-[20px] py-[20px]">
            <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
              {t('license.loansPage.card.reservedSection')} <span className="text-[16px] font-light text-secondary dark:text-secondaryLight">({reserved.length})</span>
            </p>
            <div className="flex flex-col gap-[12px] w-full">
              {reserved.map((license) => (
                <ReservedCard key={license.id} license={license} token={auth?.token} onCancel={setCancelLicense} onOpenDetail={openEntryDetail} />
              ))}
            </div>
          </div>
        )}

        {/* Past / Re-reserve section */}
        {past.length > 0 && (
          <div className="flex flex-col gap-[20px] py-[20px]">
            <p className="text-[18px] font-bold text-secondary dark:text-secondaryLight tracking-[0.1px]">
              {t('license.loansPage.card.pastSection')} <span className="text-[16px] font-light text-secondary dark:text-secondaryLight">({past.length})</span>
            </p>
            <div className="flex flex-col gap-[12px] w-full">
              {past.map((license) => (
                <PastCard key={license.id} license={license} token={auth?.token} onViewDetail={openEntryDetail} />
              ))}
            </div>
          </div>
        )}
      </div>

      {extendLicense && (
        <ExtendLoanModal
          license={extendLicense}
          onClose={() => setExtendLicense(null)}
          onSuccess={loadLicenses}
        />
      )}

      {returnLicense && (
        <ReturnBookModal
          license={returnLicense}
          onClose={() => setReturnLicense(null)}
          onSuccess={loadLicenses}
        />
      )}

      {cancelLicense && (
        <CancelReservationModal
          license={cancelLicense}
          onClose={() => setCancelLicense(null)}
          onSuccess={loadLicenses}
        />
      )}
    </>
  );
}
