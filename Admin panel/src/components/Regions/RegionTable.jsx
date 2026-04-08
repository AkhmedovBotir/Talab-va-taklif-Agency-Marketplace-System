import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Delete, Visibility, ExpandMore, ChevronRight } from '@mui/icons-material';

const RegionTable = ({
  regions,
  districts,
  mfys,
  loading,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
}) => {
  const [expandedRegions, setExpandedRegions] = useState({});
  const [expandedDistricts, setExpandedDistricts] = useState({});

  const districtsByRegion = useMemo(() => {
    const grouped = {};
    districts.forEach((district) => {
      const regionId = district.region_id;
      if (!grouped[regionId]) grouped[regionId] = [];
      grouped[regionId].push(district);
    });
    return grouped;
  }, [districts]);

  const mfysByDistrict = useMemo(() => {
    const grouped = {};
    mfys.forEach((mfy) => {
      const districtId = mfy.district_id;
      if (!grouped[districtId]) grouped[districtId] = [];
      grouped[districtId].push(mfy);
    });
    return grouped;
  }, [mfys]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Regionlar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {regions.map((region) => {
          const regionId = region.id ?? region._id;
          const isExpanded = !!expandedRegions[regionId];
          const regionDistricts = districtsByRegion[regionId] || [];

          return (
            <div key={regionId} className="bg-white">
              <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setExpandedRegions((prev) => ({ ...prev, [regionId]: !prev[regionId] }))
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ExpandMore className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Viloyat
                    </span>
                    <h3 className="text-sm font-medium text-gray-900">{region.name}</h3>
                    <span className="text-xs text-gray-500">({region.code})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={region.status === 'active'}
                        onChange={(e) => onStatusChange('region', region, e.target.checked ? 'active' : 'inactive')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                    <button onClick={() => onView({ ...region, type: 'region' })} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                      <Visibility className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit({ ...region, type: 'region' })} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete({ ...region, type: 'region' })} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50"
                  >
                    <div className="pl-8 pr-6 divide-y divide-gray-200">
                      {regionDistricts.length === 0 ? (
                        <div className="py-4 text-sm text-gray-500">Tumanlar mavjud emas</div>
                      ) : (
                        regionDistricts.map((district) => {
                          const districtId = district.id ?? district._id;
                          const isDistrictExpanded = !!expandedDistricts[districtId];
                          const districtMfys = mfysByDistrict[districtId] || [];

                          return (
                            <div key={districtId}>
                              <div className="px-4 py-3 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() =>
                                        setExpandedDistricts((prev) => ({
                                          ...prev,
                                          [districtId]: !prev[districtId],
                                        }))
                                      }
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      {isDistrictExpanded ? (
                                        <ExpandMore className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Tuman
                                    </span>
                                    <h4 className="text-sm font-medium text-gray-900">{district.name}</h4>
                                    <span className="text-xs text-gray-500">({district.code})</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={district.status === 'active'}
                                        onChange={(e) =>
                                          onStatusChange(
                                            'district',
                                            district,
                                            e.target.checked ? 'active' : 'inactive'
                                          )
                                        }
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                    </label>
                                    <button onClick={() => onView({ ...district, type: 'district' })} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                                      <Visibility className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onEdit({ ...district, type: 'district' })} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDelete({ ...district, type: 'district' })} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                                      <Delete className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <AnimatePresence>
                                {isDistrictExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-gray-100"
                                  >
                                    <div className="pl-8 pr-4 divide-y divide-gray-200">
                                      {districtMfys.length === 0 ? (
                                        <div className="py-3 text-sm text-gray-500">MFYlar mavjud emas</div>
                                      ) : (
                                        districtMfys.map((mfy) => {
                                          const mfyId = mfy.id ?? mfy._id;
                                          return (
                                            <div key={mfyId} className="px-4 py-2 hover:bg-gray-50 transition-colors">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                    MFY
                                                  </span>
                                                  <span className="text-sm text-gray-900">{mfy.name}</span>
                                                  <span className="text-xs text-gray-500">({mfy.code})</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                  <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                      type="checkbox"
                                                      checked={mfy.status === 'active'}
                                                      onChange={(e) =>
                                                        onStatusChange(
                                                          'mfy',
                                                          mfy,
                                                          e.target.checked ? 'active' : 'inactive'
                                                        )
                                                      }
                                                      className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                                  </label>
                                                  <button onClick={() => onView({ ...mfy, type: 'mfy' })} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                                                    <Visibility className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={() => onEdit({ ...mfy, type: 'mfy' })} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={() => onDelete({ ...mfy, type: 'mfy' })} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                                                    <Delete className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegionTable;
