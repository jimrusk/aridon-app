// Aridon - Push to GitHub via API (no git required)
const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) { return new Promise(r => rl.question(q, r)); }

function apiCall(method, endpoint, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'aridon-setup',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch(e) { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function getFiles(dir, base) {
  const SKIP = new Set(['node_modules','.git','.next','push-to-github.js','push-to-github.bat','setup-github.bat','setup-github.ps1']);
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel  = path.relative(base, full).replace(/\\/g, '/');
    if (entry.isDirectory()) out = out.concat(getFiles(full, base));
    else out.push({ full, rel });
  }
  return out;
}

async function main() {
  console.log('\n========================================');
  console.log('  ARIDON - GitHub Push (via API)');
  console.log('========================================\n');
  console.log('You need a GitHub Personal Access Token.');
  console.log('Create one at: https://github.com/settings/tokens/new');
  console.log('  - Note: "aridon-setup"');
  console.log('  - Expiration: 30 days');
  console.log('  - Scopes: check "repo"\n');

  const token    = await ask('Paste your GitHub PAT: ');
  const username = await ask('Your GitHub username:   ');

  if (!token.trim() || !username.trim()) {
    console.log('\nBoth fields required. Exiting.'); rl.close(); return;
  }

  // 1. Create repo
  console.log('\nCreating repo "aridon-app"...');
  const cr = await apiCall('POST', '/user/repos', token.trim(), {
    name: 'aridon-app',
    description: 'Aridon v0.2 - AI Executive Operating System',
    private: false,
    auto_init: false
  });

  if (cr.status === 201) {
    console.log('Repo created: https://github.com/' + username.trim() + '/aridon-app');
  } else if (cr.status === 422) {
    console.log('Repo already exists — uploading files into it.');
  } else {
    console.log('Repo creation failed:', cr.data.message || cr.status);
    rl.close(); return;
  }

  // 2. Upload files
  const base  = __dirname;
  const files = getFiles(base, base);
  console.log('\nUploading ' + files.length + ' files...\n');

  let ok = 0, fail = 0;
  for (const f of files) {
    process.stdout.write('  ' + f.rel.padEnd(45));
    const content = fs.readFileSync(f.full).toString('base64');
    const r = await apiCall('PUT',
      `/repos/${username.trim()}/aridon-app/contents/${f.rel}`,
      token.trim(),
      { message: 'Add ' + f.rel, content }
    );
    if (r.status === 201 || r.status === 200) { console.log('OK'); ok++; }
    else { console.log('FAIL ' + r.status + ' - ' + (r.data.message||'')); fail++; }
  }

  console.log('\n----------------------------------------');
  console.log('Done: ' + ok + ' uploaded, ' + fail + ' failed.');

  if (fail === 0) {
    console.log('\n========================================');
    console.log('  All files on GitHub!');
    console.log('========================================\n');
    console.log('Repo: https://github.com/' + username.trim() + '/aridon-app\n');
    console.log('NEXT - Deploy on Vercel:');
    console.log('  1. https://vercel.com/new');
    console.log('  2. Import GitHub repo: aridon-app');
    console.log('  3. Add env var: OPENAI_API_KEY = sk-...');
    console.log('  4. Click Deploy\n');
  }

  rl.close();
}

main().catch(e => { console.error('Error:', e.message); rl.close(); });
