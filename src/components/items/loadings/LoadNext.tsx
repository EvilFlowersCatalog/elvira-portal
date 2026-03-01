import { CircleLoader } from 'react-spinners';
import useAppContext from '../../../hooks/contexts/useAppContext';

const LoadNext = () => {
  return (
    <div className='flex w-full justify-center h-20'>
      <div className='h-20 w-fit flex justify-center items-center'>
        <CircleLoader color={'var(--color-primary)'} size={50} />
      </div>
    </div>
  );
};

export default LoadNext;
