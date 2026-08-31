'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

declare global {
  interface Window {
    Plaid?: { create: (config: any) => { open: () => void; destroy?: () => void } };
  }
}

type Connection = {
  provider: string;
  label: string;
  category: string;
  capabilities: string[];
  connectionMode: string;
  configured: boolean;
  status: string;
  company_name?: string | null;
  last_sync_at?: string | null;
  last_error?: string | null;
};

type FinanceData = {
  tenant: { id: string; slug: string; business_name: string; industry?: string | null };
  connections: Connection[];
  accounts: any[];
  transactions: any[];
  invoices: any[];
  reconciliations: any[];
  handoffs: any[];
  summary: {
    inflow: number;
    outflow: number;
    netCashMovement: number;
    unreconciled: number;
    uncategorized: number;
    openReceivables: number;
    overdueInvoices: number;
    connectedSources: number;
    cashBalance: number;
  };
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function FinanceWorkspace({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(searchParams.get('financeError') || '');
  const [message, setMessage] = useState(searchParams.get('connected') ? `${searchParams.get('connected')} connected. Sync it now to pull financial data.` : '');
  const [importKind, setImportKind] = useState<'transactions' | 'invoices'>('transactions');
  const [importSource, setImportSource] = useState('bank-csv');
  const [positiveMeans, setPositiveMeans] = useState<'inflow' | 'outflow'>('outflow');
  const [file, setFile] = useState<File | null>(null);
  const [taxYear, setTaxYear] = useState(new Date().getUTCFullYear());
  const [preparerName, setPreparerName] = useState('');
  const [preparerEmail, setPreparerEmail] = useState('');
  const [reconResult, setReconResult] = useState<any | null>(null);

  useEffect(() => {
    getBrowserClient().auth.getSession().then(async ({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/finance`)}`);
        return;
      }
      setToken(access);
      await load(access);
    });
  }, [params.slug, router]);

  async function load(access = token) {
    if (!access) return;
    setLoading(true);
    const response = await fetch(`/api/customer/finance?slug=${encodeURIComponent(params.slug)}`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      await getBrowserClient().auth.signOut();
      router.replace('/customer/login');
      return;
    }
    if (!response.ok) setError(result.error || 'Unable to load Finance OS.');
    else {
      setData(result);
      setError('');
    }
    setLoading(false);
  }

  async function api(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: params.slug, ...body }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Finance action failed.');
    return result;
  }

  async function connectOAuth(provider: 'quickbooks' | 'stripe') {
    try {
      setBusy(`connect-${provider}`); setError(''); setMessage('');
      const result = await api(`/api/customer/finance/connect/${provider}/start`, {});
      if (!result.url) throw new Error('Connection URL was not returned.');
      window.location.assign(result.url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); setBusy(''); }
  }

  async function connectPlaid() {
    try {
      setBusy('connect-plaid'); setError(''); setMessage('');
      const result = await api('/api/customer/finance/connect/plaid/link-token', {});
      await ensurePlaidScript();
      if (!window.Plaid) throw new Error('Bank connection window could not load.');
      const handler = window.Plaid.create({
        token: result.linkToken,
        onSuccess: async (publicToken: string, metadata: any) => {
          try {
            setBusy('connect-plaid');
            await api('/api/customer/finance/connect/plaid/exchange', { publicToken, institutionName: metadata?.institution?.name || null });
            setMessage('Bank connection approved. Pulling the first transaction sync next.');
            await syncProvider('plaid');
          } catch (e) { setError(e instanceof Error ? e.message : 'Bank connection failed.'); setBusy(''); }
        },
        onExit: (err: any) => {
          if (err?.display_message || err?.error_message) setError(err.display_message || err.error_message);
          setBusy('');
        },
      });
      handler.open();
    } catch (e) { setError(e instanceof Error ? e.message : 'Bank connection failed.'); setBusy(''); }
  }

  async function syncProvider(provider: 'plaid' | 'quickbooks' | 'stripe') {
    try {
      setBusy(`sync-${provider}`); setError('');
      const result = await api(`/api/customer/finance/sync/${provider}`, {});
      setMessage(`${providerLabel(provider)} synced. ${result.transactions ?? result.ledgerRows ?? result.added ?? 0} ledger row(s) refreshed.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Sync failed.'); }
    finally { setBusy(''); }
  }

  async function disconnect(provider: string) {
    if (!window.confirm(`Disconnect ${provider}? Imported historical ledger rows will stay in Finance OS unless you remove them separately.`)) return;
    try {
      setBusy(`disconnect-${provider}`); setError('');
      await api('/api/customer/finance/connect/disconnect', { provider });
      setMessage(`${provider} disconnected. Stored connector credentials were removed.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Disconnect failed.'); }
    finally { setBusy(''); }
  }

  async function importCsv() {
    if (!file) { setError('Choose a CSV file first.'); return; }
    try {
      setBusy('import'); setError(''); setMessage('');
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length < 2) throw new Error('The CSV does not contain data rows.');
      const headers = parsed[0].map((value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
      const objects = parsed.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
      const rows = importKind === 'invoices' ? mapInvoiceRows(objects) : mapTransactionRows(objects, positiveMeans);
      const result = await api('/api/customer/finance/import', { kind: importKind, source: importSource, filename: file.name, rows });
      setMessage(`Import finished: ${result.imported || 0} new row(s), ${result.duplicates || 0} already present.`);
      setFile(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed.'); }
    finally { setBusy(''); }
  }

  async function reconcile() {
    try {
      setBusy('reconcile'); setError(''); setMessage('');
      const result = await api('/api/customer/finance/reconcile', {});
      setReconResult(result);
      setMessage(`Reconciliation finished: ${result.matched || 0} invoice payment(s) matched, ${result.unresolved || 0} item(s) need review.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Reconciliation failed.'); }
    finally { setBusy(''); }
  }

  async function createHandoff() {
    try {
      setBusy('handoff'); setError(''); setMessage('');
      const result = await api('/api/customer/finance/handoff', { action: 'create', taxYear, preparerName, preparerEmail });
      setMessage(`Tax workpaper package for ${taxYear} created as a draft. Review it before owner approval.`);
      await load();
      return result.handoff;
    } catch (e) { setError(e instanceof Error ? e.message : 'Tax handoff failed.'); return null; }
    finally { setBusy(''); }
  }

  async function approveHandoff(id: string) {
    if (!window.confirm('Approve this tax workpaper package for handoff? This does not file or sign a tax return.')) return;
    try {
      setBusy(`approve-${id}`); setError('');
      await api('/api/customer/finance/handoff', { action: 'approve', handoffId: id, confirm: true });
      setMessage('Owner approval recorded. The package is ready to download and provide to the approved tax professional.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Approval failed.'); }
    finally { setBusy(''); }
  }

  async function downloadHandoff(id: string, year: number) {
    try {
      setBusy(`download-${id}`); setError('');
      const response = await fetch(`/api/customer/finance/handoff?slug=${encodeURIComponent(params.slug)}&handoffId=${encodeURIComponent(id)}&format=csv`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Unable to download ledger.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `aridon-finance-${year}-ledger.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Download failed.'); }
    finally { setBusy(''); }
  }

  const isAg = useMemo(() => /farm|ranch|agri|livestock|crop|dairy/i.test(data?.tenant?.industry || ''), [data]);
  if (loading && !data) return <main style={loadingPage}>Opening Finance OS…</main>;
  if (!data) return <main style={loadingPage}><div><h1>Finance OS could not open.</h1><p>{error}</p></div></main>;

  const connected = data.connections.filter((item) => item.status === 'connected');
  const latestRecon = data.reconciliations[0];

  return <main style={page}>
    <div style={shell}>
      <header style={header}>
        <div><div style={eyebrow}>ARIDON · FINANCE OS {isAg ? '· AG MODE' : ''}</div><h1 style={h1}>Books, tax prep, CFO and Financial Sentinel.</h1><p style={lead}>Connect the financial systems already in use, normalize the ledger, reconcile what does not match, and turn the month into decisions. Tax filing and signatures remain behind owner and professional approval.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href={`/workspace/${params.slug}`} style={outline}>Company Home</Link><Link href={isAg ? '/ag/finance' : '/business-os/finance'} style={outline}>Finance Overview</Link></div>
      </header>

      {error && <div style={errorBox}>{error}</div>}
      {message && <div style={successBox}>{message}</div>}

      <section style={metricGrid}>
        <Metric label="Month inflow" value={money.format(data.summary.inflow)} detail="Imported and synced" />
        <Metric label="Month outflow" value={money.format(data.summary.outflow)} detail="Operating cash out" />
        <Metric label="Net cash movement" value={money.format(data.summary.netCashMovement)} detail="Before financing adjustments" />
        <Metric label="Open receivables" value={money.format(data.summary.openReceivables)} detail={`${data.summary.overdueInvoices} overdue`} />
        <Metric label="Needs reconciliation" value={String(data.summary.unreconciled)} detail={`${data.summary.uncategorized} uncategorized`} />
        <Metric label="Connected sources" value={String(data.summary.connectedSources)} detail={`${data.accounts.length} finance account(s)`} />
      </section>

      <section style={{ ...panel, marginTop: 14 }}>
        <div style={sectionHead}><div><div style={label}>CONNECTION FABRIC</div><h2 style={h2}>Bring the books to Aridon.</h2></div><span style={badge}>{connected.length} live source{connected.length === 1 ? '' : 's'}</span></div>
        <div style={connectionGrid}>{data.connections.map((connection) => <ConnectionCard key={connection.provider} connection={connection} busy={busy} connectPlaid={connectPlaid} connectOAuth={connectOAuth} syncProvider={syncProvider} disconnect={disconnect} />)}</div>
      </section>

      <section style={twoCol}>
        <article style={panel}>
          <div style={label}>CSV / PAYROLL / INVOICE IMPORT</div><h2 style={h2}>Historical records without a connector.</h2><p style={muted}>Use exports from a bank, payroll service, accounting system or invoicing tool. Aridon stores normalized rows in the same ledger as connected sources.</p>
          <div style={formGrid}>
            <label style={field}><span>Import type</span><select value={importKind} onChange={(e) => setImportKind(e.target.value as any)} style={input}><option value="transactions">Transactions</option><option value="invoices">Invoices / receivables</option></select></label>
            <label style={field}><span>Source</span><select value={importSource} onChange={(e) => setImportSource(e.target.value)} style={input}><option value="bank-csv">Bank / card CSV</option><option value="payroll">Payroll export</option><option value="invoicing">Invoice export</option><option value="accounting-csv">Accounting CSV</option></select></label>
            {importKind === 'transactions' && <label style={field}><span>Positive amounts mean</span><select value={positiveMeans} onChange={(e) => setPositiveMeans(e.target.value as any)} style={input}><option value="outflow">Money out</option><option value="inflow">Money in</option></select></label>}
            <label style={field}><span>CSV file</span><input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} style={input} /></label>
          </div>
          <button disabled={busy === 'import'} onClick={() => void importCsv()} style={primary}>{busy === 'import' ? 'Importing…' : 'Import into Finance OS'}</button>
          <p style={tiny}>Recognized transaction columns include Date, Description/Name/Memo, Amount or Debit/Credit, Category and Reference. Invoice imports recognize Invoice Number, Customer, Issue Date, Due Date, Total, Balance and Status.</p>
        </article>

        <article style={panel}>
          <div style={label}>AUTOMATIC RECONCILIATION</div><h2 style={h2}>Make the ledger argue with itself.</h2><p style={muted}>Aridon matches invoice payments by amount and timing, then flags possible duplicates, unmatched deposits, overdue invoices and uncategorized activity for human review.</p>
          <button disabled={busy === 'reconcile'} onClick={() => void reconcile()} style={primary}>{busy === 'reconcile' ? 'Reconciling…' : 'Run reconciliation now'}</button>
          {latestRecon && <div style={darkBox}><strong>Latest run</strong><div>{latestRecon.matched_count} matched · {latestRecon.unresolved_count} need review</div><div style={tinyDark}>{latestRecon.period_start} → {latestRecon.period_end}</div></div>}
          {reconResult?.items?.length > 0 && <div style={{ marginTop: 12, maxHeight: 220, overflow: 'auto' }}>{reconResult.items.slice(0, 20).map((item: any, index: number) => <div key={`${item.issue_type}-${index}`} style={issueRow}><strong>{String(item.issue_type).replace(/_/g, ' ')}</strong><span>{item.note}</span></div>)}</div>}
        </article>
      </section>

      <section style={twoCol}>
        <article style={panel}>
          <div style={label}>RECENT LEDGER</div><h2 style={h2}>What hit the books.</h2>
          {data.transactions.length === 0 ? <p style={muted}>No transactions yet. Connect a source or import a CSV.</p> : <div style={{ overflowX: 'auto' }}><table style={table}><thead><tr><th>Date</th><th>Description</th><th>Source</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>{data.transactions.slice(0, 24).map((tx) => <tr key={tx.id}><td>{tx.posted_at}</td><td>{tx.description}</td><td>{tx.source}</td><td>{tx.category || <span style={{ color: '#A36B13' }}>review</span>}</td><td style={{ textAlign: 'right', fontWeight: 900, color: tx.direction === 'inflow' ? '#176B4D' : '#8A3C3C' }}>{tx.direction === 'inflow' ? '+' : '-'}{money.format(Number(tx.amount || 0))}</td></tr>)}</tbody></table></div>}
        </article>

        <article style={panel}>
          <div style={label}>RECEIVABLES</div><h2 style={h2}>Invoices still waiting for cash.</h2>
          {data.invoices.filter((invoice) => !['paid', 'void', 'deleted'].includes(String(invoice.status || '').toLowerCase())).length === 0 ? <p style={muted}>No open invoices are in the finance ledger.</p> : <div>{data.invoices.filter((invoice) => !['paid', 'void', 'deleted'].includes(String(invoice.status || '').toLowerCase())).slice(0, 15).map((invoice) => <div key={invoice.id} style={row}><div><strong>{invoice.invoice_number || invoice.customer_name || 'Invoice'}</strong><div style={tiny}>{invoice.customer_name || 'Customer'} · due {invoice.due_date || 'not set'}</div></div><strong>{money.format(Number(invoice.balance || 0))}</strong></div>)}</div>}
        </article>
      </section>

      <section style={{ ...panel, marginTop: 14 }}>
        <div style={sectionHead}><div><div style={label}>CPA / EA HANDOFF</div><h2 style={h2}>Prepare the tax package. Keep filing authority human.</h2></div><span style={badge}>Owner approval gate</span></div>
        <div style={handoffGrid}>
          <div><p style={muted}>Aridon summarizes income, expenses, tax categories, unreconciled items and open receivables, then packages the year ledger for the approved preparer. Creating a package does not file, sign or transmit a return.</p><div style={formGrid}><label style={field}><span>Tax year</span><input type="number" value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))} style={input} /></label><label style={field}><span>Preparer name</span><input value={preparerName} onChange={(e) => setPreparerName(e.target.value)} placeholder="CPA / EA / tax firm" style={input} /></label><label style={field}><span>Preparer email</span><input value={preparerEmail} onChange={(e) => setPreparerEmail(e.target.value)} placeholder="optional" style={input} /></label></div><button disabled={busy === 'handoff'} onClick={() => void createHandoff()} style={primary}>{busy === 'handoff' ? 'Preparing…' : 'Create draft tax package'}</button></div>
          <div>{data.handoffs.length === 0 ? <div style={emptyBox}>No tax handoff packages yet.</div> : data.handoffs.map((handoff) => <div key={handoff.id} style={handoffCard}><div><strong>{handoff.tax_year} workpaper package</strong><div style={tiny}>{handoff.preparer_name || 'Preparer not assigned'} · {handoff.status}</div><div style={tiny}>{handoff.summary?.transactionCount || 0} ledger rows · {handoff.summary?.unreconciledCount || 0} unreconciled</div></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{!handoff.owner_approved && <button disabled={busy === `approve-${handoff.id}`} onClick={() => void approveHandoff(handoff.id)} style={smallButton}>Owner approve</button>}<button disabled={busy === `download-${handoff.id}`} onClick={() => void downloadHandoff(handoff.id, handoff.tax_year)} style={smallButton}>Download ledger</button></div></div>)}</div>
        </div>
      </section>

      {isAg && <section style={agBox}><div><strong>🌾 Ag Finance is active for this workspace.</strong><p style={{ margin: '6px 0 0', color: '#DCE9DD' }}>Use the same ledger for Schedule F-ready organization, herd/crop enterprise analysis, cost per head or acre, equipment depreciation workpapers, lender packages and grant evidence.</p></div><Link href="/ag/finance" style={agLink}>Open Ag Finance overview</Link></section>}
    </div>
  </main>;
}

function ConnectionCard({ connection, busy, connectPlaid, connectOAuth, syncProvider, disconnect }: any) {
  const connected = connection.status === 'connected';
  const setupNeeded = !connection.configured && connection.connectionMode !== 'manual';
  return <article style={connectionCard}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}><div><strong style={{ fontSize: 18 }}>{connection.label}</strong><div style={tiny}>{connection.category}</div></div><span style={{ ...statusPill, background: connected ? '#DDF7EA' : setupNeeded ? '#FFF0D0' : '#ECE8DF', color: connected ? '#176B4D' : setupNeeded ? '#7D5717' : '#4E4A43' }}>{connected ? 'connected' : setupNeeded ? 'setup required' : connection.status.replace(/_/g, ' ')}</span></div><p style={{ ...muted, minHeight: 54 }}>{connection.capabilities.slice(0, 4).join(' · ')}</p>{connection.company_name && <div style={tiny}><strong>{connection.company_name}</strong></div>}{connection.last_sync_at && <div style={tiny}>Last sync {new Date(connection.last_sync_at).toLocaleString()}</div>}{connection.last_error && <div style={{ ...tiny, color: '#8A3C3C' }}>{connection.last_error}</div>}<div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>{connected && ['plaid', 'quickbooks', 'stripe-connect'].includes(connection.provider) && <button disabled={busy === `sync-${connection.provider === 'stripe-connect' ? 'stripe' : connection.provider}`} onClick={() => syncProvider(connection.provider === 'stripe-connect' ? 'stripe' : connection.provider)} style={smallButton}>Sync now</button>}{connected && <button disabled={busy === `disconnect-${connection.provider}`} onClick={() => disconnect(connection.provider)} style={ghostButton}>Disconnect</button>}{!connected && connection.provider === 'plaid' && <button disabled={setupNeeded || busy === 'connect-plaid'} onClick={() => connectPlaid()} style={smallButton}>{setupNeeded ? 'Add Plaid keys first' : 'Connect bank'}</button>}{!connected && connection.provider === 'quickbooks' && <button disabled={setupNeeded || busy === 'connect-quickbooks'} onClick={() => connectOAuth('quickbooks')} style={smallButton}>{setupNeeded ? 'Add Intuit keys first' : 'Connect QuickBooks'}</button>}{!connected && connection.provider === 'stripe-connect' && <button disabled={setupNeeded || busy === 'connect-stripe'} onClick={() => connectOAuth('stripe')} style={smallButton}>{setupNeeded ? 'Enable Stripe Connect first' : 'Connect Stripe'}</button>}{!connected && connection.connectionMode === 'manual' && <span style={tiny}>Use the import panel below.</span>}</div></article>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article style={metric}><div style={tiny}>{label}</div><strong style={{ fontSize: 28 }}>{value}</strong><div style={tiny}>{detail}</div></article>;
}

function providerLabel(provider: string) {
  if (provider === 'plaid') return 'Bank feeds';
  if (provider === 'quickbooks') return 'QuickBooks';
  if (provider === 'stripe') return 'Stripe';
  return provider;
}

function ensurePlaidScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Plaid) { resolve(); return; }
    const existing = document.querySelector('script[data-aridon-plaid]') as HTMLScriptElement | null;
    if (existing) { existing.addEventListener('load', () => resolve(), { once: true }); existing.addEventListener('error', () => reject(new Error('Plaid Link failed to load.')), { once: true }); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.dataset.aridonPlaid = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Plaid Link failed to load.'));
    document.head.appendChild(script);
  });
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function findValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) if (typeof row[key] === 'string' && row[key].trim()) return row[key].trim();
  return '';
}

