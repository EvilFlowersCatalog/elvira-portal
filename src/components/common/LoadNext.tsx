import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';

const LoadNext = () => {
  const { STUColor } = useAppContext();

  return (
    <div className='flex justify-center h-20'>
      <div className='h-20 w-fit flex justify-center items-center'>
        <CircleLoader color={STUColor} size={50} />
      </div>
    </div>
  );
};

export default LoadNext;
