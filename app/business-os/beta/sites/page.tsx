import Link from 'next/link';

const cardStyle = {
  background: '#111827',
  border: '1px solid #2A3857',
  borderRadius: '18px',
  padding: '22px',
};

export default function BetaSitesPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', padding: '36px 20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '18px' }}>
        <div>
          <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>BUSINESS OS BETA · WEBSITE ANALYSIS LAB</div>
          <h1 style={{ fontSize: 'clamp(38px,7vw,64px)', lineHeight: 1, margin: '10px 0 14px' }}>Real companies. Real websites. Better beta testing.</h1>
          <p style={{ color: '#B7C2D5', lineHeight: 1.7, maxWidth: '780px' }}>
            These public websites are used as unaffiliated test cases to define what Business OS should learn automatically from a company website: positioning, services, customers, proof, growth opportunities and recommended next actions.
          </p>
        </div>

        <section style={cardStyle}>
          <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>PUBLIC TEST CASE 001</div>
          <h2 style={{ fontSize: '30px', margin: '9px 0' }}>Pratt Marketing Agency</h2>
          <p style={{ color: '#C4CEDD', lineHeight: 1.65 }}>
            Scottsdale-based full-service marketing agency spanning brand consulting, podcasts, public relations, advertising, production, social media, website design and SEO. Strong fit for testing service extraction, positioning analysis, proof signals and growth recommendations.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Link href="/business-os/beta/sites/pratt-marketing" style={{ background: '#9EF0CF', color: '#08130F', padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 900 }}>Open Analysis</Link>
            <a href="https://prattmarketingagency.com/" target="_blank" rel="noreferrer" style={{ border: '1px solid #415171', color: '#E4EAF5', padding: '11px 15px', borderRadius: '10px', textDecoration: 'none', fontWeight: 800 }}>Visit Public Site</a>
          </div>
          <p style={{ color: '#7F8DA5', fontSize: '11px', marginTop: '14px' }}>Public-site analysis only. No affiliation or endorsement is implied.</p>
        </section>

        <Link href="/business-os/beta" style={{ color: '#B9CFFF', fontWeight: 850, textDecoration: 'none' }}>← Back to Business OS beta</Link>
      </div>
    </main>
  );
}
