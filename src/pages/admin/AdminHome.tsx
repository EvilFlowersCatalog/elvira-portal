import { MouseEvent } from 'react';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import Breadcrumb from '../../components/common/Breadcrumb';

const AdminHome = () => {
  const { specialNavigation } = useAppContext();
  const { t } = useTranslation();

  interface IAdminParams {
    text: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  }
  const AdminButton = ({ text, onClick }: IAdminParams) => {
    return (
      <div className='flex w-full p-2 md:w-1/3 lg:w-1/3 xl:w-1/5 xxl:w-1/6'>
        <button
          onClick={onClick}
          className='py-5 font-bold bg-zinc-200 dark:bg-darkGray text-black dark:text-white hover:text-white dark:hover:bg-STUColor hover:bg-STUColor rounded-md w-full h-full'
        >
          {text}
        </button>
      </div>
    );
  };

  return (
    <div className='flex-1'>
      <Breadcrumb />
      <div className='flex flex-wrap px-2'>
        <AdminButton
          text={t('administration.homePage.entries')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminEntries)
          }
        />
        <AdminButton
          text={t('administration.homePage.feeds')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminFeeds)
          }
        />
      </div>
    </div>
  );
};

export default AdminHome;
