import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ElviraInput from './ElviraInput';

interface PartialDateInputProps {
  label: string;
  /** `YYYY`, `YYYY-MM`, `YYYY-MM-DD` or empty. */
  value: string;
  onChange: (value: string) => void;
}

interface Parts {
  year: string;
  month: string;
  day: string;
}

const parse = (value: string): Parts => {
  const [year = '', month = '', day = ''] = (value ?? '').split('-');
  return { year, month, day };
};

const pad = (n: string) => n.padStart(2, '0');

/**
 * Builds the most precise valid partial date from what was typed. A part that
 * is incomplete or out of range drops itself and everything after it, so the
 * year alone is always enough.
 */
const compose = ({ year, month, day }: Parts): string => {
  if (!/^\d{4}$/.test(year)) return '';
  const m = parseInt(month, 10);
  if (!(m >= 1 && m <= 12)) return year;
  const d = parseInt(day, 10);
  const daysInMonth = new Date(parseInt(year, 10), m, 0).getDate();
  if (!(d >= 1 && d <= daysInMonth)) return `${year}-${pad(month)}`;
  return `${year}-${pad(month)}-${pad(day)}`;
};

/**
 * Year / month / day as three numeric fields. Publication dates are often
 * known only to the year, which a native date picker cannot express.
 */
const PartialDateInput = ({ label, value, onChange }: PartialDateInputProps) => {
  const { t } = useTranslation();
  const [parts, setParts] = useState<Parts>(() => parse(value));
  // The last value we emitted — anything else arriving through `value` came
  // from outside (e.g. identifier autofill) and replaces what is typed.
  const emitted = useRef(value);

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setParts(parse(value));
    }
  }, [value]);

  const update = (key: keyof Parts, raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    const next = { ...parts, [key]: raw };
    setParts(next);
    const composed = compose(next);
    if (composed === emitted.current) return;
    emitted.current = composed;
    onChange(composed);
  };

  const hasYear = /^\d{4}$/.test(parts.year);
  const hasMonth = hasYear && compose(parts).length >= 7;

  return (
    <fieldset className='w-full flex flex-col gap-1'>
      <legend className='text-sm pl-1 mb-1 text-black dark:text-white'>{label}</legend>
      <div className='grid grid-cols-[2fr_1fr_1fr] gap-2'>
        <ElviraInput
          label='false'
          inputMode='numeric'
          maxLength={4}
          placeholder={t('entry.wizard.dateYear')}
          aria-label={t('entry.wizard.dateYear')}
          value={parts.year}
          onChange={(e) => update('year', e.target.value)}
        />
        <ElviraInput
          label='false'
          inputMode='numeric'
          maxLength={2}
          placeholder={t('entry.wizard.dateMonth')}
          aria-label={t('entry.wizard.dateMonth')}
          value={parts.month}
          disabled={!hasYear}
          className='disabled:opacity-50'
          onChange={(e) => update('month', e.target.value)}
        />
        <ElviraInput
          label='false'
          inputMode='numeric'
          maxLength={2}
          placeholder={t('entry.wizard.dateDay')}
          aria-label={t('entry.wizard.dateDay')}
          value={parts.day}
          disabled={!hasMonth}
          className='disabled:opacity-50'
          onChange={(e) => update('day', e.target.value)}
        />
      </div>
    </fieldset>
  );
};

export default PartialDateInput;
