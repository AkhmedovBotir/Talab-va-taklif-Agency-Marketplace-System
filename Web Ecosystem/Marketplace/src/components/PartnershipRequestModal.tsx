import { useCallback, useEffect, useState } from 'react';
import Icon from './ui/Icon';
import RegionSelect, { RegionOption } from './ui/RegionSelect';
import ActivityTypeSelect from './ui/ActivityTypeSelect';
import PhoneInput from './ui/PhoneInput';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, {
  CreatePartnershipRequest,
  Region,
  ContragentType,
} from '../services/api';

interface PartnershipRequestModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

const initialForm: CreatePartnershipRequest = {
  companyName: '',
  inn: '',
  mfo: '',
  accountNumber: '',
  viloyat: '',
  tuman: '',
  mfy: '',
  activityType: '',
  managerFirstName: '',
  managerLastName: '',
  managerPhone: '',
};

function sortRegions(regions: Region[]): Region[] {
  return [...regions].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'uz')
  );
}

function toOptions(regions: Region[]): RegionOption[] {
  return regions.map((r) => ({ _id: r._id, name: r.name || '' }));
}

export default function PartnershipRequestModal({
  open,
  onClose,
  token,
  onSuccess,
}: PartnershipRequestModalProps) {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePartnershipRequest>({
    ...initialForm,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [viloyatlar, setViloyatlar] = useState<Region[]>([]);
  const [tumanlar, setTumanlar] = useState<Region[]>([]);
  const [mfyList, setMfyList] = useState<Region[]>([]);

  const loadAllRegions = useCallback(
    async (params: {
      type: 'region' | 'district' | 'mfy';
      parent?: string;
    }): Promise<Region[]> => {
      const base = { ...params, page: 1, limit: 1000 };
      const first = await apiService.getRegions(base);
      let all: Region[] = [...(first.data || [])];
      let page = first.page;
      while (page < first.totalPages) {
        page += 1;
        const next = await apiService.getRegions({ ...base, page });
        all = [...all, ...(next.data || [])];
      }
      return sortRegions(all);
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadAllRegions({ type: 'region' })
      .then((list) => {
        if (!cancelled) setViloyatlar(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, loadAllRegions]);

  useEffect(() => {
    if (!formData.viloyat) {
      setTumanlar([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'district', parent: formData.viloyat })
      .then((list) => {
        if (!cancelled) setTumanlar(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [formData.viloyat, loadAllRegions]);

  useEffect(() => {
    if (!formData.tuman) {
      setMfyList([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'mfy', parent: formData.tuman })
      .then((list) => {
        if (!cancelled) setMfyList(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [formData.tuman, loadAllRegions]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.companyName.trim() || formData.companyName.trim().length < 2) {
      e.companyName = "Kompaniya nomi kamida 2 ta belgi bo'lishi kerak";
    }
    if (!formData.inn.trim() || !/^\d{9}$|^\d{12}$/.test(formData.inn.trim())) {
      e.inn = "INN 9 yoki 12 ta raqamdan iborat bo'lishi kerak";
    }
    if (!formData.mfo.trim()) e.mfo = "MFO raqami kiritilishi shart";
    if (!formData.accountNumber.trim())
      e.accountNumber = "Hisob raqami kiritilishi shart";
    if (!formData.viloyat) e.viloyat = 'Viloyat tanlanishi shart';
    if (!formData.tuman) e.tuman = 'Tuman tanlanishi shart';
    if (!formData.mfy) e.mfy = 'MFY tanlanishi shart';
    if (!formData.activityType)
      e.activityType = 'Faoliyat turi tanlanishi shart';
    if (
      !formData.managerFirstName.trim() ||
      formData.managerFirstName.trim().length < 2
    ) {
      e.managerFirstName = "Rahbar ismi kamida 2 ta belgi bo'lishi kerak";
    }
    if (
      !formData.managerLastName.trim() ||
      formData.managerLastName.trim().length < 2
    ) {
      e.managerLastName = "Rahbar familiyasi kamida 2 ta belgi bo'lishi kerak";
    }
    if (!formData.managerPhone.trim())
      e.managerPhone = "Rahbar telefon raqami kiritilishi shart";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const digits = formData.managerPhone.replace(/\D/g, '').slice(0, 9);
    const payload: CreatePartnershipRequest = {
      ...formData,
      managerPhone: digits.length === 9 ? digits : formData.managerPhone,
    };
    try {
      setLoading(true);
      const res = await apiService.createPartnershipRequest(payload, token);
      if (res.success) {
        showSuccess("Hamkorlik so'rovi muvaffaqiyatli yuborildi");
        setFormData({ ...initialForm });
        setErrors({});
        onSuccess();
        onClose();
      } else {
        showError(res.message || "So'rov yuborishda xatolik");
      }
    } catch (err: unknown) {
      showError(
        (err as { message?: string })?.message ||
          "Hamkorlik so'rovini yuborishda xatolik yuz berdi"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalContainer"
        style={{
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          paddingBottom: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #e5e5e7',
          }}
        >
          <h2 className="modalTitle">Hamkorlik so'rovi</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Icon name="close" size={24} color="#666" />
          </button>
        </div>

        <div style={{ padding: '0 4px' }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#333',
              marginBottom: 12,
            }}
          >
            Kompaniya ma'lumotlari
          </p>

          <div style={{ marginBottom: 16 }}>
            <label className="regionSelectLabel">Kompaniya nomi *</label>
            <input
              type="text"
              className="modalInput"
              style={errors.companyName ? { borderColor: '#FF3B30' } : undefined}
              placeholder="Kompaniya nomini kiriting"
              value={formData.companyName}
              onChange={(ev) => {
                setFormData({ ...formData, companyName: ev.target.value });
                if (errors.companyName) setErrors({ ...errors, companyName: '' });
              }}
            />
            {errors.companyName && (
              <div className="regionSelectError">{errors.companyName}</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="regionSelectLabel">INN *</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              className="modalInput"
              style={errors.inn ? { borderColor: '#FF3B30' } : undefined}
              placeholder="INN (9 yoki 12 raqam)"
              value={formData.inn}
              onChange={(ev) => {
                setFormData({
                  ...formData,
                  inn: ev.target.value.replace(/\D/g, ''),
                });
                if (errors.inn) setErrors({ ...errors, inn: '' });
              }}
            />
            {errors.inn && (
              <div className="regionSelectError">{errors.inn}</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="regionSelectLabel">MFO *</label>
            <input
              type="text"
              className="modalInput"
              style={errors.mfo ? { borderColor: '#FF3B30' } : undefined}
              placeholder="MFO raqamini kiriting"
              value={formData.mfo}
              onChange={(ev) => {
                setFormData({ ...formData, mfo: ev.target.value });
                if (errors.mfo) setErrors({ ...errors, mfo: '' });
              }}
            />
            {errors.mfo && (
              <div className="regionSelectError">{errors.mfo}</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="regionSelectLabel">Hisob raqami (XR) *</label>
            <input
              type="text"
              className="modalInput"
              style={
                errors.accountNumber ? { borderColor: '#FF3B30' } : undefined
              }
              placeholder="Hisob raqamini kiriting"
              value={formData.accountNumber}
              onChange={(ev) => {
                setFormData({ ...formData, accountNumber: ev.target.value });
                if (errors.accountNumber)
                  setErrors({ ...errors, accountNumber: '' });
              }}
            />
            {errors.accountNumber && (
              <div className="regionSelectError">{errors.accountNumber}</div>
            )}
          </div>

          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#333',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Manzil
          </p>

          <div style={{ marginBottom: 16 }}>
            <RegionSelect
              label="Viloyat *"
              valueId={formData.viloyat}
              options={toOptions(viloyatlar)}
              placeholder="Viloyatni tanlang"
              icon="location-outline"
              error={errors.viloyat}
              onChange={(opt) => {
                setFormData({
                  ...formData,
                  viloyat: opt?._id || '',
                  tuman: '',
                  mfy: '',
                });
                if (errors.viloyat) setErrors({ ...errors, viloyat: '' });
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <RegionSelect
              label="Tuman *"
              valueId={formData.tuman}
              options={toOptions(tumanlar)}
              placeholder="Tumanni tanlang"
              icon="business-outline"
              disabled={!formData.viloyat}
              error={errors.tuman}
              onChange={(opt) => {
                setFormData({
                  ...formData,
                  tuman: opt?._id || '',
                  mfy: '',
                });
                if (errors.tuman) setErrors({ ...errors, tuman: '' });
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <RegionSelect
              label="MFY *"
              valueId={formData.mfy}
              options={toOptions(mfyList)}
              placeholder="MFYni tanlang"
              icon="home"
              disabled={!formData.tuman}
              error={errors.mfy}
              onChange={(opt) => {
                setFormData({ ...formData, mfy: opt?._id || '' });
                if (errors.mfy) setErrors({ ...errors, mfy: '' });
              }}
            />
          </div>

          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#333',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Faoliyat
          </p>

          <div style={{ marginBottom: 16 }}>
            <ActivityTypeSelect
              label="Faoliyat turi *"
              valueId={formData.activityType}
              placeholder="Faoliyat turini tanlang"
              error={errors.activityType}
              onChange={(type: ContragentType | null) => {
                setFormData({
                  ...formData,
                  activityType: type?._id || '',
                });
                if (errors.activityType)
                  setErrors({ ...errors, activityType: '' });
              }}
            />
          </div>

          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#333',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Rahbar ma'lumotlari
          </p>

          <div style={{ marginBottom: 16 }}>
            <label className="regionSelectLabel">Rahbar ismi *</label>
            <input
              type="text"
              className="modalInput"
              style={
                errors.managerFirstName ? { borderColor: '#FF3B30' } : undefined
              }
              placeholder="Rahbar ismini kiriting"
              value={formData.managerFirstName}
              onChange={(ev) => {
                setFormData({ ...formData, managerFirstName: ev.target.value });
                if (errors.managerFirstName)
                  setErrors({ ...errors, managerFirstName: '' });
              }}
            />
            {errors.managerFirstName && (
              <div className="regionSelectError">
                {errors.managerFirstName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="regionSelectLabel">Rahbar familiyasi *</label>
            <input
              type="text"
              className="modalInput"
              style={
                errors.managerLastName ? { borderColor: '#FF3B30' } : undefined
              }
              placeholder="Rahbar familiyasini kiriting"
              value={formData.managerLastName}
              onChange={(ev) => {
                setFormData({ ...formData, managerLastName: ev.target.value });
                if (errors.managerLastName)
                  setErrors({ ...errors, managerLastName: '' });
              }}
            />
            {errors.managerLastName && (
              <div className="regionSelectError">
                {errors.managerLastName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <PhoneInput
              label="Rahbar telefon raqami *"
              value={formData.managerPhone}
              onChange={(val) => {
                setFormData({ ...formData, managerPhone: val });
                if (errors.managerPhone)
                  setErrors({ ...errors, managerPhone: '' });
              }}
              error={errors.managerPhone}
            />
          </div>

          <button
            type="button"
            className="modalPrimaryButton"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 16,
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                Yuborilmoqda...
              </span>
            ) : (
              'Yuborish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
