import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import usePermissions from '../../hooks/usePermissions';
import { canAccessPath, hasAnyPermission } from '../../utils/permissions';
import ContentStatusPanel from '../common/ContentStatusPanel';

const PermissionRoute = ({ permission, anyOf, path: pathProp, children }) => {
  const { loading, isAuthenticated } = useAuth();
  const { permissions } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const checkPath = pathProp || location.pathname;

  let allowed = false;
  if (anyOf?.length) {
    allowed = hasAnyPermission(permissions, null, anyOf);
  } else if (permission) {
    allowed = hasAnyPermission(permissions, null, [permission]);
  } else {
    allowed = canAccessPath(permissions, null, checkPath);
  }

  if (!allowed) {
    return (
      <ContentStatusPanel
        status={403}
        title="Sahifaga ruxsat yo‘q"
        message="Bu bo‘limga kirish uchun profilingizda tegishli ruxsat yo‘q. Chap menyudan ruxsat berilgan boshqa bo‘limni tanlang."
      />
    );
  }

  return children;
};

export default PermissionRoute;