function parseAmount(value: string) {
  if (!value) return 0;
  const negative = /^\s*\(.*\)\s*$/.test(value);
  const cleaned = value.replace(/[,$()\s]/g, '');
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return 0;
  return negative ? -Math.abs(number) : number;
}

function mapTransactionRows(rows: Record<string, string>[], positiveMeans: 'inflow' | 'outflow') {
  return rows.map((row, index) => {
    const date = findValue(row, ['date', 'posted_date', 'transaction_date', 'posting_date']);
    const description = findValue(row, ['description', 'name', 'memo', 'payee', 'merchant', 'details']);
    const debit = parseAmount(findValue(row, ['debit', 'withdrawal', 'money_out']));
    const credit = parseAmount(findValue(row, ['credit', 'deposit', 'money_in']));
    let amount = parseAmount(findValue(row, ['amount', 'transaction_amount', 'value']));
    let direction: 'inflow' | 'outflow' = positiveMeans;
    if (debit) { amount = Math.abs(debit); direction = 'outflow'; }
    else if (credit) { amount = Math.abs(credit); direction = 'inflow'; }
    else if (amount < 0) { amount = Math.abs(amount); direction = positiveMeans === 'outflow' ? 'inflow' : 'outflow'; }
    return {
      id: findValue(row, ['transaction_id', 'id', 'reference_id']) || `row-${index}`,
      date,
      description,
      amount,
      direction,
      merchant: findValue(row, ['merchant', 'payee', 'vendor']),
      category: findValue(row, ['category', 'account_category']),
      taxCategory: findValue(row, ['tax_category', 'tax_line']),
      reference: findValue(row, ['reference', 'check_number', 'check_no', 'transaction_id']),
    };
  }).filter((row) => row.date && row.description && row.amount);
}

