import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAuthContext from '../../../../hooks/contexts/useAuthContext';
import { IEntry } from '../../../../utils/interfaces/entry';
import useAppContext from '../../../../hooks/contexts/useAppContext';

interface IEntrySwiperParams {
  entry: IEntry;
  isActive: boolean;
  setClickedEntry: (clickedEntry: 'popular' | 'lastAdded' | '') => void;
  clickedEntry: 'popular' | 'lastAdded' | '';
  type: 'popular' | 'lastAdded';
}

const EntrySwiper = ({
  entry,
  isActive,
  setClickedEntry,
  type,
  clickedEntry,
}: IEntrySwiperParams) => {
  const { auth } = useAuthContext();
  const { stuBg } = useAppContext();

  const [isScale, setIsScale] = useState<boolean>(false);
  const [isUnderLine, setIsUnderLine] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const handelMouseEnter = () => {
    setIsScale(true);
    setIsUnderLine(true);
  };

  const handelMouseLeave = () => {
    setIsScale(false);
    setIsUnderLine(false);
  };

  const openEntryDetail = () => {
    if (type === 'popular')
      umami.track('Popular Entry Button', {
        entryId: entry.id,
      });
    else
      umami.track('Last Added Entry Button', {
        entryId: entry.id,
      });

    const params = new URLSearchParams(searchParams);
    const id = searchParams.get('entry-detail-id');

    if (id === entry.id && type === clickedEntry)
      params.delete('entry-detail-id');
    else params.set('entry-detail-id', entry.id);

    setClickedEntry(type);
    setSearchParams(params);
  };

  return (
    <div className={'flex h-96 w-52'}>
      <button
        className={`flex flex-col justify-center p-4 w-full gap-2 rounded-md text-left ${
          isActive ? `${stuBg}` : 'hover:bg-zinc-100 dark:hover:bg-darkGray'
        }`}
        onMouseEnter={handelMouseEnter}
        onMouseLeave={handelMouseLeave}
        onClick={openEntryDetail}
      >
        <div
          className={`w-full rounded-md border border-gray dark:border-zinc-200 ${
            imageLoaded ? 'h-auto my-auto' : 'h-72'
          } overflow-hidden max-h-72`}
        >
          <img
            className={`w-full h-full ${
              isScale ? 'scale-110' : ''
            } duration-1000`}
            src={entry.thumbnail + `?access_token=${auth?.token}`}
            alt='Entry Thumbnail'
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        <span
          className={`text-sm ${
            isActive ? 'text-white' : 'text-darkGray dark:text-white'
          } font-bold line-clamp-3 md:line-clamp-2 ${
            isUnderLine ? 'underline' : ''
          }`}
        >
          {entry.title}
        </span>
        {entry.authors.length > 0 && (
          <span
            className={`text-xs ${
              isActive ? 'text-zinc-200' : 'text-gray dark:text-zinc-200'
            }`}
          >
            {entry.authors[0].name} {entry.authors[0].surname}
          </span>
        )}
      </button>
    </div>
  );
};

export default EntrySwiper;
