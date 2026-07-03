// Aridon - Push ALL files to GitHub (creates repo if needed)
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
        'User-Agent': 'aridon-push',
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
  const SKIP = new Set(['node_modules', '.git', '.next', '.vercel',
    'push-to-github.js', 'push-to-github.bat', 'push-all.js', 'push-all.bat',
    'setup-github.bat', 'setup-github.ps1', 'crop-executives.html',
    'install-supabase.bat', 'deploy-v03.bat']);
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

async function getSHA(token, username, rel) {
  const r = await apiCall('GET', `/repos/${username}/aridon-app/contents/${rel}`, token);
  if (r.status === 200 && r.data && r.data.sha) return r.data.sha;
  return null;
}

async function main() {
  console.log('\n========================================');
  console.log('  ARIDON v0.3 - Push All Files to GitHub');
  console.log('========================================\n');
  console.log('Need a GitHub Personal Access Token (PAT):');
  console.log('  1. Go to: https://github.com/settings/tokens/new');
  console.log('  2. Note: "aridon-push"');
  console.log('  3. Expiration: 30 days');
  console.log('  4. Check the "repo" checkbox');
  console.log('  5. Click Generate token\n');

  const token    = (await ask('Paste your GitHub PAT: ')).trim();
  const username = (await ask('Your GitHub username:   ')).trim();

  if (!token || !username) {
    console.log('Both required. Exiting.'); rl.close(); return;
  }

  // Step 1: Verify token works
  console.log('\nVerifying token...');
  const me = await apiCall('GET', '/user', token);
  if (me.status !== 200) {
    console.log('Token invalid or expired (status ' + me.status + '). Please generate a new one.');
    rl.close(); return;
  }
  console.log('Token OK — logged in as: ' + me.data.login);

  // Step 2: Create or verify repo
  console.log('\nChecking repo "aridon-app"...');
  const repoCheck = await apiCall('GET', `/repos/${username}/aridon-app`, token);
  if (repoCheck.status === 404) {
    console.log('Repo not found — creating it...');
    const cr = await apiCall('POST', '/user/repos', token, {
      name: 'aridon-app',
      description: 'Aridon — AI Executive Operating System',
      private: false,
      auto_init: false
    });
    if (cr.status === 201) {
      console.log('Repo created: https://github.com/' + username + '/aridon-app');
    } else {
      console.log('Failed to create repo: ' + (cr.data.message || cr.status));
      rl.close(); return;
    }
  } else if (repoCheck.status === 200) {
    console.log('Repo exists: https://github.com/' + username + '/aridon-app');
  } else {
    console.log('Unexpected error checking repo: ' + repoCheck.status);
    rl.close(); return;
  }

  // Step 3: Push all files
  const base  = __dirname;
  const files = getFiles(base, base);
  console.log('\nPushing ' + files.length + ' files...\n');

  let ok = 0, fail = 0;
  for (const f of files) {
    process.stdout.write('  ' + f.rel.padEnd(52));
    const content = fs.readFileSync(f.full).toString('base64');
    const sha = await getSHA(token, username, f.rel);
    const body = { message: 'Update ' + f.rel, content };
    if (sha) body.sha = sha;
    const r = await apiCall('PUT',
      `/repos/${username}/aridon-app/contents/${f.rel}`,
      token, body
    );
    if (r.status === 201 || r.status === 200) { console.log('✓'); ok++; }
    else { console.log('✗ ' + r.status + ' — ' + (r.data.message||'')); fail++; }
  }

  console.log('\n----------------------------------------');
  console.log('Done: ' + ok + ' pushed, ' + fail + ' failed.');
  if (ok > 0) {
    console.log('\nVercel will auto-deploy in ~60 seconds.');
    console.log('Then check: https://aridon-v02.vercel.app/test.html');
    console.log('Portraits should be visible there.\n');
  }
  rl.close();
}

main().catch(e => { console.error('Error:', e.message); rl.close(); });
