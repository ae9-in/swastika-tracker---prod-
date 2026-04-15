import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, requiresBusiness = true, allowedRoles = [] }) {
  const { isAuthenticated, activeBusiness, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiresBusiness && !activeBusiness) {
    return <Navigate to="/select-business" replace />;
  }

  // Role-based authorization
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, activeBusiness } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={activeBusiness ? '/app/dashboard' : '/select-business'} replace />;
  }

  return children;
}
