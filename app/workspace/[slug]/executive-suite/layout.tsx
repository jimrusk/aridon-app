import type { ReactNode } from 'react';
import { executives } from '../../../../lib/executives';

export default function ExecutiveSuiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <section style={teamShell} aria-label="Aridon executive team">
        <div style={teamInner}>
          <div style={teamHeading}>
            <div>
              <div style={eyebrow}>ARIDON EXECUTIVE TEAM</div>
              <h2 style={title}>All 11 executives</h2>
            </div>
            <span style={count}>{executives.length} ACTIVE</span>
          </div>

          <div style={roster}>
            {executives.map((executive) => (
              <article key={executive.id} style={{ ...card, borderColor: `${executive.color}66` }}>
                <span style={{ ...portrait, borderColor: `${executive.color}88`, background: `${executive.color}20` }}>
                  <svg viewBox="0 0 64 64" aria-hidden="true" style={fallbackPortrait}>
                    <circle cx="32" cy="22" r="13" fill={executive.color} opacity="0.75" />
                    <path d="M10 62c2-18 11-28 22-28s20 10 22 28" fill={executive.color} opacity="0.5" />
                  </svg>
                  <img src={executive.avatar} alt={`${executive.name} portrait`} style={image} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <strong style={name}>{executive.name}</strong>
                  <span style={role}>{executive.abbr} · {executive.role}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {children}
    </>
  );
}

const teamShell = {
  background: '#07101D',
  color: '#F8FAFC',
  padding: '18px 18px 0',
  fontFamily: 'Arial, sans-serif',
};
const teamInner = { maxWidth: 1120, margin: '0 auto' };
const teamHeading = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' as const, marginBottom: 10 };
const eyebrow = { color: '#9EF0CF', fontSize: 10, fontWeight: 950, letterSpacing: 1 };
const title = { margin: '4px 0 0', fontSize: 21 };
const count = { fontSize: 10, fontWeight: 950, color: '#9EF0CF', border: '1px solid #315D50', borderRadius: 999, padding: '6px 9px' };
const roster = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8 };
const card = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 68, background: '#0D1728', border: '1px solid #283856', borderRadius: 13, padding: '8px 10px' };
const portrait = { position: 'relative' as const, width: 50, height: 50, flexShrink: 0, overflow: 'hidden', borderRadius: 14, border: '1px solid #3A4A67', display: 'grid', placeItems: 'center' };
const fallbackPortrait = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%' };
const image = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const };
const name = { display: 'block', fontSize: 13, lineHeight: 1.2 };
const role = { display: 'block', marginTop: 3, color: '#AEB9CB', fontSize: 10, lineHeight: 1.25 };
