'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  executionProjectToMarkdown,
  type ExecutionProject,
} from '../../lib/execution';
import styles from './page.module.css';

const RUN_STAGES = [
  'Heather is decomposing the project and locking the definition of done.',
  'Eva is shaping the strategy, audience, offer, and decision path.',
  'Scout and Atlas are separating evidence, assumptions, and technical work.',
  'Ledger is checking commercial logic, costs, and commitment boundaries.',
  'Nova is assembling every deliverable into one completed project package.',
  'Oracle is running final quality control and approval-gate checks.',
];

const INITIAL_FORM = {
  title: 'AWG-1000 Pilot Development Package',
  projectType: 'Pilot outreach package',
  objective:
    'Create a complete, decision-ready AWG-1000 pilot package that can be reviewed and released to a municipal utility, Tribal water authority, funder, or engineering partner.',
  audience:
    'Municipal utilities, Tribal water authorities, infrastructure funders, engineering partners, and data-center water resilience decision-makers.',
  constraints:
    'Label assumptions. Do not invent contacts, citations, production guarantees, prices, approvals, or engineering certifications. Require human approval before sending messages, committing funds, signing agreements, or releasing engineering claims.',
  requestedOutputs:
    'Executive brief\nOne-page pilot concept\nStakeholder outreach email\nThree-message follow-up sequence\nPhone call script\nFunding and partner checklist\nRisk and verification register\nFinal quality-control report',
};

function statusLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export default function ExecutionPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [project, setProject] = useState<ExecutionProject | null>(null);
  const [history, setHistory] = useState<ExecutionProject[]>([]);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');
  const [openDeliverables, setOpenDeliverables] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');

  useEffect(() => {
    void refreshHistory();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, RUN_STAGES.length - 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [running]);

  async function refreshHistory() {
    try {
      const response = await fetch('/api/execution', { cache: 'no-store' });
      if (response.ok) setHistory(await response.json());
    } catch {
      setHistory([]);
    }
  }

  async function runExecutionTeam() {
    setRunning(true);
    setStage(0);
    setError('');
    setProject(null);
    setOpenDeliverables({});

    try {
      const response = await fetch('/api/execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to run the execution team.');
      setProject(data);
      setOpenDeliverables(
        Object.fromEntries((data.deliverables || []).map((item: { id: string }, index: number) => [item.id, index === 0])),
      );
      await refreshHistory();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unable to run the execution team.');
    } finally {
      setRunning(false);
    }
  }

  function downloadProject() {
    if (!project) return;
    const markdown = executionProjectToMarkdown(project);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'aridon-project'}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function copyText(label: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  }

  const approvals = useMemo(
    () => project?.deliverables.filter((item) => item.approvalRequired).length || 0,
    [project],
  );

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>ARIDON DIGITAL WORKFORCE · LAYER 3</div>
          <h1>Execution Replacement Layer</h1>
          <p>
            Drop in a finished-project objective. Heather routes the work, the specialist agents complete it,
            Nova assembles it, and Oracle holds the final package at the right approval gate.
          </p>
        </div>
        <nav className={styles.links}>
          <Link href="/">Command Center</Link>
          <Link href="/email">Email Queue</Link>
        </nav>
      </header>

      <section className={styles.metrics}>
        <article><strong>7</strong><span>Execution agents</span></article>
        <article><strong>{project?.deliverables.length || 0}</strong><span>Finished deliverables</span></article>
        <article><strong>{project?.progress || 0}%</strong><span>Project completion</span></article>
        <article><strong>{approvals}</strong><span>Approval-gated actions</span></article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.intakeCard}>
          <div className={styles.sectionHeading}>
            <div>
              <span>PROJECT INTAKE</span>
              <h2>What should be finished?</h2>
            </div>
            <span className={styles.statusPill}>● Team online</span>
          </div>

          <label>
            Project name
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>

          <label>
            Execution playbook
            <select value={form.projectType} onChange={(event) => setForm({ ...form, projectType: event.target.value })}>
              <option>Pilot outreach package</option>
              <option>Funding response package</option>
              <option>Data-center electrical proposal</option>
              <option>Sales funnel launch</option>
              <option>Investor and partner package</option>
              <option>Custom execution package</option>
            </select>
          </label>

          <label>
            Finished-project objective
            <textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} />
          </label>

          <label>
            Audience and decision-makers
            <textarea value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} />
          </label>

          <label>
            Guardrails and constraints
            <textarea value={form.constraints} onChange={(event) => setForm({ ...form, constraints: event.target.value })} />
          </label>

          <label>
            Required outputs, one per line
            <textarea className={styles.outputs} value={form.requestedOutputs} onChange={(event) => setForm({ ...form, requestedOutputs: event.target.value })} />
          </label>

          <button className={styles.runButton} disabled={running || !form.objective.trim()} onClick={runExecutionTeam}>
            {running ? 'Execution team working…' : 'Run the Execution Team'}
          </button>

          {running && (
            <div className={styles.runner}>
              <div className={styles.progressTrack}><span style={{ width: `${((stage + 1) / RUN_STAGES.length) * 100}%` }} /></div>
              <strong>{RUN_STAGES[stage]}</strong>
              <small>The project remains open until the deliverables and final checks are assembled.</small>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <aside className={styles.historyCard}>
          <div className={styles.sectionHeading}>
            <div>
              <span>PROJECT MEMORY</span>
              <h2>Recent runs</h2>
            </div>
          </div>
          <div className={styles.historyList}>
            {history.map((item) => (
              <button key={item.id} onClick={() => setProject(item)}>
                <strong>{item.title}</strong>
                <span>{item.deliverables.length} deliverables · {statusLabel(item.status)}</span>
              </button>
            ))}
            {history.length === 0 && (
              <div className={styles.emptySmall}>No saved runs yet. The first one becomes the beginning of the operating memory.</div>
            )}
          </div>
        </aside>
      </section>

      {project ? (
        <section className={styles.resultArea}>
          <div className={styles.resultHeader}>
            <div>
              <div className={styles.eyebrow}>COMPLETED PROJECT PACKAGE</div>
              <h2>{project.title}</h2>
              <p>{project.executiveSummary}</p>
              {project.storageStatus === 'not_configured' && (
                <div className={styles.notice}>The package is complete in this session. Run the included Supabase schema to retain project history permanently.</div>
              )}
            </div>
            <div className={styles.resultActions}>
              <button onClick={() => copyText('project', executionProjectToMarkdown(project))}>{copied === 'project' ? 'Copied' : 'Copy project'}</button>
              <button className={styles.primaryAction} onClick={downloadProject}>Download complete project</button>
            </div>
          </div>

          <div className={styles.completionGrid}>
            <article>
              <span>Status</span>
              <strong>{statusLabel(project.status)}</strong>
            </article>
            <article>
              <span>Completion</span>
              <strong>{project.progress}%</strong>
            </article>
            <article>
              <span>Deliverables</span>
              <strong>{project.deliverables.length}</strong>
            </article>
            <article>
              <span>Next action</span>
              <strong>{project.nextAction}</strong>
            </article>
          </div>

          <div className={styles.twoColumn}>
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div><span>CONTROL GATE</span><h3>Definition of done</h3></div>
              </div>
              <ul className={styles.checkList}>
                {project.definitionOfDone.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div><span>FINAL INSPECTION</span><h3>Oracle checks</h3></div>
              </div>
              <ul className={styles.checkList}>
                {project.finalChecks.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div><span>AGENT CHAIN</span><h3>Who completed what</h3></div>
            </div>
            <div className={styles.agentGrid}>
              {project.agents.map((agent) => (
                <article key={`${agent.name}-${agent.role}`}>
                  <div><strong>{agent.name}</strong><span>{agent.status}</span></div>
                  <small>{agent.role}</small>
                  <p>{agent.assignment}</p>
                  <footer>{agent.output}</footer>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.deliverables}>
            <div className={styles.sectionHeading}>
              <div><span>FINISHED OUTPUTS</span><h3>Deliverable package</h3></div>
            </div>
            {project.deliverables.map((deliverable) => {
              const isOpen = Boolean(openDeliverables[deliverable.id]);
              return (
                <article className={styles.deliverable} key={deliverable.id}>
                  <button className={styles.deliverableHeader} onClick={() => setOpenDeliverables({ ...openDeliverables, [deliverable.id]: !isOpen })}>
                    <div>
                      <span>{deliverable.owner}</span>
                      <strong>{deliverable.title}</strong>
                      <small>{deliverable.summary}</small>
                    </div>
                    <div className={styles.deliverableMeta}>
                      <span className={deliverable.approvalRequired ? styles.approval : styles.complete}>{statusLabel(deliverable.status)}</span>
                      <b>{isOpen ? '−' : '+'}</b>
                    </div>
                  </button>
                  {isOpen && (
                    <div className={styles.deliverableBody}>
                      <pre>{deliverable.content}</pre>
                      <div className={styles.qualityBox}>
                        <strong>Quality checks</strong>
                        {deliverable.qualityChecks.map((check) => <span key={check}>✓ {check}</span>)}
                      </div>
                      <button onClick={() => copyText(deliverable.id, deliverable.content)}>{copied === deliverable.id ? 'Copied' : 'Copy deliverable'}</button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </section>
      ) : !running && (
        <section className={styles.emptyState}>
          <div>⚙</div>
          <h2>The factory floor is ready.</h2>
          <p>Run the first project to produce the execution log, finished deliverables, approval gates, and downloadable package.</p>
        </section>
      )}
    </main>
  );
}
