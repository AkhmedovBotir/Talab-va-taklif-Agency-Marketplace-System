import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Delete, Visibility, ExpandMore, ChevronRight } from '@mui/icons-material';
import { regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatDate } from '../../utils/dateFormatter';

const RegionTable = ({ regions, loading, onEdit, onDelete, onView, onStatusChange }) => {
  const [expandedRegions, setExpandedRegions] = useState({});
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [regionChildren, setRegionChildren] = useState({});
  const [districtChildren, setDistrictChildren] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const { showSuccess, showError } = useSnackbar();

  // Refresh cache when regions prop changes - re-fetch children for expanded regions
  useEffect(() => {
    const refreshExpandedRegions = async () => {
      // Get current expanded state
      const currentExpandedRegions = expandedRegions;
      const currentExpandedDistricts = expandedDistricts;
      
      // Re-fetch children for currently expanded regions
      const expandedRegionIds = Object.keys(currentExpandedRegions).filter(
        (id) => currentExpandedRegions[id]
      );
      
      const newRegionChildren = {};
      for (const regionId of expandedRegionIds) {
        try {
          const response = await regionAPI.getRegionChildren(regionId);
          if (response.success) {
            // API returns { success: true, count, data: [...] }
            newRegionChildren[regionId] = response.data || [];
          }
        } catch (err) {
          // Silent fail for refresh
          newRegionChildren[regionId] = [];
        }
      }
      setRegionChildren((prev) => ({ ...prev, ...newRegionChildren }));
      
      // Re-fetch MFYs for expanded districts
      const expandedDistrictIds = Object.keys(currentExpandedDistricts).filter(
        (id) => currentExpandedDistricts[id]
      );
      
      const newDistrictChildren = {};
      for (const districtId of expandedDistrictIds) {
        try {
          const response = await regionAPI.getRegionChildren(districtId);
          if (response.success) {
            // API returns { success: true, count, data: [...] }
            newDistrictChildren[districtId] = response.data || [];
          }
        } catch (err) {
          // Silent fail for refresh
          newDistrictChildren[districtId] = [];
        }
      }
      setDistrictChildren((prev) => ({ ...prev, ...newDistrictChildren }));
    };
    
    // Only refresh if there are expanded regions/districts
    if (Object.keys(expandedRegions).some(id => expandedRegions[id]) || 
        Object.keys(expandedDistricts).some(id => expandedDistricts[id])) {
      refreshExpandedRegions();
    } else {
      // If nothing is expanded, just clear cache
      setRegionChildren({});
      setDistrictChildren({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions]);

  const toggleRegion = async (regionId) => {
    const isExpanded = expandedRegions[regionId];
    setExpandedRegions({ ...expandedRegions, [regionId]: !isExpanded });

    if (!isExpanded) {
      // Always fetch fresh data when expanding
      try {
        const response = await regionAPI.getRegionChildren(regionId);
        if (response.success) {
          // API returns { success: true, count, data: [...] }
          setRegionChildren({ ...regionChildren, [regionId]: response.data || [] });
        }
      } catch (err) {
        showError('Tumanlarni yuklashda xatolik');
      }
    }
  };

  const toggleDistrict = async (districtId) => {
    const isExpanded = expandedDistricts[districtId];
    setExpandedDistricts({ ...expandedDistricts, [districtId]: !isExpanded });

    if (!isExpanded) {
      // Always fetch fresh data when expanding
      try {
        const response = await regionAPI.getRegionChildren(districtId);
        if (response.success) {
          // API returns { success: true, count, data: [...] }
          setDistrictChildren({ ...districtChildren, [districtId]: response.data || [] });
        }
      } catch (err) {
        showError('MFYlarni yuklashda xatolik');
      }
    }
  };

  const handleStatusToggle = async (region, newStatus) => {
    setUpdatingStatus({ ...updatingStatus, [region._id]: true });
    try {
      const response = await regionAPI.updateRegionStatus(region._id, newStatus);
      if (response.success) {
        showSuccess(response.message || 'Status muvaffaqiyatli yangilandi');
        // Clear cache for this region's parent to refresh children
        if (region.parent?._id) {
          setRegionChildren((prev) => {
            const newState = { ...prev };
            delete newState[region.parent._id];
            return newState;
          });
        }
        // Clear district children cache if this is a district
        if (region.type === 'district') {
          setDistrictChildren((prev) => {
            const newState = { ...prev };
            delete newState[region._id];
            return newState;
          });
        }
        onStatusChange?.();
      }
    } catch (error) {
      showError(error.message || 'Status yangilashda xatolik');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [region._id]: false });
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'region':
        return 'Viloyat';
      case 'district':
        return 'Tuman';
      case 'mfy':
        return 'MFY';
      default:
        return type;
    }
  };

  const getTypeBadge = (type) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (type) {
      case 'region':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'district':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'mfy':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
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
          const isExpanded = expandedRegions[region._id];
          const districts = regionChildren[region._id] || [];

          return (
            <div key={region._id} className="bg-white">
              {/* Region Row */}
              <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleRegion(region._id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isExpanded ? (
                        <ExpandMore className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={getTypeBadge(region.type)}>{getTypeLabel(region.type)}</span>
                        <h3 className="text-sm font-medium text-gray-900">{region.name}</h3>
                        <span className="text-xs text-gray-500">({region.code})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={region.status === 'active'}
                        onChange={(e) => {
                          const newStatus = e.target.checked ? 'active' : 'inactive';
                          handleStatusToggle(region, newStatus);
                        }}
                        disabled={updatingStatus[region._id]}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(region)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Batafsil ko'rish"
                      >
                        <Visibility className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(region)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(region)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="O'chirish"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Districts (Expanded) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-gray-50"
                  >
                    <div className="pl-8 pr-6 divide-y divide-gray-200">
                      {districts.length === 0 ? (
                        <div className="py-4 text-sm text-gray-500">Tumanlar mavjud emas</div>
                      ) : (
                        districts.map((district) => {
                          const isDistrictExpanded = expandedDistricts[district._id];
                          const mfys = districtChildren[district._id] || [];

                          return (
                            <div key={district._id}>
                              {/* District Row */}
                              <div className="px-4 py-3 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <button
                                      onClick={() => toggleDistrict(district._id)}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      {isDistrictExpanded ? (
                                        <ExpandMore className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={getTypeBadge(district.type)}>
                                          {getTypeLabel(district.type)}
                                        </span>
                                        <h4 className="text-sm font-medium text-gray-900">
                                          {district.name}
                                        </h4>
                                        <span className="text-xs text-gray-500">({district.code})</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={district.status === 'active'}
                                        onChange={(e) => {
                                          const newStatus = e.target.checked ? 'active' : 'inactive';
                                          handleStatusToggle(district, newStatus);
                                        }}
                                        disabled={updatingStatus[district._id]}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => onView(district)}
                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                        title="Batafsil ko'rish"
                                      >
                                        <Visibility className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => onEdit(district)}
                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                        title="Tahrirlash"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => onDelete(district)}
                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="O'chirish"
                                      >
                                        <Delete className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* MFYs (Expanded) */}
                              <AnimatePresence>
                                {isDistrictExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden bg-gray-100"
                                  >
                                    <div className="pl-8 pr-4 divide-y divide-gray-200">
                                      {mfys.length === 0 ? (
                                        <div className="py-3 text-sm text-gray-500">MFYlar mavjud emas</div>
                                      ) : (
                                        mfys.map((mfy) => (
                                          <div
                                            key={mfy._id}
                                            className="px-4 py-2 hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className={getTypeBadge(mfy.type)}>
                                                  {getTypeLabel(mfy.type)}
                                                </span>
                                                <span className="text-sm text-gray-900">{mfy.name}</span>
                                                <span className="text-xs text-gray-500">({mfy.code})</span>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={mfy.status === 'active'}
                                                    onChange={(e) => {
                                                      const newStatus = e.target.checked
                                                        ? 'active'
                                                        : 'inactive';
                                                      handleStatusToggle(mfy, newStatus);
                                                    }}
                                                    disabled={updatingStatus[mfy._id]}
                                                    className="sr-only peer"
                                                  />
                                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                                                </label>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => onView(mfy)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                    title="Batafsil ko'rish"
                                                  >
                                                    <Visibility className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => onEdit(mfy)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                                    title="Tahrirlash"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => onDelete(mfy)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                    title="O'chirish"
                                                  >
                                                    <Delete className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))
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

