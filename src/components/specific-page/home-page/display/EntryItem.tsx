import { useTranslation } from "react-i18next";
import useAuthContext from "../../../../hooks/contexts/useAuthContext";
import { IEntry } from "../../../../utils/interfaces/entry";
import { useEffect, useState } from "react";
import useAddToShelf from "../../../../hooks/api/my-shelf/useAddToShelf";
import useRemoveFromShelf from "../../../../hooks/api/my-shelf/useRemoveFromShelf";
import useGetEntryDetail from "../../../../hooks/api/entries/useGetEntryDetail";

interface IEntryItem {
    entry: IEntry;
    triggerReload?: () => void;
}

export default function EntryItem({ entry, triggerReload }: IEntryItem) {
    const { auth } = useAuthContext();
    const { t } = useTranslation();
    const addToShelf = useAddToShelf();
    const removeFromShelf = useRemoveFromShelf();
    const getDetails = useGetEntryDetail();

    const [isOnShelf, setIsOnShelf] = useState<boolean>(entry.shelf_record_id != null);

    useEffect(() => {
        getDetails(entry.id).then((details) => {
            entry.shelf_record_id = details.response.shelf_record_id;
            setIsOnShelf(details.response.shelf_record_id != null);
        }).catch(() => { });
    }, [entry]);

    const handleBookmarkToggle = async () => {
        if (isOnShelf) {
            triggerReload?.();
            await removeFromShelf(entry.shelf_record_id);
            setIsOnShelf(false);
        } else {
            const shelfRecordId = await addToShelf(entry.id);
            setIsOnShelf(true);
            entry.shelf_record_id = shelfRecordId.response.id;
        }
    };

    return <div className="rounded-lg overflow-hidden relative w-full mb-8 h-68 max-w-[200px]">
        <div className="h-40">
            <img
                className='w-full h-full object-cover select-none cursor-pointer'
                src={entry.thumbnail + `?access_token=${auth?.token}`}
                alt='Entry Thumbnail'
            />
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
        <div className="bg-white dark:bg-gray-800 relative p-2 h-full">
            <div className="mb-2">
                {entry.feeds.map(feed => (
                    <span key={feed.id} className="font-semibold px-2 py-1 text-xs bg-primaryLight text-primary rounded-md mr-1">
                        {feed.title}
                    </span>
                ))}
            </div>
            <h3 className="cursor-pointer font-bold text-secondary text-sm line-clamp-2 overflow-hidden text-ellipsis mb-2">{entry.title}</h3>
            {entry.authors.length > 0 ? <p className="text-xs">{entry.authors[0]?.name} {entry.authors[0]?.surname}</p> :
                <p className="text-xs text-gray-500">{t('entry.detail.noAuthor')}</p>}
        </div>
    </div>
}