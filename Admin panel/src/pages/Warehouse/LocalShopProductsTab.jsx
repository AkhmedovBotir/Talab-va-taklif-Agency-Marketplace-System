import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clear, Close, Search, Visibility } from '@mui/icons-material';
import {
  localShopProductAPI,
  localShopProductTemplateAPI,
  neighborhoodShopAPI,
} from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import useGeoCatalog from '../../hooks/useGeoCatalog';
import ContentStatusPanel from '../../components/common/ContentStatusPanel';
import { resolvePageError } from '../../utils/apiError';
import GeoCascadeSearchableFields from '../../components/DistrictContragents/GeoCascadeSearchableFields';
import GeoSearchableSelect from '../../components/DistrictContragents/GeoSearchableSelect';
import { descriptionToPlainText } from '../../components/Products/productFormUtils';

const emptyFilters = () => ({
  q: '',
  local_shop_id: '',
  template_id: '',
  region_id: '',
  district_id: '',
  mfy_id: '',
  shop_status: '',
  template_status: '',
});

const formatSum = (n) => {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('uz-UZ')} so'm`;
};

const formatDt = (s) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('uz-UZ');
  } catch {
    return String(s);
  }
};

const statusBadge = (status) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
      status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
    }`}
  >
    {status === 'active' ? 'Faol' : status === 'inactive' ? 'Nofaol' : status || '—'}
  </span>
);

const LocalShopProductsTab = () => {
  const { showError } = useSnackbar();

  const { regions, districts, mfys, geoLoading, geoEnabled } = useGeoCatalog();
  const [shops, setShops] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [pageError, setPageError] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const shopOptions = useMemo(
    () =>
      shops.map((s) => ({
        id: String(s.id ?? s._id),
        title: s.name || `Do'kon #${s.id}`,
        subtitle: s.phone || '',
      })),
    [shops]
  );

  const templateOptions = useMemo(
    () =>
      templates.map((t) => ({
        id: String(t.id ?? t._id),
        title: t.name || `Shablon #${t.id}`,
        subtitle: t.status || '',
      })),
    [templates]
  );

  const fetchMeta = useCallback(async () => {
    try {
      const [shopRes, tplRes] = await Promise.all([
        neighborhoodShopAPI.getAll({ page: 1, limit: 100 }),
        localShopProductTemplateAPI.getAll({ page: 1, limit: 100 }),
      ]);
      const shopPayload = shopRes.data || {};
      const shopItems = Array.isArray(shopPayload.items)
        ? shopPayload.items
        : Array.isArray(shopPayload)
          ? shopPayload
          : [];
      setShops(shopItems);
      const tplPayload = tplRes.data || {};
      const tplItems = Array.isArray(tplPayload.items)
        ? tplPayload.items
        : Array.isArray(tplPayload)
          ? tplPayload
          : [];
      setTemplates(tplItems);
    } catch {
      setShops([]);
      setTemplates([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await localShopProductAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        q: appliedFilters.q || undefined,
        local_shop_id: appliedFilters.local_shop_id || undefined,
        template_id: appliedFilters.template_id || undefined,
        region_id: appliedFilters.region_id || undefined,
        district_id: appliedFilters.district_id || undefined,
        mfy_id: appliedFilters.mfy_id || undefined,
        shop_status: appliedFilters.shop_status || undefined,
        template_status: appliedFilters.template_status || undefined,
      });
      const payload = res.data || {};
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setRows(items);
      setPagination((prev) => ({
        ...prev,
        page: Number(payload.page) || prev.page,
        limit: Number(payload.limit) || prev.limit,
        total: Number(payload.total) ?? items.length,
        pages:
          Number(payload.total_pages) ||
          Math.max(1, Math.ceil((Number(payload.total) || items.length) / (Number(payload.limit) || prev.limit || 1))),
      }));
    } catch (e) {
      const pe = resolvePageError(e);
      if (pe) setPageError(pe);
      else showError(e.message || 'Mahsulotlar ro‘yxatini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    const empty = emptyFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openView = async (row) => {
    setViewOpen(true);
    setViewRow(row);
    setViewLoading(true);
    try {
      const res = await localShopProductAPI.getById(row.id);
      if (res.data) setViewRow(res.data);
    } catch (e) {
      showError(e.message || 'Mahsulotni yuklab bo‘lmadi');
    } finally {
      setViewLoading(false);
    }
  };

  if (pageError) {
    return <ContentStatusPanel status={pageError.status} message={pageError.message} />;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Maxalla do&apos;koni mahsulotlari</h3>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Clear className="w-4 h-4" />
            Tozalash
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Shablon yoki do'kon nomi..."
              value={draftFilters.q}
              onChange={(e) => setDraftFilters((f) => ({ ...f, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <GeoSearchableSelect
            label="Do'kon"
            required={false}
            allowClear
            optionalPlaceholder="Barcha do'konlar"
            value={draftFilters.local_shop_id}
            onChange={(id) => setDraftFilters((f) => ({ ...f, local_shop_id: id }))}
            options={shopOptions}
            disabled={false}
            emptyMessage="Do'konlar topilmadi"
          />
          <GeoSearchableSelect
            label="Shablon"
            required={false}
            allowClear
            optionalPlaceholder="Barcha shablonlar"
            value={draftFilters.template_id}
            onChange={(id) => setDraftFilters((f) => ({ ...f, template_id: id }))}
            options={templateOptions}
            disabled={false}
            emptyMessage="Shablonlar topilmadi"
          />
          <select
            value={draftFilters.shop_status}
            onChange={(e) => setDraftFilters((f) => ({ ...f, shop_status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Do'kon statusi — barchasi</option>
            <option value="active">Do'kon faol</option>
            <option value="inactive">Do'kon nofaol</option>
          </select>
          <select
            value={draftFilters.template_status}
            onChange={(e) => setDraftFilters((f) => ({ ...f, template_status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Shablon statusi — barchasi</option>
            <option value="active">Shablon faol</option>
            <option value="inactive">Shablon nofaol</option>
          </select>
        </div>

        {geoEnabled && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Hudud bo&apos;yicha</p>
          <GeoCascadeSearchableFields
            required={false}
            allowClear
            geoLoading={geoLoading}
            regions={regions}
            districts={districts}
            mfys={mfys}
            values={{
              region_id: draftFilters.region_id,
              district_id: draftFilters.district_id,
              mfy_id: draftFilters.mfy_id,
            }}
            onChange={(patch) => setDraftFilters((f) => ({ ...f, ...patch }))}
          />
        </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            <Search fontSize="small" />
            Qidirish
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[160px]">Shablon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[160px]">Do&apos;kon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Miqdor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Narx</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Asl narx</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Do&apos;kon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Shablon</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Amal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Mahsulotlar topilmadi.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const tpl = row.template || {};
                const shop = row.shop || {};
                const unitLabel = [row.quantity, tpl.unit].filter((x) => x != null && x !== '').join(' ');
                return (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70 align-top">
                    <td className="px-4 py-3 font-medium text-gray-900">{tpl.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{shop.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {unitLabel}
                      {tpl.unit_size ? ` (${tpl.unit_size})` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatSum(row.price)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatSum(row.original_price)}</td>
                    <td className="px-4 py-3">{statusBadge(shop.status)}</td>
                    <td className="px-4 py-3">{statusBadge(tpl.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openView(row)}
                        className="inline-flex items-center justify-center p-2 text-sky-600 hover:bg-sky-50 rounded-md"
                        title="Ko'rish"
                      >
                        <Visibility fontSize="small" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Jami: <span className="font-semibold">{pagination.total}</span>
          <span className="text-gray-400 ml-2">(faqat ko&apos;rish — tahrirlash do&apos;kon tomonidan)</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
          </select>
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Oldingi
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {Math.max(1, pagination.pages)}
          </span>
          <button
            type="button"
            disabled={pagination.page >= Math.max(1, pagination.pages)}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Keyingi
          </button>
        </div>
      </div>

      {viewOpen &&
        viewRow &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ margin: 0 }}>
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setViewOpen(false);
                setPreviewImage('');
              }}
            />
            <div className="relative bg-white shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-800">Mahsulot tafsilotlari</h3>
                <button
                  type="button"
                  onClick={() => {
                    setViewOpen(false);
                    setPreviewImage('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Close />
                </button>
              </div>
              {viewLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600" />
                </div>
              ) : (
                <div className="p-5 space-y-6">
                  <section>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Zaxira</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>{' '}
                        <span className="font-medium text-gray-900">{viewRow.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Miqdor:</span>{' '}
                        <span className="font-medium text-gray-900">{viewRow.quantity ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Narx:</span>{' '}
                        <span className="font-medium text-gray-900">{formatSum(viewRow.price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Asl narx:</span>{' '}
                        <span className="font-medium text-gray-900">{formatSum(viewRow.original_price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Yaratilgan:</span>{' '}
                        <span className="font-medium text-gray-900">{formatDt(viewRow.createdAt ?? viewRow.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Yangilangan:</span>{' '}
                        <span className="font-medium text-gray-900">{formatDt(viewRow.updatedAt ?? viewRow.updated_at)}</span>
                      </div>
                    </div>
                  </section>

                  {viewRow.template && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Shablon</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Nom:</span>{' '}
                          <span className="font-medium">{viewRow.template.name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span> {statusBadge(viewRow.template.status)}
                        </div>
                        <div>
                          <span className="text-gray-500">Birlik:</span>{' '}
                          <span className="font-medium">
                            {viewRow.template.unit || '—'}
                            {viewRow.template.unit_size ? ` (${viewRow.template.unit_size})` : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3 mb-1">Tavsif</p>
                      <div className="border border-gray-200 rounded-md p-3 text-sm bg-gray-50 whitespace-pre-wrap">
                        {descriptionToPlainText(viewRow.template.description) || '—'}
                      </div>
                      {Array.isArray(viewRow.template.images) && viewRow.template.images.length > 0 && (
                        <>
                          <p className="text-sm text-gray-500 mt-3 mb-1">Rasmlar</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {viewRow.template.images.map((img, idx) => (
                              <button
                                key={`${idx}-${String(img).slice(0, 16)}`}
                                type="button"
                                onClick={() => setPreviewImage(String(img))}
                                className="block w-full"
                              >
                                <img
                                  src={img}
                                  alt=""
                                  className="w-full h-24 object-cover rounded border border-gray-200"
                                />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </section>
                  )}

                  {viewRow.shop && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Do&apos;kon</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Nom:</span>{' '}
                          <span className="font-medium">{viewRow.shop.name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span> {statusBadge(viewRow.shop.status)}
                        </div>
                        <div>
                          <span className="text-gray-500">Telefon:</span>{' '}
                          <span className="font-medium">{viewRow.shop.phone || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">MFY ID:</span>{' '}
                          <span className="font-medium">{viewRow.shop.mfy_id ?? '—'}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Yetkazish MFYlari</h4>
                    {Array.isArray(viewRow.delivery_areas) && viewRow.delivery_areas.length > 0 ? (
                      <ul className="text-sm text-gray-800 list-disc pl-5 space-y-1">
                        {viewRow.delivery_areas.map((a) => (
                          <li key={a.mfy_id ?? a.mfy_name}>
                            {a.mfy_name || `MFY #${a.mfy_id}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Belgilanmagan</p>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {previewImage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" style={{ margin: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setPreviewImage('')} />
            <div className="relative max-w-5xl w-full max-h-[90vh]">
              <button
                type="button"
                onClick={() => setPreviewImage('')}
                className="absolute -top-10 right-0 text-white/90 hover:text-white"
              >
                <Close />
              </button>
              <img src={previewImage} alt="" className="w-full max-h-[90vh] object-contain rounded-lg" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default LocalShopProductsTab;
