import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { MdKeyboardDoubleArrowUp } from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';

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
      className="fixed p-3 flex items-center justify-center bottom-5 right-10 z-10 rounded-full bg-primary text-white dark:text-white border-none shadow-lg"
      onClick={handleScrollUp}
      aria-label={t('general.scrollUp')}
    >
      <MdKeyboardDoubleArrowUp size={30} />
    </button>
  );
};

export default ScrollUpButton;
