import { useEffect, useMemo, useState } from 'react';
import { Save, RestartAlt, InfoOutlined } from '@mui/icons-material';

const initialDistribution = {
  punkt: 0,
  viloyatAgent: 0,
  tumanAgent: 0,
  mfyAgent: 0,
  punktTransfer: 0,
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
    const { punkt, viloyatAgent, tumanAgent, mfyAgent } = formState.distribution;
    return (
      Number(punkt || 0) +
      Number(viloyatAgent || 0) +
      Number(tumanAgent || 0) +
      Number(mfyAgent || 0)
    );
  }, [formState.distribution]);

  const remainingPercent = useMemo(() => 100 - sumOfBasePercents, [sumOfBasePercents]);

  useEffect(() => {
    if (editingDistribution) {
      setFormState({
        name: editingDistribution.name || '',
        description: editingDistribution.description || '',
        isActive: !!editingDistribution.isActive,
        distribution: {
          ...initialDistribution,
          ...editingDistribution.distribution,
          punktTransfer: editingDistribution.distribution?.punktTransfer || 0,
        },
      });
      setLocalError('');
    } else if (defaults) {
      setFormState((prev) => ({
        ...prev,
        name: '',
        description: defaults.description || '',
        isActive: true,
        distribution: {
          ...initialDistribution,
          ...defaults.distribution,
          punktTransfer: defaults.distribution?.punktTransfer || 0,
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
        mfyAgent: Math.max(
          0,
          Math.min(100, Number(prev.distribution.mfyAgent || 0) + remainingPercent),
        ),
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (sumOfBasePercents !== 100) {
      setLocalError(
        `Asosiy to'rtta foiz (punkt, viloyat, tuman, MFY) yig'indisi 100% bo'lishi kerak. Hozir: ${sumOfBasePercents || 0}%`,
      );
      return;
    }
    setLocalError('');
    onSubmit({
      name: formState.name,
      description: formState.description,
      isActive: formState.isActive,
      distribution: {
        ...formState.distribution,
      },
    });
  };

  const handlePrefillDefaults = () => {
    if (!defaults) return;
    setFormState((prev) => ({
      ...prev,
      name: defaults.name || '',
      description: defaults.description || '',
      distribution: {
        ...initialDistribution,
        ...defaults.distribution,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {editingDistribution ? 'Taqsimlash qiymatlari' : 'Default qiymatlardan foydalaning'}
          </h3>
          <p className="text-sm text-gray-500">
            {editingDistribution
              ? 'Foizlarni moslab, taqsimlashni yangilang'
              : 'Tavsiyaviy qiymatlar asosida yangi konfiguratsiya yarating'}
          </p>
        </div>
        {!editingDistribution && (
          <button
            type="button"
            onClick={handlePrefillDefaults}
            disabled={!defaults || defaultsLoading}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            <RestartAlt className="w-4 h-4" />
            Tavsiya etilgan qiymatlar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
          <input
            type="text"
            required
            value={formState.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Masalan: Standard Distribution"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
          <textarea
            value={formState.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="Bu taqsimlash qachon ishlatilishini yozib qo'ying"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {['punkt', 'viloyatAgent', 'tumanAgent', 'mfyAgent', 'punktTransfer'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field === 'punkt'
                ? 'Punkt (%)'
                : field === 'viloyatAgent'
                ? 'Viloyat Agent (%)'
                : field === 'tumanAgent'
                ? 'Tuman Agent (%)'
                : field === 'mfyAgent'
                ? 'MFY Agent (%)'
                : 'Punkt Transfer (%)'}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={formState.distribution[field]}
              onChange={(e) => handleDistributionChange(field, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <InfoOutlined className="w-4 h-4 text-indigo-500" />
            <span>Asosiy foizlar yig‘indisi: </span>
            <span className="font-semibold text-gray-800">{sumOfBasePercents}%</span>
          </div>
          {remainingPercent !== 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Qolgan:</span>
              <span
                className={`font-semibold ${
                  remainingPercent > 0 ? 'text-amber-600' : 'text-red-600'
                }`}
              >
                {remainingPercent > 0 ? `+${remainingPercent}%` : `${remainingPercent}%`}
              </span>
              {remainingPercent > 0 && (
                <button
                  type="button"
                  onClick={handleBalanceDistribution}
                  className="text-indigo-600 hover:text-indigo-800 text-xs underline"
                >
                  MFY ga qo‘shish
                </button>
              )}
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={formState.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          Faol taqsimlash sifatida saqlash
        </label>
      </div>

      {localError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {localError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {editingDistribution ? 'O‘zgartirish' : 'Saqlash'}
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Bekor qilish
        </button>
      </div>

      {notes.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-2">Eslatmalar</h4>
          <ul className="list-disc pl-5 text-sm text-indigo-900 space-y-1">
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export default KPIDistributionForm;


