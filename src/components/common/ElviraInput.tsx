import { ChangeEvent, InvalidEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uuid } from '../../utils/func/functions';

interface IElviraInputParams {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInvalid?: (e: InvalidEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder: string;
  value: string;
  type?: 'text' | 'password';
}
// Custom input used in step forms in ADMIN
const ElviraInput = ({
  onChange,
  onInvalid,
  placeholder,
  required = false,
  value,
  type = 'text',
}: IElviraInputParams) => {
  const { t } = useTranslation();
  const id = uuid();
  const [focus, setFocus] = useState<boolean>(false);

  return (
    <div className='relative w-full text-left h-16 flex items-end'>
      <span
        className={`absolute left-0 duration-200 z-10 select-none pointer-events-none ${
          focus || value ? 'top-0 text-sm text-STUColor' : 'top-[30px] text-md'
        }`}
      >
        {placeholder}
      </span>
      <div className='w-full flex gap-2 items-center'>
        {required && !value && (
          <span className='absolute -left-7 bottom-2.5 flex h-3 w-3 bg-STUColor rounded-full'>
            <span className='animate-ping inline-flex h-full w-full rounded-full bg-STUColor opacity-75'></span>
          </span>
        )}
        <input
          className='w-full py-2 border-b border-b-black dark:border-b-white focus:border-b-STUColor dark:focus:border-b-STUColor bg-transparent outline-none focus:border-STUColor duration-200'
          required={required}
          onChange={onChange}
          onInvalid={onInvalid}
          id={id}
          value={value}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          type={type}
        />
      </div>
    </div>
  );
};

export default ElviraInput;
