'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type AuthState = 'checking' | 'ready' | 'signed-out';

type JoinResult = {
  ok?: boolean;
  botId?: string | null;
  status?: string;
  error?: string;
  code?: string;
};

export default function EvaMeetingDirectPage() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [title, setTitle] = useState('Aridon Partner Meeting');
  const [goal, setGoal] = useState('Represent Aridon accurately, answer questions when addressed, identify the partner fit, agree on a measurable next step, and capture owners and follow-up actions.');
  const [status, setStatus] = useState('Checking your Aridon session…');
  const [joining, setJoining] = useState(false);
  const [botId, setBotId] = useState('');

  useEffect(() => {
    let active = true;
    void getBrowserClient().auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setAuthState('ready');
        setStatus('Ready. Paste a Zoom, Google Meet, Microsoft Teams, or Webex link and send Eva in.');
      } else {
        setAuthState('signed-out');
        setStatus('Sign in to Aridon to use Eva Direct Meeting Mode.');
      }
    }).catch(() => {
      if (!active) return;
      setAuthState('signed-out');
      setStatus('Sign in to Aridon to use Eva Direct Meeting Mode.');
    });
    return () => { active = false; };
  }, []);

  async function sendEva() {
    if (joining || authState !== 'ready') return;
    const url = meetingUrl.trim();
    if (!url) {
      setStatus('Paste the meeting link first.');
      return;
    }

    setJoining(true);
    setBotId('');
    setStatus('Sending Eva into the meeting…');
    try {
      const db = getBrowserClient();
      const { data, error } = await db.auth.getSession();
      if (error || !data.session?.access_token) {
        setAuthState('signed-out');
        throw new Error('Your Aridon session expired. Sign in again.');
      }

      const response = await fetch('/api/eva-meeting/direct', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingUrl: url, title, goal }),
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({})) as JoinResult;
      if (!response.ok) {
        if (result.code === 'RECALL_NOT_CONFIGURED') {
          throw new Error('The live voice layer is installed. One meeting-bot bridge credential still needs to be connected before Eva can enter the call directly.');
        }
        throw new Error(result.error || 'Eva could not join that meeting.');
      }

      setBotId(result.botId || 'created');
      setStatus('Eva is joining as “Eva | Aridon AI”. Admit her if the meeting lobby asks. Once connected, say “Eva” when you want her to speak.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Eva could not join that meeting.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 70% 0,#173D60,#07101D 44%,#040A11)', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: 20 }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '.14em' }}>ARIDON · EVA DIRECT MEETING MODE</div>
            <h1 style={{ margin: '7px 0 5px', fontSize: 38 }}>Put Eva in the call.</h1>
            <p style={{ margin: 0, maxWidth: 720, color: '#C4D0DE', lineHeight: 1.55 }}>
              Eva joins as a visible AI participant, listens to the room, and speaks live when she is addressed. No second device is required.
            </p>
          </div>
          <img src={EVA_AVATAR} alt="Eva" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '2px solid #9EF0CF' }} />
        </header>

        <section style={{ background: 'rgba(8,19,32,.88)', border: '1px solid rgba(148,163,184,.24)', borderRadius: 20, padding: 22, boxShadow: '0 18px 50px rgba(0,0,0,.28)' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#9EF0CF', letterSpacing: '.08em', marginBottom: 7 }}>MEETING LINK</label>
          <input
            value={meetingUrl}
            onChange={(event) => setMeetingUrl(event.target.value)}
            placeholder="https://meet.google.com/... or Zoom / Teams link"
            autoComplete="off"
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid #36516c', background: '#081420', color: '#fff', padding: '13px 14px', fontSize: 16, outline: 'none' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16, marginTop: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#9EF0CF', letterSpacing: '.08em', marginBottom: 7 }}>MEETING TITLE</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 180))}
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid #36516c', background: '#081420', color: '#fff', padding: '12px 14px', fontSize: 15, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#9EF0CF', letterSpacing: '.08em', marginBottom: 7 }}>EVA'S OBJECTIVE</label>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value.slice(0, 1_200))}
                rows={4}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: 12, border: '1px solid #36516c', background: '#081420', color: '#fff', padding: '12px 14px', fontSize: 15, lineHeight: 1.45, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={sendEva}
              disabled={joining || authState !== 'ready'}
              style={{ border: 0, borderRadius: 999, padding: '12px 20px', fontSize: 15, fontWeight: 950, cursor: joining || authState !== 'ready' ? 'not-allowed' : 'pointer', background: joining || authState !== 'ready' ? '#475569' : '#9EF0CF', color: '#07101D' }}
            >
              {joining ? 'Sending Eva…' : 'Send Eva Into Meeting'}
            </button>
            <Link href="/eva-meeting" style={{ color: '#B8CAE0', fontSize: 14 }}>Use second-device Meeting Mode</Link>
          </div>

          <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'rgba(25,45,66,.72)', color: '#DCE7F4', lineHeight: 1.5 }}>
            {status}
            {botId ? <div style={{ marginTop: 6, fontSize: 12, color: '#98AFC5' }}>Meeting bot: {botId}</div> : null}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 18 }}>
          {[
            ['LISTENS FIRST', 'Eva stays quiet during normal human conversation and waits until she is addressed.'],
            ['SPEAKS LIVE', 'Say “Eva” and ask the question. Her answer is played directly into the meeting.'],
            ['RESEARCHES LIVE', 'When current facts are needed, Eva can use Aridon’s research backend before answering.'],
            ['STAYS TRANSPARENT', 'Eva identifies herself as Aridon AI and never pretends to be a human attendee.'],
          ].map(([heading, copy]) => (
            <div key={heading} style={{ background: 'rgba(8,19,32,.68)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 15 }}>
              <div style={{ fontSize: 11, fontWeight: 950, color: '#9EF0CF', letterSpacing: '.08em' }}>{heading}</div>
              <div style={{ marginTop: 7, color: '#B9C7D6', fontSize: 13, lineHeight: 1.5 }}>{copy}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
