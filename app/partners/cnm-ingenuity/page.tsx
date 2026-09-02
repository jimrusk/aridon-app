import Link from 'next/link';
import type { CSSProperties } from 'react';
import { cnmModules, cnmSources } from '../../../lib/cnmIngenuityCurriculum';

const card: CSSProperties = { background: '#0D1728', border: '1px solid #2B3D5B', borderRadius: 18, padding: 18 };
const primary: CSSProperties = { display: 'inline-block', background: '#20A6D8', color: '#06131B', textDecoration: 'none', borderRadius: 11, padding: '12px 15px', fontWeight: 950 };
const outline: CSSProperties = { display: 'inline-block', border: '1px solid #526982', color: '#EDF3FA', textDecoration: 'none', borderRadius: 11, padding: '11px 14px', fontWeight: 900 };

export default function CnmIngenuityPartnerPage() {
  const learnerFlow = [
    ['1 · Discover', 'A prospective learner answers a few questions about interests, experience and career goals.'],
    ['2 · Sample', 'The AI teacher recommends a short lesson from a real CNM Ingenuity program area instead of making the learner browse a long catalog alone.'],
    ['3 · Practice', 'The learner asks questions, speaks to the tutor, completes a small exercise and gets a quick check for understanding.'],
    ['4 · Route', 'When the learner is ready, the system points them back to the appropriate CNM Ingenuity program, funding resources or human advisor.'],
  ];

  const operatingValue = [
    ['Program discovery', 'Turn a broad training catalog into a guided conversation that helps prospective students find the right starting point.'],
    ['24/7 sample lessons', 'Let people experience the teaching style and subject matter before deciding whether to enroll.'],
    ['Adaptive explanations', 'Explain the same concept differently to a beginner, career changer or experienced worker without changing the underlying learning objective.'],
    ['Voice practice', 'Let students ask spoken questions and practice communication-oriented lessons through a conversational interface.'],
    ['Knowledge checks', 'Add low-stakes quizzes and coaching so the learner does something with the concept instead of only reading a program description.'],
    ['Human handoff', 'Keep instructors, advisors and labs in control by routing enrollment, high-stakes questions, certification and hands-on instruction to people.'],
    ['Interest intelligence', 'Aggregate anonymous topic demand and common questions so CNM can see what prospective learners are trying to understand before enrollment.'],
    ['Workforce customization', 'Use the same engine for employer-specific training pathways when CNM Ingenuity builds customized workforce programs.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 950 }}>ARIDON · EDUCATION PARTNER LAB</div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <a href="https://www.cnmingenuity.org/training-programs/" target="_blank" rel="noreferrer" style={outline}>CNM Programs</a>
            <Link href="/partners/cnm-ingenuity/teacher" style={primary}>Open AI Teacher</Link>
          </div>
        </nav>

        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(280px,.8fr)', gap: 28, alignItems: 'center', paddingTop: 58 }}>
          <div>
            <div style={{ color: '#20A6D8', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>CNM INGENUITY + ARIDON · PROPOSED AI LEARNING EXPERIENCE</div>
            <h1 style={{ fontSize: 'clamp(50px,8vw,88px)', lineHeight: .92, letterSpacing: -4, margin: '14px 0 20px' }}>Don’t just show potential students a course. Let them try the skill.</h1>
            <p style={{ color: '#BBC7D8', fontSize: 20, lineHeight: 1.68, maxWidth: 880 }}>CNM Ingenuity already offers accelerated workforce training across technology, business, trades and emerging industries. This prototype adds a conversational front door: an AI teacher that gives a five-minute taste of a program, adapts to the learner and then routes the person into the real CNM experience.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <Link href="/partners/cnm-ingenuity/teacher" style={primary}>Try a 5-Minute Lesson</Link>
              <a href="https://www.cnmingenuity.org/funding-resources/" target="_blank" rel="noreferrer" style={outline}>Explore Funding Resources</a>
            </div>
          </div>

          <aside style={{ ...card, background: 'radial-gradient(circle at 50% 18%,#12465B 0,#102239 46%,#0A1524 100%)' }}>
            <div style={{ width: 156, height: 156, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 18px', border: '1px solid #2D7FA0', background: '#0A2633', fontSize: 48, fontWeight: 950, color: '#8FE6C4' }}>AI</div>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: 23 }}>Future Skills Guide</strong>
              <p style={{ color: '#B9C7D6', lineHeight: 1.55, fontSize: 13 }}>A neutral Aridon teaching avatar for the prototype. CNM could later choose its own approved visual identity, voices, instructors, curriculum sources and student-data rules.</p>
            </div>
          </aside>
        </div>
      </section>

      <section style={{ background: '#F3F7F8', color: '#10202A', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#176D8B' }}>THE EXPERIENCE</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 24px' }}>From “What should I take?” to “I just learned something.”</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 11 }}>
            {learnerFlow.map(([name, detail]) => (
              <article key={name} style={{ background: '#fff', border: '1px solid #D4E0E4', borderRadius: 16, padding: 18 }}>
                <strong style={{ fontSize: 20 }}>{name}</strong>
                <p style={{ color: '#53656D', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ color: '#8FE6C4', fontSize: 12, fontWeight: 950 }}>LIVE SAMPLE CURRICULUM</div>
        <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 22px' }}>One teacher. Different doors into the CNM Ingenuity catalog.</h2>
        <p style={{ color: '#AEBBD0', lineHeight: 1.65, fontSize: 17, maxWidth: 880 }}>The prototype uses public CNM Ingenuity program descriptions as the source boundary. The lesson is intentionally a sampler, not a copy of CNM course materials.</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
          {cnmModules.map((module, index) => (
            <article key={module.id} style={{ ...card, display: 'grid', gridTemplateColumns: '54px minmax(0,1fr)', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#20A6D8', color: '#06131B', fontWeight: 950 }}>{index + 1}</div>
              <div>
                <strong style={{ fontSize: 21 }}>{module.title}</strong>
                <p style={{ color: '#AEBBD0', lineHeight: 1.55, margin: '5px 0 8px' }}>{module.promise}</p>
                <div style={{ color: '#8FE6C4', fontSize: 13 }}><strong>Interactive extension:</strong> {module.aridonExtension}</div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 20 }}><Link href="/partners/cnm-ingenuity/teacher" style={primary}>Launch the Teaching Studio</Link></div>
      </section>

      <section style={{ background: '#0D1728', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#20A6D8', fontSize: 12, fontWeight: 950 }}>WHY THIS COULD MATTER TO CNM INGENUITY</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 24px' }}>Use AI to widen the front door, not replace the classroom.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 11 }}>
            {operatingValue.map(([name, detail]) => (
              <article key={name} style={card}>
                <strong style={{ color: '#8FE6C4', fontSize: 19 }}>{name}</strong>
                <p style={{ color: '#C1CCDC', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#F3F7F8', color: '#10202A', padding: '72px 20px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#176D8B' }}>PILOT IDEA</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 18px' }}>Start with one pathway and measure whether more learners reach the right program.</h2>
          <p style={{ color: '#53656D', lineHeight: 1.72, fontSize: 17 }}>A practical pilot could start with AI Ready or one Deep Dive technology pathway. CNM supplies the approved learning objectives, source materials, brand rules and enrollment handoff. Aridon supplies the conversational teacher, adaptive practice, source controls and analytics. Measure lesson starts, completion, questions asked, program-page clicks, advisor handoffs and enrollment conversion. If it works, expand the same engine across the catalog.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/partners/cnm-ingenuity/teacher" style={{ ...primary, background: '#10202A', color: '#fff' }}>Try the Prototype</Link>
            <a href="https://www.cnmingenuity.org/program/ai-ready/" target="_blank" rel="noreferrer" style={{ ...outline, borderColor: '#64777F', color: '#10202A' }}>See CNM AI Ready</a>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '52px 20px 76px' }}>
        <p style={{ color: '#8392A9', fontSize: 12, lineHeight: 1.6 }}>This is an independent Aridon partnership prototype. It is not an official CNM Ingenuity product and does not imply endorsement or affiliation. Public program descriptions are summarized only to demonstrate how an approved curriculum could be delivered through a conversational interface. Proprietary curriculum, assessments, student records, instructor likenesses and official branding should only be connected with CNM authorization.</p>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: '#20A6D8', fontWeight: 900 }}>Public CNM Ingenuity sources used for the prototype</summary>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{cnmSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#C8D5E6', lineHeight: 1.5 }}>{source.title} · {source.note}</a>)}</div>
        </details>
      </section>

      <style>{`@media(max-width:820px){.hero-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
