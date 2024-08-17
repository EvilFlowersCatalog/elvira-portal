import { useContext } from 'react';
import { CookiesContext } from '../../providers/CookiesProvider';

const useCookiesContext = () => {
  const context = useContext(CookiesContext);

  if (context === null) throw Error('CookiesContext is null.');
  return context;
};

export default useCookiesContext;
