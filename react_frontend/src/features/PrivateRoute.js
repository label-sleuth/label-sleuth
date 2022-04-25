import { Navigate } from 'react-router-dom';
import {useAuth}  from '../customHooks/useAuth'

export function PrivateRoute({ children }) {
    const auth = useAuth();
    return auth ? children : <Navigate to="/login" />;
  }