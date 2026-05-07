import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { RxCalendar } from 'react-icons/rx';
import { LuDownload, LuRepeat2, LuClock } from 'react-icons/lu';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { MdMoreTime } from 'react-icons/md';
import { HiOutlineUsers } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { ILicense } from '../../../utils/interfaces/license';
import useGetLicenses from '../../../hooks/api/licenses/useGetLicenses';
import useDownloadLicense from '../../../hooks/api/licenses/useDownloadLicense';

function BorrowedDateBadge({ date }: { date: string }) {
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#f0f8ff] shrink-0">
      <RxCalendar size={11} className="text-[#1e6cb4] shrink-0" />
      <span className="text-[10px] text-[#1e6cb4] tracking-[0.1px] whitespace-nowrap">
        Požičané od: {date}
      </span>
    </span>
  );
}

function DaysLeftBadge({ daysLeft }: { daysLeft: number }) {
  const isUrgent = daysLeft <= 1;
  const bgColor = isUrgent ? 'bg-[#ffe5dd]' : 'bg-[#fff4dd]';
  const textColor = isUrgent ? 'text-[#c30000]' : 'text-[#333]';
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

function ExtensionsBadge({ count }: { count: number }) {
  const word = count === 1 ? 'predĺženie' : count >= 2 && count <= 4 ? 'predĺženia' : 'predĺžení';
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#e0fff2] shrink-0">
      <LuRepeat2 size={11} className="text-[#005e11] shrink-0" />
      <span className="text-[10px] text-[#005e11] tracking-[0.1px] whitespace-nowrap">
        <strong>{count}</strong> {word}
      </span>
    </span>
  );
}

function ReservedDateBadge({ date }: { date: string }) {
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#feeecc] shrink-0">
      <RxCalendar size={11} className="text-[#9f6c00] shrink-0" />
      <span className="text-[10px] text-[#9f6c00] tracking-[0.1px] whitespace-nowrap">
        Rezervované: {date}
      </span>
    </span>
  );
}

