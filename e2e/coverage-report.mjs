// Merge V8 coverage from every test, print function + code coverage, list functions no test ran.
import fs from 'fs';
const runs = JSON.parse(fs.readFileSync('results/coverage.json', 'utf8'));
const scripts = new Map(); // source -> {hit:Uint8Array, fns:Map}
for (const e of runs) {
  if (!e.source || e.source.length < 5000) continue;
  let s = scripts.get(e.source); if (!s) { s = { src: e.source, hit: new Uint8Array(e.source.length), fns: new Map() }; scripts.set(e.source, s); }
  const cov = new Uint8Array(e.source.length);
  for (const f of e.functions) for (const r of f.ranges) cov.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset); // nested ranges come after their parents
  for (let i = 0; i < cov.length; i++) if (cov[i]) s.hit[i] = 1;
  for (const f of e.functions) { if (!f.functionName && f.ranges[0].startOffset === 0) continue; const k = f.ranges[0].startOffset; const was = s.fns.get(k); const c = f.ranges[0].count > 0;
    s.fns.set(k, { name: f.functionName || '(anonymous)', start: k, end: f.ranges[0].endOffset, hit: (was && was.hit) || c }); }
}
const big = [...scripts.values()].sort((a, b) => b.src.length - a.src.length)[0];
const fns = [...big.fns.values()]; const named = fns.filter(f => f.name !== '(anonymous)');
const codeChars = [...big.src].length; let hit = 0, total = 0;
for (let i = 0; i < big.src.length; i++) { if (/\s/.test(big.src[i])) continue; total++; if (big.hit[i]) hit++; }
const pct = (a, b) => (100 * a / b).toFixed(1) + '%';
const miss = named.filter(f => !f.hit);
const line = i => big.src.slice(0, i).split('\n').length;
let out = `Functions run: ${named.length - miss.length}/${named.length} named (${pct(named.length - miss.length, named.length)}), ${fns.filter(f => f.hit).length}/${fns.length} incl. anonymous (${pct(fns.filter(f => f.hit).length, fns.length)})\nCode executed: ${pct(hit, total)} of non-whitespace characters\n\nNamed functions no test ran (${miss.length}):\n`;
out += miss.sort((a, b) => a.start - b.start).map(f => `  ${f.name}  (script line ${line(f.start)}, ${f.end - f.start} chars)`).join('\n');
fs.writeFileSync('results/coverage.txt', out); console.log(out.split('\n').slice(0, 4).join('\n')); console.log(`(full list: results/coverage.txt)`);
const min = +(process.argv.find(a => a.startsWith('--min=')) || '').slice(6); if (min && 100 * (named.length - miss.length) / named.length < min) process.exit(1);
