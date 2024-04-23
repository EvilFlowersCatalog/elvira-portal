import { MouseEvent, useState } from 'react';
import { IEntry } from '../../../utils/interfaces/entry';
import useAppContext from '../../../hooks/useAppContext';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';

interface IEntryDefaultParams {
  entry: IEntry;
}

const EntryDefault = ({ entry }: IEntryDefaultParams) => {
  const { specialNavigation } = useAppContext();
  const [isScale, setIsScale] = useState<boolean>(false);
  const [isUnderLine, setIsUnderLine] = useState<boolean>(false);

  const handelMouseEnter = () => {
    setIsScale(true);
    setIsUnderLine(true);
  };

  const handelMouseLeave = () => {
    setIsScale(false);
    setIsUnderLine(false);
  };

  const handleClickButton = (e: MouseEvent<HTMLButtonElement>) => {
    specialNavigation(e, NAVIGATION_PATHS.viewer + entry.id);
  };

  return (
    <button
      className={`flex flex-col justify-center w-[200px] flex-shrink-0 gap-2 rounded-md text-left`}
      onMouseEnter={handelMouseEnter}
      onMouseLeave={handelMouseLeave}
      onClick={handleClickButton}
    >
      <div
        className={
          'w-full h-[300px] rounded-md border border-gray dark:border-lightGray overflow-hidden'
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
        className={`text-sm font-bold line-clamp-3 md:line-clamp-2 text-black dark:text-white ${
          isUnderLine ? 'underline' : ''
        }`}
      >
        {entry.title}
      </span>
      <span className={'flex-1'}></span>
      <span className={`text-sm text-gray dark:text-lightGray`}>
        {entry.authors[0].name} {entry.authors[0].surname}
      </span>
    </button>
  );
};

export default EntryDefault;
