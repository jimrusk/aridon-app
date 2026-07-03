import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const data = await req.json();
  const plan = {
    companyName: data.companyName || 'Your Company',
    recommendedExecutives: ['Heather','Ethos','Atlas','Eva','Scout','Ledger','Oracle'],
    firstModules: ['Dashboard','AI Chat','CRM','Projects','Tasks','Knowledge Vault','Executive Meeting'],
    setupSummary: `Aridon will configure an AI executive team for ${data.companyName || 'your company'} serving ${data.customers || 'your customers'} with services including ${data.services || 'your core services'}.`,
    nextSteps: ['Confirm services','Add customer types','Upload business documents','Invite first users','Start daily executive briefing']
  };
  return NextResponse.json(plan);
}
