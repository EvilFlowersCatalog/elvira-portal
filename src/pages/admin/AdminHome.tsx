import { useTranslation } from 'react-i18next';
import { FaBook } from 'react-icons/fa';
import { MdCategory, MdFeed } from 'react-icons/md';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import useAppContext from '../../hooks/contexts/useAppContext';
import AdminButton from '../../components/buttons/AdminButton';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

const buttonConfig = [
  {
    icon: <FaBook size={25} />,
    textKey: 'administration.homePage.entries',
    path: NAVIGATION_PATHS.adminEntries,
  },
  {
    icon: <MdFeed size={25} />,
    textKey: 'administration.homePage.feeds',
    path: NAVIGATION_PATHS.adminFeeds,
  },
  {
    icon: <MdCategory size={25} />,
    textKey: 'administration.homePage.categories',
    path: NAVIGATION_PATHS.adminCategories,
  },
];

const AdminHome = () => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className='w-full overflow-auto'>
      <Breadcrumb />
      <div className='flex flex-wrap px-2'>
        {buttonConfig.map(({ icon, textKey, path }, index) => (
          <AdminButton
            key={index}
            icon={icon}
            text={t(textKey)}
            onClick={(event) => {
              umamiTrack('Admin Home Button', {
                path,
              });
              specialNavigation(event, path);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
