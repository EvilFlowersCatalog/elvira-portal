import Breadcrumb from '../../components/buttons/Breadcrumb';
import useAppContext from '../../hooks/contexts/useAppContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import readSvg from '/images/static/read.svg';
import organizeSvg from '/images/static/organize.svg';
import distributeSvg from '/images/static/distribute.svg';
import { useTranslation } from 'react-i18next';
import Feature, {
  IFeatureParams,
} from '../../components/specific-page/about-page/Feature';
import Footer from '../../components/specific-page/about-page/Footer';

const About = () => {
  const { theme, titleLogoDark, titleLogoLight } = useAppContext();
  const { t } = useTranslation();

  const FeatureList: IFeatureParams[] = [
    {
      title: t('about.read.title'),
      imgPath: readSvg,
      description: (
        <>
          {t('about.read.descriptionPart1')}
          <span className='bg-zinc-200 dark:bg-darkGray px-1 rounded-md'>
            EvilFlowersViewer
          </span>
          {t('about.read.descriptionPart2')}
        </>
      ),
      left: true,
    },
    {
      title: t('about.organize.title'),
      imgPath: organizeSvg,
      description: <>{t('about.organize.description')}</>,
      left: false,
    },
    {
      title: t('about.distribute.title'),
      imgPath: distributeSvg,
      description: <>{t('about.distribute.description')}</>,
      left: true,
    },
  ];

  return (
    <div className='flex w-full flex-col'>
      <Breadcrumb />
      <div className='flex flex-col w-full p-4 justify-start items-center text-center'>
        <img
          className='w-full md:w-1/4'
          src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          alt='Elvira Logo'
        />
        <p className='text-2xl font-extrabold mt-5'>{t('about.title')}</p>
        <p>{t('about.subTitle')}</p>

        <button
          className='hover:underline text-STUColor mb-10'
          onClick={() => window.open('https://elvira.digital/', '_blank')}
        >
          {t('about.readMore')}
        </button>

        <div className='flex flex-col w-full gap-10 px-4 lg:px-20 '>
          {FeatureList.map((props, index) => (
            <Feature key={index} {...props} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
