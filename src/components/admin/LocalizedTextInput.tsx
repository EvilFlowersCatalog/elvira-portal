import { useTranslation } from 'react-i18next';
import { TextInput } from './Field';
import { LocalizedText } from '../../utils/interfaces/general/general';
import { AcceptedLanguage, getLanguage } from '../../hooks/api/languages/languages';
import { CONTENT_LANGUAGES, DEFAULT_CONTENT_LANGUAGE, toLocalized } from '../../utils/func/localized';

interface LocalizedTextInputProps {
  /** Id of the first input, so a `<Field htmlFor>` label points at it. */
  id: string;
  value: LocalizedText | string;
  onChange: (value: LocalizedText) => void;
  invalid?: boolean;
}

/**
 * One input per content language (Slovak, English). Slovak comes first and is required;
 * English is optional.
 */
export default function LocalizedTextInput({ id, value, onChange, invalid }: LocalizedTextInputProps) {
  const { i18n } = useTranslation();
  const current = toLocalized(value);

  const languageName = (code: string) =>
    getLanguage(code)?.name[i18n.language as AcceptedLanguage] ?? getLanguage(code)?.name.en ?? code;

  return (
    <div className="flex flex-col gap-2">
      {CONTENT_LANGUAGES.map((code, index) => {
        const required = code === DEFAULT_CONTENT_LANGUAGE;
        return (
          <div key={code} className="flex items-center gap-2">
            <span
              className="w-10 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-700/50 py-1 text-center text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-300"
              title={languageName(code)}
              aria-hidden="true"
            >
              {code}
              {required && <span className="ml-0.5 text-redText dark:text-red">*</span>}
            </span>
            <TextInput
              id={index === 0 ? id : `${id}-${code}`}
              lang={code}
              aria-label={index === 0 ? undefined : languageName(code)}
              aria-required={required || undefined}
              value={current[code] ?? ''}
              // Only the required Slovak input is flagged; English is optional.
              invalid={invalid && required}
              onChange={(e) => onChange({ ...current, [code]: e.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}
