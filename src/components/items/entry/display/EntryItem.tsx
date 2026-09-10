import { useTranslation } from "react-i18next";
import useAuthContext from "../../../../hooks/contexts/useAuthContext";
import { IEntry, IEntryDetail } from "../../../../utils/interfaces/entry";
import { useEffect, useState } from "react";
import useAddToShelf from "../../../../hooks/api/my-shelf/useAddToShelf";
import useRemoveFromShelf from "../../../../hooks/api/my-shelf/useRemoveFromShelf";
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from "react-router-dom";
import { NAVIGATION_PATHS } from "../../../../utils/interfaces/general/general";
import useAppContext from "../../../../hooks/contexts/useAppContext";
import { AvailabilityBadge, AvailabilityState } from "../details/AvailabilityBadge";


interface IEntryItem {
    entry: IEntry | IEntryDetail;
    triggerReload?: () => void;
    id?: string;
    type?: 'ai-recommendation' | 'library-item';
    hasActiveLoan?: boolean;
}

export default function EntryItem({ entry, triggerReload, id, type, hasActiveLoan }: IEntryItem) {
    const { titleLogoDark } = useAppContext();
    const { auth } = useAuthContext();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const addToShelf = useAddToShelf();
    const removeFromShelf = useRemoveFromShelf();
    const [isOnShelf, setIsOnShelf] = useState<boolean>(entry.shelf_record_id != null);

    useEffect(() => {
        setIsOnShelf(entry.shelf_record_id != null);

        // Keep this card in sync when the same entry is bookmarked/unbookmarked
        // elsewhere. The listener MUST be cleaned up — previously it was added on
        // every entry change and never removed, so infinite-scroll leaked one
        // listener per card and every shelf toggle fanned out across all of them.
        const handleShelfUpdated = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail.id === entry.id) {
                const updated = customEvent.detail.isOnShelf;
                if (updated) entry.shelf_record_id = customEvent.detail.shelf_record_id;
                setIsOnShelf(updated);
            }
        };
        document.addEventListener('shelf-updated', handleShelfUpdated);
        return () => document.removeEventListener('shelf-updated', handleShelfUpdated);
    }, [entry]);

    const handleBookmarkToggle = async () => {
        if (isOnShelf) {
            try {
                await removeFromShelf(entry.shelf_record_id);
                triggerReload?.();
                setIsOnShelf(false);
                toast.success(t('notifications.myShelf.remove.success')); // Notify user
                document.dispatchEvent(new CustomEvent('shelf-updated', { detail: { id: entry.id, isOnShelf: false } }));
            } catch {
                toast.error(t('notifications.myShelf.remove.error')); // notify user
            }
        } else {
            try {
                const shelfRecordId = await addToShelf(entry.id);
                setIsOnShelf(true);
                entry.shelf_record_id = shelfRecordId.response.id;
                toast.success(t('notifications.myShelf.add.success')); // Notify user
                document.dispatchEvent(new CustomEvent('shelf-updated', { detail: { id: entry.id, isOnShelf: true, shelf_record_id: entry.shelf_record_id } }));
            } catch {
                toast.error(t('notifications.myShelf.add.error')); // Notify user
            }
        }
    };

    /* TODO: trigger search */

    const openEntryDetail = () => {
        const params = new URLSearchParams(searchParams);

        if (type == 'ai-recommendation') {
            params.set('dialog-priority', 'entry-detail')
        }

        params.set('entry-detail-id', entry.id);
        params.set('entry-catalog-id', entry.catalog_id);

        setSearchParams(params);
    };

    const handleParamClick = (name: string, value: string) => {
        if (location.pathname === NAVIGATION_PATHS.library) {
            searchParams.set(name, value);
            setSearchParams(searchParams);
        } else {
            const params = new URLSearchParams();
            params.set(name, value);
            navigate({
                pathname: NAVIGATION_PATHS.library,
                search: params.toString(),
            });
        }
    };

    const [isFallbackImage, setIsFallbackImage] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    function invalidImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
        e.currentTarget.src = '/assets/thumbnail.webp';
        setIsFallbackImage(true);
        setImgLoaded(true);
    }

    const hasAcquisitions = entry.acquisitions?.length > 0;
    const readiumEnabled = Boolean((entry as IEntryDetail).config?.readium_enabled);
    const lcpState = entry.lcp_state;

    const availabilityState = ((): AvailabilityState | null => {
        if (hasActiveLoan || lcpState === 'active_loan_for_user' || !!entry.user_active_license_id) return 'borrowed';
        if (entry.user_reservation_id) return 'reserved';
        if (lcpState === 'fully_borrowed' || lcpState === 'available_in_days') return 'unavailable';
        if (lcpState === 'available_now' || readiumEnabled) return 'available';
        return null;
    })();

    const daysUntilAvailable = lcpState === 'available_in_days' && entry.next_available_at
        ? Math.max(0, Math.ceil((new Date(entry.next_available_at).getTime() - Date.now()) / 86_400_000))
        : null;
    const queuePosition = availabilityState === 'reserved' ? entry.user_position ?? null : null;

    return (
        <div className="group rounded-[8px] relative w-full bg-white dark:bg-strongDarkGray shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] dark:hover:shadow-strongDarkGray transition-shadow duration-300 flex flex-col gap-[7px] pb-[10px]">
            {/* Book cover */}
            <div className="h-[163px] relative shrink-0 w-full overflow-hidden rounded-t-[8px] bg-lightGray dark:bg-darkGray">
                <div
                    onClick={openEntryDetail}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('entry.detail.openDetail', { defaultValue: 'Open detail' })}: ${entry.title}`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openEntryDetail();
                        }
                    }}
                    className="relative w-full h-full cursor-pointer select-none"
                >
                    <img
                        className={`w-full h-full object-cover select-none transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        src={entry.thumbnail + `?access_token=${auth?.token}`}
                        alt={`Thumbnail ${entry.title}`}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setImgLoaded(true)}
                        onError={invalidImageFallback}
                    />
                    {isFallbackImage && (
                        <img
                            className="absolute w-[80%] z-[2] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-300"
                            src={titleLogoDark}
                            alt='Elvira Logo'
                        />
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleBookmarkToggle}
                    aria-pressed={isOnShelf}
                    aria-label={isOnShelf
                        ? t('myShelf.remove', { defaultValue: 'Remove from shelf' })
                        : t('myShelf.add', { defaultValue: 'Add to shelf' })}
                    className={`cursor-pointer absolute top-[8px] right-[6px] w-9 h-7 rounded-[8px] flex items-center justify-center drop-shadow-[0px_4px_6px_rgba(0,0,0,0.1)]
                     ${isOnShelf ? 'bg-primaryLight border-2 border-primary' : 'bg-white'}`}
                >
                    <svg width="16" height="21" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            stroke={isOnShelf ? "var(--color-primary)" : "#333333"}
                            fill={isOnShelf ? "var(--color-primary)" : "none"}
                            d="M12.8333 16.5L6.99999 12.3333L1.16666 16.5V3.16667C1.16666 2.72464 1.34225 2.30072 1.65481 1.98816C1.96737 1.67559 2.3913 1.5 2.83332 1.5H11.1667C11.6087 1.5 12.0326 1.67559 12.3452 1.98816C12.6577 2.30072 12.8333 2.72464 12.8333 3.16667V16.5Z"
                            strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            {/* Detail section */}
            <div className="flex flex-col flex-1 gap-[6px] items-start px-[7.5px] min-w-0 overflow-hidden">
                {/* Feeds */}
                <div className="flex gap-[6px] items-center w-full min-w-0 overflow-hidden">
                    {entry.feeds.length > 0 && (
                        <button
                            type="button"
                            key={id ? `${id}-${entry.feeds[0].id}` : entry.feeds[0].id}
                            onClick={() => handleParamClick('feed-id', entry.feeds[0].id)}
                            aria-label={`${t('search.filterByFeed', { defaultValue: 'Filter by category' })}: ${entry.feeds[0].title}`}
                            className="cursor-pointer font-medium px-[4px] py-[3px] text-[9px] tracking-[0.1px] bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight rounded-[4px] truncate min-w-0 shrink"
                        >
                            {entry.feeds[0].title}
                        </button>
                    )}
                    {entry.feeds.length > 1 && (
                        <span
                            title={entry.feeds.slice(1).map(f => f.title).join(', ')}
                            className="font-medium px-[4px] py-[3px] text-[9px] tracking-[0.1px] bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight rounded-[4px] flex-shrink-0 whitespace-nowrap"
                        >
                            +{entry.feeds.length - 1}
                        </span>
                    )}
                </div>

                {/* Title + Author */}
                <div className="flex flex-col gap-[2px] w-full min-w-0">
                    <h3
                        onClick={openEntryDetail}
                        className="cursor-pointer font-semibold text-[14px] leading-[16px] tracking-[0.1px] text-secondary dark:text-white line-clamp-2 group-hover:underline transition-all duration-300 break-words"
                    >
                        {entry.title}
                    </h3>
                    <p
                        className="font-light text-[10px] leading-[18px] tracking-[0.1px] text-[#333] dark:text-white overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                        onClick={() => handleParamClick('author', entry.authors[0]?.name + ' ' + entry.authors[0]?.surname)}
                    >
                        {entry.authors.length > 0
                            ? `${entry.authors[0]?.name} ${entry.authors[0]?.surname}`
                            : <span className="text-gray-500">{t('entry.detail.noAuthor')}</span>
                        }
                    </p>
                </div>
            </div>

            {/* Badge */}
            <div className="shrink-0 px-[7.5px]">
                {availabilityState ? (
                    <AvailabilityBadge state={availabilityState} size="small" position={queuePosition} days={daysUntilAvailable} />
                ) : hasAcquisitions ? (
                    <div className="inline-flex items-center gap-[4px] h-[12px] px-[7px] rounded-[6px] bg-[#cfffd8]">
                        <div className="rounded-full size-[4.5px] shrink-0 bg-[#005e11]" />
                        <span className="text-[9px] text-[#005e11] tracking-[0.1px] whitespace-nowrap leading-none">
                            {t('entry.badge.read', { defaultValue: 'Read' })}
                        </span>
                    </div>
                ) : (
                    <div className="inline-block h-[12px] w-[72px] rounded-[6px] bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                )}
            </div>
        </div>
    );
}