import { useCallback, useEffect, useState } from 'react';
import Icon from './ui/Icon';
import PartnershipRequestModal from './PartnershipRequestModal';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface PartnershipBlockProps {
  compact?: boolean;
}

export default function PartnershipBlock({ compact = false }: PartnershipBlockProps) {
  const { token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkPartnershipRequests = useCallback(async () => {
    if (!token) {
      setHasRequest(false);
      setChecking(false);
      return;
    }
    try {
      setChecking(true);
      const res = await apiService.getMyPartnershipRequests({ limit: 1 }, token);
      setHasRequest(
        Boolean(res.success && res.data && res.data.length > 0)
      );
    } catch {
      setHasRequest(false);
    } finally {
      setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    checkPartnershipRequests();
  }, [checkPartnershipRequests]);

  if (!token || checking || hasRequest) return null;

  return (
    <>
      <div
        className="partnershipBlock"
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        <div className="partnershipBlockIcon">
          <Icon
            name="business-outline"
            size={compact ? 24 : 32}
            color="#007AFF"
          />
        </div>
        <div className="partnershipBlockContent">
          <div className="partnershipBlockTitle">Bizga hamkor bo'ling</div>
          {!compact && (
            <p className="partnershipBlockDesc">
              Hamkor bo'lib, bizning platformada mahsulotlaringizni sotish
              imkoniyatiga ega bo'ling
            </p>
          )}
        </div>
        <Icon name="chevron-forward" size={20} color="#007AFF" />
      </div>

      {token && (
        <PartnershipRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          token={token}
          onSuccess={() => {
            setModalOpen(false);
            checkPartnershipRequests();
          }}
        />
      )}
    </>
  );
}
