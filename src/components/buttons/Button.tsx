import { ButtonHTMLAttributes, forwardRef } from 'react';

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
    return (
      <button
        ref={ref}
        {...props}
        className={`px-8 border-2 border-STUColor text-[17px] font-semibold rounded-md w-fit h-fit hover:bg-STUColor hover:bg-opacity-30 duration-100 ${
          className ? className : 'py-2'
        }`}
      >
        {title}
      </button>
    );
  }
);

export default Button;
