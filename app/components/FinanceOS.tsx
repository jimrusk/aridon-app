'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, BookOpenCheck, Calculator, CheckCircle2, FileCheck2, Landmark, Leaf, ReceiptText, ShieldCheck, Sprout } from 'lucide-react';

type Mode = 'business' | 'ag';

type FinanceOSProps = {
  mode: Mode;
};

const businessModules = [
  {
    icon: BookOpenCheck,
    title: 'Books',
    text: 'General ledger, bank and card reconciliation workflow, AR/AP, invoicing, payroll entries, inventory, fixed assets, job costing and monthly close.',
  },
  {
    icon: FileCheck2,
    title: 'Tax',
    text: 'Tax organizer, estimated-tax reserve, 1099 tracking, sales-tax workpapers, depreciation schedules, deduction support and federal/state filing packages.',
  },
  {
    icon: BarChart3,
    title: 'CFO',
    text: 'Budgets, rolling cash forecasts, margin analysis, scenario planning, working-capital decisions and lender-ready financial packages.',
  },
  {
    icon: ShieldCheck,
    title: 'Financial Sentinel',
    text: 'Review queues for unusual transactions, duplicate charges, missing deposits, overdue receivables, cash pressure, tax deadlines and owner approvals.',
  },
];

const agModules = [
  'Schedule F-ready income and expense organization',
  'Livestock, crop and enterprise-level profitability',
  'Cost per head, acre and production unit',
  'Feed, seed, fertilizer, fuel, veterinary and repair tracking',
  'Equipment, vehicle and breeding-stock depreciation workpapers',
  'USDA, lender, insurance and grant evidence packs',
  'Weather-loss and disaster-support documentation trail',
  '1099 contractor and seasonal labor review',
];

const closeSteps = [
  'Collect bank, card, payroll, sales and loan activity',
  'Categorize and reconcile transactions',
  'Review AR, AP, inventory and fixed assets',
  'Close the month and produce financial statements',
  'Refresh tax reserve, forecast and owner alerts',
  'Send tax workpapers to the approved preparer when needed',
];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

