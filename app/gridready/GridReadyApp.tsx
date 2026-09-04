'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CoolingType = 'air' | 'closed-loop-liquid' | 'dry' | 'immersion' | 'evaporative' | 'hybrid';
type WaterSource = 'not-set' | 'municipal' | 'reclaimed' | 'groundwater' | 'surface' | 'onsite' | 'mixed';

type ProjectState = {
  projectName: string;
  city: string;
  state: string;
  peakLoadMW: number;
  gridImportMW: number;
  onsiteGenerationMW: number;
  bessMW: number;
  bessMWh: number;
  flexibleLoadMW: number;
  contingencyPlan: boolean;
  vrtReady: boolean;
  psseModel: boolean;
  pscadModel: boolean;
  equipmentModels: boolean;
  disturbanceStudy: boolean;
  waterDemandGPD: number;
  recycledWaterPct: number;
  waterSource: WaterSource;
  backupWaterPlan: boolean;
  coolingType: CoolingType;
  coolingWUE: number;
  heatRecovery: boolean;
  siteControl: boolean;
  financialCommitment: boolean;
  screeningFeeBudgeted: boolean;
  duplicateRequestDisclosure: boolean;
  transmissionScreening: boolean;
  regulatoryReview: boolean;
  executionSchedule: boolean;
  noisePlan: boolean;
  trafficEmergencyPlan: boolean;
  communityWaterPlan: boolean;
};

const DEFAULT_PROJECT: ProjectState = {
  projectName: 'Texas AI Campus - Example',
  city: 'Abilene',
  state: 'TX',
  peakLoadMW: 500,
  gridImportMW: 150,
  onsiteGenerationMW: 200,
  bessMW: 200,
  bessMWh: 800,
  flexibleLoadMW: 75,
  contingencyPlan: true,
  vrtReady: false,
  psseModel: true,
  pscadModel: false,
  equipmentModels: true,
  disturbanceStudy: false,
  waterDemandGPD: 500000,
  recycledWaterPct: 85,
  waterSource: 'reclaimed',
  backupWaterPlan: true,
  coolingType: 'closed-loop-liquid',
  coolingWUE: 0.18,
  heatRecovery: false,
  siteControl: true,
  financialCommitment: true,
  screeningFeeBudgeted: true,
  duplicateRequestDisclosure: true,
  transmissionScreening: false,
  regulatoryReview: true,
  executionSchedule: true,
  noisePlan: true,
  trafficEmergencyPlan: false,
  communityWaterPlan: true,
};

const EMPTY_PROJECT: ProjectState = {
  ...DEFAULT_PROJECT,
  projectName: 'New GridReady Project',
  city: '',
  peakLoadMW: 100,
  gridImportMW: 100,
  onsiteGenerationMW: 0,
  bessMW: 0,
  bessMWh: 0,
  flexibleLoadMW: 0,
  contingencyPlan: false,
  vrtReady: false,
  psseModel: false,
  pscadModel: false,
  equipmentModels: false,
  disturbanceStudy: false,
  waterDemandGPD: 0,
  recycledWaterPct: 0,
  waterSource: 'not-set',
  backupWaterPlan: false,
  coolingType: 'air',
  coolingWUE: 0,
  heatRecovery: false,
  siteControl: false,
  financialCommitment: false,
  screeningFeeBudgeted: false,
  duplicateRequestDisclosure: false,
  transmissionScreening: false,
  regulatoryReview: false,
  executionSchedule: false,
  noisePlan: false,
  trafficEmergencyPlan: false,
  communityWaterPlan: false,
};

const STORAGE_KEY = 'aridon-gridready-project-v1';

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreLabel(score: number) {
  if (score >= 85) return 'Submission Ready';
  if (score >= 70) return 'Nearly Ready';
  if (score >= 50) return 'Work Required';
  return 'High Risk';
}

