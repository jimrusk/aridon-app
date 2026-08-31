import type { Metadata } from 'next';
import FinanceOS from '../../components/FinanceOS';

export const metadata: Metadata = {
  title: 'Aridon Ag Finance OS | Ranch and Farm Accounting Intelligence',
  description: 'Books, tax preparation workflows, CFO planning and financial alerts for farms and ranches, including enterprise profitability and Schedule F-ready organization.',
};

export default function AgFinancePage() {
  return <FinanceOS mode="ag" />;
}
