import EntryContainer from '../../components/data-page/entry/EntryContainer';
import DataProvider from '../../contexts/DataProvider';
import { DATA_TYPE } from '../../utils/interfaces/general/general';

const MyShelf = () => {
  return (
    <DataProvider type={DATA_TYPE.myShelf}>
      <EntryContainer />
    </DataProvider>
  );
};

export default MyShelf;
