import { ButtonHTMLAttributes, forwardRef } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';

interface CustomInputProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

/**
 * Returns button
 * @param {IButton}
 * @returns custom button used in global merite
 */
const Button = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ title, className, ...props }, ref) => {
    const { stuBorder, stuBgHover } = useAppContext();

    return (
      <button
        ref={ref}
        {...props}
        className={`px-8 border-2 ${stuBorder} text-[17px] font-semibold rounded-md w-fit h-fit ${stuBgHover} hover:bg-opacity-50 dark:hover:bg-opacity-50 duration-100 ${
          className ? className : 'py-2'
        }`}
      >
        {title}
      </button>
    );
  }
);

export default Button;
