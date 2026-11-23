import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Your Bank Just Told You You're On Your Own. Believe Them. | Aridon",
  description:
    'A call to action from Jim Rusk, Founder and CEO of Aridon: seven big banks rewrote their customer agreements to push AI agent losses onto customers. Move your money to a local bank or credit union, and get protected before the action runs.',
};

export default function YourBankPage() {
  return (
    <main style={page}>
      <article style={shell}>
        <header>
          <div style={eyebrow}>ARIDON · FROM THE CEO</div>
          <h1 style={h1}>Your Bank Just Told You You&rsquo;re On Your Own. Believe Them.</h1>
          <p style={byline}>A call to action from Jim Rusk, Founder and CEO of Aridon</p>
        </header>

        <div style={body}>
          <p style={para}>
            I am Jim Rusk, founder and CEO of Aridon. I am writing this because somebody in this industry needs to say it plainly, and the big banks just made it easy.
          </p>

          <p style={para}>
            In the last ninety days, seven of the biggest banks in America quietly rewrote their customer agreements. Citi. JPMorgan. Bank of America. PNC. Ally. Citizens. And Wells Fargo, whose new Section 15 takes effect tomorrow, November 24. The language differs. The meaning does not. If an AI agent acting on your account loses your money, that loss is yours. Wells Fargo says it in so many words: the bank does not monitor, screen, or review what your agent does. Your agent&rsquo;s actions are deemed to be yours. At your own risk.
          </p>

          <p style={para}>
            Read that again. The bank holds your money. The bank built the app your agent connects to. The bank profits from every transaction that moves through it. And when the newest risk in banking arrived, the bank&rsquo;s answer was not to protect you. It was to hire lawyers and rewrite the contract so it never has to.
          </p>

          <p style={para}>
            So here is my answer, and I mean it as a call to action, not a complaint.
          </p>

          <p style={standout}>If you don&rsquo;t want to protect us, you don&rsquo;t need our money.</p>

          <p style={para}>
            Move your money. Not in anger. In order. Move it to a local bank or a local credit union, where you can get the CEO on the phone, where a human being has to look you in the eye, and where your deposit actually matters to the institution holding it. The big banks are counting on you never doing the math, on the hassle of switching being worth more to you than your own protection. Do the math. Your money counts. What you say counts. It is time they heard both.
          </p>

          <p style={para}>
            And when you land at that local bank or credit union, ask them one question: what checks an AI agent&rsquo;s action before it runs on my account? If the answer is nothing, and today it almost always is, tell them to call us. A local bank can be protected. It can offer its customers the one thing the giants just refused to offer theirs. That is not a weakness for a small bank. That is how a small bank wins.
          </p>

          <p style={para}>
            Because here is what nobody in this industry wants to say out loud. Almost everything sold as AI security today is post-protection. It watches the damage happen, logs it beautifully, and sends you an alert after your money is already gone. That is not protection. That is a witness.
          </p>

          <p style={para}>
            Sentinel is pre-protection. It screens every action an agent attempts before the action runs. Every agent. Every connection. No exceptions for the ones carrying the right credential. Money moves, purchases, messages, sign-ups, data leaving your accounts: checked first, executed second, and the consequential ones held for a human yes. I will make this claim plainly, because it is true: we are the only company in the world doing this, an independent check that stands before the action, not owned by the platforms whose agents need watching. The watchdog never belongs to the watched.
          </p>

          <p style={para}>
            Now the practical part, and do this first. If your information was caught in one of this year&rsquo;s breaches or hacks, and after this year you should assume it was, contact the credit bureaus today: Equifax, Experian, and TransUnion. Place a freeze or a fraud alert on your file and start that process. It is free, it is your right, and it stops a stolen identity from becoming a stolen life while you do everything else.
          </p>

          <p style={para}>
            Then protect yourself, because the bank just told you it won&rsquo;t. We built Sentinel for everyday customers for exactly this moment: a 2-week trial, then $150 setup and $50 a month if you stay. And get your local bank protected too. Walk in. Ask the question. Tell them a small company in New Mexico will put the check in front of their agents&rsquo; actions and prove it in their own environment.
          </p>

          <p style={para}>
            Seven banks just told you, in writing, that you are on your own. Believe them. Then act like it: freeze your file, protect yourself, and move your money to an institution that will stand in front of the action with you.
          </p>

          <p style={para}>That is the stance. The rest is up to all of us.</p>
        </div>

        <footer style={signature}>
          <div>Jim Rusk</div>
          <div>Founder and CEO, Triple R Restoration, LLC dba Aridon</div>
          <div>La Plata, New Mexico</div>
        </footer>

        <div style={{ marginTop: 34 }}>
          <Link href="/" style={navLink}>Back to Aridon</Link>
        </div>
      </article>
    </main>
  );
}

const page = { minHeight: '100vh', background: '#F2F0E9', color: '#171717', fontFamily: 'Arial, sans-serif', padding: '40px 18px 90px' };
const shell = { maxWidth: 760, margin: '0 auto' };
const eyebrow = { color: '#24604E', fontWeight: 950, fontSize: 12, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(36px,6.5vw,58px)', lineHeight: 1.02, margin: '12px 0 14px', letterSpacing: -1.5 };
const byline = { color: '#55564F', fontSize: 18, lineHeight: 1.5, fontWeight: 700, margin: '0 0 8px' };
const body = { marginTop: 22 };
const para = { fontSize: 18, lineHeight: 1.75, color: '#26261F', margin: '0 0 22px' };
const standout = { fontSize: 24, lineHeight: 1.45, fontWeight: 900, color: '#171717', borderLeft: '4px solid #24604E', paddingLeft: 16, margin: '0 0 22px' };
const signature = { marginTop: 34, borderTop: '1px solid #D2CEC3', paddingTop: 20, fontSize: 17, lineHeight: 1.6, fontWeight: 700, color: '#171717' };
const navLink = { border: '1px solid #AAA79E', color: '#171717', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850, display: 'inline-block' };
