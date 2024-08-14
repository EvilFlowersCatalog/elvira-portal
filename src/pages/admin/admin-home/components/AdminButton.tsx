import { ReactElement, MouseEvent } from 'react';

interface IAdminParams {
  text: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  icon: ReactElement;
}

const AdminButton = ({ text, onClick, icon }: IAdminParams) => {
  return (
    <div className='flex w-full p-2 md:w-1/3 lg:w-1/3 xl:w-1/5 xxl:w-1/6'>
      <button
        onClick={onClick}
        className='flex items-center gap-4 justify-center py-5 font-bold bg-zinc-200 dark:bg-darkGray hover:text-white dark:hover:bg-STUColor hover:bg-STUColor rounded-md w-full h-full'
      >
        {text}
        {icon}
      </button>
    </div>
  );
};

export default AdminButton;
