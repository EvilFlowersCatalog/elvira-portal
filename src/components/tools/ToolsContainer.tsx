import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoSearchOutline } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';

const ToolsContainer = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState<string>('');
  const [selection, setSelection] = useState('-created_at');

  // submit input (search title)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If there is input set it to params else delete it
    if (input) searchParams.set('title', input);
    else searchParams.delete('title');
    setSearchParams(searchParams);
  };

  useEffect(() => {
    const orderBy = searchParams.get('order-by');
    if (orderBy) setSelection(orderBy);
  }, [searchParams]);

  // Handle input
  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'none') searchParams.delete('order-by');
    else searchParams.set('order-by', e.target.value);
    setSearchParams(searchParams);
  };

  return (
    <div className='flex gap-3 px-4 pb-4 md:items-center flex-col md:flex-row'>
      <form
        className='relative flex w-full md:w-1/2 xl:w-1/4 items-center gap-2 text-darkGray dark:text-white'
        onSubmit={submit}
      >
        <input
          className={
            'w-full p-2 rounded-md bg-zinc-200 dark:bg-darkGray border-2 border-white dark:border-gray outline-none focus:border-STUColor dark:focus:border-STUColor'
          }
          type={'text'}
          name={'searchTitle'}
          value={input}
          placeholder={t('tools.search')}
          onChange={handleSearchInput}
        />
        <button type='submit' className={'absolute right-2'}>
          <IoSearchOutline size={30} />
        </button>
      </form>

      <div className='flex gap-3 items-end text-[15px]'>
        <select
          className='bg-transparent cursor-pointer outline-none uppercase text-left'
          name='orderBy'
          id='orderBy'
          value={selection}
          onChange={handleSelectChange}
        >
          <option value='-created_at'>
            {t('tools.orderBy.createdAtDesc')}
          </option>
          <option value='created_at'>{t('tools.orderBy.createdAtAsc')}</option>
          <option value='-title'>{t('tools.orderBy.titleDesc')}</option>
          <option value='title'>{t('tools.orderBy.titleAsc')}</option>
        </select>
      </div>
    </div>
  );
};

export default ToolsContainer;
