import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../lib/customerAuth';
import { cleanFinanceText } from '../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

function dayDiff(a: string, b: string) {
  const left = new Date(`${a}T00:00:00Z`).getTime();
  const right = new Date(`${b}T00:00:00Z`).getTime();
  return Math.abs(left - right) / 86400000;
}

function normalizeWords(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter((word) => word.length >= 3);
}

function similarity(a: unknown, b: unknown) {
  const left = new Set(normalizeWords(a));
  const right = new Set(normalizeWords(b));
  if (!left.size || !right.size) return 0;
  let common = 0;
  left.forEach((word) => { if (right.has(word)) common += 1; });
  return common / Math.max(left.size, right.size);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const tenantId = membership.tenant.id;

    const today = new Date();
    const defaultStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)).toISOString().slice(0, 10);
    const periodStart = cleanFinanceText(body?.periodStart, 20) || defaultStart;
    const periodEnd = cleanFinanceText(body?.periodEnd, 20) || today.toISOString().slice(0, 10);

    const [transactionResult, invoiceResult] = await Promise.all([
      auth.db.from('customer_finance_transactions').select('*').eq('tenant_id', tenantId).gte('posted_at', periodStart).lte('posted_at', periodEnd).order('posted_at'),
      auth.db.from('customer_finance_invoices').select('*').eq('tenant_id', tenantId).order('due_date', { ascending: true, nullsFirst: false }),
    ]);
    if (transactionResult.error) throw transactionResult.error;
    if (invoiceResult.error) throw invoiceResult.error;

    const transactions = transactionResult.data || [];
    const invoices = invoiceResult.data || [];
    const items: Array<Record<string, unknown>> = [];
    const transactionUpdates: string[] = [];
    const invoiceUpdates: Array<{ id: string; transactionId: string }> = [];
    const usedTransactions = new Set<string>();
    let matched = 0;

    for (const invoice of invoices) {
      if (['paid', 'void', 'deleted'].includes(String(invoice.status || '').toLowerCase())) continue;
      const targetAmount = Number(invoice.balance || invoice.total || 0);
      if (targetAmount <= 0) continue;
      const candidates = transactions
        .filter((transaction) => transaction.direction === 'inflow' && !usedTransactions.has(transaction.id) && Math.abs(Number(transaction.amount || 0) - targetAmount) <= 0.01)
        .map((transaction) => {
          const anchorDate = invoice.due_date || invoice.issue_date || transaction.posted_at;
          const days = anchorDate ? dayDiff(transaction.posted_at, anchorDate) : 30;
          const words = similarity(`${transaction.description || ''} ${transaction.merchant || ''} ${transaction.reference || ''}`, `${invoice.customer_name || ''} ${invoice.invoice_number || ''}`);
          const dateScore = Math.max(0, 1 - Math.min(days, 45) / 45);
          const confidence = Math.min(0.99, 0.62 + dateScore * 0.22 + words * 0.15);
          return { transaction, confidence, days };
        })
        .sort((a, b) => b.confidence - a.confidence);
      const best = candidates[0];
      if (best && best.confidence >= 0.7) {
        matched += 1;
        usedTransactions.add(best.transaction.id);
        transactionUpdates.push(best.transaction.id);
        invoiceUpdates.push({ id: invoice.id, transactionId: best.transaction.id });
        items.push({
          tenant_id: tenantId,
          transaction_id: best.transaction.id,
          invoice_id: invoice.id,
          issue_type: 'invoice_payment_match',
          confidence: best.confidence,
          status: best.confidence >= 0.88 ? 'auto_matched' : 'review',
          note: `Amount matched exactly; timing difference ${best.days.toFixed(0)} day(s).`,
        });
      }
    }

    const signatureMap = new Map<string, any[]>();
    for (const transaction of transactions) {
      const signature = [transaction.posted_at, Number(transaction.amount || 0).toFixed(2), transaction.direction, String(transaction.description || '').toLowerCase().replace(/\s+/g, ' ').trim()].join('|');
      const group = signatureMap.get(signature) || [];
      group.push(transaction);
      signatureMap.set(signature, group);
    }
    for (const group of signatureMap.values()) {
      if (group.length <= 1) continue;
      for (const transaction of group.slice(1)) {
        items.push({ tenant_id: tenantId, transaction_id: transaction.id, invoice_id: null, issue_type: 'possible_duplicate', confidence: 0.86, status: 'review', note: 'Same date, amount, direction and description as another transaction.' });
      }
    }

    for (const transaction of transactions) {
      if (!transaction.category) {
        items.push({ tenant_id: tenantId, transaction_id: transaction.id, invoice_id: null, issue_type: 'uncategorized_transaction', confidence: 1, status: 'review', note: 'No accounting category has been assigned.' });
      }
      if (transaction.direction === 'inflow' && !usedTransactions.has(transaction.id) && Number(transaction.amount || 0) >= 1) {
        items.push({ tenant_id: tenantId, transaction_id: transaction.id, invoice_id: null, issue_type: 'unmatched_deposit', confidence: 0.8, status: 'review', note: 'Deposit is not matched to an imported invoice.' });
      }
    }

    const now = Date.now();
    for (const invoice of invoices) {
      if (['paid', 'void', 'deleted'].includes(String(invoice.status || '').toLowerCase())) continue;
      if (invoice.due_date && new Date(`${invoice.due_date}T23:59:59Z`).getTime() < now && !invoiceUpdates.some((item) => item.id === invoice.id)) {
        items.push({ tenant_id: tenantId, transaction_id: null, invoice_id: invoice.id, issue_type: 'overdue_invoice', confidence: 1, status: 'review', note: `Invoice is overdue with ${Number(invoice.balance || 0).toFixed(2)} still open.` });
      }
    }

    const unresolved = items.filter((item) => item.status !== 'auto_matched').length;
    const { data: run, error: runError } = await auth.db.from('customer_finance_reconciliation_runs').insert({
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'completed',
      matched_count: matched,
      unresolved_count: unresolved,
      summary: {
        transactionCount: transactions.length,
        invoiceCount: invoices.length,
        possibleDuplicates: items.filter((item) => item.issue_type === 'possible_duplicate').length,
        unmatchedDeposits: items.filter((item) => item.issue_type === 'unmatched_deposit').length,
        uncategorized: items.filter((item) => item.issue_type === 'uncategorized_transaction').length,
        overdueInvoices: items.filter((item) => item.issue_type === 'overdue_invoice').length,
      },
      created_by: auth.user.id,
    }).select('*').single();
    if (runError) throw runError;

    if (items.length) {
      const withRun = items.map((item) => ({ ...item, run_id: run.id }));
      const { error } = await auth.db.from('customer_finance_reconciliation_items').insert(withRun);
      if (error) throw error;
    }

    if (transactionUpdates.length) {
      const { error } = await auth.db.from('customer_finance_transactions').update({ reconciled: true, updated_at: new Date().toISOString() }).in('id', transactionUpdates);
      if (error) throw error;
    }
    for (const update of invoiceUpdates) {
      const { error } = await auth.db.from('customer_finance_invoices').update({ matched_transaction_id: update.transactionId, status: 'paid', balance: 0, updated_at: new Date().toISOString() }).eq('id', update.id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, run, matched, unresolved, items }, { headers: NO_STORE });
  } catch (error) {
    console.error('Finance reconciliation error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Reconciliation failed.' }, { status: 500, headers: NO_STORE });
  }
}
