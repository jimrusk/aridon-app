'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { executives } from '../../lib/executives';

type Lead = {
  id: string;
  name: string;
  company: string;
  status: string;
  notes: string;
  email: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  description: string;
  executive: string;
};

type GmailStatus = {
  configured: boolean;
  missing: string[];
  connected: boolean;
  email: string;
  approvalRequired: boolean;
};

type EmailDraft = {
  id: string;
  leadId: string;
  contactName: string;
  company: string;
  email: string;
  executive: string;
  projectName: string;
  objective: string;
  subject: string;
  body: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  messageId?: string;
  nextFollowUpDays: number;
  error?: string;
};

const STORAGE_KEY = 'aridon-email-queue-v1';
const panel: React.CSSProperties = {
  background: '#11182b',
  border: '1px solid #26314f',
  borderRadius: '18px',
  padding: '20px',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0b1120',
  border: '1px solid #344260',
  color: '#f5f7ff',
  borderRadius: '10px',
  padding: '10px 12px',
  marginTop: '6px',
  boxSizing: 'border-box',
};
const buttonStyle: React.CSSProperties = {
  background: '#E87722',
  color: '#101421',
  border: 0,
  borderRadius: '10px',
  padding: '11px 15px',
  fontWeight: 800,
  cursor: 'pointer',
};
const secondaryButton: React.CSSProperties = {
  ...buttonStyle,
  background: '#151f36',
  color: '#eaf0ff',
  border: '1px solid #344260',
};

