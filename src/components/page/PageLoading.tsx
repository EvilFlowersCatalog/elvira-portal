import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';

const PageLoading = () => {
  const { STUColor } = useAppContext();

  return (
    <div className={'flex flex-1 justify-center items-center'}>
      <CircleLoader color={STUColor} size={100} />
    </div>
  );
};

export default PageLoading;