function mapInvoiceRows(rows: Record<string, string>[]) {
  return rows.map((row, index) => ({
    id: findValue(row, ['invoice_id', 'id']) || `invoice-${index}`,
    invoiceNumber: findValue(row, ['invoice_number', 'invoice_no', 'number', 'invoice']),
    customerName: findValue(row, ['customer_name', 'customer', 'client', 'name']),
    issueDate: findValue(row, ['issue_date', 'invoice_date', 'date']),
    dueDate: findValue(row, ['due_date', 'due']),
    total: Math.abs(parseAmount(findValue(row, ['total', 'invoice_total', 'amount']))),
    balance: Math.abs(parseAmount(findValue(row, ['balance', 'open_balance', 'amount_due']))),
    status: findValue(row, ['status']),
  })).filter((row) => row.invoiceNumber || row.customerName || row.total || row.balance);
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 18px 80px' };
const loadingPage = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial, sans-serif' };
const shell = { maxWidth: 1220, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 24 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(44px,7vw,76px)', lineHeight: .96, letterSpacing: -3, margin: '10px 0 14px', maxWidth: 900 };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 900 };
const outline = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
const errorBox = { background: '#FCE5EA', color: '#7B233A', borderRadius: 11, padding: 13, marginBottom: 14 };
const successBox = { background: '#DDF7EA', color: '#155D43', borderRadius: 11, padding: 13, marginBottom: 14 };
const metricGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 10 };
const metric = { background: '#0D192B', border: '1px solid #263650', borderRadius: 15, padding: 16, display: 'grid', gap: 7 };
const panel = { background: '#F5F2EA', color: '#171717', border: '1px solid #D4CEC1', borderRadius: 18, padding: 20 };
const sectionHead = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' as const };
const label = { fontSize: 11, fontWeight: 950, letterSpacing: 1, color: '#285D47' };
const h2 = { fontSize: 30, margin: '7px 0 10px' };
const badge = { background: '#DDF7EA', color: '#176B4D', padding: '6px 9px', borderRadius: 999, fontSize: 11, fontWeight: 950 };
const connectionGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10, marginTop: 14 };
const connectionCard = { background: '#fff', border: '1px solid #D8D2C7', borderRadius: 14, padding: 15 };
const statusPill = { padding: '5px 8px', borderRadius: 999, fontSize: 10, fontWeight: 950 };
const muted = { color: '#625E56', lineHeight: 1.55, fontSize: 14 };
const tiny = { color: '#746F67', fontSize: 11, lineHeight: 1.45 };
const tinyDark = { color: '#A8B5C8', fontSize: 11, lineHeight: 1.45 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,390px),1fr))', gap: 14, marginTop: 14 };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 9, marginTop: 14 };
const field = { display: 'grid', gap: 5, color: '#5D594F', fontSize: 12, fontWeight: 850 };
const input = { border: '1px solid #C8C1B5', borderRadius: 9, padding: '11px 12px', background: '#fff', color: '#171717', font: 'inherit' };
const primary = { marginTop: 13, background: '#171717', color: '#fff', border: 0, borderRadius: 10, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' };
const smallButton = { border: 0, background: '#171717', color: '#fff', borderRadius: 8, padding: '8px 10px', fontWeight: 900, cursor: 'pointer', fontSize: 12 };
const ghostButton = { border: '1px solid #BEB7AC', background: '#fff', color: '#423E37', borderRadius: 8, padding: '7px 9px', fontWeight: 850, cursor: 'pointer', fontSize: 12 };
const darkBox = { background: '#0D192B', color: '#fff', borderRadius: 12, padding: 13, marginTop: 13, display: 'grid', gap: 5 };
const issueRow = { display: 'grid', gap: 3, borderTop: '1px solid #D8D2C7', padding: '9px 0', fontSize: 12 };
const table = { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 };
const row = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', padding: '11px 0', borderTop: '1px solid #DDD6CA' };
const handoffGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: 16 };
const handoffCard = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const, padding: '12px 0', borderTop: '1px solid #DDD6CA' };
const emptyBox = { background: '#fff', border: '1px dashed #C7C0B4', borderRadius: 12, padding: 18, color: '#6F695F' };
const agBox = { marginTop: 14, background: '#163D2A', border: '1px solid #2A6045', borderRadius: 17, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const };
const agLink = { background: '#C8E2AC', color: '#17301E', textDecoration: 'none', borderRadius: 10, padding: '11px 13px', fontWeight: 950 };
