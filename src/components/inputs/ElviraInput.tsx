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
import PopupInfo from '../common/PopupInfo';

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalidMessage?: string;
  paddingLeft?: number;
  nativePlaceholder?: string;
  /**
   * 'animated' (default): the placeholder floats up into a label on focus/value.
   * 'false': `placeholder` renders as a static, non-animating label and the
   *   wrapper hugs the input's height instead of reserving room for the
   *   animation, so the input lines up with sibling elements (e.g. a submit
   *   button) at their natural height.
   * 'icon': same static behaviour as 'false', plus `icon` rendered on the left
   *   as a PopupInfo trigger (tooltip content via `tooltip`/`tooltipLabel`)
   *   instead of the animated label.
   */
  label?: 'animated' | 'false' | 'icon';
  /** Icon shown by the `label="icon"` PopupInfo trigger, e.g. `<FiHelpCircle size={16} />`. */
  icon?: React.ReactNode;
  /** Tooltip content shown when the `label="icon"` icon is hovered/clicked. */
  tooltip?: React.ReactNode;
  /** aria-label for the `label="icon"` tooltip trigger. */
  tooltipLabel?: string;
}
// Custom input used in step forms in ADMIN
const ElviraInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ invalidMessage, paddingLeft, nativePlaceholder, label = 'animated', icon, tooltip, tooltipLabel, ...props }, ref) => {
    const id = uuid();
    const [isInvalid, setIsInvalid] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const { onChange, onFocus, onBlur, value, required, placeholder, className } = props;
    const hasValue = value !== undefined && value !== null && value !== '';
    const isAnimated = label === 'animated';
    const showIcon = label === 'icon' && !!icon;
    const useNativePlaceholder = !!nativePlaceholder || !isAnimated;
    const resolvedPaddingLeft = paddingLeft ?? (showIcon ? 34 : 7);

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
        <div className={`relative w-full flex flex-col justify-end gap-2 ${isAnimated ? 'h-16' : 'h-fit'}`}>
          {!useNativePlaceholder && (
            <span
              className={`absolute font-light
                  ${isFocused || hasValue
                    ? `top-0 text-[12px] ${isInvalid ? 'text-redText' : 'text-primaryText dark:text-primaryLight'}`
                    : `top-1/2 -translate-y-[1px]`}
                  duration-200 pointer-events-none select-none`}
                  style={{ paddingLeft: isFocused || hasValue ? 0 : `${resolvedPaddingLeft}px` }}
            >
              {`${placeholder} ${required ? '*' : ''}`}
            </span>
          )}
          {showIcon && (
            <div className='absolute left-2 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center'>
              <PopupInfo icon={icon} label={tooltipLabel}>
                {tooltip}
              </PopupInfo>
            </div>
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
            style={{ paddingLeft: `${resolvedPaddingLeft}px` }}
            required={required}
            placeholder={nativePlaceholder ?? (!isAnimated ? placeholder : '')}
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
