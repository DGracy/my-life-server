import fs from 'fs'; import { createRequire } from 'module'; const rq = createRequire(import.meta.url); const sharp = (() => { try { return rq('sharp'); } catch (_) { return rq('/home/claude/.npm-global/lib/node_modules/sharp'); } })();
import { Fail } from './harness.mjs';
const UPDATE = process.env.UPDATE === '1';
export async function shot(page, name) {
  await page.evaluate(() => { document.querySelectorAll('.hm-it.walk').forEach(e => e.style.transition = 'none'); });
  const buf = await page.screenshot({ animations: 'disabled', caret: 'hide', mask: [page.locator('.hm-it.walk, #today, .rng')] });
  fs.mkdirSync('baselines', { recursive: true }); fs.mkdirSync('results/diff', { recursive: true });
  const base = `baselines/${name}.png`;
  if (UPDATE || !fs.existsSync(base)) { fs.writeFileSync(base, buf); return; }
  const [a, b] = await Promise.all([sharp(base).raw().toBuffer({ resolveWithObject: true }), sharp(buf).raw().toBuffer({ resolveWithObject: true })]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) throw new Fail(`visual ${name}: size changed`);
  let diff = 0; const out = Buffer.alloc(a.data.length); const ch = a.info.channels;
  for (let i = 0; i < a.data.length; i += ch) { const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]); if (d > 40) { diff++; out[i] = 255; out[i + 1] = 0; out[i + 2] = 0; } else { out[i] = out[i + 1] = out[i + 2] = b.data[i] * .3 + 170; } if (ch === 4) out[i + 3] = 255; }
  const pct = diff / (a.data.length / ch) * 100;
  if (pct > 0.3) { await sharp(out, { raw: a.info }).png().toFile(`results/diff/${name}.png`); fs.writeFileSync(`results/diff/${name}-actual.png`, buf); throw new Fail(`visual ${name}: ${pct.toFixed(2)}% pixels differ (see results/diff/${name}.png)`); }
}
