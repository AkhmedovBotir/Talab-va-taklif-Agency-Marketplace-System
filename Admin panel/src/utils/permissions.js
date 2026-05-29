/** GET /admins/permission-names — tavsiya ro‘yxati (fallback) */
export const DEFAULT_PERMISSION_NAMES = [
  'dashboard',
  'adminlar',
  'agentlar',
  'menejerlar',
  'punktlar',
  'hududlar',
  'kontragent turlari',
  'kontragentlar',
  "maxalla do'konlari",
  "hamkorlik so'rovi",
  'kategoriyalar',
  'mahsulotlar',
  'maxalla maxsulotlari shablonlari',
  'maxalla maxsulotlari',
  'marketplace foydalanuvchilari',
  'barcha buyurtmalar',
  'buyurtmalar monitoringgi',
  'kommentariya shablonlari',
  'kommentariyalar',
  'trankzasiyalar',
  "do'kon obunasi",
  'integratsiya kalitlari',
  'arxiv',
  'qr tizimi',
];

/** @deprecated — DEFAULT_PERMISSION_NAMES yoki getRecommendedPermissionNames() */
export const ALL_PERMISSION_KEYS = DEFAULT_PERMISSION_NAMES;

let recommendedPermissionNames = [...DEFAULT_PERMISSION_NAMES];

export const getRecommendedPermissionNames = () => [...recommendedPermissionNames];

export const setRecommendedPermissionNames = (names) => {
  if (Array.isArray(names) && names.length > 0) {
    recommendedPermissionNames = sanitizePermissionsPayload(names);
  }
};

export const PERMISSION_LABELS = {
  dashboard: 'Dashboard',
  adminlar: 'Adminlar',
  agentlar: 'Agentlar',
  menejerlar: 'Menejerlar',
  punktlar: 'Punktlar',
  hududlar: 'Hududlar',
  'kontragent turlari': 'Kontragent turlari',
  kontragentlar: 'Kontragentlar',
  "maxalla do'konlari": "Maxalla do'konlari",
  "hamkorlik so'rovi": "Hamkorlik so'rovi",
  kategoriyalar: 'Kategoriyalar',
  mahsulotlar: 'Mahsulotlar',
  'maxalla maxsulotlari shablonlari': 'Maxalla mahsulotlari — shablonlar',
  'maxalla maxsulotlari': 'Maxalla mahsulotlari',
  'marketplace foydalanuvchilari': 'Marketplace foydalanuvchilari',
  'barcha buyurtmalar': 'Barcha buyurtmalar',
  'buyurtmalar monitoringgi': 'Buyurtmalar monitoringi',
  'kommentariya shablonlari': 'Kommentariya shablonlari',
  kommentariyalar: 'Kommentariyalar',
  trankzasiyalar: 'Tranzaksiyalar',
  "do'kon obunasi": "Do'kon obunasi",
  'integratsiya kalitlari': 'Integratsiya kalitlari',
  arxiv: 'Arxiv',
  'qr tizimi': 'QR tizimi',
};

export const PERMISSIONS_GROUPED = [
  { title: 'Asosiy', keys: ['dashboard', 'adminlar'] },
  { title: 'Tuzilmalar', keys: ['agentlar', 'menejerlar', 'punktlar', 'hududlar'] },
  {
    title: 'Kontragentlar va do‘konlar',
    keys: ['kontragent turlari', 'kontragentlar', "maxalla do'konlari", "hamkorlik so'rovi"],
  },
  {
    title: 'Ombor',
    keys: ['kategoriyalar', 'mahsulotlar', 'maxalla maxsulotlari shablonlari', 'maxalla maxsulotlari'],
  },
  {
    title: 'Marketplace va buyurtmalar',
    keys: ['marketplace foydalanuvchilari', 'barcha buyurtmalar', 'buyurtmalar monitoringgi'],
  },
  { title: 'Kommentariya', keys: ['kommentariya shablonlari', 'kommentariyalar'] },
  {
    title: 'Moliya va tizim',
    keys: ['trankzasiyalar', "do'kon obunasi", 'integratsiya kalitlari', 'arxiv', 'qr tizimi'],
  },
];

