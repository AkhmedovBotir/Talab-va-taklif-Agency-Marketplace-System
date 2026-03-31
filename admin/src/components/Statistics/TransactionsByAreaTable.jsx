const formatNumber = (value) => new Intl.NumberFormat('uz-UZ').format(Number(value) || 0);

const formatAmount = (value) => `${formatNumber(value)} so'm`;

const TransactionsByAreaTable = ({ rows, level, loading, onNavigate }) => {
  const showRegion = level === 'region';
  const showDistrict = level === 'district';
  const showMfy = level === 'mfy';
  const hasAction = (showRegion || showDistrict) && typeof onNavigate === 'function';
  const colSpan = (showRegion ? 1 : 1) + (showDistrict || showMfy ? 1 : 0) + (showMfy ? 1 : 0) + 2 + (hasAction ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              {showRegion && <th className="px-4 py-3 text-left font-semibold">Viloyat</th>}
              {showDistrict && <th className="px-4 py-3 text-left font-semibold">Tuman</th>}
              {showMfy && <th className="px-4 py-3 text-left font-semibold">MFY</th>}
              {!showRegion && <th className="px-4 py-3 text-left font-semibold">Viloyat ID</th>}
              {(showDistrict || showMfy) && <th className="px-4 py-3 text-left font-semibold">Tuman ID</th>}
              {showMfy && <th className="px-4 py-3 text-left font-semibold">MFY ID</th>}
              <th className="px-4 py-3 text-right font-semibold">Buyurtmalar soni</th>
              <th className="px-4 py-3 text-right font-semibold">Jami summa</th>
              {hasAction && <th className="px-4 py-3 text-right font-semibold">Amallar</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
                  Ma'lumot topilmadi
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={`${level}-${idx}-${row.region_id || ''}-${row.district_id || ''}-${row.mfy_id || ''}`} className="border-t border-gray-100 hover:bg-gray-50">
                  {showRegion && <td className="px-4 py-3">{row.region_name || '-'}</td>}
                  {showDistrict && <td className="px-4 py-3">{row.district_name || '-'}</td>}
                  {showMfy && <td className="px-4 py-3">{row.mfy_name || '-'}</td>}
                  {!showRegion && <td className="px-4 py-3">{row.region_id ?? '-'}</td>}
                  {(showDistrict || showMfy) && <td className="px-4 py-3">{row.district_id ?? '-'}</td>}
                  {showMfy && <td className="px-4 py-3">{row.mfy_id ?? '-'}</td>}
                  <td className="px-4 py-3 text-right font-medium">{formatNumber(row.orders_count)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatAmount(row.total_amount)}</td>
                  {hasAction && (
                    <td className="px-4 py-3 text-right">
                      {showRegion && (
                        <button
                          type="button"
                          onClick={() => onNavigate('region', { id: row.region_id, name: row.region_name || `Viloyat #${row.region_id}` })}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Tumanlar →
                        </button>
                      )}
                      {showDistrict && (
                        <button
                          type="button"
                          onClick={() => onNavigate('district', { id: row.district_id, name: row.district_name || `Tuman #${row.district_id}` })}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          MFYlar →
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsByAreaTable;
