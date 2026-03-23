import { useState } from 'react';
import Icon from './ui/Icon';
import { useLocation } from '../contexts/LocationContext';
import RegionSelectionModal from './RegionSelectionModal';

interface RegionRequiredGateProps {
  children: React.ReactNode;
}

/**
 * For new users (no region selected), shows a blocking overlay so they cannot
 * interact with the app until they select a delivery region.
 */
export default function RegionRequiredGate({ children }: RegionRequiredGateProps) {
  const { selectedViloyat, selectedTuman } = useLocation();
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  const regionRequired = !selectedViloyat || !selectedTuman;

  return (
    <>
      {children}

      {regionRequired && (
        <>
          <div
            className="regionRequiredOverlay"
            aria-hidden
            style={{ pointerEvents: 'auto' }}
          />
          <div className="regionRequiredPrompt" role="dialog" aria-modal="true" aria-labelledby="region-required-title">
            <div className="regionRequiredPromptIcon">
              <Icon name="information-circle" size={22} color="#007AFF" />
            </div>
            <div className="regionRequiredPromptBody">
              <h2 id="region-required-title" className="regionRequiredPromptTitle">
                Hududni tanlang
              </h2>
              <p className="regionRequiredPromptText">
                Mahsulotlarni ko&apos;rish va buyurtma berish uchun avval yetkazib berish
                hududingizni belgilang.
              </p>
            </div>
            <button
              type="button"
              className="regionRequiredPromptButton"
              onClick={() => setRegionModalOpen(true)}
            >
              Tanlash
            </button>
          </div>

          <RegionSelectionModal
            open={regionModalOpen}
            onClose={() => setRegionModalOpen(false)}
            onSaved={() => setRegionModalOpen(false)}
            highZIndex
          />
        </>
      )}
    </>
  );
}
