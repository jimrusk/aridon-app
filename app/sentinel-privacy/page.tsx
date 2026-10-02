import Link from 'next/link';

const wrap = {minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif'} as const;
const sec = {maxWidth:860,margin:'0 auto',padding:'32px 20px 72px'} as const;
const p = {color:'#B8C4D5',fontSize:16,lineHeight:1.7} as const;
const h2 = {fontSize:22,margin:'28px 0 10px'} as const;

export default function SentinelPrivacyPage(){return <main style={wrap}>
<section style={sec}>
<nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:40}}><Link href="/" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>ARIDON</Link><Link href="/sentinel-demo" style={{color:'#D8E2EF',textDecoration:'none',fontWeight:900}}>Sentinel</Link></nav>
<div style={{color:'#ffb45e',fontSize:12,fontWeight:950,letterSpacing:1}}>PRIVACY POLICY</div>
<h1 style={{fontSize:'clamp(36px,5vw,54px)',letterSpacing:-2,margin:'12px 0 8px'}}>Sentinel Mobile privacy policy</h1>
<p style={p}>Effective October 2, 2026. Aridon LLC ("we") makes Sentinel Mobile, pre-security for AI agents and everyday browsing.</p>

<h2 style={h2}>What the app does on your device</h2>
<p style={p}>When you tap "Protect this device," the app uses Android's VPN framework to see the domain names your device looks up (DNS queries). It checks each name against your blocklist and a built-in allowlist of banks, email providers, and payment services, blocks what you told it to block, and shows you the activity in the app. Your other internet traffic is not routed through the app and is not inspected.</p>

<h2 style={h2}>What we collect</h2>
<p style={p}><strong>Nothing leaves your device.</strong> DNS lookups, your blocklist, and the activity log stay on your phone. We run no accounts, no analytics SDKs, no advertising, and no cloud backend for the app. If you email us for support, we see whatever you put in that email.</p>

<h2 style={h2}>What we share</h2>
<p style={p}>Nothing. There is no data to share because none is collected.</p>

<h2 style={h2}>Permissions</h2>
<p style={p}>The app requests the VPN permission (to filter domain lookups), internet access (to resolve allowed lookups), and the foreground-service permission (to keep protection running with a visible notification you can stop anytime).</p>

<h2 style={h2}>Children</h2>
<p style={p}>The app is a general-audience utility and is not directed at children under 13.</p>

<h2 style={h2}>Changes</h2>
<p style={p}>If this policy changes, the new version will be posted here with a new effective date.</p>

<h2 style={h2}>Contact</h2>
<p style={p}>Aridon LLC — privacy questions: <a href="mailto:jimrusk66@gmail.com" style={{color:'#ffb45e'}}>jimrusk66@gmail.com</a></p>
</section></main>}