function saveQueue(queue: EmailDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(0, 200)));
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function EmailCommandCenter() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gmail, setGmail] = useState<GmailStatus>({
    configured: false,
    missing: [],
    connected: false,
    email: '',
    approvalRequired: true,
  });
  const [queue, setQueue] = useState<EmailDraft[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [executive, setExecutive] = useState('Heather');
  const [objective, setObjective] = useState(
    'schedule a short call to discuss a paid feasibility or pilot next step',
  );
  const [nextFollowUpDays, setNextFollowUpDays] = useState(7);
  const [activeDraftId, setActiveDraftId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId),
    [leads, selectedLeadId],
  );
  const activeDraft = useMemo(
    () => queue.find((draft) => draft.id === activeDraftId),
    [queue, activeDraftId],
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as EmailDraft[];
        if (Array.isArray(parsed)) {
          setQueue(parsed);
          if (parsed[0]) setActiveDraftId(parsed[0].id);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    Promise.all([
      fetch('/api/crm', { cache: 'no-store' }),
      fetch('/api/projects', { cache: 'no-store' }),
      fetch('/api/gmail/status', { cache: 'no-store' }),
    ])
      .then(async ([leadResponse, projectResponse, gmailResponse]) => {
        if (leadResponse.ok) {
          const leadData = (await leadResponse.json()) as Lead[];
          setLeads(leadData);
          const firstWithEmail = leadData.find((lead) => lead.email);
          if (firstWithEmail) setSelectedLeadId(firstWithEmail.id);
        }
        if (projectResponse.ok) setProjects((await projectResponse.json()) as Project[]);
        if (gmailResponse.ok) setGmail((await gmailResponse.json()) as GmailStatus);
      })
      .catch(() => setNotice('The Email Command Center could not load all live data.'));

    const params = new URLSearchParams(window.location.search);
    const gmailResult = params.get('gmail');
    if (gmailResult === 'connected') setNotice('Gmail connected. Emails still require your approval.');
    if (gmailResult === 'denied') setNotice('Google access was not approved. Nothing was connected.');
    if (gmailResult === 'connect-error') setNotice('Gmail connection failed. Check the Google OAuth settings.');
    if (gmailResult === 'state-error') setNotice('The Gmail connection expired. Start the connection again.');
  }, []);

  function replaceQueue(next: EmailDraft[]) {
    setQueue(next);
    saveQueue(next);
  }

  function updateDraft(id: string, patch: Partial<EmailDraft>) {
    replaceQueue(queue.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  async function generateDraft() {
    if (!selectedLead?.email) {
      setNotice('Choose a contact with an email address.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedLead,
          executive,
          projectName: selectedProject,
          objective,
        }),
      });
      const data = (await response.json()) as {
        subject?: string;
        body?: string;
        error?: string;
      };
      if (!response.ok || !data.subject || !data.body) {
        throw new Error(data.error || 'Unable to generate the draft.');
      }

      const draft: EmailDraft = {
        id: newId(),
        leadId: selectedLead.id,
        contactName: selectedLead.name,
        company: selectedLead.company,
        email: selectedLead.email,
        executive,
        projectName: selectedProject,
        objective,
        subject: data.subject,
        body: data.body,
        status: 'draft',
        createdAt: new Date().toISOString(),
        nextFollowUpDays,
      };
      const next = [draft, ...queue];
      replaceQueue(next);
      setActiveDraftId(draft.id);
      setNotice(`${executive} prepared a draft. Review every line before sending.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to generate the draft.');
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGmail() {
    await fetch('/api/gmail/disconnect', { method: 'POST' });
    setGmail({ ...gmail, connected: false, email: '' });
    setNotice('Gmail disconnected. Existing local drafts were preserved.');
  }

  async function logSend(draft: EmailDraft, sentAt: string, messageId: string) {
    const followUpDate = new Date(
      Date.now() + draft.nextFollowUpDays * 24 * 60 * 60 * 1000,
    );
    const dateLabel = followUpDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    await Promise.allSettled([
      fetch('/api/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draft.leadId,
          appendNote: `Follow-up email sent ${new Date(sentAt).toLocaleString()} by Jim Rusk; drafted by ${draft.executive}. Gmail message: ${messageId}. Next follow-up: ${dateLabel}.`,
          status: 'active',
        }),
      }),
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Follow up with ${draft.contactName} (${draft.company || draft.email}) on ${dateLabel}`,
          assigned_to: draft.executive,
          priority: 'medium',
          status: 'open',
        }),
      }),
    ]);
  }

  async function approveAndSend(draft: EmailDraft) {
    if (!gmail.connected) {
      setNotice('Connect Gmail before sending.');
      return;
    }

    const recent = queue.find(
      (item) =>
        item.id !== draft.id &&
        item.email.toLowerCase() === draft.email.toLowerCase() &&
        item.status === 'sent' &&
        item.sentAt &&
        Date.now() - new Date(item.sentAt).getTime() < 48 * 60 * 60 * 1000,
    );
    if (recent && !window.confirm('An email was sent to this contact within the last 48 hours. Send another one?')) {
      return;
    }

    const approved = window.confirm(
      `Approve and send this email from ${gmail.email} to ${draft.email}?`,
    );
    if (!approved) return;

    updateDraft(draft.id, { status: 'sending', error: '' });
    setBusy(true);
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          to: draft.email,
          subject: draft.subject,
          body: draft.body,
        }),
      });
      const data = (await response.json()) as {
        sent?: boolean;
        sentAt?: string;
        messageId?: string;
        error?: string;
      };
      if (!response.ok || !data.sent || !data.sentAt || !data.messageId) {
        throw new Error(data.error || 'Gmail did not send the message.');
      }

      const updated = queue.map((item) =>
        item.id === draft.id
          ? {
              ...item,
              status: 'sent' as const,
              sentAt: data.sentAt,
              messageId: data.messageId,
              error: '',
            }
          : item,
      );
      replaceQueue(updated);
      await logSend(draft, data.sentAt, data.messageId);
      setNotice(`Sent to ${draft.contactName}. The CRM note and next follow-up task were added.`);
    } catch (error) {
      updateDraft(draft.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unable to send.',
      });
      setNotice(error instanceof Error ? error.message : 'Unable to send.');
    } finally {
      setBusy(false);
    }
  }

  function deleteDraft(id: string) {
    if (!window.confirm('Delete this draft from the local queue?')) return;
    const next = queue.filter((draft) => draft.id !== id);
    replaceQueue(next);
    if (activeDraftId === id) setActiveDraftId(next[0]?.id || '');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080d19', color: '#f5f7ff', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '22px' }}>
          <div>
            <div style={{ color: '#E87722', fontWeight: 900, letterSpacing: '0.16em' }}>ARIDON</div>
            <h1 style={{ margin: '7px 0 4px', fontSize: '32px' }}>Email Command Center</h1>
            <div style={{ color: '#9ba8c6' }}>Executives draft. Jim reviews. Gmail sends. CRM remembers.</div>
          </div>
          <Link href="/" style={{ ...secondaryButton, textDecoration: 'none' }}>← Command Center</Link>
        </div>

        {notice && (
          <div style={{ ...panel, borderColor: '#E8772266', marginBottom: '18px', padding: '13px 16px' }}>
            {notice}
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.9fr) minmax(360px, 1.4fr)', gap: '18px' }}>
          <div style={{ display: 'grid', gap: '18px', alignContent: 'start' }}>
            <div style={panel}>
              <h2 style={{ marginTop: 0 }}>1. Gmail Connection</h2>
              {!gmail.configured ? (
                <>
                  <p style={{ color: '#ffb36f' }}>Google OAuth needs these Vercel variables:</p>
                  <div style={{ background: '#080d19', padding: '12px', borderRadius: '10px', fontFamily: 'monospace', lineHeight: 1.7 }}>
                    {gmail.missing.map((name) => <div key={name}>{name}</div>)}
                  </div>
                </>
              ) : gmail.connected ? (
                <>
                  <div style={{ color: '#5bd68a', fontWeight: 800 }}>● Connected</div>
                  <p style={{ color: '#9ba8c6' }}>{gmail.email}</p>
                  <button style={secondaryButton} onClick={disconnectGmail}>Disconnect Gmail</button>
                </>
              ) : (
                <>
                  <p style={{ color: '#9ba8c6' }}>Connect the Gmail account that should send approved Aridon follow-ups.</p>
                  <button style={buttonStyle} onClick={() => { window.location.href = '/api/gmail/connect'; }}>Connect Gmail</button>
                </>
              )}
              <p style={{ color: '#9ba8c6', fontSize: '12px', lineHeight: 1.5, marginBottom: 0 }}>
                Send-only permission is requested. Aridon cannot read or delete your inbox in this phase.
              </p>
            </div>

            <div style={panel}>
              <h2 style={{ marginTop: 0 }}>2. Choose Follow-Up</h2>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                Contact
                <select value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)} style={inputStyle}>
                  <option value="">Choose a contact</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id} disabled={!lead.email}>
                      {lead.name}{lead.company ? ` · ${lead.company}` : ''}{!lead.email ? ' · no email' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                Executive author
                <select value={executive} onChange={(event) => setExecutive(event.target.value)} style={inputStyle}>
                  {executives.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.abbr}</option>)}
                </select>
              </label>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                Project
                <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} style={inputStyle}>
                  <option value="">General Aridon follow-up</option>
                  {projects.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                Desired next step
                <textarea value={objective} onChange={(event) => setObjective(event.target.value)} style={{ ...inputStyle, minHeight: '86px', resize: 'vertical' }} />
              </label>
              <label style={{ display: 'block', marginBottom: '14px' }}>
                Next follow-up after sending
                <select value={nextFollowUpDays} onChange={(event) => setNextFollowUpDays(Number(event.target.value))} style={inputStyle}>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </label>
              <button style={{ ...buttonStyle, width: '100%', opacity: busy ? 0.65 : 1 }} disabled={busy} onClick={generateDraft}>
                {busy ? 'Working…' : `Generate Follow-Up with ${executive}`}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '18px', alignContent: 'start' }}>
            <div style={panel}>
              <h2 style={{ marginTop: 0 }}>3. Review and Approve</h2>
              {!activeDraft ? (
                <p style={{ color: '#9ba8c6' }}>Generate a draft or select one from the queue below.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div>
                      <strong>{activeDraft.contactName}</strong>
                      <div style={{ color: '#9ba8c6', fontSize: '13px' }}>{activeDraft.email} · Drafted by {activeDraft.executive}</div>
                    </div>
                    <span style={{ color: activeDraft.status === 'sent' ? '#5bd68a' : '#ffb36f', fontWeight: 800 }}>{activeDraft.status.toUpperCase()}</span>
                  </div>
                  <label style={{ display: 'block', marginBottom: '12px' }}>
                    Subject
                    <input
                      value={activeDraft.subject}
                      disabled={activeDraft.status === 'sent'}
                      onChange={(event) => updateDraft(activeDraft.id, { subject: event.target.value, status: 'draft' })}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: 'block', marginBottom: '12px' }}>
                    Email body
                    <textarea
                      value={activeDraft.body}
                      disabled={activeDraft.status === 'sent'}
                      onChange={(event) => updateDraft(activeDraft.id, { body: event.target.value, status: 'draft' })}
                      style={{ ...inputStyle, minHeight: '330px', resize: 'vertical', lineHeight: 1.55 }}
                    />
                  </label>
                  {activeDraft.error && <div style={{ color: '#ff8e8e', marginBottom: '12px' }}>{activeDraft.error}</div>}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {activeDraft.status !== 'sent' && (
                      <button style={buttonStyle} disabled={busy} onClick={() => approveAndSend(activeDraft)}>
                        Approve & Send
                      </button>
                    )}
                    <button style={secondaryButton} onClick={() => setNotice('Draft saved in this browser. Nothing was sent.')}>Save Draft</button>
                    <button style={secondaryButton} onClick={() => deleteDraft(activeDraft.id)}>Delete</button>
                  </div>
                  <p style={{ color: '#9ba8c6', fontSize: '12px', marginBottom: 0 }}>
                    Aridon cannot send this message until you confirm the final approval dialog.
                  </p>
                </>
              )}
            </div>

            <div style={panel}>
              <h2 style={{ marginTop: 0 }}>Email Queue <span style={{ color: '#9ba8c6', fontWeight: 400 }}>({queue.length})</span></h2>
              <div style={{ display: 'grid', gap: '10px', maxHeight: '430px', overflowY: 'auto' }}>
                {queue.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => setActiveDraftId(draft.id)}
                    style={{
                      textAlign: 'left',
                      background: draft.id === activeDraftId ? '#1c2946' : '#0b1120',
                      color: '#f5f7ff',
                      border: `1px solid ${draft.id === activeDraftId ? '#E87722' : '#26314f'}`,
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <strong>{draft.contactName}</strong>
                      <span style={{ color: draft.status === 'sent' ? '#5bd68a' : '#ffb36f', fontSize: '12px', fontWeight: 800 }}>{draft.status}</span>
                    </div>
                    <div style={{ color: '#9ba8c6', fontSize: '12px', marginTop: '4px' }}>{draft.subject}</div>
                  </button>
                ))}
                {queue.length === 0 && <p style={{ color: '#9ba8c6' }}>No drafts yet.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
