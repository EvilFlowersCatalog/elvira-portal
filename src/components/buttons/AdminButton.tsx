import { ReactElement, ButtonHTMLAttributes, forwardRef } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';

interface CustomInputProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  text: string;
  icon: ReactElement;
}
const AdminButton = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({title, text, icon, ...props }, ref) => {
    return (
      <div className="w-full p-2">
        <button
          ref={ref}
          {...props}
          className={`
            group w-full h-full rounded-xl bg-white dark:bg-gray shadow-md 
            hover:shadow-lg transition-all duration-200 p-6 text-left
            border border-zinc-300 dark:border-zinc-700 hover:border-transparent
            hover:bg-primary hover:text-white dark:hover:bg-primary-dark
            flex flex-col justify-between gap-4
          `}
        >
          <div className="text-3xl text-primary dark:text-primary-dark group-hover:text-white">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold group-hover:text-white">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-200">
              {text}
            </p>
          </div>
        </button>
      </div>
    );
  }
);

export default AdminButton;