function n(value: string) {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FinanceOS({ mode }: FinanceOSProps) {
  const isAg = mode === 'ag';
  const [revenue, setRevenue] = useState('100000');
  const [expenses, setExpenses] = useState('72000');
  const [cash, setCash] = useState('85000');
  const [receivables, setReceivables] = useState('30000');
  const [payables, setPayables] = useState('18000');
  const [taxRate, setTaxRate] = useState('25');
  const [units, setUnits] = useState(isAg ? '250' : '0');

  const metrics = useMemo(() => {
    const r = n(revenue);
    const e = n(expenses);
    const c = n(cash);
    const ar = n(receivables);
    const ap = n(payables);
    const rate = Math.max(0, n(taxRate)) / 100;
    const unitCount = Math.max(0, n(units));
    const profit = r - e;
    const taxReserve = Math.max(0, profit * rate);
    const afterTax = profit - taxReserve;
    const cashCoverage = e > 0 ? c / e : 0;
    const workingCapital = c + ar - ap;
    const perUnit = unitCount > 0 ? profit / unitCount : 0;
    return { profit, taxReserve, afterTax, cashCoverage, workingCapital, perUnit };
  }, [revenue, expenses, cash, receivables, payables, taxRate, units]);

  const green = '#163d2a';
  const accent = isAg ? '#c8e2ac' : '#9ef0cf';
  const background = isAg ? '#f4f1e8' : '#f4f1e9';

  return (
    <main style={{ minHeight: '100vh', background, color: '#18211c', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#07101d', color: '#fff', padding: '16px 18px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong style={{ letterSpacing: 1.2 }}>ARIDON FINANCE OS</strong>
            <div style={{ color: '#aeb9c8', fontSize: 12, marginTop: 3 }}>{isAg ? 'AGRICULTURE EDITION' : 'BUSINESS EDITION'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={isAg ? '/ag' : '/business-os'} style={darkButton}>{isAg ? 'Back to Aridon Ag' : 'Back to Business OS'}</Link>
            {isAg && <Link href="/business-os/finance" style={darkButton}>Business Finance OS</Link>}
          </div>
        </div>
      </header>

      <section style={{ background: isAg ? green : '#0d1728', color: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', padding: '62px 18px 58px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ color: accent, fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>BOOKS → TAX → CFO → SENTINEL</div>
            <h1 style={{ fontSize: 'clamp(48px,8vw,82px)', lineHeight: .94, letterSpacing: -3, margin: '12px 0 20px' }}>One financial operating system, not four disconnected tools.</h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: '#d5dde8', maxWidth: 790 }}>
              Aridon Finance OS is the command layer for bookkeeping, tax preparation workflows, financial planning and owner alerts. {isAg ? 'For farms and ranches, it also tracks the economics that matter by herd, crop, acre and enterprise.' : 'It is designed to connect financial truth to sales, operations, hiring, acquisition decisions and growth.'}
            </p>
          </div>
          <aside style={{ background: '#fff', color: '#18211c', borderRadius: 20, padding: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: isAg ? '#356943' : '#1d6c50' }}>CONTROLLED ACCOUNTING</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 14px' }}>AI does the repetitive work. People keep authority.</h2>
            {[
              'Every consequential adjustment can enter a review queue',
              'Owner approval stays required for payments and commitments',
              'Tax workpapers can be prepared without pretending Aridon is the signing tax professional',
              'Credentialed tax professionals can review and file where required',
            ].map((item) => <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 10, lineHeight: 1.45 }}><CheckCircle2 size={19} color={green} style={{ flex: '0 0 auto', marginTop: 1 }} /><span>{item}</span></div>)}
          </aside>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: 'auto', padding: '58px 18px' }}>
        <div style={{ fontSize: 12, fontWeight: 950, color: isAg ? '#356943' : '#1d6c50' }}>THE FOUR FINANCE DESKS</div>
        <h2 style={{ fontSize: 'clamp(36px,5vw,56px)', margin: '8px 0 22px' }}>From raw transactions to a decision you can use.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 12 }}>
          {businessModules.map(({ icon: Icon, title, text }) => (
            <article key={title} style={card}>
              <Icon size={28} color={green} />
              <h3 style={{ fontSize: 24, margin: '12px 0 7px' }}>{title}</h3>
              <p style={copy}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {isAg && (
        <section style={{ background: '#e6ecdf', padding: '54px 18px' }}>
          <div style={{ maxWidth: 1180, margin: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 24 }}>
            <div>
              <Sprout size={34} color="#356943" />
              <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, marginTop: 12 }}>ARIDON AG FINANCE</div>
              <h2 style={{ fontSize: 'clamp(38px,5vw,58px)', margin: '8px 0 12px' }}>The books should understand the ranch.</h2>
              <p style={{ ...copy, fontSize: 18 }}>A generic P&L can hide the difference between a profitable enterprise and a costly one. The Ag edition is built to organize records around the way producers actually make operating decisions.</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #cbd9c7', borderRadius: 18, padding: 20, display: 'grid', gap: 9 }}>
              {agModules.map((item) => <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.45 }}><Leaf size={18} color="#356943" style={{ flex: '0 0 auto', marginTop: 2 }} /><span>{item}</span></div>)}
            </div>
          </div>
        </section>
      )}

      <section style={{ maxWidth: 1180, margin: 'auto', padding: '58px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Calculator size={28} color={green} /><div style={{ fontSize: 12, fontWeight: 950, color: isAg ? '#356943' : '#1d6c50' }}>LIVE OWNER SNAPSHOT</div></div>
        <h2 style={{ fontSize: 'clamp(36px,5vw,54px)', margin: '8px 0 8px' }}>Turn this month into a finance brief.</h2>
        <p style={{ ...copy, maxWidth: 820 }}>This first live layer gives the owner an immediate monthly operating picture while bank, payroll, accounting and tax-preparer connectors are wired into the deeper ledger workflow.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 16, marginTop: 24 }}>
          <article style={card}>
            <Input label="Revenue" value={revenue} setValue={setRevenue} />
            <Input label="Operating expenses" value={expenses} setValue={setExpenses} />
            <Input label="Cash on hand" value={cash} setValue={setCash} />
            <Input label="Accounts receivable" value={receivables} setValue={setReceivables} />
            <Input label="Accounts payable" value={payables} setValue={setPayables} />
            <Input label="Estimated tax reserve %" value={taxRate} setValue={setTaxRate} />
            {isAg && <Input label="Head / acres / production units" value={units} setValue={setUnits} />}
          </article>
          <article style={{ ...card, background: '#07101d', color: '#fff', borderColor: '#07101d' }}>
            <Metric label="Operating profit" value={money(metrics.profit)} />
            <Metric label="Suggested tax reserve" value={money(metrics.taxReserve)} />
            <Metric label="Profit after reserve" value={money(metrics.afterTax)} />
            <Metric label="Working capital snapshot" value={money(metrics.workingCapital)} />
            <Metric label="Cash / monthly expense coverage" value={`${metrics.cashCoverage.toFixed(1)}×`} />
            {isAg && <Metric label="Profit per entered production unit" value={money(metrics.perUnit)} />}
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: metrics.profit >= 0 ? '#102d25' : '#3a1f1f', color: '#e9f6ef', lineHeight: 1.45 }}>
              {metrics.profit >= 0 ? 'Positive operating month. Next check: whether profit is converting to cash and whether the tax reserve is funded.' : 'Operating loss detected. Sentinel should surface the largest expense and revenue variances before the next owner decision.'}
            </div>
          </article>
        </div>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #d8d4ca', borderBottom: '1px solid #d8d4ca', padding: '56px 18px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 24 }}>
          <div>
            <ReceiptText size={30} color={green} />
            <div style={{ fontSize: 12, fontWeight: 950, color: isAg ? '#356943' : '#1d6c50', marginTop: 10 }}>MONTH-END CLOSE</div>
            <h2 style={{ fontSize: 42, margin: '8px 0 10px' }}>A repeatable close, every month.</h2>
            <p style={copy}>The goal is not merely a cleaner P&L. The close refreshes the tax picture, cash forecast and next decisions across the rest of Aridon.</p>
          </div>
          <div style={{ display: 'grid', gap: 9 }}>
            {closeSteps.map((step, index) => <div key={step} style={{ ...card, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ width: 28, height: 28, borderRadius: 99, display: 'grid', placeItems: 'center', background: '#e7f2ea', color: green, fontWeight: 950, flex: '0 0 auto' }}>{index + 1}</span><span style={{ lineHeight: 1.45 }}>{step}</span></div>)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: 'auto', padding: '56px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          <article style={card}>
            <Landmark size={28} color={green} />
            <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginTop: 10 }}>CONNECTOR LAYER</div>
            <h3 style={{ fontSize: 28, margin: '7px 0' }}>Next connections</h3>
            <p style={copy}>Bank and card feeds, QuickBooks, payroll, payment processors, invoicing, lender data and tax-preparer handoff. These require account authorization and are not represented here as already connected.</p>
          </article>
          <article style={card}>
            <AlertTriangle size={28} color="#9a6116" />
            <div style={{ fontSize: 12, fontWeight: 950, color: '#9a6116', marginTop: 10 }}>TAX AUTHORITY</div>
            <h3 style={{ fontSize: 28, margin: '7px 0' }}>Preparation is not the same as signing.</h3>
            <p style={copy}>Aridon can organize records, calculate planning estimates, prepare workpapers and route review. Tax returns that require a credentialed preparer, signature or electronic filing remain behind the appropriate human authorization and professional review.</p>
          </article>
        </div>
      </section>

      <footer style={{ background: '#07101d', color: '#aeb9c8', padding: '28px 18px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>Aridon Finance OS · finance truth feeding operating decisions</div>
          <div>{isAg ? 'Ag edition enabled' : 'Business edition'}</div>
        </div>
      </footer>
    </main>
  );
}

function Input({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return <label style={{ display: 'grid', gap: 5, marginBottom: 12 }}><span style={{ fontSize: 12, fontWeight: 900, color: '#59635d' }}>{label}</span><input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} style={{ border: '1px solid #cbc8be', borderRadius: 10, padding: '12px 13px', fontSize: 17, background: '#fff', color: '#171717' }} /></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid #263246' }}><span style={{ color: '#aeb9c8' }}>{label}</span><strong style={{ textAlign: 'right' }}>{value}</strong></div>;
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #d7d2c7', borderRadius: 17, padding: 19 };
const copy: React.CSSProperties = { color: '#58625c', lineHeight: 1.6, margin: 0 };
const darkButton: React.CSSProperties = { color: '#fff', border: '1px solid #40516b', borderRadius: 999, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
