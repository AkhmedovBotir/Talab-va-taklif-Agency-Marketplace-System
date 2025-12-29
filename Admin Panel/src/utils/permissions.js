// Permission mapping for menu items
export const PERMISSION_MAP = {
  '/dashboard': 'dashboard',
  '/dashboard/admins': 'admins',
  '/dashboard/regions': 'regions',
  '/dashboard/contragents': 'counterparties',
  '/dashboard/agents': 'agents',
  '/dashboard/punkts': 'points',
  '/dashboard/archive': 'archive',
  '/dashboard/ombor': 'warehouse',
  '/dashboard/marketplace-users': 'marketplace_clients',
  '/dashboard/notifications': 'messages',
  '/dashboard/orders': 'orders',
  '/dashboard/kpi': 'kpi_bonuses',
  '/dashboard/statistics': 'area_statistics',
  '/dashboard/sms-verifications': 'sms',
  '/dashboard/finance': 'finance',
  '/dashboard/reviews': 'pricing', // Assuming reviews uses pricing permission
  '/dashboard/partnership-requests': 'partnership_requests',
  '/dashboard/vacancies': 'vacancies',
  '/dashboard/settings': 'settings',
};

// All available permissions
export const ALL_PERMISSIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'admins', label: 'Adminlar' },
  { value: 'regions', label: 'Regionlar' },
  { value: 'counterparties', label: 'Kontragentlar' },
  { value: 'agents', label: 'Agentlar' },
  { value: 'points', label: 'Punktlar' },
  { value: 'archive', label: 'Arxiv' },
  { value: 'warehouse', label: 'Ombor' },
  { value: 'marketplace_clients', label: 'Marketplace Mijozlar' },
  { value: 'messages', label: 'Xabarlar' },
  { value: 'orders', label: 'Buyurtmalar' },
  { value: 'kpi_bonuses', label: 'KPI Bonuslar' },
  { value: 'area_statistics', label: 'Hududlar Statistikasi' },
  { value: 'sms', label: 'SMS lar' },
  { value: 'finance', label: 'Moliya' },
  { value: 'pricing', label: 'Baholar' },
  { value: 'partnership_requests', label: 'Hamkorlik So\'rovlari' },
  { value: 'vacancies', label: 'Vakansiyalar' },
  { value: 'settings', label: 'Sozlamalar' },
];

// Check if user has permission for a path
export const hasPermission = (permissions, path) => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    // If no permissions, check if default permissions should be applied
    // For now, return false to be safe
    return false;
  }
  
  const requiredPermission = PERMISSION_MAP[path];
  if (!requiredPermission) {
    // If path is not in map, allow access (e.g., nested routes)
    return true;
  }
  
  return permissions.includes(requiredPermission);
};

// Filter menu items based on permissions
export const filterMenuItemsByPermissions = (menuItems, permissions) => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    // If no permissions, return empty array or only dashboard
    return menuItems.filter(item => item.path === '/dashboard');
  }
  
  return menuItems.map(item => {
    // Check if parent item has permission
    const parentHasPermission = hasPermission(permissions, item.path);
    
    // Filter children if they exist
    if (item.children && Array.isArray(item.children)) {
      const filteredChildren = item.children.filter(child => 
        hasPermission(permissions, child.path)
      );
      
      // If parent has permission or has filtered children, include it
      if (parentHasPermission || filteredChildren.length > 0) {
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }
      
      // If parent doesn't have permission and no children, exclude it
      return null;
    }
    
    // For items without children, check permission
    return parentHasPermission ? item : null;
  }).filter(item => item !== null);
};
