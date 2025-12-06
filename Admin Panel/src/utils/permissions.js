// Permission labels in Uzbek
export const PERMISSION_LABELS = {
  'view_dashboard': 'Dashboard',
  'manage_admins': 'Adminlar',
  'manage_shop_owners': 'Do\'kon egalari',
  'manage_stores': 'Do\'konlar',
  'manage_shops': 'Do\'konlar',
  'manage_sellers': 'Sotuvchilar',
  'manage_regions': 'Regionlar',
  'manage_categories': 'Kategoriyalar',
  'manage_products': 'Mahsulotlar',
  'manage_orders': 'Buyurtmalar',
  'manage_installments': 'Muddatli to\'lovlar',
  'manage_notifications': 'Xabarnomalar',
  'manage_settings': 'Sozlamalar',
};

export const ADMIN_PERMISSIONS = [
  'view_dashboard',
  'manage_admins',
  'manage_shop_owners',
  'manage_stores',
  'manage_shops',
  'manage_sellers',
  'manage_regions',
  'manage_categories',
  'manage_products',
  'manage_orders',
  'manage_installments',
  'manage_notifications',
  'manage_settings',
];

export const getPermissionLabel = (permission) => {
  return PERMISSION_LABELS[permission] || permission;
};



