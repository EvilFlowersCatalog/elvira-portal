import { ChangeEvent, useRef, useState } from 'react';
import { uuid } from '../../utils/func/functions';

interface IElviraInputParams {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  invalidMessage?: string;
  required?: boolean;
  placeholder: string;
  value: string;
  backgroundTailwind?: string;
  type?: 'text' | 'password';
}
// Custom input used in step forms in ADMIN
const ElviraInput = ({
  onChange,
  invalidMessage,
  placeholder,
  required = false,
  value,
  type = 'text',
  backgroundTailwind = '',
}: IElviraInputParams) => {
  const id = uuid();
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className={`w-full text-left flex items-start`}>
      <div className='w-full flex flex-col justify-start gap-2'>
        <input
          ref={ref}
          className={`w-full p-2 border-2 border-transparent ${
            backgroundTailwind ? backgroundTailwind : 'bg-white dark:bg-gray'
          } ${
            isInvalid ? 'border-red' : ''
          } focus:border-STUColor dark:focus:border-STUColor bg-transparent outline-none rounded-md`}
          required={required}
          placeholder={`${placeholder} ${required ? '*' : ''}`}
          onChange={(e) => {
            onChange(e);
            setIsInvalid(false);
          }}
          onInvalid={(e: ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();
            ref.current?.focus();
            setIsInvalid(true);
          }}
          id={id}
          value={value}
          type={type}
        />
        {isInvalid && (
          <span className='text-red text-sm text-left'>* {invalidMessage}</span>
        )}
      </div>
    </div>
  );
};

export default ElviraInput;
