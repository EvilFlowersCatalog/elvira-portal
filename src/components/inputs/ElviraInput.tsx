import {
  ChangeEvent,
  FocusEvent,
  forwardRef,
  InputHTMLAttributes,
  useState,
} from 'react';
import { uuid } from '../../utils/func/functions';
import useAppContext from '../../hooks/contexts/useAppContext';

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalidMessage?: string;
}
// Custom input used in step forms in ADMIN
const ElviraInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ invalidMessage, ...props }, ref) => {
    const { stuText, stuBorderFocus, stuBorder } = useAppContext();

    const id = uuid();
    const [isInvalid, setIsInvalid] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const { onChange, onFocus, onBlur, value, required, placeholder } = props;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity('');

      onChange && onChange(e);
      setIsInvalid(false);
    };
    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      e.target.setCustomValidity('');

      onFocus && onFocus(e);
      setIsInvalid(false);
      setIsFocused(true);
    };
    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      onBlur && onBlur(e);
      setIsFocused(false);
    };
    const handleInvalid = (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setIsInvalid(true);
    };

    return (
      <div className={`w-full text-left flex flex-col items-start`}>
        <div className='relative w-full h-16 flex flex-col justify-end gap-2'>
          <span
            className={`absolute ${
              isFocused || value
                ? `left-0 top-0 text-[12px] ${
                    isInvalid ? 'text-red' : `${stuText}`
                  }`
                : 'left-3 top-[30px]'
            } duration-200 pointer-events-none select-none`}
          >
            {`${placeholder} ${required ? '*' : ''}`}
          </span>

          <input
            ref={ref}
            {...props}
            className={`w-full p-2 border-2
              ${
                value
                  ? `${stuBorder}`
                  : isInvalid
                  ? 'border-red dark:border-red'
                  : `${stuBorderFocus} border-black dark:border-white`
              }
              bg-transparent outline-none rounded-md`}
            required={required}
            placeholder=''
            onChange={handleChange}
            onInvalid={handleInvalid}
            onFocus={handleFocus}
            onBlur={handleBlur}
            id={id}
          />
        </div>
        {isInvalid && (
          <span className='text-red text-sm text-left'>* {invalidMessage}</span>
        )}
      </div>
    );
  }
);

export default ElviraInput;
