/**
 * generate-exec-photos.js
 *
 * Generates half-body desk portraits for all 7 Aridon executives using DALL-E 3.
 * Saves them to public/executives/ as .png files.
 *
 * Run from the project root:
 *   node generate-exec-photos.js
 *
 * Requires OPENAI_API_KEY in .env.local (loaded automatically).
 * Each image costs ~$0.08 (HD 1024x1024). Total: ~$0.56 for all 7.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env.local manually (no dotenv dependency needed)
function loadEnv(file) {
  try {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv(path.join(__dirname, '.env.local'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌  OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

// Shared photography style suffix applied to every prompt.
// Keeps visual consistency across all 7 executives.
const STYLE = [
  'seated at a sleek modern executive desk',
  'upper body visible from waist up with the desk surface in frame',
  'facing the camera directly with a natural slight forward lean',
  'professional office environment with dark blurred background',
  'cinematic studio lighting with soft fill on face',
  'ultra-realistic photographic quality, 4k, sharp focus on face',
  'no text, no watermarks',
].join(', ');

const EXECUTIVES = [
  {
    id: 'heather',
    prompt: `Photorealistic portrait of a professional woman with vibrant red shoulder-length hair, pale skin, and clear blue eyes, wearing a tailored black blazer. ${STYLE}. Warm confident expression.`,
  },
  {
    id: 'ethos',
    prompt: `Photorealistic portrait of a distinguished man in his early 50s with dark wavy salt-and-pepper hair and a well-groomed short beard, wearing a dark navy blazer. ${STYLE}. Calm authoritative expression.`,
  },
  {
    id: 'atlas',
    prompt: `Photorealistic portrait of a man in his late 40s with short salt-and-pepper hair, sharp blue eyes, and a short grey beard, wearing a dark charcoal button-up shirt. ${STYLE}. Focused precise expression.`,
  },
  {
    id: 'eva',
    prompt: `Photorealistic portrait of a professional woman with long dark wavy hair, olive complexion, and high cheekbones, wearing a sleek black suit jacket with small gold hoop earrings. ${STYLE}. Composed serious expression.`,
  },
  {
    id: 'scout',
    prompt: `Photorealistic portrait of a young man in his early 30s with light blonde-brown hair styled upward, clean-shaven with bright blue eyes and a warm confident smile, wearing a navy blazer over an open-collar white shirt. ${STYLE}. Energetic approachable expression.`,
  },
  {
    id: 'ledger',
    prompt: `Photorealistic portrait of a distinguished man in his late 50s with short grey hair and rectangular dark-framed glasses, wearing a dark navy suit jacket and light blue dress shirt. ${STYLE}. Calm measured expression with a slight confident smile.`,
  },
  {
    id: 'oracle',
    prompt: `Photorealistic portrait of a woman in her mid-40s with dark hair pulled back with natural silver-grey streaks, wearing round dark-framed glasses, dressed in a black turtleneck under a black blazer. ${STYLE}. Intelligent contemplative expression.`,
  },
];

function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`OpenAI: ${parsed.error.message}`));
          } else {
            // gpt-image-1 returns b64_json by default; fall back to url if present
            resolve(parsed.data[0].b64_json || parsed.data[0].url);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nRaw: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', (c) => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const outDir = path.join(__dirname, 'public', 'executives');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`Generating ${EXECUTIVES.length} executive portraits via DALL-E 3...\n`);

  for (const exec of EXECUTIVES) {
    process.stdout.write(`  ${exec.id.padEnd(10)} generating...`);
    try {
      const result = await callOpenAI(exec.prompt);
      const outPath = path.join(outDir, `${exec.id}.jpg`);
      if (result.startsWith('http')) {
        const imgBuf = await downloadImage(result);
        fs.writeFileSync(outPath, imgBuf);
      } else {
        fs.writeFileSync(outPath, Buffer.from(result, 'base64'));
      }
      console.log(` ✓  saved to public/executives/${exec.id}.jpg`);
    } catch (err) {
      console.log(` ✗  FAILED: ${err.message}`);
    }

    // 1-second gap between requests to avoid rate-limit bursts
    if (exec !== EXECUTIVES[EXECUTIVES.length - 1]) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log('\nDone. Next steps:');
  console.log('  1. Run deploy-now.bat to push new images + code to Vercel');
  console.log('  2. Test each executive — video should now show them at desk distance');
  console.log('  3. Old .jpg files can be deleted from public/executives/ after confirming\n');
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
