import AdminFeedContainer from '../../components/data-page/feed/admin/AdminFeedContainer';
import DataProvider from '../../contexts/DataProvider';
import { DATA_TYPE } from '../../utils/interfaces/general/general';

const AdminFeeds = () => {
  return (
    <DataProvider type={DATA_TYPE.feeds}>
      <AdminFeedContainer />
    </DataProvider>
  );
};

export default AdminFeeds;
