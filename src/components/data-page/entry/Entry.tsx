import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IEntry } from '../../../utils/interfaces/entry';

interface IEntryParams {
  entry: IEntry;
  isActive: boolean;
}

const Entry = ({ entry, isActive }: IEntryParams) => {
  const [isScale, setIsScale] = useState<boolean>(false);
  const [isUnderLine, setIsUnderLine] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handelMouseEnter = () => {
    setIsScale(true);
    setIsUnderLine(true);
  };

  const handelMouseLeave = () => {
    setIsScale(false);
    setIsUnderLine(false);
  };

  const openEntryInfo = () => {
    const params = new URLSearchParams(searchParams);
    const id = searchParams.get('entry-detail-id');

    if (id === entry.id) params.delete('entry-detail-id');
    else params.set('entry-detail-id', entry.id);

    setSearchParams(params);
  };

  return (
    <div
      className={
        'flex w-full sm:w-1/2 md:w-1/3 lg:w-1/5 xl:w-1/6 xxl:w-[14.28%]'
      }
    >
      <button
        className={`flex flex-col justify-center p-5 w-full gap-2 rounded-md text-left ${
          isActive ? 'bg-STUColor' : 'hover:bg-lightGray dark:hover:bg-darkGray'
        }`}
        onMouseEnter={handelMouseEnter}
        onMouseLeave={handelMouseLeave}
        onClick={openEntryInfo}
      >
        <div
          className={
            'w-full h-[102vw] sm:h-[52vw] md:h-[35.33vw] lg:h-[22vw] xl:h-[18.66vw] xxl:h-[16.28vw] rounded-md border border-gray dark:border-lightGray overflow-hidden'
          }
        >
          <img
            className={`w-full h-full ${
              isScale ? 'scale-110' : ''
            } duration-1000`}
            src={entry.thumbnail}
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
        <span className={'flex-1'}></span>
        <span
          className={`text-sm ${
            isActive ? 'text-lightGray' : 'text-gray dark:text-lightGray'
          }`}
        >
          {entry.authors[0].name} {entry.authors[0].surname}
        </span>
      </button>
    </div>
  );
};

export default Entry;
