import { ChangeEvent, FocusEvent, forwardRef, InputHTMLAttributes, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import useAppContext from '../../hooks/contexts/useAppContext';
import ElviraInput from './ElviraInput';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalidMessage?: string;
  paddingLeft?: number;
  step?: number;
}

const ElviraNumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ step = 1, value = '', onChange, ...props }, ref) => {
    const { stuText, stuBorderFocus, stuBorder } = useAppContext();
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.value == "" || /^\d*$/.test(e.target.value)) {
        onChange?.(e);
      }
    };

    const adjustValue = (delta: number) => {
      const current = value ? parseInt(value.toString()) : 0;
      const newValue = Math.max(0, current + delta).toString();
      onChange?.({
        target: { value: newValue }
      } as ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className="relative w-full">
        <ElviraInput
          ref={ref}
          {...props}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onFocus={(e: FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e: FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={twMerge('pr-8', props.className)}
        />
        <div className="absolute right-2 top-[43px] transform -translate-y-1/2 flex flex-col gap-0.5">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => adjustValue(step)}
            className="w-4 h-4 flex items-center justify-center text-xs hover:text-primary"
          >
            <BiChevronUp size={16} className={twMerge(isFocused ? stuText : 'text-gray-500')} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => adjustValue(-step)}
            className="w-4 h-4 flex items-center justify-center text-xs hover:text-primary"
          >
            <BiChevronDown size={16} className={twMerge(isFocused ? stuText : 'text-gray-500')} />
          </button>
        </div>
      </div>
    );
  }
);

export default ElviraNumberInput;