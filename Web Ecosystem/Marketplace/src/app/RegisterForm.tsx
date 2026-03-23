import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RegionSelect from '../components/ui/RegionSelect';
import apiService, { Region } from '../services/api';

export default function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { phone?: string };
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'erkak' as 'ayol' | 'erkak',
    birthDate: '',
    password: '',
    viloyatId: '',
    tumanId: '',
    mfyId: '',
  });
  const [viloyatlar, setViloyatlar] = useState<Region[]>([]);
  const [tumanlar, setTumanlar] = useState<Region[]>([]);
  const [mfyList, setMfyList] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = state.phone;
  React.useEffect(() => {
    if (!phone) navigate('/register');
  }, [phone, navigate]);

  const sortRegionsAlphabetically = (regions: Region[]): Region[] => {
    return [...regions].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'uz');
    });
  };

  const loadAllRegions = async (params: {
    type: 'region' | 'district' | 'mfy';
    parent?: string;
  }): Promise<Region[]> => {
    const baseParams: {
      type: 'region' | 'district' | 'mfy';
      parent?: string;
      page: number;
      limit: number;
    } = {
      ...params,
      page: 1,
      limit: 1000,
    };

    const first = await apiService.getRegions(baseParams);
    let allData: Region[] = [...(first.data || [])];
    let currentPage = first.page;

    while (currentPage < first.totalPages) {
      currentPage += 1;
      const next = await apiService.getRegions({ ...baseParams, page: currentPage });
      allData = [...allData, ...(next.data || [])];
    }

    return sortRegionsAlphabetically(allData);
  };

  React.useEffect(() => {
    let cancelled = false;
    loadAllRegions({ type: 'region' })
      .then((list) => {
        if (!cancelled) setViloyatlar(list);
      })
      .catch((err) => {
        console.error('Error loading regions:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!form.viloyatId) {
      setTumanlar([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'district', parent: form.viloyatId })
      .then((list) => {
        if (!cancelled) setTumanlar(list);
      })
      .catch((err) => {
        console.error('Error loading districts:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [form.viloyatId]);

  React.useEffect(() => {
    if (!form.tumanId) {
      setMfyList([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'mfy', parent: form.tumanId })
      .then((list) => {
        if (!cancelled) setMfyList(list);
      })
      .catch((err) => {
        console.error('Error loading mfys:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [form.tumanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.birthDate || !form.password) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (!form.viloyatId || !form.tumanId || !form.mfyId) {
      setError('Viloyat, tuman va MFY tanlang');
      return;
    }
    if (form.password.length < 6) {
      setError('Parol kamida 6 belgi');
      return;
    }
    if (!phone) return;
    setLoading(true);
    try {
      await apiService.registerStep1(phone);

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        viloyat: form.viloyatId,
        tuman: form.tumanId,
        mfy: form.mfyId,
        birthDate: form.birthDate,
        password: form.password,
      };

      navigate('/sms-verify', {
        state: {
          phone,
          type: 'register',
          formData: JSON.stringify(payload),
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="app-layout" style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Ma'lumotlaringiz</h1>
        <form onSubmit={handleSubmit}>
          <input type="hidden" value={phone} readOnly />
          <label>Ism</label>
          <input
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <label>Familiya</label>
          <input
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <label>Jinsi</label>
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as 'ayol' | 'erkak' }))}
            style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8 }}
          >
            <option value="erkak">Erkak</option>
            <option value="ayol">Ayol</option>
          </select>
          <label>Tug'ilgan sana</label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <label>Parol</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <RegionSelect
            label="Viloyat"
            icon="map-outline"
            valueId={form.viloyatId}
            options={viloyatlar}
            placeholder="Viloyatni tanlang"
            onChange={(opt) =>
              setForm((f) => ({
                ...f,
                viloyatId: opt?._id || '',
                tumanId: '',
                mfyId: '',
              }))
            }
          />
          <RegionSelect
            label="Tuman"
            icon="location-outline"
            valueId={form.tumanId}
            options={tumanlar}
            placeholder="Tumanni tanlang"
            disabled={!form.viloyatId}
            onChange={(opt) =>
              setForm((f) => ({
                ...f,
                tumanId: opt?._id || '',
                mfyId: '',
              }))
            }
          />
          <RegionSelect
            label="MFY"
            icon="home"
            valueId={form.mfyId}
            options={mfyList}
            placeholder="MFY ni tanlang"
            disabled={!form.tumanId}
            onChange={(opt) =>
              setForm((f) => ({
                ...f,
                mfyId: opt?._id || '',
              }))
            }
          />
          {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Yuborilmoqda...' : 'Ro\'yxatdan o\'tish'}
          </button>
        </form>
      </div>
    </div>
  );
}
