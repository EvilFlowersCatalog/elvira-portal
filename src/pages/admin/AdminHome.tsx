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
    titleKey: 'administration.homePage.entries.title',
    textKey: 'administration.homePage.entries.text',
    path: NAVIGATION_PATHS.adminEntries,
  },
  {
    icon: <MdFeed size={25} />,
    titleKey: 'administration.homePage.feeds.title',
    textKey: 'administration.homePage.feeds.text',
    path: NAVIGATION_PATHS.adminFeeds,
  },
  {
    icon: <MdCategory size={25} />,
    titleKey: 'administration.homePage.categories.title',
    textKey: 'administration.homePage.categories.text',
    path: NAVIGATION_PATHS.adminCategories,
  },
];

const AdminHome = () => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className='w-full overflow-auto'>
      <Breadcrumb />

      <h1 className='px-4 text-secondary dark:text-secondaryLight text-4xl font-extrabold text-left mb-4'>{t('navbarMenu.administration')}</h1>

      <div className='grid md:grid-cols-3 px-2'>
        {buttonConfig.map(({ icon, titleKey, textKey, path }, index) => (
          <AdminButton
            key={index}
            icon={icon}
            text={t(textKey)}
            title={t(titleKey)}
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
