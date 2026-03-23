import React, { useState, useEffect } from 'react';
import { IoChevronDown, IoClose, IoCheckmark, IoSquareOutline } from 'react-icons/io5';
import { apiService, Region } from '../services/api';
import styles from './RegionPicker.module.css';

interface RegionPickerProps {
  label?: string;
  value?: string;
  type: 'region' | 'district' | 'mfy';
  parentId?: string;
  onSelect: (region: Region) => void;
  displayValue?: string;
  disabled?: boolean;
  multiple?: boolean;
  selectedIds?: string[];
}

export function RegionPicker({
  label,
  value,
  type,
  parentId,
  onSelect,
  displayValue,
  disabled = false,
  multiple = false,
  selectedIds = [],
}: RegionPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      setLoading(true);
      apiService
        .getRegions({ type, parent: parentId, limit: 1000 })
        .then((res) => {
          if (res?.data) setRegions(res.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [modalVisible, parentId, type]);

  const handleSelect = (region: Region) => {
    onSelect(region);
    if (!multiple) {
      setModalVisible(false);
    }
  };

  const isSelected = (regionId: string) => {
    if (multiple) return selectedIds.includes(regionId);
    return value === regionId;
  };

  const displayText = displayValue || regions.find((r) => r._id === value)?.name || label || 'Tanlang';

  return (
    <>
      <button
        type="button"
        className={[styles.pickerButton, disabled && styles.pickerButtonDisabled].filter(Boolean).join(' ')}
        onClick={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <span className={styles.pickerText}>{displayText}</span>
        <IoChevronDown size={20} color={disabled ? '#ccc' : '#666'} />
      </button>

      {modalVisible && (
        <div className={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{label || 'Tanlang'}</h3>
              <button type="button" className={styles.modalClose} onClick={() => setModalVisible(false)} aria-label="Yopish">
                <IoClose size={24} />
              </button>
            </div>
            {loading ? (
              <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : (
              <div className={styles.list}>
                {regions.map((item) => {
                  const selected = isSelected(item._id);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      className={[styles.regionItem, selected && styles.regionItemSelected].filter(Boolean).join(' ')}
                      onClick={() => handleSelect(item)}
                    >
                      <span className={[styles.regionText, selected && styles.regionTextSelected].filter(Boolean).join(' ')}>{item.name}</span>
                      {selected && (multiple ? <IoSquareOutline size={20} color="#007AFF" /> : <IoCheckmark size={20} color="#007AFF" />)}
                    </button>
                  );
                })}
              </div>
            )}
            {!loading && regions.length === 0 && <p className={styles.emptyText}>Ma'lumot topilmadi</p>}
          </div>
        </div>
      )}
    </>
  );
}
