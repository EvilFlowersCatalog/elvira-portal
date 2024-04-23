import { useContext } from 'react';
import { DataContext } from '../contexts/DataProvider';

const useDataContext = () => {
  const context = useContext(DataContext);

  if (context === null) throw Error('DataPageContext is null.');
  return context;
};

export default useDataContext;