/** Yo‘l → aniq bitta ruxsat (sahifa kirishi uchun, faqat frontend) */
export const PATH_PERMISSION = {
  '/dashboard': 'dashboard',
  '/dashboard/admins': 'adminlar',
  '/dashboard/agents': 'agentlar',
  '/dashboard/managers': 'menejerlar',
  '/dashboard/punkts': 'punktlar',
  '/dashboard/regions': 'hududlar',
  '/dashboard/contragents/types': 'kontragent turlari',
  '/dashboard/contragents/tuman': 'kontragentlar',
  '/dashboard/contragents/maxalla-dokonlar': "maxalla do'konlari",
  '/dashboard/contragents/hamkorlik-sorovlari': "hamkorlik so'rovi",
  '/dashboard/warehouse/categories': 'kategoriyalar',
  '/dashboard/warehouse/products': 'mahsulotlar',
  '/dashboard/warehouse/neighborhood-products': 'maxalla maxsulotlari shablonlari',
  '/dashboard/marketplace-users': 'marketplace foydalanuvchilari',
  '/dashboard/commentary': 'kommentariya shablonlari',
  '/dashboard/statistics/transactions-by-area': 'trankzasiyalar',
  '/dashboard/neighborhood-shop-subscriptions': "do'kon obunasi",
  '/dashboard/integration-api-keys': 'integratsiya kalitlari',
  '/dashboard/archive': 'arxiv',
  '/dashboard/qr-system': 'qr tizimi',
};

/** Bir URL — bir nechta ruxsatdan biri yetarli (ichki tablar) */
export const PATH_PERMISSION_ANY = {
  '/dashboard/warehouse/neighborhood-products': [
    'maxalla maxsulotlari shablonlari',
    'maxalla maxsulotlari',
  ],
  '/dashboard/commentary': ['kommentariya shablonlari', 'kommentariyalar'],
  '/dashboard/order-pipeline-monitor': ['buyurtmalar monitoringgi', 'barcha buyurtmalar'],
};

