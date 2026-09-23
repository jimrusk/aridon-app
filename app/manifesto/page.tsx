import Link from 'next/link';

export const metadata = {
  title: 'The Missing Middle — Aridon',
  description:
    'Everyone in food-as-medicine agrees on the prescription. Almost nobody has built the pharmacy. The missing middle is the unglamorous layer between the farm and the patient, and it is the entire ballgame.',
};

const sections: [string, string[]][] = [
  [
    'The problem was never demand. It is plumbing.',
    [
      'Healthcare knows what to prescribe. Patients want the food. Farmers can grow it. What does not exist is the connective tissue: someone to aggregate from dozens of small regenerative producers, verify what is actually in the food, move it cold and fast, keep records that satisfy an underwriter, and settle payment without waiting on a grant cycle.',
      'Every food-as-medicine pilot that has quietly died died in the middle. Not for lack of belief. For lack of infrastructure.',
    ],
  ],
  [
    'Nutrient density is a specification, not a slogan.',
    [
      'Here is the standard we are holding: if it is not tested, it is not nutrient-dense. It is a claim.',
      'The regenerative movement has spent years arguing about practices. Practices matter, but practices are inputs. Patients and health plans need outputs: measured nutrient density, lot by lot, with a paper trail. That means testing. It means a quality spec the way every other serious supply chain has one. And it means paying farmers for what is in the food, which finally gives the best growers a price signal instead of a pat on the back.',
      'When a farmer can prove density, two things unlock. First, premium payment tied to something real. Second, data: a production and soil record that a lender can underwrite and an insurer can price. That is how a good farmer gets credit, and how this stops depending on grants.',
    ],
  ],
  [
    'The middle layer looks like this.',
    [
      'Regional aggregation built for health, not commodities. Food safety and nutrient testing at intake. Cold chain from farm gate to patient door. Records that are lender-ready and insurer-ready from day one. Produce prescriptions fulfilled with the reliability of a pharmacy benefit, because patients cannot eat good intentions.',
      'None of this is glamorous. All of it is the reason the movement stalls.',
    ],
  ],
  [
    'Start in the Four States. Prove it. Replicate it.',
    [
      'We are starting where we are: Kansas, Missouri, Oklahoma, and Arkansas. Real farms, real patients, real prescriptions, real data. One region done properly teaches more than five regions done thinly. The model is designed to replicate: the middle layer is a playbook, and every region gets its own.',
    ],
  ],
  [
    'Why we can build this.',
    [
      'Aridon is building the infrastructure underneath the middle layer. Our Farm OS, now in development, will keep the records: provenance, testing, chain of custody, the data package a lender or insurer needs. Our AWG 30K water technology, also in development, pulls water from air for farms in regions where water is the constraint. Our Iron Grid energy systems are being designed to keep it all running where the grid is thin or expensive. And the Southwest Technology Campus in Farmington, New Mexico is where we will prove it all working together before we ask anyone to bet on it.',
      'We are early. Our first pilot deployment is ahead of us, not behind us, and we will not pretend otherwise. What we have is the thesis, the technology path, and the region. We are looking for the farmers, the clinicians, the funders, and the operators who want to build the middle with us.',
    ],
  ],
  [
    'The future of healthcare has a loading dock.',
    [
      '"Food is medicine" is a slogan. A pharmacy is infrastructure. Prescriptions do not fill themselves, farmers cannot aggregate themselves, and nutrient density does not verify itself. Someone has to build the layer in between.',
      'We are building it. Join us.',
    ],
  ],
];

export default function ManifestoPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f4f1e8',
        color: '#18251d',
        fontFamily: 'Arial,sans-serif',
      }}
    >
      <header style={{ background: '#123b2a', color: '#fff', padding: '15px 18px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>ARIDON</strong> · MANIFESTO
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <Link href="/ag/farm-to-health" style={{ color: '#d8eadb', textDecoration: 'none', fontWeight: 850 }}>
              Farm-to-Health
            </Link>
            <Link href="/ag" style={{ color: '#d8eadb', textDecoration: 'none', fontWeight: 850 }}>
              Ag OS
            </Link>
          </div>
        </div>
      </header>

      <section
        style={{
          background: 'linear-gradient(135deg,#123b2a,#386c45)',
          color: '#fff',
          padding: '72px 18px 60px',
        }}
      >
        <div style={{ maxWidth: 860, margin: 'auto' }}>
          <div style={{ color: '#c8e2ac', fontSize: 12, fontWeight: 950, letterSpacing: 1.2 }}>
            A POINT OF VIEW
          </div>
          <h1
            style={{
              fontSize: 'clamp(44px,7vw,76px)',
              lineHeight: 0.95,
              letterSpacing: -2.4,
              margin: '12px 0 18px',
            }}
          >
            The Missing Middle
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.6, color: '#e1eee4', maxWidth: 640 }}>
            Why food-as-medicine keeps failing, and what we&apos;re building instead.
          </p>
        </div>
      </section>

      <article
        style={{
          maxWidth: 860,
          margin: 'auto',
          padding: '44px 18px 30px',
          fontSize: 18,
          lineHeight: 1.75,
        }}
      >
        <p>
          Everyone in food-as-medicine agrees on the prescription. Almost nobody has built the
          pharmacy.
        </p>
        <p>
          On one end of this movement: doctors, health plans, and community programs writing
          produce prescriptions. On the other end: regenerative farmers growing the most
          nutrient-dense food in America. Between them sits nothing. No aggregation. No
          verification worth trusting. No cold chain built for this purpose. No records a lender
          or insurer would accept. No rails for a prescription to clear the way a drug
          prescription does.
        </p>
        <p>
          So the money flows around the very farmers it was meant to reach. Pilots buy from
          broadline distributors and call it local. &ldquo;Nutrient-dense&rdquo; is a label, not a
          lab result. And the farmer growing genuinely exceptional food three counties away
          cannot get into the program at all, because there is no door.
        </p>
        <p>
          This is the missing middle. It is the unglamorous layer between the farm and the
          patient, and it is the entire ballgame. We are building it.
        </p>

        {sections.map(([heading, paragraphs]) => (
          <section key={heading} style={{ marginTop: 40 }}>
            <h2
              style={{
                fontSize: 26,
                letterSpacing: -0.6,
                color: '#123b2a',
                marginBottom: 12,
              }}
            >
              {heading}
            </h2>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid #d8dfd5',
          }}
        >
          <p style={{ fontWeight: 850 }}>— Jim Rusk, Aridon</p>
          <p style={{ fontStyle: 'italic', color: '#5a675f', fontSize: 16 }}>
            The &ldquo;missing middle&rdquo; framing at the heart of this piece was developed with
            Bethany.
          </p>
        </div>
      </article>

      <section style={{ maxWidth: 860, margin: 'auto', padding: '0 18px 70px' }}>
        <div
          style={{
            background: '#123b2a',
            color: '#fff',
            borderRadius: 18,
            padding: 28,
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong style={{ fontSize: 20 }}>Building the middle with us?</strong>
            <div style={{ color: '#c8e2ac', marginTop: 6 }}>
              Farmers, clinicians, funders, operators: let&apos;s talk.
            </div>
          </div>
          <Link
            href="/ag/farm-to-health"
            style={{
              background: '#fff',
              color: '#123b2a',
              fontWeight: 900,
              padding: '12px 20px',
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            See the Farm-to-Health Network
          </Link>
        </div>
      </section>
    </main>
  );
}
