import { MouseEvent, ReactElement } from 'react';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { FaBook } from 'react-icons/fa';
import { MdCategory, MdFeed } from 'react-icons/md';
import AdminButton from './components/AdminButton';

const AdminHome = () => {
  const { specialNavigation } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className='flex-1'>
      <Breadcrumb />
      <div className='flex flex-wrap px-2'>
        <AdminButton
          icon={<FaBook size={25} />}
          text={t('administration.homePage.entries')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminEntries)
          }
        />
        <AdminButton
          icon={<MdFeed size={30} />}
          text={t('administration.homePage.feeds')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminFeeds)
          }
        />
        <AdminButton
          icon={<MdCategory size={30} />}
          text={t('administration.homePage.categories')}
          onClick={(event) =>
            specialNavigation(event, NAVIGATION_PATHS.adminCategories)
          }
        />
      </div>
    </div>
  );
};

export default AdminHome;
