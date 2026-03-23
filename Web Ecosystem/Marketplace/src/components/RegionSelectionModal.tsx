import { useEffect, useState, useCallback } from 'react';
import RegionSelect from './ui/RegionSelect';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { Region } from '../services/api';

interface RegionSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Use higher z-index when opened from RegionRequiredGate so modal appears above blocking overlay */
  highZIndex?: boolean;
}

const sortRegionsAlphabetically = (regions: Region[]): Region[] => {
  return [...regions].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB, 'uz');
  });
};

export default function RegionSelectionModal({
  open,
  onClose,
  onSaved,
  highZIndex = false,
}: RegionSelectionModalProps) {
  const { isAuthenticated, token } = useAuth();
  const {
    selectedViloyat,
    selectedTuman,
    selectedMfy,
    setSelectedViloyat,
    setSelectedTuman,
    setSelectedMfy,
  } = useLocation();
  const { showError, showSuccess } = useSnackbar();

  const [viloyatlar, setViloyatlar] = useState<Region[]>([]);
  const [tumanlar, setTumanlar] = useState<Region[]>([]);
  const [mfyList, setMfyList] = useState<Region[]>([]);
  const [tempViloyatId, setTempViloyatId] = useState('');
  const [tempTumanId, setTempTumanId] = useState('');
  const [tempMfyId, setTempMfyId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAllRegions = useCallback(
    async (params: { type: 'region' | 'district' | 'mfy'; parent?: string }) => {
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
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    setTempViloyatId(selectedViloyat?._id || '');
    setTempTumanId(selectedTuman?._id || '');
    setTempMfyId(selectedMfy?._id || '');
  }, [open, selectedViloyat?._id, selectedTuman?._id, selectedMfy?._id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadAllRegions({ type: 'region' })
      .then((list) => {
        if (!cancelled) setViloyatlar(list);
      })
      .catch((err) => console.error('Error loading regions:', err));
    return () => {
      cancelled = true;
    };
  }, [open, loadAllRegions]);

  useEffect(() => {
    if (!open || !tempViloyatId) {
      setTumanlar([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'district', parent: tempViloyatId })
      .then((list) => {
        if (!cancelled) setTumanlar(list);
      })
      .catch((err) => console.error('Error loading tumans:', err));
    return () => {
      cancelled = true;
    };
  }, [open, tempViloyatId, loadAllRegions]);

  useEffect(() => {
    if (!open || !tempTumanId) {
      setMfyList([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'mfy', parent: tempTumanId })
      .then((list) => {
        if (!cancelled) setMfyList(list);
      })
      .catch((err) => console.error('Error loading mfys:', err));
    return () => {
      cancelled = true;
    };
  }, [open, tempTumanId, loadAllRegions]);

  const handleSave = async () => {
    if (!tempViloyatId || !tempTumanId) {
      showError("Iltimos, viloyat va tumanni tanlang");
      return;
    }
    setSaving(true);
    try {
      if (isAuthenticated && token) {
        const payload: { viloyat: string | null; tuman: string | null; mfy?: string | null } = {
          viloyat: tempViloyatId,
          tuman: tempTumanId,
          mfy: tempMfyId || null,
        };
        const res = await apiService.updateViloyatTuman(payload, token);
        if (res.success && res.data) {
          setSelectedViloyat(res.data.viloyat);
          setSelectedTuman(res.data.tuman);
          setSelectedMfy(res.data.mfy);
          showSuccess('Hudud saqlandi');
        } else {
          showError(res.message || 'Hududni saqlashda xatolik yuz berdi');
        }
      } else {
        const v = viloyatlar.find((r) => r._id === tempViloyatId) || null;
        const t = tumanlar.find((r) => r._id === tempTumanId) || null;
        const m = mfyList.find((r) => r._id === tempMfyId) || null;
        setSelectedViloyat(v);
        setSelectedTuman(t);
        setSelectedMfy(m || null);
      }
      onClose();
      onSaved?.();
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : 'Hududni saqlashda xatolik yuz berdi'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setTempViloyatId('');
    setTempTumanId('');
    setTempMfyId('');
    setSelectedViloyat(null);
    setSelectedTuman(null);
    setSelectedMfy(null);
    if (isAuthenticated && token) {
      try {
        await apiService.updateViloyatTuman(
          { viloyat: null, tuman: null, mfy: null },
          token
        );
      } catch {
        // ignore
      }
    }
    onClose();
    onSaved?.();
  };

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      style={highZIndex ? { zIndex: 9992 } : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modalContainer"
        style={{ maxWidth: 520, maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modalTitle">Yetkazib berish hududi</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 }}>
          Avval viloyatni, keyin tumanni va istasangiz MFY ni tanlang. Tanlangan
          hududga qarab mahsulotlar ko‘rsatiladi.
        </p>

        <RegionSelect
          label="Viloyat"
          icon="map-outline"
          valueId={tempViloyatId}
          options={viloyatlar}
          placeholder="Viloyatni tanlang"
          onChange={(opt) => {
            setTempViloyatId(opt?._id || '');
            setTempTumanId('');
            setTempMfyId('');
          }}
        />

        <RegionSelect
          label="Tuman"
          icon="location-outline"
          valueId={tempTumanId}
          options={tumanlar}
          placeholder="Tumanni tanlang"
          disabled={!tempViloyatId}
          onChange={(opt) => {
            setTempTumanId(opt?._id || '');
            setTempMfyId('');
          }}
        />

        <RegionSelect
          label="MFY (ixtiyoriy)"
          icon="home"
          valueId={tempMfyId}
          options={mfyList}
          placeholder="MFY ni tanlang"
          disabled={!tempTumanId}
          onChange={(opt) => {
            setTempMfyId(opt?._id || '');
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 16,
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #EF4444',
              background: '#FFFFFF',
              color: '#EF4444',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Tozalash
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: 'none',
                background: '#E5E7EB',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !tempViloyatId || !tempTumanId}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                background: '#007AFF',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving || !tempViloyatId || !tempTumanId ? 0.7 : 1,
              }}
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
