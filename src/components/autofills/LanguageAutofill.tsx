import { useEffect, useState } from 'react';
import { ILanguage } from '../../utils/interfaces/language';
import { useTranslation } from 'react-i18next';
import { IEntryNewForm } from '../../utils/interfaces/entry';
import ElviraInput from '../inputs/ElviraInput';
import useAppContext from '../../hooks/contexts/useAppContext';

export const languages: ILanguage[] = [
  { name: 'English', alpha3: 'eng', alpha2: 'en' },
  { name: 'Esperanto', alpha3: 'epo', alpha2: 'eo' },
  { name: 'Estonian', alpha3: 'est', alpha2: 'et' },
  { name: 'Finnish', alpha3: 'fin', alpha2: 'fi' },
  { name: 'French', alpha3: 'fre', alpha2: 'fr' },
  { name: 'Germanic languages', alpha3: 'gem', alpha2: "ge" }, /* Check if ge is valid */
  { name: 'German', alpha3: 'deu', alpha2: 'de' },
  { name: 'Georgian', alpha3: 'geo', alpha2: 'ka' },
  { name: 'Slovak', alpha3: 'slk', alpha2: 'sk' },
  { name: 'Slovenian', alpha3: 'slv', alpha2: 'sl' },
  { name: 'Czech', alpha3: 'ces', alpha2: 'cs' },
  { name: 'Hungarian', alpha3: 'hun', alpha2: 'hu' },
  { name: 'Polish', alpha3: 'pol', alpha2: 'pl' },
  { name: 'Spanish', alpha3: 'spa', alpha2: 'es' },
  { name: 'Swedish', alpha3: 'swe', alpha2: 'sv' },
  { name: 'Norwegian', alpha3: 'nor', alpha2: 'no' },
  { name: 'Serbian', alpha3: 'srp', alpha2: 'sr' },
  { name: 'Ukrainian', alpha3: 'ukr', alpha2: 'uk' },
  { name: 'Russian', alpha3: 'rus', alpha2: 'ru' },
  { name: 'Italian', alpha3: 'ita', alpha2: 'it' },
];

export type AcceptedLanguage = 'sk' | 'en';
export type TranslatedLanguage = 'sk' | 'en' | 'eo' | 'et' | 'fi' | 'fr' | 'de' | 'ka' | 'sl' | 'cs' | 'hu' | 'pl' | 'es' | 'sv' | 'no' | 'sr' | 'uk' | 'ru' | 'it' | 'ge';
type LanguageDictionary = {
  [key in AcceptedLanguage]: {
    [key in TranslatedLanguage]: string;
  };
};
const dict: LanguageDictionary = {
  'sk': {
    'sk': 'Slovenčina',
    'en': 'Angličtina',
    'eo': 'Esperanto',
    'et': 'Estónčina',
    'fi': 'Fínčina',
    'fr': 'Francúzština',
    'de': 'Nemčina',
    'ka': 'Gruzínčina',
    'sl': 'Slovinčina',
    'cs': 'Čeština',
    'hu': 'Maďarčina',
    'pl': 'Poľština',
    'es': 'Španielčina',
    'sv': 'Švédčina',
    'no': 'Nórčina',
    'sr': 'Srbčina',
    'uk': 'Ukrajinčina',
    'ru': 'Ruština',
    'it': 'Taliančina',
    'ge': 'Germánske jazyky',
  },
  'en': {
    'sk': 'Slovak',
    'en': 'English',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'fi': 'Finnish',
    'fr': 'French',
    'de': 'German',
    'ka': 'Georgian',
    'sl': 'Slovenian',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'pl': 'Polish',
    'es': 'Spanish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'sr': 'Serbian',
    'uk': 'Ukrainian',
    'ru': 'Russian',
    'it': 'Italian',
    'ge': 'Germanic languages',
  },
}

export function languagesDictionary(currentLanguage: AcceptedLanguage, languageCode: TranslatedLanguage): string {
  return dict[currentLanguage]?.[languageCode] || '-';
}

interface ILanguageAutofillParams {
  entryForm: IEntryNewForm;
  setEntryForm: (entryForm: IEntryNewForm) => void;
}
const LanguageAutofill = ({
  entryForm,
  setEntryForm,
}: ILanguageAutofillParams) => {
  const { stuBorder } = useAppContext();
  const { i18n, t } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ILanguage[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const getTranslatedName = (language: ILanguage) =>
    languagesDictionary(i18n.language as AcceptedLanguage, language.alpha2 as TranslatedLanguage) ||
    language.name;

  useEffect(() => {
    if (entryForm.language_code) {
      const lang = languages.find(
        (l) =>
          l.alpha2 === entryForm.language_code ||
          l.alpha3 === entryForm.language_code
      );
      if (lang) setInputValue(getTranslatedName(lang));
      else setInputValue('');
    }
  }, [entryForm, i18n.language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const filteredSuggestions = languages.filter((language) =>
      getTranslatedName(language).toLowerCase().startsWith(value.toLowerCase())
    );

    setSuggestions(filteredSuggestions);
  };

  const handleSuggestionClick = (language: ILanguage) => {
    setInputValue(getTranslatedName(language));
    setEntryForm({
      ...entryForm,
      language_code: language.alpha3 ?? language.alpha2,
    });
    setIsHovering(false);
    setSuggestions([]);
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        className={`bg-white dark:bg-gray ${suggestions.length > 0 ? 'rounded-b-none' : ''
          }`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={t('entry.wizard.lang')}
        required
        invalidMessage={t('entry.wizard.requiredMessages.lang')}
        onFocus={() => {
          const filteredSuggestions = languages.filter(
            (language) =>
              getTranslatedName(language)
                .toLowerCase()
                .startsWith(inputValue.toLowerCase()) &&
              getTranslatedName(language) !== inputValue
          );
          setSuggestions(filteredSuggestions);
        }}
        onBlur={() => {
          const matchedLang = languages.find(
            (language) =>
              getTranslatedName(language).toLowerCase() ===
              inputValue.toLowerCase()
          );
          if (matchedLang) {
            setInputValue(getTranslatedName(matchedLang));
            handleSuggestionClick(matchedLang);
          } else {
            setInputValue('');
          }
          if (!isHovering) setSuggestions([]);
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className={`absolute top-[60px] border-2 rounded-md rounded-t-none ${stuBorder} list-none max-h-40 overflow-y-scroll bg-white dark:bg-gray z-20 w-full`}
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
              {getTranslatedName(language)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageAutofill;