const normalizeApostrophe = (s) => String(s).replace(/[\u2018\u2019`´]/g, "'").trim();

const normalizePath = (pathname) => {
  const p = String(pathname || '').split('?')[0].replace(/\/$/, '');
  return p || '/dashboard';
};

const permissionKey = (raw) => {
  if (raw == null || raw === '') return null;
  return normalizeApostrophe(String(raw)).trim() || null;
};

const permissionEquals = (a, b) =>
  permissionKey(a)?.toLowerCase() === permissionKey(b)?.toLowerCase();

/** Admin permissions[] dan tozalangan ro‘yxat (server saqlagan nomlar) */
export const parseAdminPermissions = (admin) => {
  if (!admin) return [];

  let raw = admin.permissions;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw.includes(',') ? raw.split(',').map((s) => s.trim()) : [raw];
    }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    raw = Object.entries(raw)
      .filter(([, v]) => v === true || (v && typeof v === 'object' && (v.view || v.read)))
      .map(([k]) => k);
  }
  if (!Array.isArray(raw)) return [];

  return sanitizePermissionsPayload(raw);
};

/** Yaratish/yangilashda yuboriladigan permissions[] — takror va bo‘sh satrlar tozalanadi */
export const sanitizePermissionsPayload = (raw) => {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const s = permissionKey(typeof item === 'string' ? item : item?.key ?? item?.name);
    if (!s) continue;
    if (!out.some((x) => permissionEquals(x, s))) out.push(s);
  }
  return out;
};

/** API javobidan admin obyektini ajratadi (login, /me, CRUD) */
export const extractAdminFromResponse = (data) => {
  if (!data || typeof data !== 'object') return null;
  if (data.admin && typeof data.admin === 'object') return data.admin;
  if (data.id != null || data.username != null) return data;
  return null;
};

export const getEffectivePermissions = (admin) => parseAdminPermissions(admin);

/** Frontend: adminlar bo‘limi — faqat `adminlar` ruxsati */
export const canManageAdmins = (admin) =>
  permissionsInclude(getEffectivePermissions(admin), 'adminlar');

export const permissionsInclude = (permissions, key) => {
  if (!key || !Array.isArray(permissions)) return false;
  return permissions.some((p) => permissionEquals(p, key));
};

export const canAccessPermission = (permissions, _role, key) => permissionsInclude(permissions, key);

export const hasAnyPermission = (permissions, _role, keys) =>
  (keys || []).some((k) => permissionsInclude(permissions, k));

const resolvePathPermission = (pathname) => {
  const path = normalizePath(pathname);

  if (PATH_PERMISSION_ANY[path]) {
    return { type: 'any', keys: PATH_PERMISSION_ANY[path] };
  }

  const sorted = Object.keys(PATH_PERMISSION).sort((a, b) => b.length - a.length);
  for (const routePath of sorted) {
    if (path === routePath) {
      return { type: 'one', key: PATH_PERMISSION[routePath] };
    }
  }
  return null;
};

/** Sahifa URL — faqat admin.permissions[] bo‘yicha (server tekshirmaydi) */
export const canAccessPath = (permissions, _role, pathname) => {
  const resolved = resolvePathPermission(pathname);
  if (!resolved) return false;

  if (resolved.type === 'any') {
    return hasAnyPermission(permissions, null, resolved.keys);
  }
  return permissionsInclude(permissions, resolved.key);
};

export const getFirstAllowedPath = (admin) => {
  const perms = getEffectivePermissions(admin);
  const preferred = [
    '/dashboard',
    '/dashboard/admins',
    '/dashboard/agents',
    '/dashboard/managers',
    '/dashboard/punkts',
    '/dashboard/regions',
    '/dashboard/contragents/types',
    '/dashboard/contragents/tuman',
    '/dashboard/contragents/maxalla-dokonlar',
    '/dashboard/contragents/hamkorlik-sorovlari',
    '/dashboard/warehouse/categories',
    '/dashboard/warehouse/products',
    '/dashboard/warehouse/neighborhood-products',
    '/dashboard/marketplace-users',
    '/dashboard/order-pipeline-monitor',
    '/dashboard/commentary',
    '/dashboard/statistics/transactions-by-area',
    '/dashboard/neighborhood-shop-subscriptions',
    '/dashboard/integration-api-keys',
    '/dashboard/archive',
    '/dashboard/qr-system',
  ];
  for (const path of preferred) {
    if (canAccessPath(perms, null, path)) return path;
  }
  return null;
};

export const getGroupedPermissionPicker = (recommendedNames = getRecommendedPermissionNames()) => {
  const known = new Set(recommendedNames.map((n) => permissionKey(n)?.toLowerCase()));
  const grouped = PERMISSIONS_GROUPED.map((g) => ({
    ...g,
    keys: g.keys.filter((k) => known.has(permissionKey(k)?.toLowerCase())),
  })).filter((g) => g.keys.length > 0);

  const inGroups = new Set(grouped.flatMap((g) => g.keys.map((k) => permissionKey(k)?.toLowerCase())));
  const extras = recommendedNames.filter((n) => !inGroups.has(permissionKey(n)?.toLowerCase()));
  if (extras.length) {
    grouped.push({ title: 'Boshqa', keys: extras });
  }
  return grouped;
};

export const canSeeWarehouseSection = (permissions) =>
  hasAnyPermission(permissions, null, [
    'kategoriyalar',
    'mahsulotlar',
    'maxalla maxsulotlari shablonlari',
    'maxalla maxsulotlari',
  ]);

export const canSeeContragentsSection = (permissions) =>
  hasAnyPermission(permissions, null, [
    'kontragent turlari',
    'kontragentlar',
    "maxalla do'konlari",
    "hamkorlik so'rovi",
  ]);

export const canSeeCommentarySection = (permissions) =>
  hasAnyPermission(permissions, null, ['kommentariya shablonlari', 'kommentariyalar']);

export const canSeeOrdersSection = (permissions) =>
  hasAnyPermission(permissions, null, ['buyurtmalar monitoringgi', 'barcha buyurtmalar']);

export const getFirstWarehousePath = (permissions) => {
  if (permissionsInclude(permissions, 'kategoriyalar')) return '/dashboard/warehouse/categories';
  if (permissionsInclude(permissions, 'mahsulotlar')) return '/dashboard/warehouse/products';
  if (
    permissionsInclude(permissions, 'maxalla maxsulotlari shablonlari') ||
    permissionsInclude(permissions, 'maxalla maxsulotlari')
  ) {
    return '/dashboard/warehouse/neighborhood-products';
  }
  return null;
};

export const getFirstContragentPath = (permissions) => {
  if (permissionsInclude(permissions, 'kontragent turlari')) return '/dashboard/contragents/types';
  if (permissionsInclude(permissions, 'kontragentlar')) return '/dashboard/contragents/tuman';
  if (permissionsInclude(permissions, "maxalla do'konlari")) return '/dashboard/contragents/maxalla-dokonlar';
  if (permissionsInclude(permissions, "hamkorlik so'rovi")) return '/dashboard/contragents/hamkorlik-sorovlari';
  return null;
};
