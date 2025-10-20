import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IEntryNewForm } from '../../utils/interfaces/entry';
import { IEntryAuthor } from '../../utils/interfaces/author';
import ElviraInput from '../inputs/ElviraInput';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IAuthorsAutofillParams {
  entryForm: IEntryNewForm;
  setEntryForm: (entryForm: IEntryNewForm) => void;
  index: number;
  authors: IEntryAuthor[];
  type: 'name' | 'surname';
}

const AuthorsAutofill = ({
  entryForm,
  setEntryForm,
  index,
  authors,
  type,
}: IAuthorsAutofillParams) => {
  const { t } = useTranslation();
  const { stuBorder } = useAppContext();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const ref = useRef<HTMLInputElement>();

  useEffect(() => {
    if (entryForm.authors) {
      if (type === 'name') {
        const author = entryForm.authors[index].name;
        if (author) setInputValue(author);
        else setInputValue('');
      } else {
        const author = entryForm.authors[index].surname;
        if (author) setInputValue(author);
        else setInputValue('');
      }
    }
  }, [entryForm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    let a = entryForm.authors;
    if (type === 'name') a[index].name = value;
    else a[index].surname = value;

    setEntryForm({
      ...entryForm,
      authors: a,
    });

    // Filter authors based on input and type
    if (type === 'name') {
      const filteredSuggestions = authors
        .filter((a) => a.name.toLowerCase().startsWith(value.toLowerCase()))
        .map((a) => a.name);
      setSuggestions(filteredSuggestions);
    } else {
      const filteredSuggestions = authors
        .filter((a) => a.surname.toLowerCase().startsWith(value.toLowerCase()))
        .map((a) => a.surname);
      setSuggestions(filteredSuggestions);
    }
  };

  const handleSuggestionClick = (name: string) => {
    setInputValue(name);
    let a = entryForm.authors;
    if (type === 'name') a[index].name = name;
    else a[index].surname = name;

    setEntryForm({
      ...entryForm,
      authors: a,
    });
    setIsHovering(false);
    setSuggestions([]); // Hide suggestions after selection
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        className={`bg-white ${suggestions.length > 0 ? 'rounded-b-none' : ''}`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={
          type === 'name'
            ? t('entry.wizard.authorName')
            : t('entry.wizard.authorSurname')
        }
        required
        invalidMessage={
          type === 'name'
            ? t('entry.wizard.requiredMessages.authorName')
            : t('entry.wizard.requiredMessages.authorSurname')
        }
        onFocus={(e) => {
          if (type === 'name') {
            const filteredSuggestions = authors
              .filter((a) =>
                a.name.toLowerCase().startsWith(inputValue.toLowerCase())
              )
              .map((a) => a.name);
            setSuggestions(filteredSuggestions);
          } else {
            const filteredSuggestions = authors
              .filter((a) =>
                a.surname.toLowerCase().startsWith(inputValue.toLowerCase())
              )
              .map((a) => a.surname);
            setSuggestions(filteredSuggestions);
          }
        }}
        onBlur={() => {
          // if we click outside out input no on suggestions
          if (!isHovering) setSuggestions([]);
        }}
      />
      {suggestions.length > 0 && (
        <ul
         className={`absolute top-[60px] rounded-md rounded-t-none ${stuBorder} list-none max-h-40 overflow-y-scroll bg-white dark:bg-gray z-20 w-full
          shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A]`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className='bg-white dark:bg-gray hover:bg-zinc-200 dark:hover:bg-darkGray text-left relative z-20'
              onClick={() => handleSuggestionClick(suggestion)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuthorsAutofill;
