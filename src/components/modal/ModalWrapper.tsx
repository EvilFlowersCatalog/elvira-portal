import { KeyboardEvent, MouseEvent, ReactNode, useEffect, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';
import Button from '../common/Button';

interface IModalWrapperParams {
  setOpen: (open: boolean) => void;
  title: string;
  children: ReactNode;
  buttonLabel: string;
  onClick: (any: any) => any;
}

const ModalWrapper = ({
  setOpen,
  title,
  children,
  buttonLabel,
  onClick,
}: IModalWrapperParams) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref) ref.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code.toLocaleLowerCase() === 'escape') {
      setOpen(false);
    }
  };
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    setOpen(false);
  };

  return (
    <div
      className='fixed z-50 top-0 left-0 bottom-0 right-0 bg-white bg-opacity-90 dark:bg-gray dark:bg-opacity-90 flex justify-center items-center'
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      tabIndex={-1}
      ref={ref}
    >
      <div
        className='flex flex-col justify-center items-start p-5 bg-lightGray dark:bg-darkGray w-[90%] h-fit min-h-96 max-h-[50%] md:max-w-[50%]  rounded-md'
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative flex w-full justify-center items-center gap-5'>
          <span className='text-xl font-bold text-STUColor uppercase'>
            {title}
          </span>
          <button
            className='absolute -top-3 -right-3 text-darkGray dark:text-white hover:text-STUColor dark:hover:text-STUColor'
            onClick={() => setOpen(false)}
          >
            <IoMdClose size={30} />
          </button>
        </div>
        <div className='py-5 overflow-auto text-center h-full w-full'>
          {children}
        </div>
        <div className='w-full flex justify-center'>
          <Button onClick={onClick}>
            <span>{buttonLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
