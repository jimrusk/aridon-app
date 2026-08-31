import type { Metadata } from 'next';
import FinanceOS from '../../components/FinanceOS';

export const metadata: Metadata = {
  title: 'Aridon Finance OS | Books, Tax, CFO and Financial Sentinel',
  description: 'Aridon Finance OS combines bookkeeping workflows, tax preparation, CFO planning and financial alerts inside the Aridon Business OS.',
};

export default function BusinessFinancePage() {
  return <FinanceOS mode="business" />;
}
