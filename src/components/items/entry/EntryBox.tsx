import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IEntry } from '../../../utils/interfaces/entry';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useAppContext from '../../../hooks/contexts/useAppContext';

interface IEntryBoxParams {
  entry: IEntry;
  isActive: boolean;
}

const EntryBox = ({ entry, isActive }: IEntryBoxParams) => {
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
    const params = new URLSearchParams(searchParams);
    const id = searchParams.get('entry-detail-id');

    if (id === entry.id) params.delete('entry-detail-id');
    else params.set('entry-detail-id', entry.id);

    setSearchParams(params);
  };

  return (
    <div
      className={`flex w-full sm:w-1/2 md:w-1/4 xl:w-1/5 xxl:w-[14.28%]`}
    >
      <button
        className={`flex flex-col justify-center p-4 w-full gap-2 rounded-md text-left ${
          isActive ? `${stuBg}` : 'hover:bg-zinc-100 dark:hover:bg-darkGray'
        }`}
        onMouseEnter={handelMouseEnter}
        onMouseLeave={handelMouseLeave}
        onClick={openEntryDetail}
      >
        <div
          className={`w-full flex ${
            imageLoaded ? 'h-auto my-auto' : 'h-64'
          } rounded-md border border-gray dark:border-zinc-200 overflow-hidden`}
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
        <div className='flex gap-2'>
          {entry.feeds.map((feed) => (
            <div
              key={feed.id}
              className={`px-2 py-1 text-sm ${stuBg} text-white rounded-md`}
            >
              {feed.title}
            </div>
          ))}
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

export default EntryBox;
