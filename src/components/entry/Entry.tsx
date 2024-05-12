import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IEntry } from '../../utils/interfaces/entry';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAuthContext from "../../hooks/contexts/useAuthContext.tsx";

interface IEntryParams {
  entry: IEntry;
  isActive: boolean;
}

const Entry = ({ entry, isActive }: IEntryParams) => {
  const { auth } = useAuthContext();
  const { showSearchBar } = useAppContext();
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

  const openEntryDetail = () => {
    const params = new URLSearchParams(searchParams);
    const id = searchParams.get('entry-detail-id');

    if (id === entry.id) params.delete('entry-detail-id');
    else params.set('entry-detail-id', entry.id);

    setSearchParams(params);
  };

  return (
    <div
      className={`flex w-full sm:w-1/2 md:w-1/4 ${
        showSearchBar
          ? 'lg:w-1/3 xl:w-1/4 xxl:w-1/6'
          : 'xl:w-1/5 xxl:w-[14.28%]'
      }`}
    >
      <button
        className={`flex flex-col justify-center p-4 w-full gap-2 rounded-md text-left ${
          isActive ? 'bg-STUColor' : 'hover:bg-zinc-100 dark:hover:bg-darkGray'
        }`}
        onMouseEnter={handelMouseEnter}
        onMouseLeave={handelMouseLeave}
        onClick={openEntryDetail}
      >
        <div
          className={
            'w-full h-auto rounded-md border border-gray dark:border-zinc-200 overflow-hidden'
          }
        >
          <img
            className={`w-full h-full ${
              isScale ? 'scale-110' : ''
            } duration-1000`}
            src={entry.thumbnail + `?access_token=${auth?.token}`}
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
          className={`text-xs ${
            isActive ? 'text-zinc-200' : 'text-gray dark:text-zinc-200'
          }`}
        >
          {entry.authors[0].name} {entry.authors[0].surname}
        </span>
      </button>
    </div>
  );
};

export default Entry;
