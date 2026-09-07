import type { Metadata } from 'next';
import Link from 'next/link';
import FinanceOS from '../../components/FinanceOS';

export const metadata: Metadata = {
  title: 'Aridon Ag Finance OS | Ranch and Farm Accounting Intelligence',
  description: 'Books, tax preparation workflows, CFO planning and financial alerts for farms and ranches, including enterprise profitability and Schedule F-ready organization.',
};

export default function AgFinancePage() {
  return <>
    <FinanceOS mode="ag" />
    <div style={{ position:'fixed', left:16, bottom:16, zIndex:40, display:'flex', gap:10, flexWrap:'wrap' }}>
      <Link href="/customer/finance" style={{ background:'#C8E2AC', color:'#17301E', textDecoration:'none', borderRadius:999, padding:'12px 16px', fontWeight:950, boxShadow:'0 12px 30px rgba(0,0,0,.24)' }}>Open My Ag Finance Workspace</Link>
      <Link href="/ag/finance/capital-fit" style={{ background:'#17301E', color:'#fff', textDecoration:'none', borderRadius:999, padding:'12px 16px', fontWeight:950, boxShadow:'0 12px 30px rgba(0,0,0,.24)' }}>Regenerative Capital Fit</Link>
    </div>
  </>;
}
