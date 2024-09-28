import { ReactElement, ButtonHTMLAttributes, forwardRef } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';

interface CustomInputProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  icon: ReactElement;
}

const AdminButton = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ text, icon, ...props }, ref) => {
    const { stuBgHover } = useAppContext();

    return (
      <div className='flex w-full p-2 md:w-1/3 lg:w-1/3 xl:w-1/5 xxl:w-1/6'>
        <button
          ref={ref}
          {...props}
          className={`flex items-center gap-4 justify-center py-5 font-bold bg-zinc-200 dark:bg-darkGray hover:text-white ${stuBgHover} rounded-md w-full h-full`}
        >
          {text}
          {icon}
        </button>
      </div>
    );
  }
);

export default AdminButton;
