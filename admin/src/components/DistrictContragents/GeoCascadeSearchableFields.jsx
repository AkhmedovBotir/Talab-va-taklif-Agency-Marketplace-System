import { useMemo } from 'react';
import GeoSearchableSelect from './GeoSearchableSelect';

const toOpt = (row) => ({
  id: row.id ?? row._id,
  title: row.name,
  subtitle: row.code,
});

const GeoCascadeSearchableFields = ({
  regions = [],
  districts = [],
  mfys = [],
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

  const mfyOpts = useMemo(() => {
    if (!values.district_id) return [];
    const did = String(values.district_id);
    return (mfys || []).filter((m) => String(m.district_id) === did).map(toOpt);
  }, [mfys, values.district_id]);

  const loadHint = geoLoading ? 'Yuklanmoqda...' : 'Tanlash mumkin emas';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GeoSearchableSelect
        label="Viloyat"
        required={required}
        allowClear={allowClear}
        optionalPlaceholder="Barcha viloyatlar"
        value={values.region_id}
        onChange={(id) => onChange({ region_id: id, district_id: '', mfy_id: '' })}
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
        onChange={(id) => onChange({ district_id: id, mfy_id: '' })}
        options={districtOpts}
        disabled={allLocked || !values.region_id}
        emptyMessage="Tumanlar topilmadi"
        lockedHint={allLocked ? loadHint : 'Avval viloyatni tanlang'}
      />
      <GeoSearchableSelect
        label="MFY"
        required={required}
        allowClear={allowClear}
        optionalPlaceholder="Barcha MFY"
        value={values.mfy_id}
        onChange={(id) => onChange({ mfy_id: id })}
        options={mfyOpts}
        disabled={allLocked || !values.district_id}
        emptyMessage="MFY topilmadi"
        lockedHint={allLocked ? loadHint : 'Avval tumanni tanlang'}
      />
    </div>
  );
};

export default GeoCascadeSearchableFields;
