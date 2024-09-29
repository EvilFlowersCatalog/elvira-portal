import { CircleLoader } from 'react-spinners';
import useAppContext from '../../../hooks/contexts/useAppContext';

const LoadNext = () => {
  const { stuColor } = useAppContext();

  return (
    <div className='flex w-full justify-center h-20'>
      <div className='h-20 w-fit flex justify-center items-center'>
        <CircleLoader color={stuColor} size={50} />
      </div>
    </div>
  );
};

export default LoadNext;
