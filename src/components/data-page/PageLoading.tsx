import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/useAppContext';

const PageLoading = () => {
  const { STUColor } = useAppContext();

  return (
    <div className={'h-full w-full flex justify-center items-center'}>
      <CircleLoader color={STUColor} size={100} />
    </div>
  );
};

export default PageLoading;
