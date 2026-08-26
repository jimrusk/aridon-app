import type { PropertyWatchSourceType } from './propertyWatch';

export type PropertySourceLane = {
  sourceType: PropertyWatchSourceType;
  label: string;
  agencies: string[];
  searchTerms: string[];
  priority: 'critical' | 'high' | 'normal';
};

export const PROPERTY_SOURCE_LANES: PropertySourceLane[] = [
  {
    sourceType: 'tax_delinquent',
    label: 'Delinquent property taxes',
    agencies: ['County Treasurer', 'Tax Collector', 'Tax Commissioner', 'Revenue Office'],
    searchTerms: ['delinquent real property list', 'delinquent property tax list', 'tax delinquent real estate'],
    priority: 'critical',
  },
  {
    sourceType: 'tax_sale',
    label: 'Tax sales and tax foreclosure',
    agencies: ['County Treasurer', 'Tax Collector', 'Commissioner of State Lands', 'County Attorney'],
    searchTerms: ['tax sale list', 'tax foreclosure sale', 'tax deed auction', 'tax lien sale'],
    priority: 'critical',
  },
  {
    sourceType: 'sheriff_sale',
    label: 'Sheriff / trustee sales',
    agencies: ['County Sheriff', 'Trustee', 'Constable', 'Civil Division'],
    searchTerms: ['sheriff sale real estate', 'trustee sale real property', 'foreclosure auction list'],
    priority: 'critical',
  },
  {
    sourceType: 'foreclosure_court',
    label: 'Foreclosure court filings',
    agencies: ['County Court', 'District Court', 'Circuit Court', 'Clerk of Court'],
    searchTerms: ['foreclosure docket', 'mortgage foreclosure cases', 'lis pendens foreclosure'],
    priority: 'critical',
  },
  {
    sourceType: 'vacant_property_registry',
    label: 'Vacant / abandoned property registry',
    agencies: ['City Code Enforcement', 'County Code Enforcement', 'Housing Department'],
    searchTerms: ['vacant property registry', 'abandoned property registry', 'vacant building list'],
    priority: 'critical',
  },
  {
    sourceType: 'code_enforcement',
    label: 'Code-enforcement distress',
    agencies: ['Code Enforcement', 'Building Department', 'Neighborhood Services'],
    searchTerms: ['code enforcement property list', 'nuisance property list', 'unsafe structure list'],
    priority: 'high',
  },
  {
    sourceType: 'condemnation',
    label: 'Condemned / demolition properties',
    agencies: ['Building Safety', 'Code Enforcement', 'City Council', 'County Commission'],
    searchTerms: ['condemned property list', 'demolition list', 'dangerous building list', 'unsafe building notice'],
    priority: 'critical',
  },
  {
    sourceType: 'land_bank',
    label: 'Land-bank inventory',
    agencies: ['Land Bank', 'Redevelopment Authority', 'Community Development'],
    searchTerms: ['land bank available properties', 'land bank inventory', 'redevelopment property list'],
    priority: 'critical',
  },
  {
    sourceType: 'probate_estate',
    label: 'Probate / estate signals',
    agencies: ['Probate Court', 'Surrogate Court', 'County Clerk'],
    searchTerms: ['probate estate docket', 'estate property sale', 'probate real estate notice'],
    priority: 'high',
  },
  {
    sourceType: 'assessor',
    label: 'Assessor ownership and mailing clues',
    agencies: ['County Assessor', 'Property Appraiser'],
    searchTerms: ['property search assessor', 'real property records', 'property appraiser search'],
    priority: 'high',
  },
  {
    sourceType: 'recorder_clerk',
    label: 'Recorder / clerk notices',
    agencies: ['County Recorder', 'Register of Deeds', 'County Clerk'],
    searchTerms: ['notice of default', 'lis pendens', 'deed records', 'foreclosure notice'],
    priority: 'high',
  },
  {
    sourceType: 'municipal_agenda',
    label: 'Municipal agendas and public notices',
    agencies: ['City Clerk', 'County Commission', 'City Council'],
    searchTerms: ['public notice nuisance property', 'demolition agenda', 'property abatement agenda'],
    priority: 'normal',
  },
  {
    sourceType: 'hud_reo',
    label: 'HUD REO',
    agencies: ['HUD'],
    searchTerms: ['HUD homes REO inventory'],
    priority: 'high',
  },
  {
    sourceType: 'usda_reo',
    label: 'USDA resale inventory',
    agencies: ['USDA Rural Development', 'Farm Service Agency'],
    searchTerms: ['USDA resale properties', 'USDA government owned homes'],
    priority: 'high',
  },
  {
    sourceType: 'fannie_freddie_reo',
    label: 'Agency REO',
    agencies: ['Fannie Mae', 'Freddie Mac'],
    searchTerms: ['HomePath REO', 'HomeSteps REO'],
    priority: 'high',
  },
  {
    sourceType: 'bank_reo',
    label: 'Bank-owned / REO',
    agencies: ['Banks', 'Credit Unions', 'REO Asset Managers'],
    searchTerms: ['bank owned properties REO', 'REO property inventory'],
    priority: 'normal',
  },
];

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
] as const;

export const MORNING_PROPERTY_WATCH_RULES = {
  nationwide: true,
  discoverNewOfficialSources: true,
  recheckKnownSources: true,
  recordUnavailableSources: true,
  requireParcelOrAddressForPromotion: true,
  prioritizeMultiSourceMatches: true,
  onlyPublicLawfulSources: true,
  doNotRepeatUnchangedLeads: true,
};
