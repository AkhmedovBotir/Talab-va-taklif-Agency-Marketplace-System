import { useEffect, useMemo, useState } from 'react';
import { 
  Save, 
  RestartAlt, 
  InfoOutlined, 
  CheckCircle,
  Warning,
  Store,
  LocationCity,
  AttachMoney,
  LocalShipping,
  AutoAwesome,
  Percent,
  People
} from '@mui/icons-material';

const initialDistribution = {
  punkt: 0,
  agent: 0,
  manager: 0,
  finance: 0,
  deliveryService: 0,
};

const KPIDistributionForm = ({
  defaults,
  defaultsLoading,
  submitting,
  editingDistribution,
  onSubmit,
  onCancelEdit,
}) => {
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    isActive: true,
    distribution: { ...initialDistribution },
  });
  const [localError, setLocalError] = useState('');

  const notes = defaults?.notes || [];

  const sumOfBasePercents = useMemo(() => {
    const { punkt, agent, manager, finance, deliveryService } = formState.distribution;
    return (
      Number(punkt || 0) +
      Number(agent || 0) +
      Number(manager || 0) +
      Number(finance || 0) +
      Number(deliveryService || 0)
    );
  }, [formState.distribution]);

  const remainingPercent = useMemo(() => 100 - sumOfBasePercents, [sumOfBasePercents]);
  const progressPercent = useMemo(() => Math.min(100, Math.max(0, sumOfBasePercents)), [sumOfBasePercents]);

  const fieldConfig = {
    punkt: { 
      label: 'Punkt', 
      icon: Store, 
      bgColor: 'bg-indigo-50', 
      borderColor: 'border-indigo-200', 
      textColor: 'text-indigo-700',
      focusRing: 'focus:ring-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    agent: { 
      label: 'Agent', 
      icon: LocationCity, 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200', 
      textColor: 'text-blue-700',
      focusRing: 'focus:ring-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    manager: { 
      label: 'Menejer', 
      icon: People, 
      bgColor: 'bg-purple-50', 
      borderColor: 'border-purple-200', 
      textColor: 'text-purple-700',
      focusRing: 'focus:ring-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    finance: { 
      label: 'Moliya', 
      icon: AttachMoney, 
      bgColor: 'bg-teal-50', 
      borderColor: 'border-teal-200', 
      textColor: 'text-teal-700',
      focusRing: 'focus:ring-teal-500',
      gradient: 'from-teal-500 to-teal-600'
    },
    deliveryService: { 
      label: 'Yetkazib Berish', 
      icon: LocalShipping, 
      bgColor: 'bg-cyan-50', 
      borderColor: 'border-cyan-200', 
      textColor: 'text-cyan-700',
      focusRing: 'focus:ring-cyan-500',
      gradient: 'from-cyan-500 to-cyan-600'
    },
  };

  useEffect(() => {
    if (editingDistribution) {
      const dist = editingDistribution.distribution || {};
      
      setFormState({
        name: editingDistribution.name || '',
        description: editingDistribution.description || '',
        isActive: !!editingDistribution.isActive,
        distribution: {
          ...initialDistribution,
          punkt: dist.punkt || 0,
          agent: dist.agent || 0,
          manager: dist.manager || 0,
          finance: dist.finance || 0,
          deliveryService: dist.deliveryService || 0,
        },
      });
      setLocalError('');
    } else if (defaults) {
      const dist = defaults.distribution || {};
      
      setFormState((prev) => ({
        ...prev,
        name: '',
        description: defaults.description || '',
        isActive: true,
        distribution: {
          ...initialDistribution,
          punkt: dist.punkt || 0,
          agent: dist.agent || 0,
          manager: dist.manager || 0,
          finance: dist.finance || 0,
          deliveryService: dist.deliveryService || 0,
        },
      }));
      setLocalError('');
    }
  }, [editingDistribution, defaults]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDistributionChange = (field, value) => {
    const sanitized = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    setFormState((prev) => ({
      ...prev,
      distribution: {
        ...prev.distribution,
        [field]: sanitized,
      },
    }));
  };

  const handleBalanceDistribution = () => {
    if (remainingPercent === 0) return;
    setFormState((prev) => ({
      ...prev,
      distribution: {
        ...prev.distribution,
        finance: Math.max(
          0,
          Math.min(100, Number(prev.distribution.finance || 0) + remainingPercent),
        ),
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (sumOfBasePercents !== 100) {
      setLocalError(
        `Asosiy taqsimlashlar (punkt, agent, manager, finance, deliveryService) yig'indisi 100% bo'lishi kerak. Hozirgi yig'indi: ${sumOfBasePercents || 0}%`,
      );
      return;
    }
    setLocalError('');
    // Prepare distribution object with only new format fields
    const distribution = {
      punkt: Number(formState.distribution.punkt || 0),
      agent: Number(formState.distribution.agent || 0),
      manager: Number(formState.distribution.manager || 0),
      finance: Number(formState.distribution.finance || 0),
      deliveryService: Number(formState.distribution.deliveryService || 0),
    };
    
    onSubmit({
      name: formState.name,
      description: formState.description,
      isActive: formState.isActive,
      distribution,
    });
  };

  const handlePrefillDefaults = () => {
    if (!defaults) return;
    const dist = defaults.distribution || {};
    
    setFormState((prev) => ({
      ...prev,
      name: defaults.name || '',
      description: defaults.description || '',
      distribution: {
        ...initialDistribution,
        punkt: dist.punkt || 0,
        agent: dist.agent || 0,
        manager: dist.manager || 0,
        finance: dist.finance || 0,
        deliveryService: dist.deliveryService || 0,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Basic Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <AutoAwesome className="w-4 h-4 text-indigo-600" />
              Asosiy Ma'lumotlar
          </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Taqsimlash nomi va tavsifini kiriting
          </p>
        </div>
        {!editingDistribution && (
          <button
            type="button"
            onClick={handlePrefillDefaults}
            disabled={!defaults || defaultsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-md hover:from-indigo-100 hover:to-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium border border-indigo-200"
          >
              <RestartAlt className="w-3 h-3" />
            Tavsiya etilgan qiymatlar
          </button>
        )}
      </div>

        <div className="grid grid-cols-1 gap-3">
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nomi <span className="text-red-500">*</span>
            </label>
          <input
            type="text"
            required
            value={formState.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Masalan: Standard Distribution"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
          />
        </div>
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tavsif
            </label>
          <textarea
            value={formState.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              placeholder="Bu taqsimlash qachon va qanday holatlarda ishlatilishini yozib qo'ying"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-white"
          />
          </div>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="space-y-3">
        {/* Main Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-indigo-600" />
              Asosiy Taqsimlashlar
            </h4>
            <p className="text-xs text-gray-600">
              Barcha asosiy taqsimlashlar yig'indisi <span className="font-semibold text-indigo-600">100%</span> bo'lishi kerak
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Yig'indi</span>
              <span className={`text-xs font-bold ${sumOfBasePercents === 100 ? 'text-green-600' : sumOfBasePercents > 100 ? 'text-red-600' : 'text-amber-600'}`}>
                {sumOfBasePercents}% / 100%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  sumOfBasePercents === 100
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : sumOfBasePercents > 100
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            {remainingPercent !== 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">Qolgan:</span>
                <span className={`font-semibold ${remainingPercent > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {remainingPercent > 0 ? `+${remainingPercent}%` : `${remainingPercent}%`}
                </span>
                {remainingPercent > 0 && (
                  <button
                    type="button"
                    onClick={handleBalanceDistribution}
                    className="text-indigo-600 hover:text-indigo-800 underline font-medium text-xs"
                  >
                    Moliya ga qo'shish
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Distribution Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {['punkt', 'agent', 'manager', 'finance', 'deliveryService'].map((field) => {
              const config = fieldConfig[field];
              const Icon = config.icon;
              return (
                <div
                  key={field}
                  className={`${config.bgColor} ${config.borderColor} border rounded-lg p-2 transition-all hover:shadow-sm hover:scale-[1.01]`}
                >
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
                    <span>{config.label}</span>
                </label>
                  <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formState.distribution[field] || 0}
                  onChange={(e) => handleDistributionChange(field, e.target.value)}
                      className={`w-full px-2 py-1.5 text-sm ${config.borderColor} border rounded-md focus:outline-none focus:ring-1 ${config.focusRing} focus:border-transparent transition-all font-semibold ${config.textColor} bg-white`}
                />
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${config.textColor} font-semibold text-xs pointer-events-none`}>
                      %
                    </span>
                  </div>
              </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Status and Summary Card */}
      <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg border border-gray-200 shadow-sm p-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {sumOfBasePercents === 100 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Warning className="w-4 h-4 text-amber-600" />
              )}
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Asosiy taqsimlashlar yig'indisi:
                </p>
                <p className={`text-base font-bold ${sumOfBasePercents === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                  {sumOfBasePercents}%
                </p>
            </div>
            </div>
        </div>
          <label className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
          <input
            type="checkbox"
            checked={formState.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
          />
            <span className="text-xs font-semibold text-gray-700">
          Faol taqsimlash sifatida saqlash
            </span>
        </label>
        </div>
      </div>

      {/* Error Message */}
      {localError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <Warning className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-800 font-medium">{localError}</p>
          </div>
        </motion.div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1.5">
            <InfoOutlined className="w-3.5 h-3.5" />
            Eslatmalar
          </h4>
          <ul className="list-disc pl-4 text-xs text-indigo-900 space-y-1">
            {notes.map((note, index) => (
              <li key={index} className="leading-relaxed">{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancelEdit}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={submitting || sumOfBasePercents !== 100}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Saqlanmoqda...' : editingDistribution ? 'O\'zgartirish' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
};

export default KPIDistributionForm;


