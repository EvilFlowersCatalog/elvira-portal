import { ChangeEvent, InvalidEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uuid } from '../../utils/func/functions';

interface IElviraTextareaParams {
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  value: string;
}
// Custom textarea used in steps in AMDIN
const ElviraTextarea = ({
  onChange,
  placeholder,
  value,
}: IElviraTextareaParams) => {
  const { t } = useTranslation();
  const [focus, setFocus] = useState<boolean>(false);
  const id = uuid();

  return (
    <div className='relative w-full h-full mt-6'>
      <span
        className={`absolute duration-200 z-10 select-none pointer-events-none ${
          focus || value
            ? '-top-6 left-0 text-sm text-STUColor'
            : 'top-2 left-2 text-md text-zinc-400'
        }`}
      >
        {placeholder}
      </span>
      <textarea
        className='w-full h-full min-h-72 p-2 rounded-md bg-white dark:bg-gray border border-white dark:border-gray outline-none focus:border-STUColor dark:focus:border-STUColor'
        value={value}
        id={id}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
    </div>
  );
};

export default ElviraTextarea;
