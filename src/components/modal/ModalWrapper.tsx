import { KeyboardEvent, MouseEvent, ReactNode, useEffect, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';
import Button from '../buttons/Button';
import { IModalParams } from '../../utils/interfaces/general/general';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      className='fixed z-50 top-0 left-0 bottom-0 right-0 bg-white bg-opacity-90 dark:bg-gray dark:bg-opacity-90'
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      tabIndex={-1}
      ref={ref}
    >
      <div className='w-full h-full p-4 overflow-auto flex items-center justify-center'>
        <div
          className='relative flex flex-col w-full max-w-[90%] sm:max-w-[500px] lg:max-w-[700px] bg-lightGray dark:bg-darkGray rounded-xl shadow-xl border border-zinc-300 dark:border-zinc-700 p-6'
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex w-full justify-center items-center gap-5'>
            <span
              className={`text-xl text-primary dark:text-primaryLight font-bold ${stuText} uppercase text-center`}
            >
              {title}
            </span>
          </div>
          <div className='py-5 text-center justify-center items-center flex flex-1 flex-col'>
            {children}
          </div>
          <div className='flex justify-end items-center gap-4'>
            {yes && <Button onClick={yes} >{buttonLabel}</Button>}
            <button
              className='hover:underline text-red font-bold py-2'
              onClick={handleClick}
            >
              {t('modal.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