function scoreTone(score: number) {
  if (score >= 85) return { bg: '#DDF8EA', border: '#78CFA8', text: '#126443' };
  if (score >= 70) return { bg: '#E5F0FF', border: '#8CB6EF', text: '#174E95' };
  if (score >= 50) return { bg: '#FFF1C9', border: '#E5BE55', text: '#775200' };
  return { bg: '#FFE2E0', border: '#E78E88', text: '#8A2620' };
}

function NumberInput({ label, value, onChange, suffix, min = 0, step = 1 }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; min?: number; step?: number }) {
  return (
    <label style={fieldLabel}>
      <span>{label}</span>
      <div style={inputShell}>
        <input type="number" min={min} step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} style={numberInput} />
        {suffix ? <strong style={{ color: '#687386', fontSize: 12 }}>{suffix}</strong> : null}
      </div>
    </label>
  );
}

function Check({ label, checked, onChange, note }: { label: string; checked: boolean; onChange: (checked: boolean) => void; note?: string }) {
  return (
    <label style={checkRow}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} style={{ width: 18, height: 18, accentColor: '#0C7A5A', flex: '0 0 auto' }} />
      <span><strong style={{ display: 'block', color: '#142033' }}>{label}</strong>{note ? <small style={{ color: '#6B7482', lineHeight: 1.45 }}>{note}</small> : null}</span>
    </label>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article style={metricCard}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: '#6B7482' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: -1.2, margin: '6px 0 4px' }}>{value}</div>
      <div style={{ color: '#6B7482', fontSize: 12, lineHeight: 1.45 }}>{note}</div>
    </article>
  );
}

