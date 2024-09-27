import { IoMdAdd } from 'react-icons/io';
import { IPartParams } from '../../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import AuthorsAutofill from '../../autofills/AuthorsAutofill';
import useGetAuthors from '../../../hooks/api/authors/useGetAuthors';
import { useEffect, useState } from 'react';
import { IEntryAuthor } from '../../../utils/interfaces/author';
import { IoRemoveCircle } from 'react-icons/io5';

const AuthorsPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();

  const [authors, setAuthors] = useState<IEntryAuthor[]>([]);

  const getAuthors = useGetAuthors();

  // get authors
  useEffect(() => {
    (async () => {
      try {
        const { items: a } = await getAuthors({ paginate: false });
        setAuthors(a);
      } catch {
        setAuthors([]);
      }
    })();
  }, []);

  const addAuthor = () => {
    umami.track('Entry Add Author Button');
    const authors = entry!.authors;
    authors.push({ name: '', surname: '' });

    setEntry({
      ...entry,
      authors: authors,
    });
  };
  const removeAuthor = (i: number) => {
    umami.track('Entry Remove Author Button');
    let a: IEntryAuthor[] = [];

    if (entry.authors.length === 1) a = [{ name: '', surname: '' }];
    else a = entry!.authors.filter((_, index) => index !== i);

    setEntry({
      ...entry!,
      authors: a,
    });
  };

  return (
    <div className='min-h-64 flex flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
      <div
        className='w-fit mx-auto flex justify-center items-center gap-2 cursor-pointer'
        onClick={addAuthor}
      >
        <span>{t('entry.wizard.authors')}</span>
        <IoMdAdd size={20} />
      </div>
      <div className='flex-1 rounded-md'>
        <div className='flex flex-col flex-1 gap-4'>
          {entry.authors?.map((_, index) => (
            <div className='flex w-full gap-4 items-center' key={index}>
              <AuthorsAutofill
                entryForm={entry}
                setEntryForm={setEntry}
                index={index}
                authors={authors}
                type='name'
              />
              <AuthorsAutofill
                entryForm={entry}
                setEntryForm={setEntry}
                index={index}
                authors={authors}
                type='surname'
              />
              <IoRemoveCircle
                color='red'
                size={40}
                className='cursor-pointer pt-[18px]'
                onClick={() => removeAuthor(index)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthorsPart;
