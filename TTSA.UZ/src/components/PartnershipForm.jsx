import { useState, useEffect } from 'react';
import { createPartnershipRequest } from '../services/api';
import RegionSelector from './RegionSelector';

const PartnershipForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    inn: '',
    mfo: '',
    accountNumber: '',
    viloyat: null,
    tuman: null,
    mfy: null,
    activity: '',
    managerFirstName: '',
    managerLastName: '',
    managerPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegionSelect = (type, region) => {
    setFormData((prev) => {
      const newData = { ...prev };
      if (type === 'region') {
        newData.viloyat = region;
        newData.tuman = null;
        newData.mfy = null;
      } else if (type === 'district') {
        newData.tuman = region;
        newData.mfy = null;
      } else if (type === 'mfy') {
        newData.mfy = region;
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.companyName || !formData.inn || !formData.mfy || !formData.managerPhone) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(formData.managerPhone)) {
      setError('Telefon raqami noto\'g\'ri formatda. Format: +998901234567');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        companyName: formData.companyName,
        inn: formData.inn,
        mfo: formData.mfo,
        accountNumber: formData.accountNumber,
        viloyat: formData.viloyat?._id,
        tuman: formData.tuman?._id,
        mfy: formData.mfy?._id,
        activity: formData.activity,
        managerFirstName: formData.managerFirstName,
        managerLastName: formData.managerLastName,
        managerPhone: formData.managerPhone,
      };

      await createPartnershipRequest(requestData);
      setSuccess(true);
      setFormData({
        companyName: '',
        inn: '',
        mfo: '',
        accountNumber: '',
        viloyat: null,
        tuman: null,
        mfy: null,
        activity: '',
        managerFirstName: '',
        managerLastName: '',
        managerPhone: '',
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-2 text-gray-900">Hamkor bo'lish so'rovi</h2>
      <p className="text-gray-600 mb-6">
        Biz bilan hamkor bo'lish uchun quyidagi formani to'ldiring
      </p>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          So'rovingiz muvaffaqiyatli yuborildi! Tez orada siz bilan bog'lanamiz.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kompaniya nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              placeholder="Kompaniya nomi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              INN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="inn"
              value={formData.inn}
              onChange={handleInputChange}
              required
              placeholder="INN raqami"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MFO
            </label>
            <input
              type="text"
              name="mfo"
              value={formData.mfo}
              onChange={handleInputChange}
              placeholder="MFO kodi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hisob raqami
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Hisob raqami"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <RegionSelector
          type="region"
          label="Viloyat"
          selectedRegion={formData.viloyat}
          onSelect={(region) => handleRegionSelect('region', region)}
          required
        />

        {formData.viloyat && (
          <RegionSelector
            type="district"
            label="Tuman"
            parentId={formData.viloyat._id}
            selectedRegion={formData.tuman}
            onSelect={(region) => handleRegionSelect('district', region)}
          />
        )}

        {formData.tuman && (
          <RegionSelector
            type="mfy"
            label="MFY"
            parentId={formData.tuman._id}
            selectedRegion={formData.mfy}
            onSelect={(region) => handleRegionSelect('mfy', region)}
            required
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Faoliyat turi
          </label>
          <textarea
            name="activity"
            value={formData.activity}
            onChange={handleInputChange}
            placeholder="Kompaniya faoliyati haqida qisqacha ma'lumot"
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menejer ismi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="managerFirstName"
              value={formData.managerFirstName}
              onChange={handleInputChange}
              required
              placeholder="Ism"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menejer familiyasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="managerLastName"
              value={formData.managerLastName}
              onChange={handleInputChange}
              required
              placeholder="Familiya"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menejer telefon raqami <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="managerPhone"
            value={formData.managerPhone}
            onChange={handleInputChange}
            required
            placeholder="+998901234567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
        >
          {loading ? 'Yuborilmoqda...' : 'So\'rov yuborish'}
        </button>
      </form>
    </div>
  );
};

export default PartnershipForm;
