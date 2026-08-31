import type { Metadata } from 'next';
import Link from 'next/link';
import FinanceOS from '../../components/FinanceOS';

export const metadata: Metadata = {
  title: 'Aridon Finance OS | Books, Tax, CFO and Financial Sentinel',
  description: 'Aridon Finance OS combines bookkeeping workflows, tax preparation, CFO planning and financial alerts inside the Aridon Business OS.',
};

export default function BusinessFinancePage() {
  return <>
    <FinanceOS mode="business" />
    <Link href="/customer/finance" style={{ position:'fixed', left:16, bottom:16, zIndex:40, background:'#9EF0CF', color:'#07130F', textDecoration:'none', borderRadius:999, padding:'12px 16px', fontWeight:950, boxShadow:'0 12px 30px rgba(0,0,0,.24)' }}>Open My Finance Workspace</Link>
  </>;
}
