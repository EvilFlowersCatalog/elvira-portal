import { useEffect, useState } from 'react';
import { ILanguage } from '../../utils/interfaces/language';
import { useTranslation } from 'react-i18next';
import { IEntryNewForm } from '../../utils/interfaces/entry';
import ElviraInput from '../inputs/ElviraInput';
import useAppContext from '../../hooks/contexts/useAppContext';
import useGetLanguages from '../../hooks/api/languages/useGetLanguages';

export type AcceptedLanguage = 'sk' | 'en';
/* /api/v1/languages returns 184 languages, which aren't translated */
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
  return dict[currentLanguage]?.[languageCode];
}

function removeDiacritics(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface ILanguageAutofillParams {
  entryForm: any;
  setEntryForm: (entryForm: any) => void;
  setIsSelectionOpen: (isOpen: boolean) => void;
  defaultLanguageId?: string;
  isRequired: boolean;
}
const LanguageAutofill = ({
  entryForm,
  setEntryForm,
  setIsSelectionOpen,
  defaultLanguageId,
  isRequired 
}: ILanguageAutofillParams) => {
  const { stuBorder } = useAppContext();
  const { i18n, t } = useTranslation();
  const getLanguages = useGetLanguages();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ILanguage[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [languages, setLanguages] = useState<ILanguage[]>([]);

  const getTranslatedName = (language: ILanguage) =>
    languagesDictionary(i18n.language as AcceptedLanguage, language.alpha2 as TranslatedLanguage) ||
    language.name;

  useEffect(() => {
    (async () => {
      var response: ILanguage[] = await getLanguages();
      setLanguages(response);
    })()
  }, []);

  useEffect(() => {
    if (defaultLanguageId && languages.length > 0) {
      const lang = languages.find(l => l.id == defaultLanguageId);
      if (!lang) return;
      setInputValue(getTranslatedName(lang as ILanguage));
    }
  }, [defaultLanguageId, languages])

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
  }, [languages, entryForm, i18n.language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const filteredSuggestions = languages.filter((language) =>
      removeDiacritics(getTranslatedName(language).toLowerCase()).startsWith(removeDiacritics(value.toLowerCase()))
    );

    setSuggestions(filteredSuggestions);
    const matchedLang = languages.find(
      (language) =>
      removeDiacritics(getTranslatedName(language).toLowerCase()) === removeDiacritics(value.toLowerCase())
    );
    if (matchedLang) {
      setEntryForm({
      ...entryForm,
      language_code: matchedLang.alpha3 ?? matchedLang.alpha2,
      language_id: matchedLang.id,
      });
    } else {
      setEntryForm({
      ...entryForm,
      language_code: '',
      language_id: '',
      });
    }
  };

  const handleSuggestionClick = (language: ILanguage) => {
    setInputValue(getTranslatedName(language));
    setEntryForm({
      ...entryForm,
      language_code: language.alpha3 ?? language.alpha2,
      language_id: language.id,
    });
    setIsHovering(false);
    setSuggestions([]);
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        className={`bg-white ${suggestions.length > 0 ? 'rounded-b-none' : ''
          }`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={t('entry.wizard.lang')}
        required={isRequired}
        invalidMessage={t('entry.wizard.requiredMessages.lang')}
        onFocus={() => {
          const filteredSuggestions = languages.filter(
            (language) =>
              removeDiacritics(getTranslatedName(language)
                .toLowerCase())
                .startsWith(removeDiacritics(inputValue.toLowerCase()))
              && removeDiacritics(getTranslatedName(language)) !== removeDiacritics(inputValue)
          );
          setSuggestions(filteredSuggestions);
          setIsSelectionOpen(true);
        }}
        onBlur={() => {
          const matchedLang = languages.find(
            (language) =>
              removeDiacritics(getTranslatedName(language).toLowerCase()) === removeDiacritics(inputValue.toLowerCase())
          );
          if (matchedLang) {
            setInputValue(getTranslatedName(matchedLang));
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
              {getTranslatedName(language)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageAutofill;