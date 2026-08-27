import Link from 'next/link';
import { highTicketOffers, postPurchaseUpsell } from '../../../lib/highTicketCheckout';

type SearchParams = { from?: string };

const mint = '#9EF0CF';
const bg = '#07101A';
const panel = { background: '#0D1723', border: '1px solid #26374D', borderRadius: 18, padding: 22 } as const;

export default function GrowthNextPage({ searchParams }: { searchParams?: SearchParams }) {
  const source = searchParams?.from || '';
  const nextOffer = postPurchaseUpsell[source as keyof typeof postPurchaseUpsell];
  const completed = source === 'managed-growth';

  return (
    <main style={{ minHeight: '100vh', background: bg, color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px 80px' }}>
        <Link href="/growth" style={{ color: '#B9C8D8', textDecoration: 'none', fontWeight: 850 }}>← Back to Aridon Growth</Link>

        <div style={{ ...panel, marginTop: 26, background: 'linear-gradient(135deg,#102033,#10261F)' }}>
          <div style={{ color: mint, fontSize: 11, fontWeight: 950, letterSpacing: 1.2 }}>PAYMENT RECEIVED</div>
          <h1 style={{ fontSize: 'clamp(42px,7vw,68px)', lineHeight: .98, margin: '10px 0 16px' }}>You are in. Now keep the next step focused.</h1>
          <p style={{ color: '#BDCAD9', lineHeight: 1.7, fontSize: 18, marginBottom: 0 }}>Aridon will use the checkout information to prepare the purchased work. Exact scope, access, timing, and any required customer inputs are confirmed during kickoff.</p>
        </div>

        {completed ? (
          <section style={{ ...panel, marginTop: 18 }}>
            <div style={{ color: mint, fontWeight: 950 }}>MANAGED GROWTH IS ACTIVE</div>
            <h2 style={{ fontSize: 32, margin: '8px 0 10px' }}>The recurring backend is now in place.</h2>
            <p style={{ color: '#B4C0D0', lineHeight: 1.65 }}>The operating rhythm is monitor, prioritize, improve, report, and expand. The next meaningful action is onboarding the current website, lead flow, campaigns, and priorities.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <Link href="/customer/start" style={button}>Open Aridon</Link>
              <Link href="/growth" style={outline}>Review the Offer Ladder</Link>
            </div>
          </section>
        ) : nextOffer ? (
          <section style={{ ...panel, marginTop: 18 }}>
            <div style={{ color: '#F4D06F', fontSize: 11, fontWeight: 950, letterSpacing: 1 }}>OPTIONAL NEXT STEP</div>
            <h2 style={{ fontSize: 34, margin: '8px 0 6px' }}>{nextOffer.name}</h2>
            <div><strong style={{ fontSize: 38 }}>{nextOffer.price}</strong> <span style={{ color: '#94A3B8' }}>{nextOffer.priceDetail}</span></div>
            <p style={{ color: '#B4C0D0', lineHeight: 1.65, fontSize: 17 }}>{nextOffer.summary}</p>
            <p style={{ color: '#8FA0B8', lineHeight: 1.55, fontSize: 13 }}>This is not required to receive what you already purchased. It is offered only when you want Aridon to move from diagnosis into deeper implementation or ongoing management.</p>
            <a href={nextOffer.href} style={{ ...button, display: 'inline-block', marginTop: 8 }}>Add {nextOffer.name}</a>
          </section>
        ) : (
          <section style={{ ...panel, marginTop: 18 }}>
            <h2 style={{ fontSize: 30, marginTop: 0 }}>Your purchased work is queued.</h2>
            <p style={{ color: '#B4C0D0', lineHeight: 1.65 }}>There is no forced upsell here. Aridon will focus on delivering the work already purchased.</p>
            <Link href="/growth" style={button}>Return to Growth</Link>
          </section>
        )}

        <section style={{ ...panel, marginTop: 18, background: '#101925' }}>
          <div style={{ color: mint, fontSize: 11, fontWeight: 950 }}>WHAT HAPPENS NEXT</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {[
              ['1. Confirm inputs', 'Website, goals, current systems, access constraints, and the most important business priority.'],
              ['2. Confirm scope', 'Aridon separates included work from optional additions and third-party costs.'],
              ['3. Execute', 'Work is delivered against the purchased service level with consequential external actions kept under owner approval.'],
              ['4. Measure', 'The result is compared with the baseline so the next decision is based on evidence.'],
            ].map(([title, text]) => <div key={title} style={{ borderTop: '1px solid #26374D', paddingTop: 11 }}><strong>{title}</strong><div style={{ color: '#AEBBD0', lineHeight: 1.55, marginTop: 4 }}>{text}</div></div>)}
          </div>
        </section>
      </section>
    </main>
  );
}

const button = { background: mint, color: '#07130F', borderRadius: 11, padding: '12px 15px', textDecoration: 'none', fontWeight: 950 } as const;
const outline = { border: '1px solid #51617A', color: '#F8FAFC', borderRadius: 11, padding: '11px 15px', textDecoration: 'none', fontWeight: 900 } as const;
