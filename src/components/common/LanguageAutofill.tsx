import { useEffect, useState } from 'react';
import { ILanguage } from '../../utils/interfaces/language';
import { useTranslation } from 'react-i18next';
import { IEntryNewForm } from '../../utils/interfaces/entry';
import ElviraInput from './ElviraInput';
import useCustomEffect from '../../hooks/useCustomEffect';

export const languages: ILanguage[] = [
  { name: 'Egyptian (Ancient)', alpha2: 'egy' },
  { name: 'Ekajuk', alpha2: 'eka' },
  { name: 'Elamite', alpha2: 'elx' },
  { name: 'English', alpha2: 'eng', alpha3: 'en' },
  { name: 'English, Middle (1100-1500)', alpha2: 'enm' },
  { name: 'Esperanto', alpha2: 'epo', alpha3: 'eo' },
  { name: 'Estonian', alpha2: 'est', alpha3: 'et' },
  { name: 'Ewe', alpha2: 'ewe', alpha3: 'ee' },
  { name: 'Ewondo', alpha2: 'ewo' },
  { name: 'Fang', alpha2: 'fan' },
  { name: 'Faroese', alpha2: 'fao', alpha3: 'fo' },
  { name: 'Fanti', alpha2: 'fat' },
  { name: 'Fijian', alpha2: 'fij', alpha3: 'fj' },
  { name: 'Filipino; Pilipino', alpha2: 'fil' },
  { name: 'Finnish', alpha2: 'fin', alpha3: 'fi' },
  { name: 'Finno-Ugrian languages', alpha2: 'fiu' },
  { name: 'Fon', alpha2: 'fon' },
  { name: 'French', alpha2: 'fre', alpha3: 'fr' },
  { name: 'French, Middle (ca.1400-1600)', alpha2: 'frm' },
  { name: 'French, Old (842-ca.1400)', alpha2: 'fro' },
  { name: 'Northern Frisian', alpha2: 'frr' },
  { name: 'Eastern Frisian', alpha2: 'frs' },
  { name: 'Western Frisian', alpha2: 'fry', alpha3: 'fy' },
  { name: 'Fulah', alpha2: 'ful', alpha3: 'ff' },
  { name: 'Friulian', alpha2: 'fur' },
  { name: 'Germanic languages', alpha2: 'gem' },
  { name: 'German', alpha2: 'deu', alpha3: 'de' },
  { name: 'Georgian', alpha2: 'geo', alpha3: 'ka' },
  { name: 'Slovak', alpha2: 'slk', alpha3: 'sk' },
  { name: 'Czech', alpha2: 'ces', alpha3: 'cs' },
  { name: 'Hungarian', alpha2: 'hun', alpha3: 'hu' },
  { name: 'Polish', alpha2: 'pol', alpha3: 'pl' },
];

interface ILanguageAutofillParams {
  entryForm: IEntryNewForm;
  setEntryForm: (entryForm: IEntryNewForm) => void;
}

const LanguageAutofill = ({
  entryForm,
  setEntryForm,
}: ILanguageAutofillParams) => {
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ILanguage[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  useCustomEffect(() => {
    if (entryForm.language_code) {
      const lang = languages.filter(
        (l) =>
          l.alpha2 === entryForm.language_code ||
          l.alpha3 === entryForm.language_code
      );
      if (lang.length > 0) setInputValue(lang[0].name);
      else setInputValue('');
    }
  }, [entryForm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Filter languages based on input
    const filteredSuggestions = languages.filter((language) =>
      language.name.toLowerCase().startsWith(value.toLowerCase())
    );

    setSuggestions(value === '' ? [] : filteredSuggestions);
  };

  const handleSuggestionClick = (language: ILanguage) => {
    setInputValue(language.name);
    setEntryForm({
      ...entryForm,
      language_code: language.alpha3 ?? language.alpha2,
    });
    setIsHovering(false);
    setSuggestions([]); // Hide suggestions after selection
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        backgroundTailwind={`bg-white dark:bg-gray ${
          suggestions.length > 0 ? 'rounded-b-none' : ''
        }`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={t('entry.wizard.lang')}
        required
        invalidMessage={t('entry.wizard.requiredMessages.lang')}
        onBlur={() => {
          const lang = languages.filter(
            (lang) =>
              lang.name.toLocaleLowerCase() === inputValue.toLocaleLowerCase()
          );
          if (lang.length === 0) {
            setInputValue('');
          } else {
            setInputValue(lang[0].name);
            handleSuggestionClick(lang[0]);
          }
          // if we click outside out input no on suggestions
          if (!isHovering) setSuggestions([]);
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className='absolute top-10 border-2 rounded-md rounded-t-none border-STUColor list-none max-h-40 overflow-y-scroll bg-white dark:bg-gray z-20 w-full'
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
