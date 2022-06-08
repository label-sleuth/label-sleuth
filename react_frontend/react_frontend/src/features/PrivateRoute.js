import { Navigate } from 'react-router-dom';
import { useAuth } from '../customHooks/useAuth'


export function PrivateRoute({ redirectPath = '/', children, }) {
  const auth = useAuth();
  if (!auth) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};