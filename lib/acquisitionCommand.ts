export type CapitalSource = {
  id: string;
  name: string;
  category: string;
  fit: string[];
  programs: string[];
  submission: string;
  status: 'active' | 'watch' | 'needs_account';
  notes: string;
};

export type AcquisitionDeal = {
  id: string;
  name: string;
  askingPrice: number;
  advertisedCashFlow: number;
  location: string;
  realEstateIncluded: boolean;
  structureGoal: string;
  status: string;
  nextActions: string[];
};

export const capitalSources: CapitalSource[] = [
  {
    id: 'loanspark',
    name: 'LoanSpark',
    category: 'Commercial & business lending marketplace / BLaaS',
    fit: ['business acquisitions', 'business-purpose loans', 'lines of credit', 'short-term capital', 'equipment financing', 'commercial real estate'],
    programs: ['Business loans', 'Business lines of credit', 'Short-term capital', 'Equipment financing', 'Commercial/DSCR/bridge programs when real estate applies'],
    submission: 'Partner/borrower portal, Express Intake, or early-stage scenario by email to Partner Advocate/support team.',
    status: 'active',
    notes: 'Use LoanSpark as a capital-source router. Do not force a leased-space business acquisition into a DSCR real-estate product. Ask LoanSpark to identify the best senior debt program, lender appetite, equity requirement, seller-note treatment, and prequalification path.'
  }
];

export const activeAcquisitions: AcquisitionDeal[] = [
  {
    id: '2026-laundromat-785k',
    name: '2024-built laundromat acquisition',
    askingPrice: 785000,
    advertisedCashFlow: 230964,
    location: 'U.S. Southwest',
    realEstateIncluded: false,
    structureGoal: 'Senior acquisition financing + seller note, target little or no buyer cash at closing',
    status: 'Financing scenario submitted to LoanSpark; seller diligence requested from broker Sean Hennigan.',
    nextActions: [
      'Receive and validate trailing financials, utilities, lease, equipment schedule, liens, and seller motivation.',
      'Receive LoanSpark financing indication or secure borrower-application link.',
      'Model lender debt + seller note + reserves and issue structured LOI only after verified cash flow supports debt service.'
    ]
  }
];

export const acquisitionWorkflow = [
  'Source opportunity',
  'Normalize ARR/run-rate claims, revenue, cash flow and seller add-backs before valuation',
  'Verify trailing financials and reconcile seller claims to bank, tax and accounting evidence',
  'Score downside, lease, equipment, customer concentration and operating risk',
  'Route to capital sources',
  'Build senior debt + seller financing + equity alternatives',
  'Stress-test debt service and working-capital reserves',
  'Negotiate LOI around terms, not just headline price',
  'Run diligence and lender underwriting',
  'Close with owner approval',
  'Track post-close performance against underwriting'
];
