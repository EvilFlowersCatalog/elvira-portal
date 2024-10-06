import { KeyboardEvent, MouseEvent, ReactNode, useEffect, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';
import Button from '../buttons/Button';
import { IModalParams } from '../../utils/interfaces/general/general';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IModalWrapperParams extends IModalParams {
  title: string;
  children: ReactNode;
  buttonLabel: string;
}

const ModalWrapper = ({
  close,
  title,
  children,
  buttonLabel,
  yes,
}: IModalWrapperParams) => {
  const { stuText, umamiTrack } = useAppContext();

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref) ref.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code.toLocaleLowerCase() === 'escape') {
      close(false);
    }
  };
  const handleClick = () => {
    umamiTrack('Close Modal Button');
    close(false);
  };

  return (
    <div
      className='fixed z-50 top-0 left-0 bottom-0 right-0 bg-white bg-opacity-90 dark:bg-gray dark:bg-opacity-90 flex justify-center items-center'
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      tabIndex={-1}
      ref={ref}
    >
      <div className='w-full h-full p-4 overflow-auto flex justify-start sm:justify-center items-center'>
        <div
          className='flex flex-col justify-start p-5 bg-zinc-100 dark:bg-darkGray min-w-64 md:min-w-[400px] h-fit w-fit lg:max-w-[40%] lg:min-w-[600px] rounded-md'
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='relative flex w-full justify-center items-center gap-5'>
            <span
              className={`text-xl font-bold ${stuText} uppercase text-center`}
            >
              {title}
            </span>
            <button className='absolute -top-3 -right-3' onClick={handleClick}>
              <IoMdClose size={30} />
            </button>
          </div>
          <div className='py-5 text-center justify-center items-center flex flex-1 flex-col'>
            {children}
          </div>
          <div className='flex justify-center'>
            <Button onClick={yes} title={buttonLabel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
