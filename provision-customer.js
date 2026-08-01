// ═══════════════════════════════════════════════════════════════════
//  Aridon Customer Provisioner
//  Creates a fresh Aridon site for a new customer on Vercel.
//
//  What it does:
//    1. Prompts for customer details
//    2. Creates a new Vercel project from the same codebase
//    3. Sets the customer's own API keys and Supabase credentials
//    4. Deploys — customer gets their own URL
//
//  Run: node provision-customer.js
// ═══════════════════════════════════════════════════════════════════

const readline = require('readline');
const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', encoding: 'utf8' });
  } catch (e) {
    if (opts.silent) return null;
    throw e;
  }
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   Aridon Customer Provisioner            ║');
  console.log('  ║   Sets up a fresh Aridon site            ║');
  console.log('  ╚══════════════════════════════════════════╝\n');

  // ── Step 1: Customer details ────────────────────────────────────────
  console.log('  Step 1 of 4 — Customer Details\n');
  const companyName  = await ask('  Company name (e.g. "Mesa Solar Group"): ');
  const adminEmail   = await ask('  Admin email (they will get the first login): ');
  const customDomain = await ask('  Custom domain? (leave blank to skip, e.g. aridon.mesasolar.com): ');
  const projectSlug  = 'aridon-' + slug(companyName);

  console.log(`\n  Project slug: ${projectSlug}`);
  const confirm = await ask('  Looks good? (y/n): ');
  if (confirm.toLowerCase() !== 'y') { console.log('  Cancelled.'); rl.close(); return; }

  // ── Step 2: API Keys ─────────────────────────────────────────────────
  console.log('\n  Step 2 of 4 — API Keys\n');
  console.log('  You need three things from this customer\'s Supabase project:');
  console.log('  → supabase.com → their project → Settings → API\n');

  const supabaseUrl  = await ask('  Supabase Project URL (https://xxx.supabase.co): ');
  const supabaseAnon = await ask('  Supabase Publishable key (sb_publishable_...): ');
  const supabaseSvc  = await ask('  Supabase Service Role key (sb_secret_...): ');

  console.log('\n  Other keys (leave blank to copy from YOUR current .env.production):');
  let openaiKey = await ask('  OpenAI API key (or blank to reuse yours): ');
  let didKey    = await ask('  D-ID API key (or blank to reuse yours): ');

  // Read fallbacks from current .env.production
  const envPath = path.join(__dirname, '.env.production');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    if (!openaiKey) { const m = env.match(/OPENAI_API_KEY=(.+)/); if (m) openaiKey = m[1].trim(); }
    if (!didKey)    { const m = env.match(/DID_API_KEY=(.+)/);    if (m) didKey    = m[1].trim(); }
  }

  // ── Step 3: Create env file + deploy ────────────────────────────────
  console.log('\n  Step 3 of 4 — Deploying to Vercel\n');

  // Write a temporary .env file for this deployment
  const tempEnv = [
    `DID_API_KEY=${didKey}`,
    `OPENAI_API_KEY=${openaiKey}`,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnon}`,
    `SUPABASE_SERVICE_ROLE_KEY=${supabaseSvc}`,
    `NEXT_PUBLIC_SITE_URL=https://${projectSlug}.vercel.app`,
  ].join('\n');

  const tempEnvPath = path.join(__dirname, `.env.${projectSlug}`);
  fs.writeFileSync(tempEnvPath, tempEnv);

  // Backup current .env.production and swap in customer env
  const backup = fs.readFileSync(envPath, 'utf8');
  fs.writeFileSync(envPath, tempEnv);

  console.log(`  Creating Vercel project: ${projectSlug}`);
  console.log('  (This may take 2–3 minutes)\n');

  let deployUrl = '';
  try {
    const result = run(
      `vercel --prod --yes --archive=tgz --name=${projectSlug}`,
      { silent: true }
    );
    // Extract production URL from output
    const lines = (result || '').split('\n');
    for (const line of lines) {
      if (line.includes('https://') && line.includes(projectSlug)) {
        deployUrl = line.trim();
        break;
      }
    }
    if (!deployUrl) deployUrl = `https://${projectSlug}.vercel.app`;
    console.log(`  ✓ Deployed to: ${deployUrl}`);
  } catch (e) {
    console.error('  ✗ Vercel deploy failed. Check your Vercel login and try again.');
  } finally {
    // Restore original .env.production
    fs.writeFileSync(envPath, backup);
    fs.unlinkSync(tempEnvPath);
  }

  // ── Step 4: Schema + first user reminder ──────────────────────────────
  console.log('\n  Step 4 of 4 — Final Setup (manual steps for customer)\n');
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log(`  │  Customer: ${companyName.padEnd(46)}│`);
  console.log(`  │  URL:      ${(deployUrl||'—').padEnd(46)}│`);
  console.log(`  │  Admin:    ${adminEmail.padEnd(46)}│`);
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log('\n  NEXT STEPS (do these in order):\n');
  console.log('  1. Go to their Supabase project → SQL Editor → run supabase-schema.sql');
  console.log('     (this creates the leads, projects, tasks, knowledge_vault tables)\n');
  console.log('  2. In Supabase → Authentication → Users → Invite a user\n');
  console.log(`     Email: ${adminEmail}`);
  console.log('     After they accept, go to their user → Edit → user_metadata → set role: "admin"\n');
  console.log(`  3. Send the customer their URL: ${deployUrl||projectSlug+'.vercel.app'}\n`);

  if (customDomain) {
    console.log(`  4. Custom domain: Go to vercel.com → ${projectSlug} → Settings → Domains`);
    console.log(`     Add: ${customDomain}\n`);
  }

  // Save a record
  const logPath = path.join(__dirname, 'customers.log');
  const logEntry = `${new Date().toISOString()} | ${companyName} | ${adminEmail} | ${deployUrl||projectSlug} | ${supabaseUrl}\n`;
  fs.appendFileSync(logPath, logEntry);
  console.log('  ✓ Customer record saved to customers.log\n');

  rl.close();
}

main().catch(e => { console.error(e.message); rl.close(); });
