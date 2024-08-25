import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';
import { LAYOUT_TYPE } from '../../utils/interfaces/general/general';
import EntryListLoading from '../entry/loading/EntryListLoading';
import EntryBoxLoading from '../entry/loading/EntryBoxLoading';

interface IPageLoadingParams {
  entries?: boolean;
  showLayout?: boolean;
}

const PageLoading = ({
  entries = false,
  showLayout = false,
}: IPageLoadingParams) => {
  const { STUColor, layout } = useAppContext();

  return (
    <div className={'flex flex-1 h-full flex-wrap px-4 pb-4'}>
      {entries ? (
        showLayout ? (
          layout === LAYOUT_TYPE.list ? (
            Array.from({ length: 30 }).map((_, index) => (
              <EntryListLoading key={index} />
            ))
          ) : (
            Array.from({ length: 30 }).map((_, index) => (
              <EntryBoxLoading key={index} />
            ))
          )
        ) : (
          Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} />
          ))
        )
      ) : (
        <div className={'flex flex-1 justify-center items-center'}>
          <CircleLoader color={STUColor} size={100} />
        </div>
      )}
    </div>
  );
};

export default PageLoading;
