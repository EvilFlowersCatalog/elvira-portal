const EntryListLoading = () => {
  return (
    <div className={`flex w-full xxl:w-1/2 min-h-96`}>
      <div className='flex flex-1 gap-4 p-4 rounded-md animate-pulse'>
        <div className='flex flex-col flex-1 items-center gap-2'>
          <div className='h-64 w-full bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
          <div className='h-5 w-3/4 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
          <div className='h-10 w-1/2 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
        </div>
        <div className='flex flex-col flex-3 gap-2'>
          <div className='w-2/3 h-8 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
          <div className='flex gap-4 h-5'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className='h-full w-20 bg-zinc-400 dark:bg-strongDarkGray rounded-md'
              ></div>
            ))}
          </div>
          <div className='h-8 w-10 bg-zinc-400 dark:bg-strongDarkGray rounded-md'></div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='flex w-full h-5 bg-zinc-400 dark:bg-strongDarkGray rounded-md'
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntryListLoading;
