import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ProspectDemo({ params, searchParams }: { params: { slug: string }; searchParams: { company?: string; state?: string; industry?: string; expires?: string } }) {
  const company = searchParams.company || 'Your Business';
  const industry = searchParams.industry || 'service business';
  const expires = searchParams.expires || 'August 26, 2026';
  return <main className="min-h-screen bg-zinc-950 text-white px-6 py-16"><div className="mx-auto max-w-4xl space-y-8">
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><b>Unofficial Aridon demonstration.</b> Built only from publicly available business information. Aridon has not accessed {company}'s private systems, customer records, email, CRM, financial accounts, or internal data. This preview expires {expires} unless the business engages.</div>
    <div><p className="text-sm uppercase tracking-widest text-zinc-400">14-Day Revenue Recovery Pilot</p><h1 className="mt-3 text-4xl font-bold">What could {company} be leaving on the table?</h1><p className="mt-5 text-xl text-zinc-300">Aridon helps an owner-led {industry} find revenue and time already slipping through ordinary business operations, without replacing the team or taking control away from management.</p></div>
    <section className="grid gap-4 md:grid-cols-2">{['Stale estimates that never got a second conversation','Leads that went quiet before booking','Past customers ready for another service','Slow inquiry response and missed follow-up','Owner and office time lost to repetitive admin','Jobs, quotes and opportunities buried across inboxes and notes'].map(x=><div key={x} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">{x}</div>)}</section>
    <section className="rounded-2xl bg-white p-7 text-zinc-950"><h2 className="text-2xl font-bold">The test</h2><p className="mt-3">Give Aridon 14 days. We identify likely revenue leaks, prioritize the best recovery opportunities, prepare follow-up actions and measure what changed. There is no upfront pilot fee. No revenue outcome is guaranteed. Your team keeps human approval over consequential actions and external communications.</p><p className="mt-4 font-semibold">If Aridon cannot demonstrate measurable business value during the pilot, you can walk away.</p></section>
    <section><h2 className="text-2xl font-bold">Human control stays intact</h2><p className="mt-3 text-zinc-300">Aridon recommends and organizes. Your business approves. The public preview does not send customer communications, change pricing, commit funds, sign agreements, or access private systems.</p></section>
    <a className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-black" href="/business-os/revenue-recovery">See the Revenue Recovery Pilot</a>
  </div></main>;
}
