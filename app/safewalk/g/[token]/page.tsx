// Guardian web portal: /safewalk/g/[token]
// Server component resolves the trip id from the guardian token;
// the client view below polls the status endpoint every 15s.
import { getServerClient } from '@/lib/supabase';
import GuardianView from './GuardianView';

export const dynamic = 'force-dynamic';

const SHELL: React.CSSProperties = {
  background: '#0a1220',
  color: '#eef3ff',
  minHeight: '100dvh',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export default async function GuardianPage({ params }: { params: { token: string } }) {
  const token = params.token ?? '';
  let tripId: string | null = null;
  try {
    const db = getServerClient();
    const { data } = await db
      .from('safewalk_trips')
      .select('id')
      .eq('guardian_token', token)
      .maybeSingle();
    tripId = (data as { id: string } | null)?.id ?? null;
  } catch {
    tripId = null;
  }

  if (!tripId) {
    return (
      <div style={{ ...SHELL, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>SafeWalk</div>
          <p style={{ color: '#8fa1c4' }}>This link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={SHELL}>
      <GuardianView tripId={tripId} token={token} />
    </div>
  );
}
