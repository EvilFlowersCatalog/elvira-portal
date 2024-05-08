import useAppContext from '../../../hooks/contexts/useAppContext';
import SearchBar from './SearchBar';

const SearchBarContainer = () => {
  const { isSmallDevice, showSearchBar } = useAppContext();
  return isSmallDevice
    ? showSearchBar && (
        <div className='fixed flex w-full h-full bg-gray bg-opacity-50 dark:bg-opacity-80 z-50 overflow-auto'>
          <SearchBar />
        </div>
      )
    : showSearchBar && <SearchBar />;
};

export default SearchBarContainer;
