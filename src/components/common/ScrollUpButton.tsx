import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { MdKeyboardDoubleArrowUp } from 'react-icons/md';

interface IScrollUpButtonParams {
  scrollRef: RefObject<HTMLDivElement | null>;
}

const ScrollUpButton = ({ scrollRef }: IScrollUpButtonParams) => {
  const { t } = useTranslation();

  const handleScrollUp = () => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth', // Smooth scrolling
      });
  };

  return (
    <button
      className='fixed flex items-center gap-2 bottom-20 right-0 z-10 p-2 text-xl rounded-l-md bg-darkGray dark:bg-white text-STUColor'
      onClick={handleScrollUp}
    >
      <MdKeyboardDoubleArrowUp size={30} />
      {t('general.scrollUp')}
    </button>
  );
};

export default ScrollUpButton;
