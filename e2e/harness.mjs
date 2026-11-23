// Tiny Playwright test harness following the ui-testing skill's layers
// (no @playwright/test / axe available offline, so this re-implements the parts we need).
import { createRequire } from 'module';
const req = createRequire(import.meta.url);
const { chromium } = (() => { try { return req('playwright'); } catch (_) { return req('/opt/npm-tools/node_modules/playwright'); } })();
import fs from 'fs'; import path from 'path';
import { NOW, TOUR_SEEN, HINTS_SEEN } from './fixtures/data.mjs';
export const APP = process.env.LIFEOS_APP || new URL('../index.html', import.meta.url).href;
export const PROJECTS = { desktop: { viewport: { width: 1280, height: 860 } }, mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } };
const tests = [];
export function test(name, fn, opt = {}) { tests.push({ name, fn, opt }); }
export class Fail extends Error {}
export function expect(cond, msg) { if (!cond) throw new Fail(msg); }
export async function poll(fn, msg, ms = 3000) { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { v = await fn(); if (v) return v; await new Promise(r => setTimeout(r, 50)); } throw new Fail(msg + ' (timed out)'); }

let browser, coverage = [];
export async function newPage(project, { data, theme = 'light', lang = 'zh', tab = 'ov', extraLS = {}, allowErrors = false } = {}) {
  const ctx = await browser.newContext({ ...PROJECTS[project], colorScheme: theme, timezoneId: 'Europe/London', locale: 'zh-CN', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', e => page.__errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) page.__errors.push('console: ' + m.text()); });
  page.on('dialog', d => { page.__errors.push('dialog: ' + d.message()); d.dismiss(); });
  await ctx.route(/^https?:/, r => r.abort());            // network boundary: no Firebase, fonts, AI
  await page.clock.install({ time: theme === 'dark' ? new Date(NOW.getTime() + 11 * 36e5) : NOW }); // pinned clock; the app goes dark by time of day (21:00)
  const ls = { 'lifeos-welcomed': '1', 'lifeos-lang': lang, 'los-tab': tab, 'lifeos-tour': JSON.stringify(Object.fromEntries([['full', 1], ['new', 1], ...TOUR_SEEN.map(k => ['nf:' + k, 1]), ...HINTS_SEEN.map(k => [k, 1])])), ...extraLS };
  if (data !== undefined) ls['lifeos-data-v1'] = JSON.stringify(data);
  await page.addInitScript(() => { let a = 20261123; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }); // seeded randomness
  await page.addInitScript(ls => { if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1'); localStorage.clear(); for (const k in ls) localStorage.setItem(k, ls[k]); }, ls);
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  page.__allowErrors = allowErrors;
  return page;
}
export async function open(page) {
  await page.goto(APP);
  await page.waitForFunction(() => typeof render === 'function' && document.querySelector('#main') && document.querySelector('#main').children.length > 0);
  await page.evaluate(() => document.querySelectorAll('.sleep-dim,.tour-ui').forEach(x => x.remove()));
  await page.waitForTimeout(250); // entrance animations (reducedMotion also set)
}
export async function closePage(page) { try { coverage.push(...(await page.coverage.stopJSCoverage())); } catch (_) {} await page.context().close(); }
export async function noSideScroll(page, where) { const r = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); expect(r[0] <= r[1] + 1, `${where}: page scrolls sideways (${r[0]} > ${r[1]})`); }

export async function run({ only, projects = ['desktop', 'mobile'], out = 'results' } = {}) {
  browser = await chromium.launch();
  const res = []; const t0 = Date.now();
  for (const t of tests) for (const pj of projects) {
    if (t.opt.projects && !t.opt.projects.includes(pj)) continue;
    if (only && !new RegExp(only).test(t.name)) continue;
    const ctx = { project: pj, pages: [] };
    const np = async o => { const p = await newPage(pj, o); ctx.pages.push(p); return p; };
    let status = 'pass', err = '';
    try { await Promise.race([t.fn({ project: pj, newPage: np }), new Promise((_, rj) => setTimeout(() => rj(new Fail('test timeout 45s')), 45000))]);
      for (const p of ctx.pages) if (!p.__allowErrors && p.__errors.length) throw new Fail('strict console: ' + p.__errors.slice(0, 3).join(' | '));
    } catch (e) { status = e.known ? 'known' : 'fail'; err = (e instanceof Fail ? '' : 'ERROR ') + (e.message || String(e)).split('\n')[0].slice(0, 4000); }
    for (const p of ctx.pages) await closePage(p);
    res.push({ name: t.name, project: pj, status, err });
    process.stdout.write(`${status === 'pass' ? '✓' : status === 'known' ? '~' : '✗'} [${pj}] ${t.name}${err ? '\n    ' + err : ''}\n`);
  }
  await browser.close();
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(out, 'coverage.json'), JSON.stringify(coverage.filter(c => c.url.startsWith('file:'))));
  const f = res.filter(r => r.status === 'fail').length, kn = res.filter(r => r.status === 'known').length;
  console.log(`\n${res.length - f - kn} passed, ${kn} known issues, ${f} failed in ${Math.round((Date.now() - t0) / 1000)}s`);
  return res;
}