function QueueBadge({ position, total }: { position: number; total: number }) {
  return (
    <span className="flex items-center gap-[5px] h-[16px] px-2 rounded-[4px] bg-[#feeecc] shrink-0">
      <HiOutlineUsers size={11} className="text-[#9f6c00] shrink-0" />
      <span className="text-[10px] text-[#9f6c00] tracking-[0.1px] whitespace-nowrap">
        Poradie: <strong>{position}.</strong> /{total}
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
          ? 'border-[0.5px] border-[rgba(0,0,0,0.25)] text-[rgba(0,0,0,0.25)] cursor-default'
          : filled
            ? 'bg-lightGray border-[0.5px] border-darkGray text-darkGray hover:bg-gray-200'
            : 'border-[0.5px] border-darkGray text-darkGray hover:bg-gray-100'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function BorrowedCard({
  license,
  onDownload,
}: {
  license: ILicense;
  onDownload: (id: string) => void;
}) {
  const expiresAt = parseISO(license.expires_at);
  const startsAt = parseISO(license.starts_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const borrowedFrom = format(startsAt, 'dd.MM.yyyy');
  const dueDate = format(expiresAt, 'dd.MM.yyyy');
  // Placeholder – not returned by API yet
  const PLACEHOLDER_EXTENSIONS = 0;
  const canExtend = PLACEHOLDER_EXTENSIONS < 2;

  return (
    <div className="h-[109px] relative w-full">
      <div className="absolute inset-0 bg-white border border-[#e5e5e5] rounded-[6px]" />

      {/* Book cover */}
      <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[55px] h-[78px] rounded-[4px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] overflow-hidden shrink-0">
        <img
          alt={license.entry?.title}
          src="/assets/thumbnail.webp"
          className="w-full h-full object-cover rounded-[4px]"
        />
      </div>

      {/* Title */}
      <div className="absolute left-[82px] right-[253px] top-[calc(50%-22px)] -translate-y-1/2">
        <p className="font-semibold text-[14px] text-[#15384e] tracking-[0.1px] truncate leading-normal">
          {license.entry?.title || 'Neznámy titul'}
        </p>
      </div>

      {/* Author – placeholder */}
      <div className="absolute left-[82px] right-[253px] top-[calc(50%+2px)] -translate-y-1/2">
        <p className="font-light text-[12px] text-[#15384e] tracking-[0.1px] truncate leading-normal">
          Autor
        </p>
      </div>

      {/* Status badges */}
      <div className="absolute left-[82px] top-[78px] flex items-center gap-[23px]">
        <BorrowedDateBadge date={borrowedFrom} />
        <DaysLeftBadge daysLeft={daysLeft} />
        <ExtensionsBadge count={PLACEHOLDER_EXTENSIONS} />
      </div>

      {/* Due date chip */}
      <div className="absolute right-[17px] top-[calc(50%-25.5px)] -translate-y-1/2 w-[218px] h-[28px] rounded-[6px] overflow-hidden flex items-center justify-center gap-[11px] px-2">
        <div className="absolute inset-0 bg-[#cce6fe] rounded-[6px] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)]" />
        <span className="relative w-[7px] h-[7px] rounded-full bg-[#1e6cb4] shrink-0" />
        <span className="relative text-[13px] text-[#1e6cb4] tracking-[0.1px] whitespace-nowrap">
          Požičané do:{' '}
          <strong>{dueDate}</strong>
        </span>
      </div>

      {/* Action buttons */}
      <div className="absolute right-[17px] bottom-[13.76%] top-[55.05%] flex items-center gap-[18px]">
        <ActionBtn
          icon={<MdMoreTime size={20} />}
          label="Predĺžiť"
          disabled={!canExtend}
        />
        <ActionBtn icon={<BsArrowReturnLeft size={20} />} label="Vrátiť" />
        <ActionBtn
          icon={<LuDownload size={20} />}
          label="Stiahnuť"
          filled
          onClick={() => onDownload(license.lcp_license_id || license.id)}
        />
      </div>
    </div>
  );
}

function ReservedCard({ license }: { license: ILicense }) {
  const startsAt = parseISO(license.starts_at);
  const expiresAt = parseISO(license.expires_at);
  const reservedDate = format(startsAt, 'dd.MM');
  const availableFrom = format(expiresAt, 'dd.MM.yyyy');
  // Placeholder queue info – not returned by API yet
  const PLACEHOLDER_QUEUE_POSITION = 1;
  const PLACEHOLDER_QUEUE_TOTAL = 3;

  return (
    <div className="h-[109px] relative w-full">
      <div className="absolute inset-0 bg-white border border-[#e5e5e5] rounded-[6px]" />

      {/* Book cover */}
      <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[55px] h-[78px] rounded-[4px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] overflow-hidden shrink-0">
        <img
          alt={license.entry?.title}
          src="/assets/thumbnail.webp"
          className="w-full h-full object-cover rounded-[4px]"
        />
      </div>

      {/* Title */}
      <div className="absolute left-[82px] right-[135px] top-[calc(50%-22px)] -translate-y-1/2">
        <p className="font-semibold text-[14px] text-[#15384e] tracking-[0.1px] truncate leading-normal">
          {license.entry?.title || 'Neznámy titul'}
        </p>
      </div>

      {/* Author – placeholder */}
      <div className="absolute left-[82px] right-[135px] top-[calc(50%+2px)] -translate-y-1/2">
        <p className="font-light text-[12px] text-[#15384e] tracking-[0.1px] truncate leading-normal">
          Autor
        </p>
      </div>

      {/* Status badges */}
      <div className="absolute left-[82px] top-[78px] flex items-center gap-[23px]">
        <ReservedDateBadge date={reservedDate} />
        <QueueBadge position={PLACEHOLDER_QUEUE_POSITION} total={PLACEHOLDER_QUEUE_TOTAL} />
      </div>

      {/* Available from chip */}
      <div className="absolute right-[17px] top-[calc(50%-25.5px)] -translate-y-1/2 w-[218px] h-[28px] rounded-[6px] overflow-hidden flex items-center justify-center gap-[11px] px-2">
        <div className="absolute inset-0 bg-[#feeecc] rounded-[6px] shadow-[inset_-1px_-1px_2.8px_0px_rgba(0,0,0,0.1)]" />
        <span className="relative w-[7px] h-[7px] rounded-full bg-[#9f6c00] shrink-0" />
        <span className="relative text-[13px] text-[#9f6c00] tracking-[0.1px] whitespace-nowrap">
          Dostupné od:{' '}
          <strong>{availableFrom}</strong>
        </span>
      </div>

      {/* Cancel button */}
      <div className="absolute right-[17px] top-[calc(50%+22.5px)] -translate-y-1/2">
        <ActionBtn icon={<IoClose size={20} />} label="Zrušiť" />
      </div>
    </div>
  );
}

export default function LoansCardView() {
  const { t } = useTranslation();
  const getLicenses = useGetLicenses();
  const { openInThorium, downloadDirect } = useDownloadLicense();
  const [searchParams] = useSearchParams();

  const [borrowed, setBorrowed] = useState<ILicense[]>([]);
  const [reserved, setReserved] = useState<ILicense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLicenses({ page: 1, limit: 50 })
      .then(({ items }) => {
        setBorrowed(items.filter((l) => l.state === 'active'));
        setReserved(items.filter((l) => l.state === 'draft' || (l.state as string) === 'ready'));
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleDownload = (licenseId: string) => {
    openInThorium(licenseId);
    toast.info(
      <div className="flex flex-col gap-1">
        <span>{t('notifications.license.download.thoriumOpened', { defaultValue: 'Opening in Thorium...' })}</span>
        <button className="text-xs underline text-left" onClick={() => downloadDirect(licenseId)}>
          {t('notifications.license.download.fallback', { defaultValue: 'Not opening? Download file directly' })}
        </button>
      </div>,
      { autoClose: 8000 },
    );
  };

  if (loading) {
    return <div className="py-8 text-center text-darkGray">Načítavam...</div>;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Borrowed section */}
      <div className="flex flex-col gap-[20px] py-[20px]">
        <p className="text-[18px] font-bold text-secondary tracking-[0.1px]">
          Požičané{' '}
          <span className="text-[16px] font-light text-[#15384e]">({borrowed.length})</span>
        </p>
        <div className="flex flex-col gap-[12px] w-full">
          {borrowed.length === 0 ? (
            <p className="text-[14px] text-darkGray">Nemáte žiadne aktívne výpožičky.</p>
          ) : (
            borrowed.map((license) => (
              <BorrowedCard key={license.id} license={license} onDownload={handleDownload} />
            ))
          )}
        </div>
      </div>

      {/* Reserved section */}
      {reserved.length > 0 && (
        <div className="flex flex-col gap-[20px] py-[20px]">
          <p className="text-[18px] font-bold text-secondary tracking-[0.1px]">
            Rezervované{' '}
            <span className="text-[16px] font-light text-[#15384e]">({reserved.length})</span>
          </p>
          <div className="flex flex-col gap-[12px] w-full">
            {reserved.map((license) => (
              <ReservedCard key={license.id} license={license} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
