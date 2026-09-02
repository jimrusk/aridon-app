export type PropertyFactSourceType = 'owner' | 'appraisal' | 'assessor' | 'recorder' | 'mls' | 'listing' | 'avm' | 'other';

export type PropertyFactObservation = {
  id: string;
  source: string;
  sourceType: PropertyFactSourceType;
  verified?: boolean;
  acreage?: number | null;
  livingSqFt?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  hasShop?: boolean | null;
  greenhouseSqFt?: number | null;
  note?: string;
};

export type PropertyFactConflict = {
  field: 'acreage' | 'livingSqFt' | 'bedrooms' | 'bathrooms' | 'hasShop' | 'greenhouseSqFt';
  label: string;
  severity: 'warning' | 'critical';
  values: Array<{ source: string; value: number | boolean; sourceType: PropertyFactSourceType; verified: boolean }>;
  message: string;
};

const labels: Record<PropertyFactConflict['field'], string> = {
  acreage: 'Acreage',
  livingSqFt: 'Living area',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  hasShop: 'Shop / detached shop',
  greenhouseSqFt: 'Greenhouse area',
};

function materiallyDifferent(field: PropertyFactConflict['field'], a: number | boolean, b: number | boolean) {
  if (typeof a === 'boolean' || typeof b === 'boolean') return a !== b;
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  if (field === 'acreage') return Math.abs(left - right) > Math.max(0.1, Math.min(left, right) * 0.05);
  if (field === 'livingSqFt' || field === 'greenhouseSqFt') return Math.abs(left - right) > Math.max(50, Math.min(left, right) * 0.05);
  return Math.abs(left - right) >= 0.5;
}

export function detectPropertyFactConflicts(observations: PropertyFactObservation[]): PropertyFactConflict[] {
  const fields: PropertyFactConflict['field'][] = ['acreage', 'livingSqFt', 'bedrooms', 'bathrooms', 'hasShop', 'greenhouseSqFt'];
  const conflicts: PropertyFactConflict[] = [];

  for (const field of fields) {
    const values = observations
      .map((item) => ({
        source: item.source,
        sourceType: item.sourceType,
        verified: item.verified === true,
        value: item[field],
      }))
      .filter((item): item is { source: string; sourceType: PropertyFactSourceType; verified: boolean; value: number | boolean } => item.value !== null && item.value !== undefined && (typeof item.value === 'boolean' || Number.isFinite(Number(item.value))));

    if (values.length < 2) continue;
    let conflict = false;
    for (let i = 0; i < values.length && !conflict; i += 1) {
      for (let j = i + 1; j < values.length; j += 1) {
        if (materiallyDifferent(field, values[i].value, values[j].value)) {
          conflict = true;
          break;
        }
      }
    }
    if (!conflict) continue;

    const verifiedValues = values.filter((item) => item.verified);
    const severity: PropertyFactConflict['severity'] = field === 'acreage' || field === 'livingSqFt' ? 'critical' : 'warning';
    const resolution = verifiedValues.length
      ? ` A verified source is present, but the disagreement should stay visible until the conflicting source is corrected or rejected.`
      : ` No source is marked verified, so Aridon should lower confidence instead of choosing whichever value produces the highest estimate.`;

    conflicts.push({
      field,
      label: labels[field],
      severity,
      values,
      message: `${labels[field]} differs across sources.${resolution}`,
    });
  }

  return conflicts;
}

export function greenhouseArea(lengthFeet: number, widthFeet: number) {
  const length = Number(lengthFeet);
  const width = Number(widthFeet);
  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) return 0;
  return length * width;
}
