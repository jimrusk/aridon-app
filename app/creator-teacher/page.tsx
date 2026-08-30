import Link from 'next/link';
import type { CSSProperties } from 'react';

const card: CSSProperties = { background: '#0D1728', border: '1px solid #2B3D5B', borderRadius: 18, padding: 18 };
const button: CSSProperties = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', textDecoration: 'none', borderRadius: 11, padding: '11px 14px', fontWeight: 950 };

export default function CreatorTeacherEnginePage() {
  const layers = [
    ['1. Learn', 'Index approved public pages, videos, FAQs, product descriptions and private curriculum into a source-linked creator knowledge base.'],
    ['2. Teach', 'Answer typed or spoken questions, explain lessons, quiz the learner and maintain follow-up context.'],
    ['3. Speak + Move', 'Use a live D-ID digital human when configured. If live avatar credentials are absent, Aridon automatically falls back to an animated teacher and synthetic voice.'],
    ['4. Apply', 'Move the learner from explanation into the relevant Aridon workflow such as acquisition underwriting, growth planning, launch execution or business analysis.'],
    ['5. Route', 'Recommend the right lesson, resource, product, advisor or human escalation based on the learner’s goal and progress.'],
    ['6. Measure', 'Track questions, completion, implementation, handoffs, conversions and revenue so the creator learns what actually helps students.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '28px 20px 80px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON CREATOR TEACHER ENGINE</div>
        <h1 style={{ fontSize: 'clamp(50px,8vw,88px)', lineHeight: .93, letterSpacing: -4, margin: '14px 0 20px', maxWidth: 1000 }}>Turn expert knowledge into an AI teacher that can listen, answer, speak, move and send the learner into action.</h1>
        <p style={{ color: '#BBC7D8', fontSize: 19, lineHeight: 1.7, maxWidth: 920 }}>This is the reusable Aridon layer behind the Codie Sanchez and Maria Wendt demos. The knowledge brain, lesson flow, voice input, source citations, digital-human adapter, fallback avatar, real-world workflow handoff and safety disclosures are reusable for future creator and expert partnerships.</p>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 11, marginTop: 30 }}>
          {layers.map(([name, detail]) => <article key={name} style={card}><strong style={{ color: '#9EF0CF', fontSize: 20 }}>{name}</strong><p style={{ color: '#C1CCDC', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p></article>)}
        </section>

        <section style={{ marginTop: 42 }}>
          <div style={{ color: '#C5B8FF', fontSize: 12, fontWeight: 950 }}>WORKING PARTNER PROTOTYPES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12, marginTop: 12 }}>
            <article style={{ ...card, background: 'linear-gradient(160deg,#162237,#0B1524)' }}>
              <h2 style={{ marginTop: 0 }}>Codie Sanchez / Contrarian Thinking</h2>
              <p style={{ color: '#B9C5D6', lineHeight: 1.6 }}>Acquisition education → Buyer Room → financing → diligence → 100-day takeover → post-close Growth Command.</p>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}><Link href="/partners/codie-sanchez" style={button}>Partner Demo</Link><Link href="/partners/codie-sanchez/teacher" style={{ ...button, background: '#C5B8FF' }}>Live Teacher</Link></div>
            </article>
            <article style={{ ...card, background: 'linear-gradient(160deg,#32243A,#101929)' }}>
              <h2 style={{ marginTop: 0 }}>Maria Wendt / Creator OS</h2>
              <p style={{ color: '#C9BBC6', lineHeight: 1.6 }}>Digital products → social funnel → copy → email → launches → automation → coaching → revenue attribution.</p>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}><Link href="/partners/maria-wendt" style={{ ...button, background: '#F4B8D5' }}>Partner Demo</Link><Link href="/partners/maria-wendt/teacher" style={{ ...button, background: '#B9CFFF' }}>Live Teacher</Link></div>
            </article>
          </div>
        </section>

        <p style={{ color: '#7F8EA5', fontSize: 12, lineHeight: 1.6, marginTop: 28 }}>Creator-specific likenesses, voice replicas and proprietary teaching materials should only be activated after explicit authorization. Until then, partner prototypes use clearly labeled Aridon demo avatars and summarized public knowledge.</p>
      </div>
    </main>
  );
}