function ScoreCard({ name, score, detail }: { name: string; score: number; detail: string }) {
  const tone = scoreTone(score);
  return (
    <article style={{ ...scoreCard, background: tone.bg, borderColor: tone.border }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <strong style={{ fontSize: 16, color: '#142033' }}>{name}</strong>
        <strong style={{ fontSize: 24, color: tone.text }}>{score}</strong>
      </div>
      <div style={{ height: 7, background: 'rgba(20,32,51,.12)', borderRadius: 999, overflow: 'hidden', margin: '10px 0 9px' }}><div style={{ width: `${score}%`, height: '100%', background: tone.text }} /></div>
      <div style={{ color: '#5F6876', fontSize: 12, lineHeight: 1.45 }}>{detail}</div>
    </article>
  );
}

export default function GridReadyApp() {
  const [project, setProject] = useState<ProjectState>(DEFAULT_PROJECT);
  const [saveNote, setSaveNote] = useState('');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setProject({ ...DEFAULT_PROJECT, ...JSON.parse(stored) });
    } catch {
      // Keep the default demo if local storage is unavailable.
    }
  }, []);

  const metrics = useMemo(() => {
    const peak = Math.max(project.peakLoadMW, 1);
    const firmCapacity = project.gridImportMW + project.onsiteGenerationMW + project.bessMW;
    const effectiveCapacity = firmCapacity + project.flexibleLoadMW;
    const coverage = effectiveCapacity / peak;
    const gridShare = project.gridImportMW / peak;
    const bessHours = project.bessMW > 0 ? project.bessMWh / project.bessMW : 0;
    const capacityGap = Math.max(peak - effectiveCapacity, 0);
    const makeupWater = Math.max(project.waterDemandGPD * (1 - project.recycledWaterPct / 100), 0);

    const power = clampScore(
      Math.min(coverage, 1) * 45 +
      Math.min(project.onsiteGenerationMW / Math.max(peak * 0.2, 1), 1) * 15 +
      Math.min(project.bessMW / Math.max(peak * 0.1, 1), 1) * 12 +
      Math.min(bessHours / 2, 1) * 10 +
      Math.min(project.flexibleLoadMW / Math.max(peak * 0.1, 1), 1) * 8 +
      (project.contingencyPlan ? 10 : 0)
    );

    const stability = clampScore(
      (project.vrtReady ? 35 : 0) +
      (project.psseModel ? 20 : 0) +
      (project.pscadModel ? 20 : 0) +
      (project.equipmentModels ? 10 : 0) +
      (project.disturbanceStudy ? 15 : 0)
    );

    const coolingBase: Record<CoolingType, number> = {
      air: 72,
      'closed-loop-liquid': 95,
      dry: 92,
      immersion: 98,
      evaporative: 50,
      hybrid: 82,
    };
    const wueScore = project.coolingWUE <= 0 ? 0 : project.coolingWUE <= 0.2 ? 30 : project.coolingWUE <= 0.4 ? 22 : project.coolingWUE <= 0.7 ? 12 : 4;
    const cooling = clampScore(coolingBase[project.coolingType] * 0.6 + wueScore + (project.heatRecovery ? 10 : 0));

    const sourcePoints: Record<WaterSource, number> = {
      'not-set': 0,
      municipal: 15,
      reclaimed: 30,
      groundwater: 12,
      surface: 12,
      onsite: 22,
      mixed: 24,
    };
    const water = clampScore(
      sourcePoints[project.waterSource] +
      Math.min(project.recycledWaterPct / 80, 1) * 35 +
      (project.backupWaterPlan ? 15 : 0) +
      (['closed-loop-liquid', 'dry', 'immersion', 'air'].includes(project.coolingType) ? 20 : project.coolingType === 'hybrid' ? 12 : 4)
    );

    const compliance = clampScore(
      (project.siteControl ? 20 : 0) +
      (project.financialCommitment ? 20 : 0) +
      (project.screeningFeeBudgeted ? 10 : 0) +
      (project.duplicateRequestDisclosure ? 10 : 0) +
      (project.transmissionScreening ? 20 : 0) +
      (project.regulatoryReview ? 10 : 0) +
      (project.executionSchedule ? 10 : 0)
    );

    const community = clampScore(
      (project.noisePlan ? 35 : 0) +
      (project.trafficEmergencyPlan ? 30 : 0) +
      (project.communityWaterPlan ? 35 : 0)
    );

    const overall = clampScore(power * 0.25 + stability * 0.2 + water * 0.15 + cooling * 0.1 + compliance * 0.2 + community * 0.1);

    return { power, stability, water, cooling, compliance, community, overall, coverage, gridShare, bessHours, capacityGap, makeupWater };
  }, [project]);

  const recommendations = useMemo(() => {
    const items: { priority: number; title: string; detail: string }[] = [];
    if (metrics.capacityGap > 0) items.push({ priority: 100, title: `Close ${metrics.capacityGap.toFixed(0)} MW of uncovered peak`, detail: 'Add firm generation, battery discharge capacity, an enforceable load-flexibility block, or reduce the requested peak before utility screening.' });
    if (!project.vrtReady) items.push({ priority: 95, title: 'Complete voltage ride-through readiness', detail: 'Document facility and UPS behavior through voltage disturbances and align protection settings with the applicable utility/ERCOT requirements.' });
    if (!project.pscadModel) items.push({ priority: 92, title: 'Build the PSCAD model package', detail: 'Create EMT-grade models for the large computational load, UPS, power conversion and onsite generation interfaces.' });
    if (!project.disturbanceStudy) items.push({ priority: 88, title: 'Run disturbance and dynamic performance studies', detail: 'Test credible voltage/frequency events and quantify how much load could disconnect simultaneously.' });
    if (!project.transmissionScreening) items.push({ priority: 86, title: 'Complete transmission screening', detail: 'Move the project from a concept request into a studied interconnection path with documented assumptions and mitigations.' });
    if (project.recycledWaterPct < 70 && project.waterDemandGPD > 0) items.push({ priority: 74, title: 'Increase water reuse', detail: 'Target a higher recycled-water fraction and quantify daily make-up demand, source reliability and drought sensitivity.' });
    if (project.waterSource === 'not-set') items.push({ priority: 82, title: 'Identify and document the water source', detail: 'Name the primary and backup sources, expected daily/peak draw and infrastructure needed to deliver them.' });
    if (!project.trafficEmergencyPlan) items.push({ priority: 60, title: 'Finish community and emergency coordination', detail: 'Document traffic, first-responder access, fuel delivery, outage procedures and emergency contacts.' });
    if (!project.siteControl) items.push({ priority: 90, title: 'Secure site control', detail: 'Document ownership, lease, option or other site-control evidence before advancing the large-load request.' });
    if (!project.financialCommitment) items.push({ priority: 89, title: 'Document financial commitment', detail: 'Prepare evidence that the project has meaningful capital support and can fund interconnection and infrastructure obligations.' });
    if (!project.screeningFeeBudgeted) items.push({ priority: 72, title: 'Budget large-load screening costs', detail: 'Reserve the required study and engineering funds so qualification does not stall for administrative reasons.' });
    if (items.length === 0) items.push({ priority: 1, title: 'Prepare the formal engineering submission package', detail: 'The screening model shows no major gaps. Validate all scores with the utility, ERCOT, PUCT counsel and the engineer of record before filing.' });
    return items.sort((a, b) => b.priority - a.priority).slice(0, 7);
  }, [metrics.capacityGap, project]);

  function patch<K extends keyof ProjectState>(key: K, value: ProjectState[K]) {
    setProject((current) => ({ ...current, [key]: value }));
    setSaveNote('');
  }

  function saveProject() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSaveNote('Saved on this device');
    } catch {
      setSaveNote('Could not save on this device');
    }
  }

  function printReport() {
    window.print();
  }

  const tone = scoreTone(metrics.overall);

  return (
    <main style={{ minHeight: '100vh', background: '#EEF2F6', color: '#142033', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        *{box-sizing:border-box} input,select,button{font:inherit} button{cursor:pointer}
        @media(max-width:900px){.gr-hero,.gr-two,.gr-scores{grid-template-columns:1fr!important}.gr-actions{width:100%}.gr-actions>*{flex:1}.gr-top{align-items:flex-start!important}.gr-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
        @media(max-width:560px){.gr-metrics{grid-template-columns:1fr!important}.gr-shell{padding-left:14px!important;padding-right:14px!important}.gr-title{font-size:42px!important}.gr-actions>*{width:100%;flex:auto}.gr-actions{display:grid!important}}
        @media print{.no-print{display:none!important}.print-card{box-shadow:none!important}.gr-shell{max-width:none!important;padding:0!important}body{background:white!important}}
      `}</style>

      <header className="no-print" style={{ background: '#07101D', color: '#F8FAFC', borderBottom: '1px solid #1D2A3D' }}>
        <div className="gr-shell gr-top" style={{ maxWidth: 1280, margin: '0 auto', padding: '15px 22px', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <Link href="/" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON · GRIDREADY</Link>
            <div style={{ color: '#8FA0B7', fontSize: 11, marginTop: 4 }}>AI infrastructure qualification workspace</div>
          </div>
          <div className="gr-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setProject(DEFAULT_PROJECT)} style={topButton}>Load 500 MW Demo</button>
            <button onClick={() => setProject(EMPTY_PROJECT)} style={topButton}>New Project</button>
            <button onClick={saveProject} style={topButton}>{saveNote || 'Save Project'}</button>
            <button onClick={printReport} style={{ ...topButton, background: '#9EF0CF', color: '#06271C', borderColor: '#9EF0CF' }}>Print / PDF</button>
          </div>
        </div>
      </header>

      <section style={{ background: 'linear-gradient(140deg,#081423 0%,#102C40 60%,#0E4B48 100%)', color: '#fff' }}>
        <div className="gr-shell gr-hero" style={{ maxWidth: 1280, margin: '0 auto', padding: '58px 22px 48px', display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)', gap: 30, alignItems: 'center' }}>
          <div>
            <div style={eyebrowDark}>POWER · WATER · STABILITY · COMPLIANCE</div>
            <h1 className="gr-title" style={{ fontSize: 62, lineHeight: .95, letterSpacing: -2.7, margin: '14px 0 18px', maxWidth: 860 }}>Make the data center qualify before it asks the grid to believe it.</h1>
            <p style={{ maxWidth: 780, color: '#C4D1DF', fontSize: 18, lineHeight: 1.65, margin: 0 }}>GridReady screens large-load projects across six readiness layers, exposes the blockers, and turns a speculative megawatt request into a structured engineering action plan.</p>
          </div>
          <article className="print-card" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 22, padding: 22, boxShadow: '0 24px 70px rgba(0,0,0,.22)' }}>
            <div style={eyebrowDark}>GRID READINESS SCORE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}><strong style={{ fontSize: 72, lineHeight: 1 }}>{metrics.overall}</strong><span style={{ color: '#9FB0C5' }}>/ 100</span></div>
            <div style={{ marginTop: 13, display: 'inline-flex', border: `1px solid ${tone.border}`, background: tone.bg, color: tone.text, padding: '7px 10px', borderRadius: 999, fontWeight: 900, fontSize: 12 }}>{scoreLabel(metrics.overall)}</div>
            <div style={{ color: '#AEBED0', lineHeight: 1.55, marginTop: 14, fontSize: 13 }}>Screening score only. Final qualification depends on utility, ERCOT/PUCT, engineering, legal and site-specific review.</div>
          </article>
        </div>
      </section>

      <div className="gr-shell" style={{ maxWidth: 1280, margin: '0 auto', padding: '26px 22px 70px' }}>
        <section className="print-card" style={panel}>
          <div style={sectionHead}><div><div style={eyebrow}>PROJECT</div><h2 style={h2}>Project identity and scale</h2></div><div style={{ color: '#77818E', fontSize: 12 }}>Large-load screening workspace</div></div>
          <div className="gr-two" style={twoCol}>
            <label style={fieldLabel}><span>Project name</span><input value={project.projectName} onChange={(e) => patch('projectName', e.target.value)} style={textInput} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
              <label style={fieldLabel}><span>City</span><input value={project.city} onChange={(e) => patch('city', e.target.value)} style={textInput} /></label>
              <label style={fieldLabel}><span>State</span><input value={project.state} onChange={(e) => patch('state', e.target.value.toUpperCase().slice(0, 2))} style={textInput} /></label>
            </div>
          </div>
        </section>

        <section className="gr-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10, margin: '14px 0' }}>
          <MetricCard label="PEAK LOAD" value={`${project.peakLoadMW.toFixed(0)} MW`} note="Requested campus peak" />
          <MetricCard label="GRID SHARE" value={`${Math.round(metrics.gridShare * 100)}%`} note={`${project.gridImportMW.toFixed(0)} MW grid import cap`} />
          <MetricCard label="COVERAGE" value={`${Math.round(metrics.coverage * 100)}%`} note="Grid + generation + BESS + flexible load" />
          <MetricCard label="BESS DURATION" value={`${metrics.bessHours.toFixed(1)} h`} note={`${project.bessMW.toFixed(0)} MW / ${project.bessMWh.toFixed(0)} MWh`} />
          <MetricCard label="MAKE-UP WATER" value={`${Math.round(metrics.makeupWater).toLocaleString()} GPD`} note={`${project.recycledWaterPct.toFixed(0)}% recycled-water target`} />
        </section>

        <section className="gr-scores" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 9, marginBottom: 14 }}>
          <ScoreCard name="Power" score={metrics.power} detail="Supply coverage, onsite power, storage and flexibility" />
          <ScoreCard name="Stability" score={metrics.stability} detail="VRT, dynamic models and disturbance behavior" />
          <ScoreCard name="Water" score={metrics.water} detail="Source, reuse, backup and cooling demand" />
          <ScoreCard name="Cooling" score={metrics.cooling} detail="Cooling architecture, WUE and heat reuse" />
          <ScoreCard name="Compliance" score={metrics.compliance} detail="Site, finance, screening and regulatory package" />
          <ScoreCard name="Community" score={metrics.community} detail="Noise, emergency traffic and water impact" />
        </section>

        <div className="gr-two" style={{ ...twoCol, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <section className="print-card" style={panel}>
              <div style={eyebrow}>01 · GRIDREADY POWER</div><h2 style={h2}>Build a credible power envelope</h2>
              <div style={inputGrid}>
                <NumberInput label="Peak campus load" value={project.peakLoadMW} onChange={(v) => patch('peakLoadMW', v)} suffix="MW" />
                <NumberInput label="Grid import limit" value={project.gridImportMW} onChange={(v) => patch('gridImportMW', v)} suffix="MW" />
                <NumberInput label="Onsite generation" value={project.onsiteGenerationMW} onChange={(v) => patch('onsiteGenerationMW', v)} suffix="MW" />
                <NumberInput label="Battery discharge" value={project.bessMW} onChange={(v) => patch('bessMW', v)} suffix="MW" />
                <NumberInput label="Battery energy" value={project.bessMWh} onChange={(v) => patch('bessMWh', v)} suffix="MWh" />
                <NumberInput label="Flexible / curtailable load" value={project.flexibleLoadMW} onChange={(v) => patch('flexibleLoadMW', v)} suffix="MW" />
              </div>
              <Check label="Contingency operating plan complete" checked={project.contingencyPlan} onChange={(v) => patch('contingencyPlan', v)} note="Defines behavior during generator, BESS, transformer or grid contingencies." />
              {metrics.capacityGap > 0 ? <div style={warningBox}>⚠ Power plan is short by approximately <strong>{metrics.capacityGap.toFixed(0)} MW</strong> at peak.</div> : <div style={goodBox}>✓ Current modeled resources cover the stated peak on a nameplate basis.</div>}
            </section>

            <section className="print-card" style={panel}>
              <div style={eyebrow}>02 · GRIDREADY STABILITY</div><h2 style={h2}>Prove the load can ride through disturbances</h2>
              <Check label="Voltage ride-through package ready" checked={project.vrtReady} onChange={(v) => patch('vrtReady', v)} />
              <Check label="PSS/E model available" checked={project.psseModel} onChange={(v) => patch('psseModel', v)} />
              <Check label="PSCAD / EMT model available" checked={project.pscadModel} onChange={(v) => patch('pscadModel', v)} />
              <Check label="UPS / inverter / generation equipment models collected" checked={project.equipmentModels} onChange={(v) => patch('equipmentModels', v)} />
              <Check label="Dynamic disturbance study completed" checked={project.disturbanceStudy} onChange={(v) => patch('disturbanceStudy', v)} />
            </section>

            <section className="print-card" style={panel}>
              <div style={eyebrow}>03 · GRIDREADY WATER + COOLING</div><h2 style={h2}>Make water demand defendable</h2>
              <div style={inputGrid}>
                <NumberInput label="Daily water demand" value={project.waterDemandGPD} onChange={(v) => patch('waterDemandGPD', v)} suffix="GPD" step={1000} />
                <NumberInput label="Recycled water target" value={project.recycledWaterPct} onChange={(v) => patch('recycledWaterPct', Math.min(v, 100))} suffix="%" />
                <label style={fieldLabel}><span>Primary water source</span><select value={project.waterSource} onChange={(e) => patch('waterSource', e.target.value as WaterSource)} style={textInput}><option value="not-set">Not identified</option><option value="municipal">Municipal potable</option><option value="reclaimed">Reclaimed / treated wastewater</option><option value="groundwater">Groundwater</option><option value="surface">Surface water</option><option value="onsite">Onsite production / capture</option><option value="mixed">Mixed sources</option></select></label>
                <label style={fieldLabel}><span>Cooling architecture</span><select value={project.coolingType} onChange={(e) => patch('coolingType', e.target.value as CoolingType)} style={textInput}><option value="air">Air cooled</option><option value="closed-loop-liquid">Closed-loop liquid</option><option value="dry">Dry cooling</option><option value="immersion">Immersion</option><option value="evaporative">Evaporative</option><option value="hybrid">Hybrid</option></select></label>
                <NumberInput label="Target WUE" value={project.coolingWUE} onChange={(v) => patch('coolingWUE', v)} suffix="L/kWh" step={0.01} />
              </div>
              <Check label="Backup water / drought plan documented" checked={project.backupWaterPlan} onChange={(v) => patch('backupWaterPlan', v)} />
              <Check label="Heat recovery / beneficial reuse evaluated" checked={project.heatRecovery} onChange={(v) => patch('heatRecovery', v)} />
            </section>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <section className="print-card" style={panel}>
              <div style={eyebrow}>04 · GRIDREADY COMPLIANCE</div><h2 style={h2}>Turn the project into a qualified request</h2>
              <Check label="Site control documented" checked={project.siteControl} onChange={(v) => patch('siteControl', v)} />
              <Check label="Meaningful financial commitment documented" checked={project.financialCommitment} onChange={(v) => patch('financialCommitment', v)} />
              <Check label="Large-load screening / study fee budgeted" checked={project.screeningFeeBudgeted} onChange={(v) => patch('screeningFeeBudgeted', v)} />
              <Check label="Similar / duplicate requests disclosed" checked={project.duplicateRequestDisclosure} onChange={(v) => patch('duplicateRequestDisclosure', v)} />
              <Check label="Transmission screening completed" checked={project.transmissionScreening} onChange={(v) => patch('transmissionScreening', v)} />
              <Check label="PUCT / ERCOT regulatory review completed" checked={project.regulatoryReview} onChange={(v) => patch('regulatoryReview', v)} />
              <Check label="Executable project schedule available" checked={project.executionSchedule} onChange={(v) => patch('executionSchedule', v)} />
            </section>

            <section className="print-card" style={panel}>
              <div style={eyebrow}>05 · GRIDREADY COMMUNITY</div><h2 style={h2}>Remove the local veto points early</h2>
              <Check label="Noise and lighting mitigation plan" checked={project.noisePlan} onChange={(v) => patch('noisePlan', v)} />
              <Check label="Traffic and emergency-response plan" checked={project.trafficEmergencyPlan} onChange={(v) => patch('trafficEmergencyPlan', v)} />
              <Check label="Local water-impact narrative and mitigation" checked={project.communityWaterPlan} onChange={(v) => patch('communityWaterPlan', v)} />
            </section>

            <section className="print-card" style={{ ...panel, background: '#07101D', color: '#fff', borderColor: '#07101D' }}>
              <div style={eyebrowDark}>PRIORITY ACTION QUEUE</div><h2 style={{ ...h2, color: '#fff' }}>What blocks this project next</h2>
              <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
                {recommendations.map((item, index) => (
                  <article key={item.title} style={{ background: '#111E30', border: '1px solid #263A55', borderRadius: 13, padding: 13 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ width: 27, height: 27, borderRadius: 8, display: 'grid', placeItems: 'center', background: index < 3 ? '#9EF0CF' : '#D9E4F2', color: '#07130F', fontWeight: 950, flex: '0 0 auto' }}>{index + 1}</span><div><strong>{item.title}</strong><div style={{ color: '#B5C2D2', fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{item.detail}</div></div></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="print-card" style={{ ...panel, marginTop: 14 }}>
          <div style={sectionHead}><div><div style={eyebrow}>GRIDREADY OUTPUT</div><h2 style={h2}>Qualification packet snapshot</h2></div><div style={{ ...scorePill, background: tone.bg, color: tone.text, borderColor: tone.border }}>{metrics.overall}/100 · {scoreLabel(metrics.overall)}</div></div>
          <div className="gr-two" style={twoCol}>
            <div style={summaryBox}><strong>Power envelope</strong><p>{project.peakLoadMW.toFixed(0)} MW peak, {project.gridImportMW.toFixed(0)} MW grid cap, {project.onsiteGenerationMW.toFixed(0)} MW onsite generation, {project.bessMW.toFixed(0)} MW / {project.bessMWh.toFixed(0)} MWh BESS, and {project.flexibleLoadMW.toFixed(0)} MW flexible load.</p></div>
            <div style={summaryBox}><strong>Water envelope</strong><p>{project.waterDemandGPD.toLocaleString()} GPD gross demand, {project.recycledWaterPct.toFixed(0)}% reuse target, approximately {Math.round(metrics.makeupWater).toLocaleString()} GPD make-up water, source: {project.waterSource.replaceAll('-', ' ')}.</p></div>
            <div style={summaryBox}><strong>Stability package</strong><p>{[project.vrtReady && 'VRT', project.psseModel && 'PSS/E', project.pscadModel && 'PSCAD', project.equipmentModels && 'equipment models', project.disturbanceStudy && 'disturbance study'].filter(Boolean).join(', ') || 'No stability artifacts marked complete yet.'}</p></div>
            <div style={summaryBox}><strong>Submission posture</strong><p>{project.transmissionScreening ? 'Transmission screening marked complete.' : 'Transmission screening remains open.'} {project.siteControl && project.financialCommitment ? 'Site control and financial commitment are documented.' : 'Core qualification evidence still needs work.'}</p></div>
          </div>
        </section>

        <footer style={{ padding: '24px 4px 0', color: '#76808D', fontSize: 11, lineHeight: 1.55 }}>Aridon GridReady is a planning and pre-qualification tool. It does not certify ERCOT, PUCT, utility, engineering, environmental, legal or financing compliance. Project teams should validate all requirements against current rules and the applicable transmission/distribution service provider.</footer>
      </div>
    </main>
  );
}

const panel = { background: '#fff', border: '1px solid #D7DEE6', borderRadius: 18, padding: 20, boxShadow: '0 8px 26px rgba(21,36,56,.05)' } as const;
const sectionHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' } as const;
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 } as const;
const inputGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, margin: '14px 0' } as const;
const eyebrow = { fontSize: 11, fontWeight: 950, letterSpacing: 1.3, color: '#0B6D53' } as const;
const eyebrowDark = { fontSize: 11, fontWeight: 950, letterSpacing: 1.3, color: '#9EF0CF' } as const;
const h2 = { fontSize: 28, letterSpacing: -1, margin: '6px 0 10px' } as const;
const fieldLabel = { display: 'grid', gap: 6, fontSize: 12, fontWeight: 850, color: '#465163' } as const;
const inputShell = { minHeight: 42, border: '1px solid #CBD4DF', background: '#F8FAFC', borderRadius: 10, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8 } as const;
const numberInput = { width: '100%', border: 0, outline: 0, background: 'transparent', color: '#142033', fontWeight: 800 } as const;
const textInput = { width: '100%', minHeight: 42, border: '1px solid #CBD4DF', background: '#F8FAFC', borderRadius: 10, padding: '0 11px', color: '#142033', fontWeight: 750, outline: 0 } as const;
const checkRow = { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderTop: '1px solid #EDF0F4', fontSize: 13, lineHeight: 1.35 } as const;
const metricCard = { background: '#fff', border: '1px solid #D7DEE6', borderRadius: 14, padding: 15 } as const;
const scoreCard = { border: '1px solid', borderRadius: 14, padding: 14 } as const;
const warningBox = { background: '#FFF2D6', border: '1px solid #E8C56E', borderRadius: 11, padding: 11, color: '#744F00', fontSize: 13, marginTop: 10 } as const;
const goodBox = { background: '#E4F8EE', border: '1px solid #91D4B5', borderRadius: 11, padding: 11, color: '#155E45', fontSize: 13, marginTop: 10 } as const;
const topButton = { border: '1px solid #34445C', background: '#101D2D', color: '#F4F7FB', borderRadius: 9, padding: '9px 12px', fontWeight: 900, fontSize: 12 } as const;
const scorePill = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontWeight: 900, fontSize: 12 } as const;
const summaryBox = { background: '#F7F9FB', border: '1px solid #E0E6ED', borderRadius: 12, padding: 14, lineHeight: 1.55, fontSize: 13 } as const;
