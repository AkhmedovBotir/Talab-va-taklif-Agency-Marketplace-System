export const PERMISSION_MAP = {
  '/dashboard': 'dashboard',
  '/dashboard/admins': 'admins',
};

/**
 * Get required permission for a path (exact or parent).
 * Nested paths like /dashboard/finance/balance use parent /dashboard/finance if no exact match.
 */
export const getRequiredPermissionForPath = (path) => {
  if (PERMISSION_MAP[path]) return PERMISSION_MAP[path];
  const parts = path.split('/').filter(Boolean);
  while (parts.length > 1) {
    parts.pop();
    const parentPath = '/' + parts.join('/');
    if (PERMISSION_MAP[parentPath]) return PERMISSION_MAP[parentPath];
  }
  return null;
};

export const PERMISSIONS_GROUPED = [
  {
    section: null,
    label: null,
    permissions: [
      { value: 'dashboard', label: 'Dashboard' },
      { value: 'admins', label: 'Adminlar' },
    ],
  },
];

// Flattened list of all permissions (backward compatible)
export const ALL_PERMISSIONS = PERMISSIONS_GROUPED.flatMap((g) => g.permissions);

/**
 * For a given permission value, return the section parent permission value (e.g. warehouse_categories -> warehouse).
 * Used so that when user checks a child (Ombor — Kategoriyalar), the parent (Ombor) is auto-selected.
 * Returns null if permission has no parent (standalone or is already the section parent).
 */
export const getParentPermissionValue = (permissionValue) => {
  for (const group of PERMISSIONS_GROUPED) {
    if (!group.section || !group.permissions?.length) continue;
    const parentValue = group.permissions[0].value;
    if (permissionValue === parentValue) return null;
    if (group.permissions.some((p) => p.value === permissionValue)) {
      return parentValue;
    }
  }
  return null;
};

// Check if user has permission for a path (supports nested tab paths via parent permission)
export const hasPermission = (permissions, path) => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  const requiredPermission = getRequiredPermissionForPath(path);
  if (!requiredPermission) return true;
  return permissions.includes(requiredPermission);
};

/**
 * Check if user has access to a section: either the main path permission
 * or any nested tab path permission (e.g. finance OR finance_balance, finance_reports, ...).
 * Used for sidebar: show "Moliya" if user has finance or any finance_*.
 */
export const hasAccessToSection = (permissions, menuPath) => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  if (hasPermission(permissions, menuPath)) return true;
  const prefix = menuPath.endsWith('/') ? menuPath : menuPath + '/';
  for (const path of Object.keys(PERMISSION_MAP)) {
    if (path.startsWith(prefix) && permissions.includes(PERMISSION_MAP[path])) {
      return true;
    }
  }
  return false;
};

/**
 * Get list of tab ids the user is allowed to access for a section (e.g. /dashboard/finance).
 * - If user has explicit tab permissions (e.g. warehouse_products, kpi_transactions), return only those tabs.
 * - If user has only the parent permission (e.g. warehouse) and NO explicit tab permissions, return all tabs.
 * So "botir" with warehouse + warehouse_products + warehouse_maxalla_products sees only Mahsulotlar and Maxalla productlari, not Kategoriyalar.
 */
export const getAllowedTabIdsForSection = (permissions, basePath) => {
  if (!permissions || !Array.isArray(permissions) || !basePath) return [];
  return [];
};

// Filter menu items based on permissions (sidebar)
export const filterMenuItemsByPermissions = (menuItems, permissions) => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return menuItems.filter((item) => item.path === '/dashboard');
  }

  return menuItems
    .map((item) => {
      const parentHasPermission = hasAccessToSection(permissions, item.path);

      if (item.children && Array.isArray(item.children)) {
        const filteredChildren = item.children.filter((child) =>
          hasPermission(permissions, child.path)
        );
        if (parentHasPermission || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : undefined,
          };
        }
        return null;
      }

      return parentHasPermission ? item : null;
    })
    .filter((item) => item !== null);
};
