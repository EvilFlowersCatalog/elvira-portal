import { CircleLoader } from 'react-spinners';
import EntryLoading from '../entry/EntryLoading';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IPageLoadingParams {
  entries?: boolean;
}

const PageLoading = ({ entries = false }: IPageLoadingParams) => {
  const { STUColor } = useAppContext();

  return (
    <div className={'flex flex-1 flex-wrap px-4 pb-4'}>
      {entries ? (
        Array.from({ length: 30 }).map((_, index) => (
          <EntryLoading key={index} />
        ))
      ) : (
        <div className={'flex flex-1 justify-center items-center'}>
          <CircleLoader color={STUColor} size={100} />
        </div>
      )}
    </div>
  );
};

export default PageLoading;
