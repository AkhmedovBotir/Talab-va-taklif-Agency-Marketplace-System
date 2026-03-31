import type { Address, Region, District, MFY } from '../types';

/** Checkout / select uchun: viloyat, tuman, MFY (nomlar bilan). */
export function formatAddressGeoSummary(
  a: Address,
  regions: readonly Region[],
  districts: readonly District[],
  mfys: readonly MFY[]
): string {
  const region = regions.find((r) => r.id === a.region_id)?.name;
  const district = districts.find((d) => d.id === a.district_id)?.name;
  const mfy = mfys.find((m) => m.id === a.mfy_id)?.name;
  const parts: string[] = [];
  if (region) parts.push(`Viloyat: ${region}`);
  if (district) parts.push(`Tuman: ${district}`);
  if (mfy) parts.push(`MFY: ${mfy}`);
  return parts.join(' · ');
}
