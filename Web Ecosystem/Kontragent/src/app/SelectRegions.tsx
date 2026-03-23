import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IoArrowBack,
  IoClose,
  IoAdd,
  IoLocationOutline,
  IoSearch,
  IoTrashOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import { AppModal } from '../components/AppModal';
import styles from './SelectRegions.module.css';

interface Region {
  _id: string;
  name: string;
  type: string;
  code?: string;
}

interface SelectedRegion {
  viloyat: Region;
  tuman: Region | null;
}

function getRegionsData(res: unknown): Region[] {
  const r = res as { data?: Region[] };
  return Array.isArray(r?.data) ? r.data : [];
}

export function SelectRegions() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = (location.state as { returnPath?: string })?.returnPath || '/profile';

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [selectedViloyat, setSelectedViloyat] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTuman] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'regions' | 'selected'>('regions');
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCloseExtra?: () => void;
  }>({ open: false, title: '', message: '', variant: 'alert' });

  const loadRegions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getRegions({
        limit: 1000,
        type: 'region',
        status: 'active',
      });
      const list = getRegionsData(res);
      setRegions([...list].sort((a, b) => a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })));
    } catch {
      setRegions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDistricts = useCallback(async (viloyatId: string) => {
    setLoadingDistricts(true);
    try {
      const res = await apiService.getRegions({
        limit: 1000,
        type: 'district',
        parent: viloyatId,
        status: 'active',
      });
      const list = getRegionsData(res);
      setDistricts([...list].sort((a, b) => a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })));
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    const state = location.state as { selectedRegions?: Array<{ viloyat: string; tuman?: string | null }> } | null;
    const parsed = state?.selectedRegions;
    if (!parsed || !parsed.length) return;
    const loadInitial = async () => {
      const loaded: SelectedRegion[] = [];
      for (const dr of parsed) {
        try {
          const res = await apiService.getRegions({ type: 'region', limit: 1000 });
          const vilList = getRegionsData(res);
          const viloyat = vilList.find((r) => r._id === dr.viloyat);
          if (!viloyat) continue;
          let tuman: Region | null = null;
          if (dr.tuman) {
            const distRes = await apiService.getRegions({ type: 'district', parent: dr.viloyat, limit: 1000 });
            const distList = getRegionsData(distRes);
            tuman = distList.find((r) => r._id === dr.tuman) || null;
          }
          loaded.push({ viloyat, tuman });
        } catch {
          /* skip */
        }
      }
      setSelectedRegions(loaded);
    };
    loadInitial();
  }, [location.state]);

  useEffect(() => {
    if (selectedViloyat) {
      loadDistricts(selectedViloyat._id);
      setSelectedTuman(null);
    } else {
      setDistricts([]);
    }
  }, [selectedViloyat, loadDistricts]);

  const handleViloyatSelect = (viloyat: Region) => {
    setSelectedViloyat(viloyat);
    setSearchQuery('');
  };

  const handleTumanSelect = (tuman: Region | null) => {
    setSelectedTuman(tuman);
    setSearchQuery('');
  };

  const handleAddRegion = () => {
    if (!selectedViloyat) {
      setModal({ open: true, title: 'Ogohlantirish', message: 'Viloyat tanlang', variant: 'alert' });
      return;
    }
    const newRegion: SelectedRegion = { viloyat: selectedViloyat, tuman: selectedTuman };
    const exists = selectedRegions.some(
      (r) =>
        r.viloyat._id === newRegion.viloyat._id &&
        (r.tuman?._id === newRegion.tuman?._id || (!r.tuman && !newRegion.tuman))
    );
    if (exists) {
      setModal({ open: true, title: 'Ogohlantirish', message: "Bu hudud allaqachon qo'shilgan", variant: 'alert' });
      return;
    }
    setSelectedRegions([...selectedRegions, newRegion]);
    setSelectedViloyat(null);
    setSelectedTuman(null);
    setDistricts([]);
    setActiveTab('selected');
  };

  const handleRemoveRegion = (index: number) => {
    setSelectedRegions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (selectedRegions.length === 0) {
      setModal({ open: true, title: 'Ogohlantirish', message: 'Kamida bitta hudud tanlashingiz kerak', variant: 'alert' });
      return;
    }
    const payload = selectedRegions.map((r) => ({
      viloyat: r.viloyat._id,
      tuman: r.tuman?._id || null,
    }));
    try {
      await apiService.updateDeliveryRegions({ deliveryRegions: payload });
      setModal({
        open: true,
        title: 'Muvaffaqiyat',
        message: 'Yetkazib berish hududlari yangilandi.',
        variant: 'alert',
        onCloseExtra: () => navigate(returnPath.startsWith('/') ? returnPath : '/profile'),
      });
    } catch (err: unknown) {
      const m = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Hududlarni saqlashda xatolik';
      setModal({ open: true, title: 'Xatolik', message: m, variant: 'alert' });
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <IoArrowBack size={24} color="#333" />
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>Yetkazib berish hududlari</h1>
          <p className={styles.headerSubtitle}>
            {selectedRegions.length > 0
              ? `${selectedRegions.length} ta hudud tanlangan`
              : 'Hududlarni tanlang'}
          </p>
        </div>
        <button
          type="button"
          className={[styles.saveBtn, selectedRegions.length === 0 && styles.saveBtnDisabled].filter(Boolean).join(' ')}
          onClick={handleSave}
          disabled={selectedRegions.length === 0}
        >
          Saqlash
        </button>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={[styles.tab, activeTab === 'regions' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('regions')}
        >
          <IoLocationOutline size={20} color={activeTab === 'regions' ? '#007AFF' : '#8E8E93'} />
          <span>Hududlar</span>
        </button>
        <button
          type="button"
          className={[styles.tab, activeTab === 'selected' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('selected')}
        >
          <IoCheckmarkCircle size={20} color={activeTab === 'selected' ? '#007AFF' : '#8E8E93'} />
          <span>Tanlangan ({selectedRegions.length})</span>
        </button>
      </div>

      {activeTab === 'selected' ? (
        <div className={styles.content}>
          {selectedRegions.length === 0 ? (
            <div className={styles.emptyState}>
              <IoLocationOutline size={64} color="#D1D5DB" />
              <p className={styles.emptyTitle}>Hududlar tanlanmagan</p>
              <p className={styles.emptyText}>
                Yetkazib berish hududlarini tanlash uchun &quot;Hududlar&quot; bo&apos;limiga o&apos;ting
              </p>
              <button type="button" className={styles.emptyBtn} onClick={() => setActiveTab('regions')}>
                Hududlarni tanlash
              </button>
            </div>
          ) : (
            <>
              <div className={styles.selectedHeader}>
                <h3>Tanlangan hududlar ({selectedRegions.length})</h3>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setModal({
                      open: true,
                      title: "Barchasini o'chirish",
                      message: "Barcha tanlangan hududlarni o'chirmoqchimisiz?",
                      variant: 'confirm',
                      onConfirm: () => setSelectedRegions([]),
                    });
                  }}
                >
                  <IoTrashOutline size={18} />
                  <span>Barchasini o&apos;chirish</span>
                </button>
              </div>
              {selectedRegions.map((r, i) => (
                <div key={i} className={styles.selectedCard}>
                  <IoLocationOutline size={24} color="#007AFF" />
                  <div className={styles.selectedInfo}>
                    <span className={styles.selectedTitle}>{r.viloyat.name}</span>
                    <span className={styles.selectedSubtitle}>
                      {r.tuman ? r.tuman.name : 'Butun viloyat'}
                    </span>
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => handleRemoveRegion(i)}>
                    <IoClose size={24} color="#FF3B30" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.searchWrap}>
            <IoSearch size={20} color="#999" />
            <input
              type="text"
              placeholder="Viloyat yoki tuman qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {selectedViloyat && (
            <div className={styles.previewCard}>
              <IoCheckmarkCircle size={24} color="#34C759" />
              <div>
                <p className={styles.previewTitle}>Tanlangan hudud</p>
                <p className={styles.previewText}>
                  {selectedViloyat.name}
                  {selectedTuman ? `, ${selectedTuman.name}` : ' (Butun viloyat)'}
                </p>
              </div>
            </div>
          )}

          <h3 className={styles.sectionTitle}>Viloyat tanlash</h3>
          {loading ? (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
            </div>
          ) : (
            <div className={styles.regionsGrid}>
              {filteredRegions.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  className={[styles.regionCard, selectedViloyat?._id === r._id && styles.regionCardSelected].filter(Boolean).join(' ')}
                  onClick={() => handleViloyatSelect(r)}
                >
                  <IoLocationOutline
                    size={24}
                    color={selectedViloyat?._id === r._id ? '#007AFF' : '#8E8E93'}
                  />
                  <span>{r.name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedViloyat && (
            <>
              <h3 className={styles.sectionTitle}>Tuman tanlash (ixtiyoriy)</h3>
              {loadingDistricts ? (
                <div className={styles.loadingWrap}>
                  <div className={styles.spinner} />
                </div>
              ) : districts.length > 0 ? (
                <div className={styles.districtsList}>
                  <button
                    type="button"
                    className={[styles.districtOpt, selectedTuman === null && styles.districtOptSelected].filter(Boolean).join(' ')}
                    onClick={() => handleTumanSelect(null)}
                  >
                    {selectedTuman === null ? (
                      <IoCheckmarkCircle size={22} color="#007AFF" />
                    ) : (
                      <span className={styles.radioOff} />
                    )}
                    <span>Butun viloyat</span>
                  </button>
                  {filteredDistricts.map((d) => (
                    <button
                      key={d._id}
                      type="button"
                      className={[styles.districtOpt, selectedTuman?._id === d._id && styles.districtOptSelected].filter(Boolean).join(' ')}
                      onClick={() => handleTumanSelect(d)}
                    >
                      {selectedTuman?._id === d._id ? (
                        <IoCheckmarkCircle size={22} color="#007AFF" />
                      ) : (
                        <span className={styles.radioOff} />
                      )}
                      <span>{d.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyDistricts}>Bu viloyat uchun tumanlar mavjud emas</p>
              )}
              <button type="button" className={styles.addBtn} onClick={handleAddRegion}>
                <IoAdd size={24} color="#fff" />
                <span>Qo&apos;shish</span>
              </button>
            </>
          )}
        </div>
      )}

      <AppModal
        open={modal.open}
        onClose={() => {
          modal.onCloseExtra?.();
          setModal((m) => ({ ...m, open: false }));
        }}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmText={modal.variant === 'confirm' ? "O'chirish" : undefined}
        onConfirm={modal.onConfirm}
        confirmDanger={modal.variant === 'confirm'}
      />
    </div>
  );
}
