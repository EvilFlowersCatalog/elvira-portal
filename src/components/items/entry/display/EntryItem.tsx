import { useTranslation } from "react-i18next";
import useAuthContext from "../../../../hooks/contexts/useAuthContext";
import { IEntry } from "../../../../utils/interfaces/entry";
import { useEffect, useState } from "react";
import useAddToShelf from "../../../../hooks/api/my-shelf/useAddToShelf";
import useRemoveFromShelf from "../../../../hooks/api/my-shelf/useRemoveFromShelf";
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from "react-router-dom";
import { NAVIGATION_PATHS, THEME_TYPE } from "../../../../utils/interfaces/general/general";
import useAppContext from "../../../../hooks/contexts/useAppContext";


interface IEntryItem {
    entry: IEntry;
    triggerReload?: () => void;
    id?: string;
}

export default function EntryItem({ entry, triggerReload, id }: IEntryItem) {
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
    }, [entry]);

    const handleBookmarkToggle = async () => {
        if (isOnShelf) {
            try {
                await removeFromShelf(entry.shelf_record_id);
                triggerReload?.();
                setIsOnShelf(false);
                toast.success(t('notifications.myShelf.remove.success')); // Notify user
            } catch {
                toast.error(t('notifications.myShelf.remove.error')); // notify user
            }
        } else {
            try {
                const shelfRecordId = await addToShelf(entry.id);
                setIsOnShelf(true);
                entry.shelf_record_id = shelfRecordId.response.id;
                toast.success(t('notifications.myShelf.add.success')); // Notify user
            } catch {
                toast.error(t('notifications.myShelf.add.error')); // Notify user
            }
        }
    };

    /* TODO: trigger search */

    const openEntryDetail = () => {
        const params = new URLSearchParams(searchParams);
        const id = searchParams.get('entry-detail-id');

        if (id === entry.id) params.delete('entry-detail-id');
        else params.set('entry-detail-id', entry.id);

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
    function invalidImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
        e.currentTarget.src = '/assets/thumbnail.webp';
        setIsFallbackImage(true);
    }

    return <div className="group rounded-lg overflow-hidden relative w-full mb-8 h-68 max-w-[200px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] dark:hover:shadow-strongDarkGray transition-shadow duration-300 ">
        <div className="h-40">
            <div onClick={openEntryDetail}
                className='relative w-full h-full object-cover select-none cursor-pointer'
            >
                <img
                    className="w-full h-full object-cover select-none cursor-pointer"
                    src={entry.thumbnail + `?access_token=${auth?.token}`}
                    alt={`Thumbnail ${entry.title}`}
                    onError={invalidImageFallback}
                />
                {isFallbackImage && (
                    <img
                        className={`absolute w-[80%] z-10 top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 transition-opacity duration-300 opacity-1 group-hover:scale-110 transition-transform duration-300`}
                        src={titleLogoDark}
                        alt='Elvira Logo'
                    />
                )}
            </div>
            <div onClick={handleBookmarkToggle}
                className={`cursor-pointer absolute top-2 right-2 w-10 h-8 rounded-lg p-2 flex items-center justify-center shadow-md
                 ${isOnShelf ? 'bg-primaryLight border-2 border-primary' : 'bg-white'}`}>
                <svg width="16" height="21" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        stroke={isOnShelf ? "#0077CCB2" : "#333333"}
                        fill={isOnShelf ? "#0077CC" : "none"}
                        d="M12.8333 16.5L6.99999 12.3333L1.16666 16.5V3.16667C1.16666 2.72464 1.34225 2.30072 1.65481 1.98816C1.96737 1.67559 2.3913 1.5 2.83332 1.5H11.1667C11.6087 1.5 12.0326 1.67559 12.3452 1.98816C12.6577 2.30072 12.8333 2.72464 12.8333 3.16667V16.5Z"
                        strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
        <div className="bg-white dark:bg-strongDarkGray relative p-2 h-full">
            <div className="mb-2">
                {entry.feeds.map(feed => (
                    <span key={id ? `${id}-${feed.id}` : feed.id} onClick={() => {
                        handleParamClick('feed-id', feed.id);
                    }} className="cursor-pointer font-semibold px-2 py-1 text-xs bg-primaryLight text-primary rounded-md mr-1">
                        {feed.title}
                    </span>
                ))}
            </div>
            <h3 onClick={openEntryDetail} className="group-hover:underline transition-udnerline duration-300 cursor-pointer font-bold text-secondary dark:text-white text-sm line-clamp-2 overflow-hidden text-ellipsis mb-2">{entry.title}</h3>
            <p className="text-xs cursor-pointer dark:text-white" onClick={() => {
                handleParamClick('author', entry.authors[0]?.name + ' ' + entry.authors[0]?.surname);
            }}>
                {entry.authors.length > 0
                    ? `${entry.authors[0]?.name} ${entry.authors[0]?.surname}`
                    : <span className="text-gray-500">{t('entry.detail.noAuthor')}</span>
                }
            </p>
        </div>
    </div>
}