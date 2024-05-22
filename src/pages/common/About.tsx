import Breadcrumb from '../../components/common/Breadcrumb';
import useAppContext from '../../hooks/contexts/useAppContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import readSvg from '/assets/static/read.svg';
import organizeSvg from '/assets/static/organize.svg';
import distributeSvg from '/assets/static/distribute.svg';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { theme, titleLogoDark, titleLogoLight } = useAppContext();
  const { t } = useTranslation();

  interface IFeaturesParams {
    imgPath: string;
    title: string;
    description: ReactNode;
  }

  const FeatureList: IFeaturesParams[] = [
    {
      title: t('about.read.title'),
      imgPath: readSvg,
      description: (
        <>
          {t('about.read.descriptionPart1')}
          <span className='bg-zinc-200 dark:bg-darkGray px-2 rounded-md'>
            EvilFlowersViewer
          </span>
          {t('about.read.descriptionPart2')}
        </>
      ),
    },
    {
      title: t('about.organize.title'),
      imgPath: organizeSvg,
      description: <>{t('about.organize.description')}</>,
    },
    {
      title: t('about.distribute.title'),
      imgPath: distributeSvg,
      description: <>{t('about.distribute.description')}</>,
    },
  ];

  function Feature({ imgPath, title, description }: IFeaturesParams) {
    return (
      <div className='flex flex-col flex-1 items-center'>
        <img className='h-[300px]' src={imgPath} alt='SVG Image' />
        <div className='text-center p-4'>
          <h1 className='text-xl font-extrabold'>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col'>
      <Breadcrumb />
      <div className='flex flex-col flex-1 p-4 justify-start items-center text-center'>
        <img
          className='w-full md:w-1/3'
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

        <div className='flex flex-col xl:flex-row flex-1 justify-between gap-10 mt-10'>
          {FeatureList.map((props, index) => (
            <Feature key={index} {...props} />
          ))}
        </div>
      </div>

      <span className='flex-1'></span>

      <div className='w-full flex flex-col items-center gap-5 bg-black bg-opacity-50 p-5 text-center'>
        <button
          onClick={() => window.open('https://www.fiit.stuba.sk/', '_blank')}
          className='rounded-md overflow-hidden'
        >
          <img
            className='w-52'
            src='/assets/static/fiit-logo.png'
            alt='FIIT Logo'
          />
        </button>
        <p className='text-lg text-zinc-200 dark:text-zinc-400'>
          Copyright © 2024 FIIT STU.
        </p>
      </div>
    </div>
  );
};

export default About;
