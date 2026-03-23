import { useEffect, useState } from 'react';
import Icon from './ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import RegionSelectionModal from './RegionSelectionModal';

interface LocationSelectorProps {
  show?: boolean;
}

export default function LocationSelector({ show = true }: LocationSelectorProps) {
  const {
    selectedViloyat,
    selectedTuman,
    selectedMfy,
  } = useLocation();
  const { isAuthenticated } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [hasShownHighlight, setHasShownHighlight] = useState(false);

  if (!show) return null;

  useEffect(() => {
    if (
      !modalOpen &&
      !hasShownHighlight &&
      !selectedViloyat &&
      !selectedTuman &&
      isAuthenticated
    ) {
      setShowHighlight(true);
      setHasShownHighlight(true);
    }
  }, [modalOpen, hasShownHighlight, selectedViloyat, selectedTuman, isAuthenticated]);

  useEffect(() => {
    if (selectedViloyat || selectedTuman) {
      setShowHighlight(false);
    }
  }, [selectedViloyat, selectedTuman]);

  const openModal = () => {
    setShowHighlight(false);
    setModalOpen(true);
  };

  const getLocationText = () => {
    if (selectedViloyat && selectedTuman && selectedMfy) {
      return `${selectedViloyat.name}, ${selectedTuman.name}, ${selectedMfy.name}`;
    }
    if (selectedViloyat && selectedTuman) {
      return `${selectedViloyat.name}, ${selectedTuman.name}`;
    }
    if (selectedViloyat) {
      return selectedViloyat.name;
    }
    return 'Hududni tanlang';
  };

  return (
    <>
      <div className="locationSelectorBar" onClick={openModal} role="button">
        <div className="locationSelectorIcon">
          <Icon name="location" size={20} color="#007AFF" />
        </div>
        <div className="locationSelectorText">
          <div className="locationSelectorLabel">Yetkazib berish hududi</div>
          <div className="locationSelectorValue">{getLocationText()}</div>
        </div>
        <Icon name="chevron-forward" size={18} color="#9CA3AF" />
      </div>

      {showHighlight && (
        <div className="locationSelectorAlert">
          <div className="locationSelectorAlertIcon">
            <Icon name="information-circle" size={18} color="#007AFF" />
          </div>
          <div className="locationSelectorAlertBody">
            <div className="locationSelectorAlertTitle">Hududni tanlang</div>
            <div className="locationSelectorAlertText">
              Mahsulotlarni ko&apos;rish va buyurtma berish uchun avval yetkazib berish
              hududingizni belgilang.
            </div>
          </div>
          <button
            type="button"
            className="locationSelectorAlertButton"
            onClick={openModal}
          >
            Tanlash
          </button>
        </div>
      )}

      <RegionSelectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setModalOpen(false)}
      />
    </>
  );
}
