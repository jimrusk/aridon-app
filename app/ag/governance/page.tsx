import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileCheck2,
  Leaf,
  Network,
  ShieldCheck,
  Sprout,
  Target,
  Users,
} from 'lucide-react';

const goals = [
  { name: 'Sustainable Sourcing', progress: 88, status: 'On track', detail: 'Supplier evidence and crop-source coverage' },
  { name: 'Regenerate, Restore & Protect', progress: 76, status: 'Watch', detail: 'Practice adoption and verified acres' },
  { name: 'Livelihoods', progress: 69, status: 'Action needed', detail: 'Producer participation and outcome documentation' },
];

const assurance = [
  { supplier: 'High Plains Growers', region: 'Southwest', score: 94, evidence: 'Complete', action: 'None' },
  { supplier: 'Riverbend Farms', region: 'Central', score: 82, evidence: '2 items due', action: 'Follow up' },
  { supplier: 'Mesa Producer Group', region: 'Southwest', score: 71, evidence: 'Audit open', action: 'Corrective plan' },
  { supplier: 'Prairie Crop Partners', region: 'Midwest', score: 89, evidence: 'Complete', action: 'None' },
];

const aiActions = [
  'Request missing verification evidence from 12 suppliers before month-end reporting.',
  'Escalate regenerative-practice adoption in two regions that are below plan.',
  'Prepare the annual goal-delivery package with supporting source records and approval history.',
  'Review four contracts with upcoming renewal or budget-approval deadlines.',
];

const capabilities = [
  ['Goal Governance', 'Own enterprise agriculture goals with accountable owners, milestones, evidence and exception tracking.', Target],
  ['Assurance & Audits', 'Manage standards, supplier questionnaires, audits, corrective actions and evidence readiness.', ShieldCheck],
  ['Data & Reporting', 'Turn operating records into annual, quarterly and executive sustainability reporting.', BarChart3],
  ['Stakeholder Engagement', 'Coordinate producers, suppliers, internal teams, auditors, NGOs and program partners.', Users],
  ['Contracts & Finance', 'Track program contracts, approvals, spend, forecast and goal-related financial accounting.', DollarSign],
  ['Capacity Building', 'Assign training, guidance, implementation plans and required follow-up by producer or region.', Sprout],
];

export default function EnterpriseAgGovernancePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f3f6f2', color: '#17384a', fontFamily: 'Arial,sans-serif', paddingBottom: 80 }}>
      <header style={{ background: 'linear-gradient(135deg,#062a46,#0a533e 72%,#387245)', color: '#fff', padding: '22px 20px 34px' }}>
        <div style={{ maxWidth: 1220, margin: 'auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#b9ee91', fontSize: 12, fontWeight: 950, letterSpacing: 1.4 }}>ARIDON AG ENTERPRISE</div>
              <strong style={{ fontSize: 22 }}>Sustainable Agriculture Governance OS</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/ag" style={{ color: '#fff', textDecoration: 'none', fontWeight: 850 }}>Aridon Ag</Link>
              <Link href="/ag/app" style={{ color: '#fff', textDecoration: 'none', fontWeight: 850 }}>Farm Command Center</Link>
              <span style={{ background: '#b9ee91', color: '#123428', padding: '9px 12px', borderRadius: 999, fontSize: 12, fontWeight: 950 }}>ENTERPRISE DEMO</span>
            </div>
          </nav>

          <div style={{ maxWidth: 900, paddingTop: 42 }}>
            <div style={{ color: '#b9ee91', fontWeight: 950, fontSize: 12, letterSpacing: 1 }}>AI OPERATING LAYER FOR LARGE-SCALE AGRICULTURE PROGRAMS</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', lineHeight: .98, margin: '12px 0 18px', letterSpacing: -2.5 }}>
              Govern the goal.<br />Prove the progress.<br /><span style={{ color: '#b9ee91' }}>Act before reporting day.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.65, color: '#dcebe4', maxWidth: 820 }}>
              One command center for sustainable sourcing, regenerative agriculture, producer livelihoods, assurance, reporting, budgets and stakeholder execution.
            </p>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1220, margin: '-18px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
          <Metric title="2030 Goal Trajectory" value="76%" sub="Portfolio progress" icon={Target} />
          <Metric title="Suppliers Needing Action" value="143" sub="Across active programs" icon={Users} />
          <Metric title="Missing Evidence" value="37" sub="Items blocking assurance" icon={FileCheck2} />
          <Metric title="High-Risk Goals" value="3" sub="Require intervention" icon={AlertTriangle} />
          <Metric title="Reports Due" value="8" sub="This month" icon={ClipboardCheck} />
        </div>
      </section>

      <section style={{ maxWidth: 1220, margin: '18px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: 'minmax(0,1.45fr) minmax(300px,.7fr)', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: 20, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#2e7d32' }}>GOAL GOVERNANCE</div>
              <h2 style={{ margin: '5px 0 0', fontSize: 30 }}>Positive Agriculture portfolio</h2>
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, background: '#edf5eb', color: '#2e7d32', padding: '8px 10px', borderRadius: 999 }}>Demo data</span>
          </div>
          <div style={{ display: 'grid', gap: 13, marginTop: 18 }}>
            {goals.map((goal) => (
              <div key={goal.name} style={{ padding: 15, background: '#f7f9f6', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{goal.name}</strong>
                    <div style={{ fontSize: 13, color: '#657888', marginTop: 4 }}>{goal.detail}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 950, fontSize: 22 }}>{goal.progress}%</div>
                    <div style={{ fontSize: 12, color: goal.status === 'On track' ? '#2e7d32' : '#a45b00', fontWeight: 900 }}>{goal.status}</div>
                  </div>
                </div>
                <div style={{ height: 9, background: '#dde7df', borderRadius: 999, marginTop: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${goal.progress}%`, height: '100%', background: goal.progress >= 80 ? '#2e7d32' : '#7a9d3b', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ background: '#0d314c', color: '#fff', borderRadius: 20, padding: 22 }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><Bot size={25} color="#b9ee91" /><span style={{ color: '#b9ee91', fontSize: 12, fontWeight: 950 }}>ARIDON AI GOVERNANCE MANAGER</span></div>
          <h2 style={{ fontSize: 30, margin: '10px 0' }}>What needs attention now?</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {aiActions.map((action, index) => (
              <div key={action} style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 9, alignItems: 'start', background: '#153f5c', padding: 11, borderRadius: 12 }}>
                <div style={{ width: 27, height: 27, borderRadius: 999, background: '#b9ee91', color: '#123428', fontWeight: 950, display: 'grid', placeItems: 'center' }}>{index + 1}</div>
                <div style={{ lineHeight: 1.45, fontSize: 13, color: '#e7f0f5' }}>{action}</div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section style={{ maxWidth: 1220, margin: '18px auto 0', padding: '0 20px' }}>
        <div style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: 22, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#2e7d32', fontSize: 12, fontWeight: 950 }}>SUSTAINABLE FARMING ASSURANCE</div>
              <h2 style={{ margin: '5px 0 0', fontSize: 30 }}>Supplier & producer readiness</h2>
            </div>
            <div style={{ fontSize: 13, color: '#647989' }}>Questionnaires • evidence • audits • corrective actions</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead style={{ background: '#edf3ee', textAlign: 'left', fontSize: 12, color: '#607284' }}>
                <tr>{['Supplier / Producer Group', 'Region', 'Assurance Score', 'Evidence', 'Next Action'].map((h) => <th key={h} style={{ padding: '12px 18px' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {assurance.map((row) => (
                  <tr key={row.supplier} style={{ borderTop: '1px solid #e7ece8' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 900 }}>{row.supplier}</td>
                    <td style={{ padding: '14px 18px', color: '#607284' }}>{row.region}</td>
                    <td style={{ padding: '14px 18px' }}><strong>{row.score}/100</strong></td>
                    <td style={{ padding: '14px 18px', color: row.evidence === 'Complete' ? '#2e7d32' : '#9a5a00', fontWeight: 850 }}>{row.evidence}</td>
                    <td style={{ padding: '14px 18px' }}>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1220, margin: '18px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
        <Panel eyebrow="REPORTING ENGINE" title="Annual goal delivery" icon={FileCheck2}>
          <Item text="Source records linked to every reported metric" />
          <Item text="Internal review and approval trail" />
          <Item text="Executive, program and audit-ready report views" />
          <Item text="Exception list for incomplete or conflicting data" />
        </Panel>
        <Panel eyebrow="STAKEHOLDER COMMAND" title="One accountable network" icon={Network}>
          <Item text="Program owners and internal execution teams" />
          <Item text="Producers, suppliers and producer groups" />
          <Item text="Auditors, verifiers and external partners" />
          <Item text="Escalations, commitments and follow-up dates" />
        </Panel>
        <Panel eyebrow="FINANCIAL GOVERNANCE" title="Program spend & approvals" icon={DollarSign}>
          <Item text="Budget vs. actual by agriculture goal" />
          <Item text="Contract status and renewal dates" />
          <Item text="Approval workflow and financial coding" />
          <Item text="Forecasted spend tied to delivery risk" />
        </Panel>
      </section>

      <section style={{ maxWidth: 1220, margin: '28px auto 0', padding: '0 20px' }}>
        <div style={{ background: '#e5f0e3', borderRadius: 22, padding: 26 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Leaf color="#2e7d32" /><div style={{ color: '#2e7d32', fontWeight: 950, fontSize: 12 }}>ENTERPRISE CAPABILITY MAP</div></div>
          <h2 style={{ fontSize: 36, margin: '8px 0 18px' }}>Built around the actual governance workload</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 11 }}>
            {capabilities.map(([title, text, Icon]: any) => (
              <div key={title} style={{ background: '#fff', borderRadius: 15, padding: 18 }}>
                <Icon size={24} color="#2e7d32" />
                <h3 style={{ margin: '10px 0 6px' }}>{title}</h3>
                <p style={{ margin: 0, color: '#607284', lineHeight: 1.5, fontSize: 14 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1220, margin: '18px auto 0', padding: '0 20px' }}>
        <div style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: 20, padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(260px,.7fr)', gap: 18, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#2e7d32', fontWeight: 950, fontSize: 12 }}>ARIDON ENTERPRISE POSITIONING</div>
            <h2 style={{ fontSize: 34, margin: '7px 0 9px' }}>Make the governance manager more powerful, not obsolete.</h2>
            <p style={{ margin: 0, color: '#607284', lineHeight: 1.65 }}>Aridon is designed as the operating layer beneath the sustainability team: organize the data, surface risk, coordinate people, preserve evidence and prepare the reporting package so the human program owner can make faster, defensible decisions.</p>
          </div>
          <div style={{ background: '#f4f8f3', borderRadius: 15, padding: 18 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900 }}><CheckCircle2 color="#2e7d32" /> Ready for enterprise demo</div>
            <p style={{ color: '#607284', fontSize: 13, lineHeight: 1.5, marginBottom: 0 }}>Next integrations: enterprise identity, supplier data import, configurable goal framework, audit evidence storage and reporting connectors.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, sub, icon: Icon }: { title: string; value: string; sub: string; icon: any }) {
  return <div style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: 17, padding: 18, boxShadow: '0 8px 28px #173b2a10' }}><Icon size={22} color="#2e7d32" /><div style={{ color: '#607284', fontSize: 12, fontWeight: 900, marginTop: 10 }}>{title}</div><div style={{ fontSize: 30, fontWeight: 950, margin: '4px 0' }}>{value}</div><div style={{ color: '#607284', fontSize: 13 }}>{sub}</div></div>;
}

function Panel({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: any; children: React.ReactNode }) {
  return <div style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: 18, padding: 20 }}><Icon size={25} color="#2e7d32" /><div style={{ color: '#2e7d32', fontWeight: 950, fontSize: 12, marginTop: 10 }}>{eyebrow}</div><h3 style={{ fontSize: 24, margin: '5px 0 12px' }}>{title}</h3><div style={{ display: 'grid', gap: 9 }}>{children}</div></div>;
}

function Item({ text }: { text: string }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 7, alignItems: 'start', color: '#607284', fontSize: 14, lineHeight: 1.45 }}><CheckCircle2 size={17} color="#2e7d32" style={{ marginTop: 1 }} /><span>{text}</span></div>;
}
