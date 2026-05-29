import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clear, Search } from '@mui/icons-material';
import { transactionsStatsAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import useGeoCatalog from '../../hooks/useGeoCatalog';
import ContentStatusPanel from '../../components/common/ContentStatusPanel';
import { resolvePageError } from '../../utils/apiError';
import TransactionsByAreaTable from './TransactionsByAreaTable';
import HorizontalBarChart from './HorizontalBarChart';

const toIso = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

const formatNumber = (value) => new Intl.NumberFormat('uz-UZ').format(Number(value) || 0);
const formatAmount = (value) => `${formatNumber(value)} so'm`;
const toKey = (value) => String(value ?? '');
const getGeoName = (item) => item?.name || item?.title || item?.fullname || item?.full_name;

const TransactionsAreaTab = ({ level = 'region', accent = 'indigo', regionId, districtId, onNavigate }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('delivered');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [responseLevel, setResponseLevel] = useState(level);
  const { regions, districts, mfys, geoEnabled } = useGeoCatalog();
  const [pageError, setPageError] = useState(null);

  const geoNameMaps = useMemo(() => {
    if (!geoEnabled) return { regions: {}, districts: {}, mfys: {} };
    return {
      regions: Object.fromEntries(
        regions
          .map((item) => [toKey(item?.id ?? item?._id), getGeoName(item)])
          .filter(([id, name]) => id && name)
      ),
      districts: Object.fromEntries(
        districts
          .map((item) => [toKey(item?.id ?? item?._id), getGeoName(item)])
          .filter(([id, name]) => id && name)
      ),
      mfys: Object.fromEntries(
        mfys.map((item) => [toKey(item?.id ?? item?._id), getGeoName(item)]).filter(([id, name]) => id && name)
      ),
    };
  }, [geoEnabled, regions, districts, mfys]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await transactionsStatsAPI.getByArea({
        level,
        status: status || undefined,
        from: toIso(from) || undefined,
        to: toIso(to) || undefined,
      });
      if (res?.success) {
        setRows(Array.isArray(res.data?.items) ? res.data.items : []);
        setResponseLevel(res.data?.level || level);
      }
    } catch (e) {
      const pe = resolvePageError(e);
      if (pe) setPageError(pe);
      else showError(e.message || "Tranzaksiya statistikalarini olishda xatolik");
    } finally {
      setLoading(false);
    }
  }, [level, status, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    if (level === 'district' && regionId) {
      return rows.filter((row) => Number(row.region_id) === Number(regionId));
    }
    if (level === 'mfy' && districtId) {
      return rows.filter((row) => Number(row.district_id) === Number(districtId));
    }
    return rows;
  }, [rows, level, regionId, districtId]);

  const filteredTotals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => {
          acc.orders += Number(row.orders_count) || 0;
          acc.amount += Number(row.total_amount) || 0;
          return acc;
        },
        { orders: 0, amount: 0 }
      ),
    [filteredRows]
  );

  const chartRows = useMemo(() => {
    const sorted = [...filteredRows].sort((a, b) => (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0));
    return sorted.slice(0, 20);
  }, [filteredRows]);

  const cardClass =
    accent === 'cyan'
      ? 'bg-cyan-50'
      : accent === 'teal'
      ? 'bg-teal-50'
      : 'bg-indigo-50';
  const ordersClass =
    accent === 'cyan'
      ? 'text-cyan-600'
      : accent === 'teal'
      ? 'text-teal-600'
      : 'text-indigo-600';

  const chartColor = accent === 'cyan' ? 'bg-cyan-500' : accent === 'teal' ? 'bg-teal-500' : 'bg-indigo-500';
  const chartTitle =
    responseLevel === 'mfy'
      ? "MFYlar bo'yicha summa (Top 20)"
      : responseLevel === 'district'
      ? "Tumanlar bo'yicha summa (Top 20)"
      : "Viloyatlar bo'yicha summa";

  if (pageError) {
    return <ContentStatusPanel status={pageError.status} message={pageError.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Default (delivered)</option>
            <option value="pending">Kutilmoqda</option>
            <option value="cancelled">Bekor qilingan</option>
            <option value="delivered">Yetkazib berilgan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tugash</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm inline-flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Qo'llash
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus('delivered');
            setFrom('');
            setTo('');
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm inline-flex items-center gap-2"
        >
          <Clear className="w-4 h-4" />
          Tozalash
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${cardClass} p-4 rounded-lg`}>
        <div>
          <p className="text-sm text-gray-500">Jami buyurtmalar</p>
          <p className={`text-2xl font-bold ${ordersClass}`}>{formatNumber(filteredTotals.orders)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Jami summa</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(filteredTotals.amount)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Satrlar soni</p>
          <p className="text-2xl font-bold text-purple-600">{formatNumber(filteredRows.length)}</p>
        </div>
      </div>

      {!loading && chartRows.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{chartTitle}</h3>
          <div className="max-h-[500px] overflow-y-auto">
            <HorizontalBarChart
              data={chartRows}
              labelKey={(item) => item.region_name || item.district_name || item.mfy_name || '-'}
              valueKey="total_amount"
              color={chartColor}
              formatValue={(v) => formatAmount(v)}
            />
          </div>
        </div>
      )}

      <TransactionsByAreaTable
        rows={filteredRows}
        level={responseLevel}
        loading={loading}
        onNavigate={onNavigate}
        geoNameMaps={geoNameMaps}
      />
    </div>
  );
};

export default TransactionsAreaTab;
