import { MouseEvent } from 'react';
import useAppContext from '../../hooks/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';

const AdminHome = () => {
  const { specialNavigation } = useAppContext();
  const { t } = useTranslation();

  interface IAdminParams {
    text: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  }
  const AdminButton = ({ text, onClick }: IAdminParams) => {
    return (
      <div className='flex p-2.5 w-full md:w-1/2 lg:w-1/3 xl:w-1/5 xxl:w-1/6'>
        <button
          onClick={onClick}
          className='py-5 font-bold bg-lightGray dark:bg-darkGray text-black dark:text-white hover:text-white dark:hover:bg-STUColor hover:bg-STUColor rounded-md w-full h-full'
        >
          {text}
        </button>
      </div>
    );
  };

  return (
    <div className='main-body-without-search'>
      <div className='flex flex-wrap p-2.5'>
        <AdminButton
          text={t('admin.homePage.entries')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminEntries)
          }
        />
        <AdminButton
          text={t('admin.homePage.feeds')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminFeeds)
          }
        />
      </div>
    </div>
  );
};

export default AdminHome;
