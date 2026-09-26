'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type StatusData = {
  status: string;
  userName: string;
  checkInAt: string;
  lastLat: number | null;
  lastLng: number | null;
  lastLocAt: string | null;
  sosAt: string | null;
  guardians: { name: string }[];
  events: { type: string; detail: Record<string, unknown>; createdAt: string }[];
};

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  active: { label: 'Trip active', color: '#14b8a6' },
  escalated: { label: 'Missed check-in', color: '#fbbf24' },
  sos: { label: 'SOS ACTIVE', color: '#f43f5e' },
  arrived: { label: 'Arrived safely', color: '#34d399' },
};

const EVENT_LABEL: Record<string, string> = {
  created: 'Trip started',
  extended: 'Check-in extended',
  arrived: 'Arrived safely',
  sos: 'SOS triggered',
  escalation: 'Missed check-in — guardians alerted',
  audio: 'SOS audio uploaded',
};

function fmtCountdown(ms: number): string {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const core = h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  return neg ? `-${core}` : core;
}

export default function GuardianView({ tripId, token }: { tripId: string; token: string }) {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/safewalk/trips/${encodeURIComponent(tripId)}/status?token=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(res.status === 403 || res.status === 404 ? 'invalid' : 'load failed');
      setData(await res.json());
      setError('');
    } catch {
      setError('Could not load trip status.');
    }
  }, [tripId, token]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 15_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
      clearInterval(tick);
    };
  }, [load]);

  const wrap: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '20px 18px 32px' };
  const card: React.CSSProperties = {
    background: '#111c33', border: '1px solid #1e2c4d', borderRadius: 18, padding: 16, marginBottom: 14,
  };
  const mut: React.CSSProperties = { color: '#8fa1c4', fontSize: 14, lineHeight: 1.5 };

  if (error && !data) {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>SafeWalk</div>
        <p style={mut}>{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>SafeWalk</div>
        <p style={mut}>Loading…</p>
      </div>
    );
  }

  const st = STATUS_STYLE[data.status] ?? { label: data.status, color: '#8fa1c4' };
  const msLeft = new Date(data.checkInAt).getTime() - now;
  const showCountdown = data.status === 'active' || data.status === 'escalated';
  const mapsUrl =
    data.lastLat != null && data.lastLng != null
      ? `https://www.google.com/maps?q=${data.lastLat},${data.lastLng}`
      : null;

  return (
    <div style={wrap}>
      <div style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8fa1c4' }}>
        SafeWalk · guardian view
      </div>
      <h1 style={{ fontSize: 28, margin: '8px 0 4px' }}>{data.userName}&rsquo;s trip</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 16px' }}>
        <span
          style={{
            border: `1px solid ${st.color}`, color: st.color, borderRadius: 999,
            padding: '6px 14px', fontWeight: 800, fontSize: 13,
          }}
        >
          {st.label}
        </span>
        {showCountdown && (
          <span style={{ border: '1px solid #1e2c4d', color: '#eef3ff', borderRadius: 999, padding: '6px 14px', fontSize: 13 }}>
            check-in {msLeft >= 0 ? 'in' : 'overdue by'} {fmtCountdown(msLeft)}
          </span>
        )}
      </div>

      {data.status === 'sos' && (
        <div style={{ ...card, borderColor: '#f43f5e' }}>
          <div style={{ fontWeight: 800, color: '#f43f5e', marginBottom: 6 }}>SOS — {data.userName} needs help</div>
          <p style={{ ...mut, margin: 0 }}>
            {mapsUrl ? (
              <>Open their live location now: <a href={mapsUrl} style={{ color: '#14b8a6' }}>Google Maps</a>. </>
            ) : (
              <>No location received yet. </>
            )}
            If you can&rsquo;t reach them, call emergency services.
          </p>
        </div>
      )}

      <div style={card}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Last known location</div>
        {mapsUrl ? (
          <>
            <a href={mapsUrl} style={{ color: '#14b8a6', fontSize: 15 }}>
              Open in Google Maps
            </a>
            <p style={{ ...mut, margin: '8px 0 0', fontSize: 13 }}>
              {data.lastLat!.toFixed(5)}, {data.lastLng!.toFixed(5)}
              {data.lastLocAt ? ` · ${new Date(data.lastLocAt).toLocaleString()}` : ''}
            </p>
          </>
        ) : (
          <p style={{ ...mut, margin: 0 }}>No location shared yet.</p>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Guardians</div>
        {data.guardians.length === 0 && <p style={{ ...mut, margin: 0 }}>None listed.</p>}
        {data.guardians.map((g: { name: string }, i: number) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: i < data.guardians.length - 1 ? '1px solid #1e2c4d' : 'none' }}>
            {g.name}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Timeline</div>
        {data.events.length === 0 && <p style={{ ...mut, margin: 0 }}>No events yet.</p>}
        {data.events.map((e: { type: string; detail: Record<string, unknown>; createdAt: string }, i: number) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < data.events.length - 1 ? '1px solid #1e2c4d' : 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{EVENT_LABEL[e.type] ?? e.type}</div>
            <div style={{ ...mut, fontSize: 12 }}>{new Date(e.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <p style={{ ...mut, fontSize: 11, textAlign: 'center' }}>
        Auto-refreshes every 15 seconds. SafeWalk by Aridon.
      </p>
    </div>
  );
}
