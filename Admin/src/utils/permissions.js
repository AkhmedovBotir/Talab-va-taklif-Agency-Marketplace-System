// Permission mapping for menu items (and nested tab paths for granular control)
export const PERMISSION_MAP = {
  '/dashboard': 'dashboard',
  '/dashboard/admins': 'admins',
  '/dashboard/regions': 'regions',
  '/dashboard/contragents': 'counterparties',
  '/dashboard/contragents/types': 'counterparties_types',
  '/dashboard/contragents/tuman': 'counterparties_tuman',
  '/dashboard/contragents/mfy': 'counterparties_mfy',
  '/dashboard/agents': 'agents',
  '/dashboard/punkts': 'points',
  '/dashboard/managers': 'managers',
  '/dashboard/archive': 'archive',
  '/dashboard/archive/punkts': 'archive_punkts',
  '/dashboard/archive/agents': 'archive_agents',
  '/dashboard/ombor': 'warehouse',
  '/dashboard/ombor/categories': 'warehouse_categories',
  '/dashboard/ombor/products': 'warehouse_products',
  '/dashboard/ombor/maxalla-products': 'warehouse_maxalla_products',
  '/dashboard/marketplace-users': 'marketplace_clients',
  '/dashboard/notifications': 'messages',
  '/dashboard/orders': 'orders',
  '/dashboard/kpi': 'kpi_bonuses',
  '/dashboard/kpi/statistics': 'kpi_statistics',
  '/dashboard/kpi/transactions': 'kpi_transactions',
  '/dashboard/kpi/agents': 'kpi_agents',
  '/dashboard/kpi/punkts': 'kpi_punkts',
  '/dashboard/kpi/managers': 'kpi_managers',
  '/dashboard/statistics': 'area_statistics',
  '/dashboard/statistics/summary': 'area_statistics_summary',
  '/dashboard/statistics/viloyats': 'area_statistics_viloyats',
  '/dashboard/sms-verifications': 'sms',
  '/dashboard/finance': 'finance',
  '/dashboard/finance/admin-payments': 'finance_admin_payments',
  '/dashboard/finance/balance': 'finance_balance',
  '/dashboard/finance/reports': 'finance_reports',
  '/dashboard/finance/kpi-payments': 'finance_kpi_payments',
  '/dashboard/finance/transactions': 'finance_transactions',
  '/dashboard/finance/statistics': 'finance_statistics',
  '/dashboard/finance/contragent-payments': 'finance_contragent_payments',
  '/dashboard/reviews': 'pricing',
  '/dashboard/reviews/reviews': 'pricing_reviews',
  '/dashboard/reviews/contacts': 'pricing_contacts',
  '/dashboard/partnership-requests': 'partnership_requests',
  '/dashboard/vacancies': 'vacancies',
  '/dashboard/settings': 'settings',
  '/dashboard/settings/kpi': 'settings_kpi',
  '/dashboard/settings/comment-templates': 'settings_comment_templates',
  '/dashboard/settings/featured-contragents': 'settings_featured_contragents',
  '/dashboard/settings/devices': 'settings_devices',
  '/dashboard/certificate-assignment': 'certificate_assignment',
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

// Permissions grouped by section for UI display (bo'limlar bo'yicha)
export const PERMISSIONS_GROUPED = [
  { section: null, label: null, permissions: [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'admins', label: 'Adminlar' },
    { value: 'regions', label: 'Regionlar' },
    { value: 'agents', label: 'Agentlar' },
    { value: 'points', label: 'Punktlar' },
    { value: 'managers', label: 'Menejerlar' },
    { value: 'marketplace_clients', label: 'Marketplace Mijozlar' },
    { value: 'messages', label: 'Xabarlar' },
    { value: 'orders', label: 'Buyurtmalar' },
    { value: 'sms', label: 'SMS lar' },
    { value: 'partnership_requests', label: 'Hamkorlik So\'rovlari' },
    { value: 'vacancies', label: 'Vakansiyalar' },
    { value: 'certificate_assignment', label: 'Sertifikat Integratsiyasi' },
  ]},
  { section: 'Kontragentlar', label: 'Kontragentlar', permissions: [
    { value: 'counterparties', label: 'Kontragentlar' },
    { value: 'counterparties_types', label: 'Kontragentlar — Turlari' },
    { value: 'counterparties_tuman', label: 'Kontragentlar — Tuman' },
    { value: 'counterparties_mfy', label: 'Kontragentlar — MFY' },
  ]},
  { section: 'Arxiv', label: 'Arxiv', permissions: [
    { value: 'archive', label: 'Arxiv' },
    { value: 'archive_punkts', label: 'Arxiv — Punktlar' },
    { value: 'archive_agents', label: 'Arxiv — Agentlar' },
  ]},
  { section: 'Ombor', label: 'Ombor', permissions: [
    { value: 'warehouse', label: 'Ombor' },
    { value: 'warehouse_categories', label: 'Ombor — Kategoriyalar' },
    { value: 'warehouse_products', label: 'Ombor — Mahsulotlar' },
    { value: 'warehouse_maxalla_products', label: 'Ombor — Maxalla mahsulotlari' },
  ]},
  { section: 'KPI Bonuslar', label: 'KPI Bonuslar', permissions: [
    { value: 'kpi_bonuses', label: 'KPI Bonuslar' },
    { value: 'kpi_statistics', label: 'KPI — Statistika' },
    { value: 'kpi_transactions', label: 'KPI — Transaksiyalar' },
    { value: 'kpi_agents', label: 'KPI — Agentlar' },
    { value: 'kpi_punkts', label: 'KPI — Punktlar' },
    { value: 'kpi_managers', label: 'KPI — Menejerlar' },
  ]},
  { section: 'Hududlar Statistikasi', label: 'Hududlar Statistikasi', permissions: [
    { value: 'area_statistics', label: 'Hududlar Statistikasi' },
    { value: 'area_statistics_summary', label: 'Statistika — Umumiy' },
    { value: 'area_statistics_viloyats', label: 'Statistika — Viloyatlar' },
  ]},
  { section: 'Moliya', label: 'Moliya', permissions: [
    { value: 'finance', label: 'Moliya' },
    { value: 'finance_admin_payments', label: 'Moliya — Admin to\'lovlari' },
    { value: 'finance_balance', label: 'Moliya — Balans' },
    { value: 'finance_reports', label: 'Moliya — Hisobotlar' },
    { value: 'finance_kpi_payments', label: 'Moliya — KPI to\'lovlar' },
    { value: 'finance_transactions', label: 'Moliya — Transaksiyalar' },
    { value: 'finance_statistics', label: 'Moliya — Statistika' },
    { value: 'finance_contragent_payments', label: 'Moliya — Contragent to\'lovlari' },
  ]},
  { section: 'Baholar', label: 'Baholar', permissions: [
    { value: 'pricing', label: 'Baholar' },
    { value: 'pricing_reviews', label: 'Baholar — Barcha baholar' },
    { value: 'pricing_contacts', label: 'Baholar — Salbiy aloqalar' },
  ]},
  { section: 'Sozlamalar', label: 'Sozlamalar', permissions: [
    { value: 'settings', label: 'Sozlamalar' },
    { value: 'settings_kpi', label: 'Sozlamalar — KPI' },
    { value: 'settings_comment_templates', label: 'Sozlamalar — Kommentariya shablonlari' },
    { value: 'settings_featured_contragents', label: 'Sozlamalar — Tanlangan kontragentlar' },
    { value: 'settings_devices', label: 'Sozlamalar — Qurilma boshqaruvi' },
  ]},
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
  if (!permissions || !Array.isArray(permissions)) return [];
  const prefix = basePath.endsWith('/') ? basePath : basePath + '/';
  const allowed = [];
  for (const path of Object.keys(PERMISSION_MAP)) {
    if (!path.startsWith(prefix)) continue;
    const tabId = path.slice(prefix.length);
    if (!tabId || tabId.includes('/')) continue; // only direct tab, e.g. "balance"
    if (permissions.includes(PERMISSION_MAP[path])) {
      allowed.push(tabId);
    }
  }
  // Parent permission = all tabs ONLY when user has no explicit tab permissions (granular list wins)
  if (allowed.length === 0 && permissions.includes(PERMISSION_MAP[basePath])) {
    const allTabIds = Object.keys(PERMISSION_MAP)
      .filter((p) => p.startsWith(prefix))
      .map((p) => p.slice(prefix.length))
      .filter((id) => id && !id.includes('/'));
    return [...new Set(allTabIds)];
  }
  return allowed;
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
