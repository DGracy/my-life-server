// Stand-in for axe: accessible names, WCAG AA text contrast, img alt, duplicate ids.
export async function a11yScan(page, rootSel) {
  return page.evaluate(rootSel => {
    const ROOT = (rootSel && [...document.querySelectorAll(rootSel)].pop()) || document.body;
    const out = [];
    const vis = el => { if (el.closest('details:not([open])') && !el.closest('summary')) return false; // closed <details> keeps a layout box in Chrome
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || e.getAttribute('aria-hidden') === 'true' || e.hidden) return false; } return true; };
    const desc = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + ` "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`;
    // 1. names
    const nameOf = el => { const lb = el.getAttribute('aria-labelledby'); if (lb) return lb.split(' ').map(i => document.getElementById(i)?.textContent || '').join(' ').trim();
      return (el.getAttribute('aria-label') || el.getAttribute('title') || (el.labels && [...el.labels].map(l => l.textContent).join(' ')) || el.getAttribute('placeholder') || el.innerText || el.value || el.querySelector('img[alt]')?.alt || el.querySelector('svg title')?.textContent || '').trim(); };
    ROOT.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab]').forEach(el => { if (!vis(el)) return; if (el.closest('[inert]')) return; if (!nameOf(el)) out.push('no accessible name: ' + desc(el)); });
    ROOT.querySelectorAll('img').forEach(el => { if (vis(el) && !el.hasAttribute('alt')) out.push('img without alt: ' + desc(el)); });
    const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1); Object.entries(ids).filter(([, n]) => n > 1).forEach(([k]) => out.push('duplicate id #' + k));
    // 2. contrast
    const parse = c => { const cs = c.match(/color\(srgb ([^)]+)\)/); if (cs) { const v = cs[1].split(/[ /]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v.length > 3 ? v[3] : 1]; } const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
    const lum = ([r, g, b]) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const blend = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
    const bgOf = el => { const layers = []; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage && s.backgroundImage !== 'none') return null; const c = parse(s.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
      let b = [255, 255, 255, 1]; if (layers.length && layers[layers.length - 1][3] >= 1) b = layers.pop(); else { const bc = parse(getComputedStyle(document.body).backgroundColor); if (bc) b = bc; } while (layers.length) b = blend(layers.pop(), b); return b; };
    const seen = new Set();
    const walker = document.createTreeWalker(ROOT, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const t = walker.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      if (!vis(el) || el.closest('svg') || el.closest('button:disabled, [disabled], .done, .d, .dz, del, s')) continue;
      const s = getComputedStyle(el); let fg = parse(s.color); if (!fg) continue; let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < .2) continue;
      const bg = bgOf(el); if (!bg) continue; fg = blend([fg[0], fg[1], fg[2], fg[3] * op], bg);
      const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      const px = parseFloat(s.fontSize), bold = +s.fontWeight >= 700, large = px >= 24 || (bold && px >= 18.66), need = large ? 3 : 4.5;
      if (ratio < need - .05) out.push(`contrast ${ratio.toFixed(2)}<${need}: ${desc(el)}` + (window.__a11yDetail || 1 ? ` fg=${s.color} bg=${bg.map(Math.round).join(',')} px=${px}` : '')); }
    return out;
  }, rootSel);
}
export async function tabWalk(page, n) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const noRing = [], seen = [];
  for (let i = 0; i < n; i++) { await page.keyboard.press('Tab');
    const r = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; const s = getComputedStyle(el);
      const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      return { d: (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ' ' + (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 14), ring }; });
    if (!r) continue; seen.push(r.d); if (!r.ring) noRing.push(r.d); }
  return { noRing: [...new Set(noRing)], seen };
}
