import { useMemo } from 'react';
import GeoSearchableSelect from '../DistrictContragents/GeoSearchableSelect';

const toOpt = (row) => ({
  id: row.id ?? row._id,
  title: row.name,
  subtitle: row.code,
});

/**
 * Punkt API: faqat viloyat_id + tuman_id (MFY yo‘q).
 */
const GeoViloyatTumanFields = ({
  regions = [],
  districts = [],
  values,
  onChange,
  disabled,
  geoLoading = false,
  required = true,
  allowClear = false,
}) => {
  const allLocked = Boolean(disabled || geoLoading);

  const regionOpts = useMemo(() => (regions || []).map(toOpt), [regions]);

  const districtOpts = useMemo(() => {
    if (!values.region_id) return [];
    const rid = String(values.region_id);
    return (districts || []).filter((d) => String(d.region_id) === rid).map(toOpt);
  }, [districts, values.region_id]);

  const loadHint = geoLoading ? 'Yuklanmoqda...' : 'Tanlash mumkin emas';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GeoSearchableSelect
        label="Viloyat"
        required={required}
        allowClear={allowClear}
        optionalPlaceholder="Barcha viloyatlar"
        value={values.region_id}
        onChange={(id) => onChange({ region_id: id, district_id: '' })}
        options={regionOpts}
        disabled={allLocked}
        emptyMessage="Viloyatlar topilmadi"
        lockedHint={loadHint}
      />
      <GeoSearchableSelect
        label="Tuman"
        required={required}
        allowClear={allowClear}
        optionalPlaceholder="Barcha tumanlar"
        value={values.district_id}
        onChange={(id) => onChange({ district_id: id })}
        options={districtOpts}
        disabled={allLocked || !values.region_id}
        emptyMessage="Tumanlar topilmadi"
        lockedHint={allLocked ? loadHint : 'Avval viloyatni tanlang'}
      />
    </div>
  );
};

export default GeoViloyatTumanFields;
