import { useTranslation } from 'react-i18next';
import { MdFilterList, MdFilterListOff, } from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useEffect, useState } from 'react';


const OpenFiltersButton = () => {
    const { t } = useTranslation();
    const { showAdvancedSearch, setShowAdvancedSearch } = useAppContext();

    const [showButton, setShowButton] = useState(false);

    const openFilters = () => {
        setShowAdvancedSearch(!showAdvancedSearch);
    };

    useEffect(() => {
        var outlet = document.getElementById('outlet-wrapper')?.childNodes[0] as HTMLElement;
        const handleScroll = () => { setShowButton(outlet.scrollTop > 150); };
        outlet.addEventListener('scroll', handleScroll);
        return () => outlet.removeEventListener('scroll', handleScroll);
    }, [setShowAdvancedSearch])

    if (!showButton) return null;

    return (
        <button
            className="fixed p-3 flex items-center justify-center bottom-5 right-10 z-10 rounded-full bg-primary text-white dark:text-white border-none shadow-lg"
            onClick={openFilters}
            aria-label={t('general.scrollUp')}
        >
            {showAdvancedSearch ? (<MdFilterListOff size={30} />) : (<MdFilterList size={30} />)}
        </button>
    );
};

export default OpenFiltersButton;
