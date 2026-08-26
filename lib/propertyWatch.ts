export type PropertyWatchSourceType =
  | 'tax_delinquent'
  | 'tax_sale'
  | 'sheriff_sale'
  | 'foreclosure_court'
  | 'vacant_property_registry'
  | 'code_enforcement'
  | 'condemnation'
  | 'land_bank'
  | 'probate_estate'
  | 'assessor'
  | 'recorder_clerk'
  | 'hud_reo'
  | 'usda_reo'
  | 'fannie_freddie_reo'
  | 'bank_reo'
  | 'municipal_agenda'
  | 'other_public_notice';

export type PropertyWatchSource = {
  id: string;
  state: string;
  county?: string;
  city?: string;
  court?: string;
  agency: string;
  sourceType: PropertyWatchSourceType;
  url: string;
  format: 'html' | 'pdf' | 'csv' | 'xlsx' | 'search' | 'api' | 'rss' | 'unknown';
  cadence: 'daily' | 'weekly' | 'monthly' | 'event' | 'unknown';
  active: boolean;
  lastCheckedAt?: string;
  lastChangedAt?: string;
  notes?: string;
};

export type PropertyLeadSignal = {
  sourceId: string;
  sourceType: PropertyWatchSourceType;
  observedAt: string;
  label: string;
  value?: string | number | boolean | null;
  sourceUrl?: string;
};

export type PropertyLead = {
  id: string;
  address?: string;
  parcelId?: string;
  city?: string;
  county?: string;
  state: string;
  zip?: string;
  ownerName?: string;
  ownerMailingAddress?: string;
  askingPrice?: number;
  auctionAmount?: number;
  assessedValue?: number;
  estimatedValue?: number;
  acreage?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  propertyType?: string;
  scenicTags: string[];
  signals: PropertyLeadSignal[];
  score: number;
  verification: 'unverified' | 'parcel_matched' | 'multi_source_verified';
  acquisitionAngle?: string;
  nextAction?: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

const SOURCE_WEIGHTS: Partial<Record<PropertyWatchSourceType, number>> = {
  vacant_property_registry: 20,
  tax_delinquent: 15,
  tax_sale: 18,
  sheriff_sale: 18,
  foreclosure_court: 15,
  code_enforcement: 10,
  condemnation: 18,
  land_bank: 20,
  probate_estate: 8,
  assessor: 5,
  recorder_clerk: 8,
  hud_reo: 15,
  usda_reo: 15,
  fannie_freddie_reo: 15,
  bank_reo: 15,
  municipal_agenda: 6,
  other_public_notice: 5,
};

export function scorePropertyLead(input: {
  signals: PropertyLeadSignal[];
  scenicTags?: string[];
  askingPrice?: number;
  estimatedValue?: number;
  absenteeOwner?: boolean;
  longTermOwner?: boolean;
}) {
  const distinct = new Set<PropertyWatchSourceType>();
  let score = 0;
  for (const signal of input.signals) {
    if (distinct.has(signal.sourceType)) continue;
    distinct.add(signal.sourceType);
    score += SOURCE_WEIGHTS[signal.sourceType] || 0;
  }
  if (input.absenteeOwner) score += 10;
  if (input.longTermOwner) score += 5;
  const scenic = new Set((input.scenicTags || []).map((x) => x.toLowerCase()));
  if (['waterfront', 'lake', 'river'].some((x) => scenic.has(x))) score += 10;
  if (['mountain', 'forest', 'views'].some((x) => scenic.has(x))) score += 7;
  if (scenic.has('acreage')) score += 5;
  if (
    input.askingPrice &&
    input.estimatedValue &&
    input.estimatedValue > 0 &&
    input.askingPrice / input.estimatedValue <= 0.7
  ) score += 7;
  if (distinct.size >= 3) score += 8;
  if (distinct.size >= 5) score += 5;
  return Math.max(0, Math.min(100, score));
}

export const PRIORITY_SOURCE_TYPES: PropertyWatchSourceType[] = [
  'tax_delinquent',
  'tax_sale',
  'sheriff_sale',
  'foreclosure_court',
  'vacant_property_registry',
  'code_enforcement',
  'condemnation',
  'land_bank',
  'probate_estate',
  'assessor',
  'recorder_clerk',
  'municipal_agenda',
  'hud_reo',
  'usda_reo',
  'fannie_freddie_reo',
  'bank_reo',
];
