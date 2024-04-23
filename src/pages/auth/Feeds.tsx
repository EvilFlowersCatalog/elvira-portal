import { DATA_TYPE } from '../../utils/interfaces/general/general';
import DataProvider from '../../contexts/DataProvider';
import FeedContainer from '../../components/data-page/feed/FeedContainer';

const Feeds = () => {
  return (
    <DataProvider type={DATA_TYPE.feeds}>
      <FeedContainer />
    </DataProvider>
  );
};

export default Feeds;
