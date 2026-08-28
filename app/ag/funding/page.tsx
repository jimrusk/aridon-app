"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FundingType = "Grant" | "Loan" | "Cost Share";
type FundingStatus = "Open" | "Watch" | "Planning";

type Opportunity = {
  name: string;
  provider: string;
  type: FundingType;
  status: FundingStatus;
  fit: number;
  uses: string;
  next: string;
};

const opportunities: Opportunity[] = [
  { name: "Farm ownership / operating financing", provider: "USDA Farm Service Agency", type: "Loan", status: "Open", fit: 92, uses: "Land, operating capital, equipment and eligible farm needs", next: "Confirm producer profile, purpose, requested amount and repayment capacity." },
  { name: "Conservation practice assistance", provider: "USDA NRCS", type: "Cost Share", status: "Watch", fit: 88, uses: "Eligible soil, water, grazing and conservation practices", next: "Map the proposed practice to the local conservation plan and current sign-up period." },
  { name: "Rural energy improvements", provider: "USDA Rural Development", type: "Grant", status: "Watch", fit: 81, uses: "Eligible renewable-energy and energy-efficiency projects", next: "Document energy baseline, project scope, ownership and matching funds." },
  { name: "State and regional agriculture programs", provider: "State / local agencies", type: "Grant", status: "Planning", fit: 74, uses: "Water, resilience, infrastructure, processing and producer-support projects", next: "Match by state, county, producer type and project objective." },
];

export default function AgFundingPage() {
  const [kind, setKind] = useState<"All" | FundingType>("All");
  const filtered = useMemo(() => opportunities.filter((item) => kind === "All" || item.type === kind), [kind]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 22px 70px", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/ag" style={{ color: "inherit" }}>← Aridon Ag</Link>
      <p style={{ marginTop: 30, textTransform: "uppercase", letterSpacing: 2, fontSize: 12 }}>Aridon Ag</p>
      <h1 style={{ fontSize: 46, margin: "6px 0 10px" }}>Ag Funding</h1>
      <p style={{ maxWidth: 820, fontSize: 19, lineHeight: 1.55 }}>
        Find agricultural loans, grants and cost-share programs, match them to the producer and project, and turn an operating need into an application-ready funding plan.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, margin: "28px 0" }}>
        {[['Matches','Rank opportunities by eligibility and evidence'],['Applications','Build checklists, narratives and budgets'],['Funding Watch','Track openings, deadlines and changes'],['Compliance','Track awards, reporting and obligations']].map(([title, body]) => (
          <div key={title} style={{ border: "1px solid #bbb", borderRadius: 14, padding: 18 }}><strong>{title}</strong><p style={{ lineHeight: 1.45 }}>{body}</p></div>
        ))}
      </section>

      <section style={{ border: "1px solid #bbb", borderRadius: 16, padding: 22, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Producer funding profile</h2>
        <p>Profile once: location, acreage, crops/livestock, ownership, water and energy needs, equipment, project goals, estimated project cost, available match and preferred financing structure.</p>
        <p><strong>Guardrail:</strong> Aridon may identify, organize, calculate and draft. It does not submit an application, accept an award, borrow money, certify facts or agree to financial terms without producer approval.</p>
      </section>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {(["All", "Grant", "Loan", "Cost Share"] as const).map((item) => <button key={item} onClick={() => setKind(item)} style={{ padding: "9px 13px", borderRadius: 20, border: "1px solid #aaa", cursor: "pointer" }}>{item}</button>)}
      </div>

      <section style={{ display: "grid", gap: 14 }}>
        {filtered.map((item) => (
          <article key={item.name} style={{ border: "1px solid #bbb", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}><div><small>{item.provider} · {item.type} · {item.status}</small><h3 style={{ margin: "6px 0" }}>{item.name}</h3></div><strong>Fit {item.fit}/100</strong></div>
            <p><strong>Potential uses:</strong> {item.uses}</p><p><strong>Next evidence step:</strong> {item.next}</p>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 30, padding: 22, border: "1px solid #bbb", borderRadius: 16 }}>
        <h2 style={{ marginTop: 0 }}>Application pipeline</h2>
        <p>Match → Eligibility review → Evidence checklist → Budget / repayment analysis → Draft → Producer approval → Submission → Follow-up → Award / loan → Compliance.</p>
        <p style={{ marginBottom: 0 }}><strong>Evidence rule:</strong> Program amounts, rates, deadlines, eligibility and terms must be verified against the current official program source before Aridon labels an opportunity application-ready.</p>
      </section>
    </main>
  );
}
