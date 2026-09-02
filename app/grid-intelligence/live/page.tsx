import Link from 'next/link';
import { getServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function status() {
  let database = false;
  let gatewayProvisioned = false;
  let arcgisConfigured = false;
  try {
    const supabase = getServerClient();
    const [{ count: assetCount, error: assetError }, { count: gatewayCount }, { count: integrationCount }] = await Promise.all([
      supabase.from('grid_assets').select('id', { count: 'exact', head: true }),
      supabase.from('grid_gateway_clients').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('grid_integrations').select('id', { count: 'exact', head: true }).eq('provider', 'arcgis').eq('enabled', true),
    ]);
    database = !assetError && typeof assetCount === 'number';
    gatewayProvisioned = (gatewayCount || 0) > 0 || !!process.env.ARIDON_GRID_GATEWAY_KEY;
    arcgisConfigured = (integrationCount || 0) > 0;
  } catch {
    database = false;
  }
  return {
    database,
    gatewayProvisioned,
    arcgisConfigured,
    adminConfigured: !!process.env.ARIDON_GRID_ADMIN_KEY,
  };
}

export default async function GridLivePage() {
  const s = await status();
  const readyCount = [s.database, s.gatewayProvisioned, s.arcgisConfigured, s.adminConfigured].filter(Boolean).length;
  return (
    <main style={{ minHeight: '100vh', background: '#06101B', color: '#F7FAFC', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 20px 78px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/grid-intelligence" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 950, letterSpacing: 1.5 }}>ARIDON GRID</Link>
          <Link href="/" style={{ color: '#D8E5EF', textDecoration: 'none', fontWeight: 850 }}>Aridon Home</Link>
        </nav>

        <div style={{ padding: '70px 0 28px', maxWidth: 900 }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.3 }}>LIVE OPERATIONS FOUNDATION</div>
          <h1 style={{ fontSize: 'clamp(48px,8vw,86px)', lineHeight: .93, letterSpacing: -3.5, margin: '12px 0 20px' }}>Drone gateway. Digital twin. ArcGIS connector.</h1>
          <p style={{ color: '#AFC1D0', fontSize: 20, lineHeight: 1.65, maxWidth: 820 }}>This is the production wiring behind Drone Grid Intelligence. Utility data stays server-side, gateway secrets are hashed, and outbound GIS writes require a human-confirmed finding plus a separate admin approval.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '18px 0 34px' }}>
          <Status title="Persistent database" ok={s.database} text="Assets, missions, events, evidence, findings, work orders and sync audit." />
          <Status title="Drone gateway" ok={s.gatewayProvisioned} text="Provision a scoped key, then POST inspection events from the edge gateway." />
          <Status title="ArcGIS layer" ok={s.arcgisConfigured} text="Configure one FeatureServer layer per utility and map Aridon fields." />
          <Status title="Admin approval" ok={s.adminConfigured} text="Dedicated server secret gates reviews, imports and outbound GIS updates." />
        </div>

        <section style={panel}>
          <div style={eyebrow}>DEPLOYMENT READINESS</div>
          <h2 style={h2}>{readyCount}/4 production connections ready</h2>
          <p style={p}>The code and database foundation are deployed. A real utility pilot becomes live when its gateway credential and ArcGIS layer configuration are provisioned. No raw ArcGIS token or drone API key is stored in the database.</p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
          <section style={panel}>
            <div style={eyebrow}>1 · DRONE / EDGE GATEWAY</div>
            <h2 style={h2}>POST /api/grid-intelligence/gateway</h2>
            <p style={p}>Authenticated with <code>x-aridon-grid-key</code>. The route idempotently creates the mission and asset, persists the inspection event and evidence pointers, scores the condition, updates the digital twin and creates a recommended work order for meaningful findings.</p>
          </section>
          <section style={panel}>
            <div style={eyebrow}>2 · DIGITAL TWIN</div>
            <h2 style={h2}>GET /api/grid-intelligence/twin</h2>
            <p style={p}>Returns one utility asset with its inspection timeline, evidence, findings, work orders and repair verification history. Reads require a scoped gateway key or the dedicated grid admin credential.</p>
          </section>
          <section style={panel}>
            <div style={eyebrow}>3 · HUMAN REVIEW</div>
            <h2 style={h2}>POST /api/grid-intelligence/review</h2>
            <p style={p}>A utility reviewer confirms, dismisses or requests a field check. This changes Aridon state only. It does not dispatch a crew and it does not write to GIS.</p>
          </section>
          <section style={panel}>
            <div style={eyebrow}>4 · ARCGIS / ARCFM</div>
            <h2 style={h2}>Import and approved sync</h2>
            <p style={p}><code>/arcgis/import</code> pulls asset records into the twin. <code>/arcgis/sync</code> writes only a human-confirmed finding to the configured FeatureServer layer. Every sync receives an audit row.</p>
          </section>
        </div>

        <section style={{ ...panel, marginTop: 12 }}>
          <div style={eyebrow}>PROVISIONING APIS</div>
          <h2 style={h2}>Built for a real pilot, not hard-coded demo credentials.</h2>
          <p style={p}><code>POST /api/grid-intelligence/gateway-clients</code> generates a one-time drone key and stores only its SHA-256 hash. <code>POST /api/grid-intelligence/integrations</code> registers the utility's ArcGIS FeatureServer layer and field map. ArcGIS access tokens remain in server environment variables named <code>ARIDON_ARCGIS_*</code>.</p>
        </section>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
          <Link href="/grid-intelligence" style={button}>Open Grid Intelligence dashboard</Link>
          <Link href="/" style={{ ...button, background: 'transparent', color: '#fff', border: '1px solid #3A526B' }}>Back to Aridon</Link>
        </div>
      </section>
    </main>
  );
}

function Status({ title, ok, text }: { title: string; ok: boolean; text: string }) {
  return <article style={{ background: '#0A1725', border: `1px solid ${ok ? '#285B50' : '#594A24'}`, borderRadius: 16, padding: 18 }}>
    <div style={{ color: ok ? '#9EF0CF' : '#FFD77D', fontSize: 11, fontWeight: 950, letterSpacing: .8 }}>{ok ? 'READY' : 'NEEDS CONNECTION'}</div>
    <h3 style={{ margin: '7px 0 7px', fontSize: 18 }}>{title}</h3>
    <p style={{ margin: 0, color: '#91A5B8', lineHeight: 1.55, fontSize: 14 }}>{text}</p>
  </article>;
}

const panel = { background: '#0A1725', border: '1px solid #20364A', borderRadius: 18, padding: 22, marginBottom: 12 } as const;
const eyebrow = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: 1.1 } as const;
const h2 = { fontSize: 25, margin: '7px 0 10px', letterSpacing: -.4 } as const;
const p = { color: '#9BAFC1', fontSize: 15, lineHeight: 1.65, margin: 0 } as const;
const button = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', textDecoration: 'none', fontWeight: 950, padding: '13px 16px', borderRadius: 12 } as const;
