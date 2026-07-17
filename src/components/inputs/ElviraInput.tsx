import {
  ChangeEvent,
  FocusEvent,
  forwardRef,
  InputHTMLAttributes,
  useState,
} from 'react';
import { uuid } from '../../utils/func/functions';
import useAppContext from '../../hooks/contexts/useAppContext';
import { twMerge } from 'tailwind-merge';

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalidMessage?: string;
  paddingLeft?: number;
  nativePlaceholder?: string;
}
// Custom input used in step forms in ADMIN
const ElviraInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ invalidMessage, paddingLeft = 7, nativePlaceholder, ...props }, ref) => {
    const id = uuid();
    const [isInvalid, setIsInvalid] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const { onChange, onFocus, onBlur, value, required, placeholder, className } = props;
    const hasValue = value !== undefined && value !== null && value !== '';
    const useNativePlaceholder = !!nativePlaceholder;

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
          {!useNativePlaceholder && (
            <span
              className={`absolute font-light
                  ${isFocused || hasValue
                    ? `top-0 text-[12px] ${isInvalid ? 'text-redText' : 'text-primaryText dark:text-primaryLight'}`
                    : `top-1/2 -translate-y-[1px]`}
                  duration-200 pointer-events-none select-none`}
                  style={{ paddingLeft: isFocused || hasValue ? 0 : `${paddingLeft}px` }}
            >
              {`${placeholder} ${required ? '*' : ''}`}
            </span>
          )}
          <input
            ref={ref}
            {...props}
            className={twMerge(`w-full p-2 border-none
              ${hasValue
                ? 'border-primary'
                : isInvalid
                  ? 'border-red dark:border-red'
                  : 'focus:border-primary border-black dark:border-white'
              }
              bg-white shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A] dark:bg-strongDarkGray outline-none rounded-md`, className)}
            style={{ paddingLeft: `${paddingLeft}px` }}
            required={required}
            placeholder={nativePlaceholder ?? ''}
            onChange={handleChange}
            onInvalid={handleInvalid}
            onFocus={handleFocus}
            onBlur={handleBlur}
            id={id}
            aria-label={
              (props['aria-label'] as string) ??
              (typeof placeholder === 'string' && placeholder ? placeholder : undefined)
            }
            aria-invalid={isInvalid || undefined}
          />
        </div>
        {isInvalid && (
          <span role="alert" className='text-redText text-sm text-left'>* {invalidMessage}</span>
        )}
      </div>
    );
  }
);

export default ElviraInput;
