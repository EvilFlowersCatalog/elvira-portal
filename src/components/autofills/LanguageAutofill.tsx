import { useEffect, useState } from 'react';
import { ILanguage } from '../../utils/interfaces/language';
import { useTranslation } from 'react-i18next';
import ElviraInput from '../inputs/ElviraInput';
import useAppContext from '../../hooks/contexts/useAppContext';
import { AcceptedLanguage, getLanguage, getLanguages } from '../../hooks/api/languages/languages';

function removeDiacritics(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface ILanguageAutofillParams {
  languageCode: string;
  setLanguageCode: (languageCode: string) => void;
  setIsSelectionOpen: (isOpen: boolean) => void;
  defaultLanguageCode?: string;
  isRequired: boolean;
}
const LanguageAutofill = ({
  languageCode,
  setLanguageCode,
  setIsSelectionOpen,
  defaultLanguageCode,
  isRequired
}: ILanguageAutofillParams) => {
  const { stuBorder } = useAppContext();
  const { i18n, t } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ILanguage[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [languages, setLanguages] = useState<ILanguage[]>([]);

  useEffect(() => {
    if (defaultLanguageCode) {
      const lang = getLanguage(defaultLanguageCode)
      if (!lang) return;
      setInputValue(lang.name.en);
    }
  }, [defaultLanguageCode])

  useEffect(()=>{
    setLanguages(getLanguages(i18n.language as AcceptedLanguage));
  }, [i18n.language]);

  useEffect(() => {
    if (languageCode) {
      const lang = getLanguage(languageCode);
      if (lang) setInputValue(lang.name[i18n.language as AcceptedLanguage]);
      else setInputValue('');
    }
  }, [languageCode, i18n.language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const filteredSuggestions = languages.filter((language) =>
      removeDiacritics(language.name.toLowerCase()).startsWith(removeDiacritics(value.toLowerCase()))
    );

    setSuggestions(filteredSuggestions);
    const matchedLang = languages.find(
      (language) =>
        removeDiacritics(language.name.toLowerCase()) === removeDiacritics(value.toLowerCase())
    );
    if (matchedLang) {
      setLanguageCode(matchedLang.alpha2 ?? matchedLang.alpha3 ?? '');
    } else {
      setLanguageCode('');
    }
  };

  const handleSuggestionClick = (language: ILanguage) => {
    setInputValue(language.name);
    setLanguageCode(language.alpha2 ?? language.alpha3 ?? '');
    setIsHovering(false);
    setSuggestions([]);
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        className={`bg-white ${suggestions.length > 0 ? 'rounded-b-none' : ''}`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={t('entry.wizard.lang')}
        required={isRequired}
        invalidMessage={t('entry.wizard.requiredMessages.lang')}
        onFocus={() => {
          const filteredSuggestions = languages.filter(
            (language) =>
              removeDiacritics(language.name
                .toLowerCase())
                .startsWith(removeDiacritics(inputValue.toLowerCase()))
              && removeDiacritics(language.name) !== removeDiacritics(inputValue)
          );
          setSuggestions(filteredSuggestions);
          setIsSelectionOpen(true);
        }}
        onBlur={() => {
          const matchedLang = languages.find(
            (language) =>
              removeDiacritics(language.name.toLowerCase()) === removeDiacritics(inputValue.toLowerCase())
          );
          if (matchedLang) {
            setInputValue(matchedLang.name);
            handleSuggestionClick(matchedLang);
          } else {
            setInputValue('');
          }
          if (!isHovering) {
            setSuggestions([]);
            setIsSelectionOpen(false);
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className={`absolute top-[60px] rounded-md list-none max-h-40 overflow-y-scroll bg-white dark:bg-gray z-20 w-full`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {suggestions.map((language, index) => (
            <li
              key={index}
              className='bg-white dark:bg-gray hover:bg-zinc-200 dark:hover:bg-darkGray'
              onClick={() => handleSuggestionClick(language)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {language.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageAutofill;