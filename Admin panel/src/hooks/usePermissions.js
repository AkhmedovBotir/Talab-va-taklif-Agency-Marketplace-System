import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  canAccessPath,
  canManageAdmins,
  getEffectivePermissions,
  getFirstAllowedPath,
  permissionsInclude,
} from '../utils/permissions';

export const usePermissions = () => {
  const { admin } = useAuth();

  const permissions = useMemo(() => getEffectivePermissions(admin), [admin]);

  const can = useCallback((key) => permissionsInclude(permissions, key), [permissions]);

  const canPath = useCallback((pathname) => canAccessPath(permissions, null, pathname), [permissions]);

  const firstAllowedPath = useMemo(() => getFirstAllowedPath(admin), [admin]);

  const manageAdmins = useMemo(() => canManageAdmins(admin), [admin]);

  return {
    admin,
    permissions,
    manageAdmins,
    can,
    canPath,
    firstAllowedPath,
  };
};

export default usePermissions;
