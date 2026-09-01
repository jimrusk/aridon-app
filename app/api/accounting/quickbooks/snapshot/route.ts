import { NextRequest, NextResponse } from 'next/server';
import { auditExecutiveAction, connectedExecutiveActor } from '../../../../../lib/executiveOps';
import { quickBooksConnection, quickBooksJson, setQuickBooksCookies } from '../../../../../lib/quickbooks';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const connection = await quickBooksConnection(request);
    const realm = encodeURIComponent(connection.realmId);
    const [company, profitAndLoss, balanceSheet, cashFlow] = await Promise.all([
      quickBooksJson<any>(`/v3/company/${realm}/companyinfo/${realm}?minorversion=75`, connection.accessToken),
      quickBooksJson<any>(`/v3/company/${realm}/reports/ProfitAndLoss?minorversion=75`, connection.accessToken),
      quickBooksJson<any>(`/v3/company/${realm}/reports/BalanceSheet?minorversion=75`, connection.accessToken),
      quickBooksJson<any>(`/v3/company/${realm}/reports/CashFlow?minorversion=75`, connection.accessToken).catch(() => null),
    ]);

    const actor = connectedExecutiveActor(request);
    await auditExecutiveAction({ actorEmail: actor.email || `quickbooks:${connection.realmId}`, executive: 'Nova', action: 'accounting_snapshot_read', channel: 'quickbooks', metadata: { realmId: connection.realmId } });
    const response = NextResponse.json({
      connected: true,
      mode: 'read-only-in-aridon',
      company: company.CompanyInfo || company,
      profitAndLoss,
      balanceSheet,
      cashFlow,
      generatedAt: new Date().toISOString(),
      protections: ['No transaction creation', 'No bill pay', 'No journal entries', 'No money movement', 'No bookkeeping changes'],
    }, { headers: NO_STORE });
    setQuickBooksCookies(response, connection.refreshToken, connection.realmId);
    return response;
  } catch (error) {
    return NextResponse.json({ connected: false, error: error instanceof Error ? error.message : 'Unable to load QuickBooks financial snapshot.' }, { status: 500, headers: NO_STORE });
  }
}
