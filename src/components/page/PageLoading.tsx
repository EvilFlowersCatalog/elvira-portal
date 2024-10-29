import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';
import EntryBoxLoading from '../items/entry/EntryBoxLoading';

interface IPageLoadingParams {
  entries?: boolean;
  showLayout?: boolean;
}

const PageLoading = ({ entries = false }: IPageLoadingParams) => {
  const { stuColor } = useAppContext();

  return (
    <div className={'flex flex-1 h-full flex-wrap px-4 pb-4'}>
      {entries ? (
        Array.from({ length: 30 }).map((_, index) => (
          <EntryBoxLoading key={index} />
        ))
      ) : (
        <div className={'flex flex-1 justify-center items-center'}>
          <CircleLoader color={stuColor} size={100} />
        </div>
      )}
    </div>
  );
};

export default PageLoading;
