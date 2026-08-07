import Link from 'next/link';

export default function BetaTermsPage() {
  return (
    <main style={pageStyle}>
      <article style={cardStyle}>
        <div style={eyebrow}>BETA TERMS</div>
        <h1 style={titleStyle}>Simple rules for testing Business OS.</h1>
        <p style={bodyStyle}>Last updated August 7, 2026. These beta terms describe the practical rules for using the test product. They are intended to be readable, not ceremonial wallpaper.</p>

        <Section title="Beta access">
          <p>Beta access is provided for evaluation and real-world business testing. Features may change, move, break, or be removed while the product is being developed. Beta access may be limited or ended.</p>
        </Section>

        <Section title="Your account and business information">
          <p>You are responsible for keeping your login secure and for providing information you are authorized to use. Do not submit another company’s confidential information unless you have permission to do so.</p>
        </Section>

        <Section title="AI output needs human review">
          <p>Business OS can research, summarize, draft, organize, and suggest actions. AI output can be incomplete or wrong. Review important financial, legal, hiring, safety, customer, and operational decisions before acting on them.</p>
        </Section>

        <Section title="You control external actions">
          <p>The product is designed so important actions such as sending sales outreach through connected tools require user approval. If you connect an outside service, that service’s own settings and terms also apply.</p>
        </Section>

        <Section title="Appropriate use">
          <p>Do not use the beta to break laws, impersonate people, send unlawful spam, attack systems, distribute malware, violate privacy rights, or access information you are not authorized to use.</p>
        </Section>

        <Section title="No guarantee of uninterrupted service">
          <p>This is a beta product. Availability, accuracy, performance, integrations, and data workflows are still being tested. Keep independent copies of important business records and do not rely on the beta as your only system of record.</p>
        </Section>

        <Section title="Feedback">
          <p>Feedback is welcome and may be used to improve the product. Do not put secrets or information you do not want reviewed by the product team into a feedback submission.</p>
        </Section>

        <Section title="Future paid plans">
          <p>Creating this free beta account does not start billing. If paid plans are offered later, you will be shown the applicable price and terms before a paid subscription begins.</p>
        </Section>

        <div style={footerBox}>
          <strong>Using the beta means you agree to these beta rules and the Privacy Notice.</strong>
          <span>If the terms change materially during testing, the updated date on this page will change.</span>
        </div>

        <div style={linksStyle}>
          <Link href="/business-os/beta" style={linkStyle}>Back to beta signup</Link>
          <Link href="/business-os/privacy" style={linkStyle}>Privacy Notice</Link>
        </div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ borderTop: '1px solid #293650', paddingTop: '16px' }}><h2 style={{ margin: '0 0 7px', fontSize: '21px' }}>{title}</h2><div style={bodyStyle}>{children}</div></section>;
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', padding: '28px 18px 80px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { maxWidth: '820px', margin: '0 auto', background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: 'clamp(20px,5vw,34px)', display: 'grid', gap: '18px' };
const eyebrow = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const titleStyle = { fontSize: 'clamp(36px,6vw,58px)', lineHeight: 1, margin: '5px 0 0' };
const bodyStyle = { color: '#BCC7D8', lineHeight: 1.7, margin: 0 };
const footerBox = { display: 'grid', gap: '5px', background: '#102033', border: '1px solid #29405A', borderRadius: '12px', padding: '14px', color: '#D6E1F4', lineHeight: 1.55 };
const linksStyle = { display: 'flex', gap: '14px', flexWrap: 'wrap' as const };
const linkStyle = { color: '#B9CFFF', fontWeight: 850 };
