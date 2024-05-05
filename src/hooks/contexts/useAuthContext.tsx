import { useContext } from 'react';
import { AuthContext } from '../../providers/AuthProvider';

const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === null) throw Error('AuthContext is null.');
  return context;
};

export default useAuthContext;
