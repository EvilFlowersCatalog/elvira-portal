import { useContext } from 'react';
import { GuideContext } from '../../providers/GuideProvider';

const useGuide = () => {
  const context = useContext(GuideContext);

  if (context === null) throw Error('GuideContext is null.');
  return context;
};

export default useGuide;
