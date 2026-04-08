import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GeneralAdminRoute = ({ children }) => {
  const { admin, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (admin?.role !== 'general') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GeneralAdminRoute;
