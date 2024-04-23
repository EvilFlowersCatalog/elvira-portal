import Feed from './Feed';
import { IFeed } from '../../../utils/interfaces/feed';
import PageLoading from '../PageLoading';
import PageEmpty from '../PageEmpty';
import useDataPage from '../../../hooks/useDataContext';

const FeedContainer = () => {
  const { data, isLoading } = useDataPage();

  return (
    <div className='flex flex-col flex-1'>
      {data!.length === 0 && isLoading ? (
        <PageLoading />
      ) : data!.length > 0 ? (
        <div className={`flex flex-wrap p-2.5 w-full`}>
          {/* FEEDS */}
          {data!.map((feed, index) => (
            <Feed key={index} feed={feed as IFeed} />
          ))}
        </div>
      ) : (
        <PageEmpty />
      )}
    </div>
  );
};

export default FeedContainer;
