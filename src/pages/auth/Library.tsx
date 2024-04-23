import { DATA_TYPE } from '../../utils/interfaces/general/general';
import DataProvider from '../../contexts/DataProvider';
import EntryContainer from '../../components/data-page/entry/EntryContainer';

const Library = () => {
  return (
    <DataProvider type={DATA_TYPE.entries}>
      <EntryContainer />
    </DataProvider>
  );
};

export default Library;
