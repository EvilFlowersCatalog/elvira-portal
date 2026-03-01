import useAppContext from '../../../hooks/contexts/useAppContext';

interface IEntryBoxLoading {
  fixedSize?: boolean;
}

const EntryBoxLoading = ({ fixedSize = false }: IEntryBoxLoading) => {

  return (
    <div
      className={
        fixedSize
          ? 'h-80 w-full p-4'
          : `flex min-h-80 w-full sm:w-1/2 md:w-1/4 xl:w-1/5 xxl:w-[14.28%] p-4`
      }
    >
      <div className='flex flex-col w-full h-full bg-zinc-300 dark:bg-darkGray overflow-hidden rounded-md animate-pulse p-2 gap-2'>
        <div className='w-full h-2/3 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
        <div className='h-4 w-full bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
        <div className='h-4 w-2/3 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
        <span className='flex flex-1'></span>
        <div className='h-2 w-2/3 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
      </div>
    </div>
  );
};

export default EntryBoxLoading;
