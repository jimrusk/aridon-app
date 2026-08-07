import Link from 'next/link';

export default function PrivacyNoticePage() {
  return (
    <main style={pageStyle}>
      <article style={cardStyle}>
        <div style={eyebrow}>PRIVACY NOTICE · BETA</div>
        <h1 style={titleStyle}>What happens to the information you put into Business OS.</h1>
        <p style={bodyStyle}>Last updated August 7, 2026. This notice is written for the beta so business owners can understand the basics without decoding legal jargon.</p>

        <Section title="What we collect">
          <p>We collect the account and business information you choose to provide, such as your name, business name, email, industry, website, goals, projects, tasks, company notes, feedback, and the prompts or messages you send to AI features.</p>
        </Section>

        <Section title="Why we use it">
          <p>We use the information to create and operate your private workspace, personalize AI assistance, provide sales and research tools you request, troubleshoot the beta, improve the product, protect the service from abuse, and communicate about your account.</p>
        </Section>

        <Section title="AI and service providers">
          <p>When you use AI features, relevant workspace information may be sent to AI service providers to generate the response you requested. We also use infrastructure and software providers to host the application, authentication, databases, billing if you later choose a paid plan, and optional integrations you connect.</p>
        </Section>

        <Section title="What not to upload during beta">
          <p>Do not use the beta as the only storage location for critical records. Avoid uploading passwords, payment-card data, Social Security numbers, medical records, regulated secrets, or information you are not authorized to share. The beta is intended for ordinary business operating information, not highly regulated data.</p>
        </Section>

        <Section title="Keeping companies separate">
          <p>Customer workspaces are designed to keep one company’s data separate from another company’s workspace. Access to private workspace information requires an authenticated account associated with that business.</p>
        </Section>

        <Section title="Retention and deletion">
          <p>Beta information may be retained while the account is active and for a reasonable period afterward for security, troubleshooting, legal, and backup purposes. A formal self-service deletion workflow may not yet be available during beta. Contact the product operator if you need beta account data removed.</p>
        </Section>

        <Section title="Beta changes">
          <p>The product and this notice may change as the beta develops. Material changes should be reflected on this page with an updated date.</p>
        </Section>

        <div style={footerBox}>
          <strong>Questions about your beta data?</strong>
          <span>Use the feedback tool inside your workspace and identify the request as a privacy or account-data question.</span>
        </div>

        <div style={linksStyle}>
          <Link href="/business-os/beta" style={linkStyle}>Back to beta signup</Link>
          <Link href="/business-os/terms" style={linkStyle}>Beta Terms</Link>
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
