import { ButtonHTMLAttributes, forwardRef } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';
import { twMerge } from 'tailwind-merge';

interface CustomInputProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  
}

/**
 * Returns button
 * @param {IButton}
 * @returns custom button used in global merite
 */
const Button = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ children, className, ...props }, ref) => {
    const { stuBorder, stuBgHover } = useAppContext();

    return (
      <button
        ref={ref}
        {...props}
        className={twMerge(
          `px-4 py-2 border-none ${stuBorder} ${stuBgHover} font-normal bg-primary text-white text-[14px] rounded-md w-fit h-fit duration-100`,
          className
        )}
      >
        {children}
      </button>
    );
  }
);

export default Button;
