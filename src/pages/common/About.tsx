import Breadcrumb from '../../components/common/Breadcrumb';
import useAppContext from '../../hooks/contexts/useAppContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';

const About = () => {
  const { theme, titleLogoDark, titleLogoLight } = useAppContext();

  return (
    <div className='flex-1'>
      <Breadcrumb />
      <div className='flex flex-col flex-1 p-4 justify-start items-center py-20'>
        <img
          className='w-1/2'
          src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
        />
        <p className='mt-20'>Elvíra je portál kde je veľa knížok</p>
      </div>
    </div>
  );
};

export default About;
