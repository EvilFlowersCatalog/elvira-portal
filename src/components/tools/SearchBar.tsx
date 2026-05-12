import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoSearchOutline } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import ElviraInput from '../inputs/ElviraInput';
import AiAssistant from '../dialogs/AiAssistant';
import SearchSuggestions from './SearchSuggestions';
import useAppContext from '../../hooks/contexts/useAppContext';

interface ISearchBar {
  param: string;
  aiEnabled?: boolean;
  enableSuggestions?: boolean;
  shouldRedirectSuggestions?: boolean;
}

const SearchBar = ({
  param,
  aiEnabled = true,
  enableSuggestions = true,
  shouldRedirectSuggestions = false,
}: ISearchBar) => {
  const { t } = useTranslation();
  const { setShowAiAssistant } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    setInput(searchParams.get('query') || '');
  }, [searchParams]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input) searchParams.set(param, input);
    else searchParams.delete(param);
    setSearchParams(searchParams);
  };

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <form
      className="relative flex flex-col flex-1 items-center gap-2 text-darkGray dark:text-white"
      onSubmit={submit}
    >
      <ElviraInput
        type="text"
        value={input}
        placeholder={t('tools.search')}
        onChange={handleSearchInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        className={`border-none ${aiEnabled ? 'md:pr-32' : 'pr-10'}`}
        paddingLeft={40}
      />

      <button type="submit" className="absolute left-2 top-[31px]">
        <IoSearchOutline size={25} />
      </button>

      {enableSuggestions && isFocused && (
        <SearchSuggestions
          searchQuery={input}
          onClose={() => setIsFocused(false)}
          shouldRedirect={shouldRedirectSuggestions}
        />
      )}

      {aiEnabled && (
        <>
          <button
            onClick={() => setShowAiAssistant(true)}
            className="absolute md:right-4 md:bottom-2 size-fit flex items-center gap-2 text-xs text-primary bg-primaryLight rounded-md px-2 py-1 max-md:relative max-md:w-full max-md:flex max-md:justify-center max-md:p-3"
          >
            <svg className="w-4" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16.5 8.58333C16.5029 9.68322 16.2459 10.7682 15.75 11.75C15.162 12.9264 14.2581 13.916 13.1395 14.6077C12.021 15.2995 10.7319 15.6662 9.41667 15.6667C8.31678 15.6695 7.23176 15.4126 6.25 14.9167L1.5 16.5L3.08333 11.75C2.58744 10.7682 2.33047 9.68322 2.33333 8.58333C2.33384 7.26812 2.70051 5.97904 3.39227 4.86045C4.08402 3.74187 5.07355 2.83797 6.25 2.24999C7.23176 1.7541 8.31678 1.49713 9.41667 1.49999H9.83333C11.5703 1.59582 13.2109 2.32896 14.441 3.55904C15.671 4.78912 16.4042 6.4297 16.5 8.16666V8.58333Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="whitespace-nowrap">{t('assistant.title')}</p>
          </button>
          <AiAssistant />
        </>
      )}
    </form>
  );
};

export default SearchBar;
