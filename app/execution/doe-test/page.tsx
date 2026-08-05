'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { executionProjectToMarkdown, type ExecutionProject } from '../../../lib/execution';
import { DOE_TEST_PROJECTS, scoreDoeTestProjects } from '../../../lib/doeTestProjects';
import styles from '../page.module.css';

function statusLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export default function DoeExecutionTestPage() {
  const [project, setProject] = useState<ExecutionProject>(DOE_TEST_PROJECTS[0]);
  const [openDeliverables, setOpenDeliverables] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');
  const scorecard = useMemo(() => scoreDoeTestProjects(), []);
  const projectScore = scorecard.projects.find((item) => item.id === project.id);
  const approvalCount = project.deliverables.filter((item) => item.approvalRequired).length;

  function downloadProject() {
    const markdown = executionProjectToMarkdown(project);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadPortfolio() {
    const markdown = DOE_TEST_PROJECTS.map(executionProjectToMarkdown).join('\n\n---\n\n');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aridon-doe-execution-test-portfolio.md';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>ARIDON EXECUTION TEAM · DOE FIELD TEST</div>
          <h1>Three projects completed and inspected</h1>
          <p>
            Paducah GridCore, Los Alamos Remote Resilience, and Genesis Infrastructure Intelligence were
            assembled as complete approval-gated packages. This screen is the deterministic benchmark for
            the live agent chain.
          </p>
        </div>
        <nav className={styles.links}>
          <Link href="/execution">Execution Engine</Link>
          <Link href="/">Command Center</Link>
        </nav>
      </header>

      <section className={styles.metrics}>
        <article><strong>{scorecard.passed ? 'PASS' : 'HOLD'}</strong><span>Portfolio release gate</span></article>
        <article><strong>{scorecard.projectCount}</strong><span>Completed projects</span></article>
        <article><strong>{DOE_TEST_PROJECTS.reduce((sum, item) => sum + item.deliverables.length, 0)}</strong><span>Finished deliverables</span></article>
        <article><strong>{DOE_TEST_PROJECTS.reduce((sum, item) => sum + item.deliverables.reduce((chars, deliverable) => chars + deliverable.content.length, 0), 0).toLocaleString()}</strong><span>Deliverable characters</span></article>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.historyCard}>
          <div className={styles.sectionHeading}>
            <div><span>TEST PORTFOLIO</span><h2>Select project</h2></div>
          </div>
          <div className={styles.historyList}>
            {DOE_TEST_PROJECTS.map((item) => {
              const score = scorecard.projects.find((entry) => entry.id === item.id);
              return (
                <button key={item.id} onClick={() => { setProject(item); setOpenDeliverables({}); }}>
                  <strong>{item.title}</strong>
                  <span>{item.deliverables.length} deliverables · {score?.passed ? 'passed' : 'hold'}</span>
                </button>
              );
            })}
          </div>
          <button className={styles.runButton} onClick={downloadPortfolio}>Download all three projects</button>
        </aside>

        <section className={styles.intakeCard}>
          <div className={styles.sectionHeading}>
            <div><span>ORACLE SCORECARD</span><h2>{projectScore?.passed ? 'Release gates passed' : 'Release hold'}</h2></div>
            <span className={styles.statusPill}>{projectScore?.passed ? '● Passed' : '● Hold'}</span>
          </div>
          <ul className={styles.checkList}>
            {projectScore && Object.entries(projectScore.checks).map(([name, passed]) => (
              <li key={name}>{passed ? '✓' : '✕'} {name.replaceAll('_', ' ')}</li>
            ))}
          </ul>
          <div className={styles.completionGrid}>
            <article><span>Team</span><strong>{project.agents.length}</strong></article>
            <article><span>Deliverables</span><strong>{project.deliverables.length}</strong></article>
            <article><span>Approval gates</span><strong>{approvalCount}</strong></article>
            <article><span>Content</span><strong>{projectScore?.totalCharacters.toLocaleString()}</strong></article>
          </div>
        </section>
      </section>

      <section className={styles.resultArea}>
        <div className={styles.resultHeader}>
          <div>
            <div className={styles.eyebrow}>COMPLETED PROJECT PACKAGE</div>
            <h2>{project.title}</h2>
            <p>{project.executiveSummary}</p>
          </div>
          <div className={styles.resultActions}>
            <button onClick={() => copyText('project', executionProjectToMarkdown(project))}>{copied === 'project' ? 'Copied' : 'Copy project'}</button>
            <button className={styles.primaryAction} onClick={downloadProject}>Download project</button>
          </div>
        </div>

        <div className={styles.completionGrid}>
          <article><span>Status</span><strong>{statusLabel(project.status)}</strong></article>
          <article><span>Completion</span><strong>{project.progress}%</strong></article>
          <article><span>Project type</span><strong>{project.projectType}</strong></article>
          <article><span>Next action</span><strong>{project.nextAction}</strong></article>
        </div>

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}><div><span>CONTROL GATE</span><h3>Definition of done</h3></div></div>
            <ul className={styles.checkList}>{project.definitionOfDone.map((item) => <li key={item}>✓ {item}</li>)}</ul>
          </section>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}><div><span>FINAL INSPECTION</span><h3>Oracle checks</h3></div></div>
            <ul className={styles.checkList}>{project.finalChecks.map((item) => <li key={item}>✓ {item}</li>)}</ul>
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}><div><span>AGENT CHAIN</span><h3>Who completed what</h3></div></div>
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
          <div className={styles.sectionHeading}><div><span>FINISHED OUTPUTS</span><h3>Deliverable package</h3></div></div>
          {project.deliverables.map((deliverable, index) => {
            const isOpen = openDeliverables[deliverable.id] ?? index === 0;
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
    </main>
  );
}
