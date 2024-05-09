import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { MdKeyboardDoubleArrowUp } from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IScrollUpButtonParams {
  scrollRef: RefObject<HTMLDivElement | null>;
}

const ScrollUpButton = ({ scrollRef }: IScrollUpButtonParams) => {
  const { isSmallDevice, showSearchBar } = useAppContext();
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
      className={`fixed flex items-center gap-2 bottom-20 ${
        !isSmallDevice && showSearchBar ? 'right-[270px]' : 'right-5'
      } z-10 p-2 text-xl rounded-md bg-darkGray dark:bg-white text-STUColor`}
      onClick={handleScrollUp}
    >
      <MdKeyboardDoubleArrowUp size={30} />
      {t('general.scrollUp')}
    </button>
  );
};

export default ScrollUpButton;
