import { test, expect, poll, open, ready, noSideScroll } from './harness.mjs';
import { populated, edge } from './fixtures/data.mjs';
import { a11yScan, tabWalk } from './a11y.mjs';
import { shot } from './visual.mjs';

const MAIN = ['ov', 'habit', 'life', 'study', 'work'];
const LIFE = ['goals', 'shop', 'memo', 'wish'];
const goTab = async (p, k) => { await p.click(`.tab[data-k="${k}"]`); await poll(() => p.evaluate(k => tab === k && document.querySelector(`.tab[data-k="${k}"]`).getAttribute('aria-selected') === 'true', k), `tab ${k} selected`); };
const lifeSub = async (p, k) => { await goTab(p, 'life'); await p.click(`[data-act="lifesub"][data-v="${k}"]`); await poll(() => p.evaluate(k => document.querySelector(`[data-act="lifesub"][data-v="${k}"]`)?.getAttribute('aria-pressed') === 'true', k), `life sub ${k}`); };
// every overlay "screen" that isn't a main tab
const SCREENS = {
  forest: async p => { await p.click('#forestBtn'); await poll(() => p.evaluate(() => tab === 'forest'), 'forest open'); },
  'forest-dex': async p => { await p.click('#forestBtn'); await poll(() => p.evaluate(() => tab === 'forest'), 'forest'); await p.evaluate(() => { forestMode = 'dex'; render(); }); },
  journal: async p => { await p.click('#jbtn'); await poll(() => p.evaluate(() => tab === 'journal'), 'journal open'); },
  home: async p => { await p.click('#homeBtn'); await poll(() => p.$('#homePage'), 'home page'); },
  shop: async p => { await p.click('#coinBtn'); await poll(() => p.$('#shopPage'), 'shop page'); },
  mailbox: async p => { await p.click('#mbBtn'); await poll(() => p.evaluate(() => mbOpen), 'mailbox'); },
  settings: async p => { await p.click('#gear'); await poll(() => p.$('.sheet-bg, .set-page, #setPage, .mbpage'), 'settings'); },
  sticky: async p => { await p.click('.st-tab'); await poll(() => p.$('.stkw.open'), 'sticky open'); },
};

/* ---------------- Layer 2: navigation ---------------- */
for (const k of MAIN) test(`nav: tab ${k} highlights exactly itself`, async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await goTab(p, k);
  const sel = await p.$$eval('.tab[aria-selected="true"]', b => b.map(x => x.dataset.k));
  expect(sel.length === 1 && sel[0] === k, `selected tabs ${sel}`);
  expect(await p.$eval('#main', m => m.innerText.trim().length > 0), 'main is empty');
  await noSideScroll(p, k);
});
test('nav: chosen tab survives reload', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await goTab(p, 'study'); const before = await p.evaluate(() => localStorage.getItem('los-tab')); expect(before === 'study', 'not stored before reload: ' + before); await p.reload(); await ready(p); // reload only, no second navigation
  const got = await p.evaluate(() => [tab, localStorage.getItem('los-tab'), 'inits=' + sessionStorage.getItem('__inits'), 'seeded=' + localStorage.getItem('__seeded'), 'url=' + location.href.slice(-30)]); expect(got[0] === 'study', 'tab not remembered: ' + got);
});
for (const k of LIFE) test(`nav: life section ${k}`, async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await lifeSub(p, k);
  expect(await p.$$eval('[data-act="lifesub"][aria-pressed="true"]', b => b.length) === 1, 'more than one life section pressed'); await noSideScroll(p, 'life/' + k);
});
for (const [k, go] of Object.entries(SCREENS)) test(`nav: open ${k}`, async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await go(p); await noSideScroll(p, k);
});
test('nav: Escape closes overlay pages', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p);
  for (const k of ['home', 'shop']) { await SCREENS[k](p); await p.keyboard.press('Escape'); await poll(() => p.evaluate(k => !document.getElementById(k + 'Page'), k), `${k} closes on Escape`); }
});

/* ---------------- Layer 3: state matrix (empty / populated / edge) ---------------- */
for (const [st, data] of [['empty', {}], ['populated', populated()], ['edge', edge()]]) {
  for (const k of MAIN) test(`state ${st}: ${k}`, async ({ newPage }) => {
    const p = await newPage({ data, tab: k }); await open(p);
    expect(await p.$eval('#main', m => m.innerText.trim().length > 0), 'nothing rendered');
    await noSideScroll(p, `${st}/${k}`);
    if (st === 'edge') expect(!(await p.evaluate(() => window.__xss)), 'hostile HTML executed: ' + await p.evaluate(() => window.__xss));
    if (st === 'edge') expect(!(await p.$('#main a[href^="javascript:"]')), 'javascript: link rendered');
  });
  for (const k of Object.keys(SCREENS)) test(`state ${st}: ${k}`, async ({ newPage }) => {
    const p = await newPage({ data }); await open(p); await SCREENS[k](p); await p.waitForTimeout(200);
    await noSideScroll(p, `${st}/${k}`);
    if (st === 'edge') expect(!(await p.evaluate(() => window.__xss)), 'hostile HTML executed');
  });
}
test('state: Monday shows last week recap once', async ({ newPage }) => {
  const d = populated(); delete d.weekly; const p = await newPage({ data: d }); await open(p);
  await poll(() => p.$('.rc-bg'), 'recap sheet'); await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('.rc-bg')?.click());
});
test('state: first run seeds examples', async ({ newPage }) => {
  const p = await newPage({}); await open(p);
  expect(await p.evaluate(() => tasks.length >= 3 && habits.length >= 2), 'seed data missing');
});
test('state: corrupted storage does not crash', async ({ newPage }) => {
  const p = await newPage({ extraLS: { 'lifeos-data-v1': '{not json' } }); await open(p);
  expect(await p.$eval('#main', m => m.innerText.trim().length > 0), 'blank page on bad storage');
});

/* ---------------- Layer 2: interactions ---------------- */
test('task: add via + on study board', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  await p.click('.add[data-space="study"][data-hz="week"]'); await p.fill('#ed-title', '读 Chapter 7'); await p.click('[data-ed="save"]');
  await poll(() => p.evaluate(() => tasks.some(t => t.title === '读 Chapter 7' && t.space === 'study')), 'task saved');
  await poll(() => p.$$eval('.t-title', a => a.some(x => x.textContent === '读 Chapter 7')), 'task shown');
});
test('task: empty title does not save', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p); const n = await p.evaluate(() => tasks.length);
  await p.click('.add[data-space="study"][data-hz="week"]'); await p.click('[data-ed="save"]');
  expect(await p.$('#ed-title'), 'sheet closed without a title'); expect(await p.evaluate(() => tasks.length) === n, 'task created');
});
test('task: tick done and undo', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'work' }); await open(p);
  const b = p.locator('.task:has(.t-title:text-is("更新简历")) [data-act="toggle"]');
  await b.click(); await poll(() => p.evaluate(() => tasks.find(t => t.title === '更新简历').done), 'done');
  await poll(() => p.evaluate(() => document.querySelector('#snack, .snack')), 'undo snack');
});
test('task: three time kinds save and show', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  await p.locator('.t-title:text-is("Phonetics 线上考试")').click();
  expect(await p.$eval('[data-ed="tmode"][data-v="win"]', b => b.classList.contains('on')), 'window mode not chosen');
  await p.click('[data-ed="tmode"][data-v="at"]'); expect(!(await p.$('#ed-s')), 'from-field still shown in at-mode'); await p.click('[data-ed="close"]');
  expect(await p.locator('.task:has(.t-title:text-is("Phonetics 线上考试")) .due.live').count() === 1, 'live window chip missing');
  expect(await p.locator('.task:has(.t-title:text-is("Phonetics 线上考试")) .t-note.rng').innerText() !== '', 'range line missing');
});
test('task: window end before start is refused', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  await p.locator('.t-title:text-is("Phonetics 线上考试")').click(); await p.fill('#ed-d', '2026-11-01'); await p.locator('#ed-d').dispatchEvent('change');
  await p.click('[data-ed="save"]'); expect(await p.$('.sheet'), 'saved an impossible window');
});
test('subtasks: fold by tapping middle, edit by tapping title', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  expect(await p.locator('.subwrap').count() === 0, 'subtasks open by default');
  const m = p.locator('.t-main.fold'); await m.scrollIntoViewIfNeeded(); const bb = await m.boundingBox(); await p.mouse.click(bb.x + bb.width - 8, bb.y + bb.height / 2);
  await poll(async () => (await p.locator('.subwrap .sub').count()) === 4, 'four steps shown');
  expect(await p.$eval('.t-main.fold', b => b.getAttribute('aria-expanded')) === 'true', 'aria-expanded not true');
  await p.click('.t-main.fold .t-title'); await poll(() => p.$('#ed-title'), 'editor opened');
});
test('subtasks: drag to reorder keeps step days', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  await p.evaluate(() => openSplit('s2')); const g = await p.$$('.step .n'); const a = await g[2].boundingBox(), c = await g[0].boundingBox();
  await p.mouse.move(a.x + 8, a.y + 8); await p.mouse.down(); await p.mouse.move(c.x + 8, c.y - 6, { steps: 8 }); await p.mouse.up(); await p.click('[data-s="ok"]');
  const subs = await p.evaluate(() => tasks.find(t => t.id === 's2').subs.map(x => x.t + (x.day ? '@' : '')));
  expect(JSON.stringify(subs) === JSON.stringify(['读文献', '改稿', '列提纲@', '写初稿']), 'order ' + subs);
});
test('habit: check in waters the sprout', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'habit' }); await open(p); const w0 = await p.evaluate(() => waterTotal()); // fixture trees already used up the drops, so watch the total
  await p.locator('[data-act="check"], [data-act="hcheck"], .hcheck').first().click();
  await poll(() => p.evaluate(w0 => waterTotal() > w0, w0), 'water did not increase');
});
test('life: add a shopping item', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await lifeSub(p, 'shop');
  const inp = p.locator('#main input[type="text"], #main input:not([type])').first(); await inp.fill('洗洁精'); await inp.press('Enter');
  await poll(() => p.evaluate(() => shop.some(x => x.name === '洗洁精')), 'shop item saved');
});
test('life: add a wish', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await lifeSub(p, 'wish');
  await p.fill('#wishTitle', '去冰岛看极光'); await p.keyboard.press('Enter');
  await poll(() => p.evaluate(() => wishes.some(w => w.title === '去冰岛看极光')), 'wish saved');
});
test('sticky: add, tag date, done', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await SCREENS.sticky(p);
  await p.fill('#stIn', '周三 14:00 组会'); await p.keyboard.press('Enter');
  await poll(() => p.evaluate(() => stickies.some(s => s.text.includes('组会') && s.date === '2026-11-25' && s.time === '14:00')), 'sticky parsed');
  await p.mouse.click(5, 400); await poll(async () => !(await p.$('.stkw.open')), 'closes on outside click');
});
test('forest: land and dex modes', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await SCREENS.forest(p);
  expect(await p.locator('#flCar, .fl-mapw').count() > 0, 'continent missing'); await p.evaluate(() => { forestMode = 'dex'; render(); });
  expect(await p.locator('#main').innerText() !== '', 'dex empty');
});
test('journal: write and save today', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await SCREENS.journal(p);
  const ta = p.locator('#main textarea').first(); await ta.fill('测试日记'); await ta.blur(); await p.waitForTimeout(800);
  await poll(() => p.evaluate(() => Object.values(journal).some(j => JSON.stringify(j).includes('测试日记'))), 'journal saved');
});
test('shop: try on, buy, go to home', async ({ newPage }) => {
  const p = await newPage({ data: { ...populated(), pomos: Object.fromEntries([...Array(40)].map((_, i) => ['pp' + i, { taskId: null, space: 'study', start: 0, end: 0, mins: 50, day: '2026-11-' + String(1 + (i % 20)).padStart(2, '0'), mode: 'pomo', tomato: true }])) } }); await open(p);
  await SCREENS.shop(p); await p.click('[data-sh="tab"][data-v="prop"]'); await p.click('[data-sh="it"][data-k="n_g_lamp"]');
  await poll(() => p.$('.fhome'), 'home preview in fitting room');
  const buy = p.locator('[data-sh="buy"]'); if (await buy.isDisabled()) throw new Error('cannot afford in fixture');
  await buy.click(); await poll(() => p.evaluate(() => !!closet.n_g_lamp), 'bought');
  await p.click('[data-sh="home"]'); await poll(() => p.$('#homePage .hm-it[data-k="n_g_lamp"]'), 'lamp placed in home');
});
test('shop: star-sign hoods and bed flowers', async ({ newPage }) => {
  const p = await newPage({ data: { ...populated(), pomos: Object.fromEntries([...Array(40)].map((_, i) => ['pp' + i, { taskId: null, space: 'study', start: 0, end: 0, mins: 50, day: '2026-11-' + String(1 + (i % 20)).padStart(2, '0'), mode: 'pomo', tomato: true }])) } }); await open(p);
  await p.evaluate(() => { birthday = '2001-12-25'; });
  await SCREENS.shop(p);
  expect(!(await p.$('[data-sh="tab"][data-v="dood"]')), 'doodle tab still there');
  await p.click('[data-sh="tab"][data-v="set"]');
  expect(await p.locator('[data-sh="it"][data-k^="n_c_"]').count() === 12, 'not 12 sign hoods');
  expect(/你的星座/.test(await p.locator('[data-sh="it"][data-k="n_c_capricorn"]').innerText()), 'your-sign tag missing');
  expect(!/你的星座/.test(await p.locator('[data-sh="it"][data-k="n_c_aries"]').innerText()), 'tag on wrong sign');
  await p.click('[data-sh="it"][data-k="n_c_capricorn"]'); await poll(() => p.evaluate(() => fitKeys().includes('n_c_capricorn')), 'hood tried on');
  await p.click('[data-sh="tab"][data-v="prop"]'); expect(await p.locator('[data-sh="it"][data-k^="n_f_"]').count() === 6, 'not 6 flowers');
  await p.click('[data-sh="it"][data-k="n_f_tulip"]'); const buy = p.locator('[data-sh="buy"]'); await buy.click();
  await poll(() => p.evaluate(() => !!closet.n_f_tulip), 'flower bought');
  await p.click('[data-sh="home"]'); await poll(() => p.$('#homePage .hm-it[data-k="n_f_tulip"]'), 'flower in home');
  expect(await p.evaluate(() => /^bed/.test(homeS.items.n_f_tulip.s)), 'flower not in the bed');
});
test('home: arrange - size, move, put away', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await SCREENS.home(p);
  await p.click('[data-hm="edit"]'); const fire = p.locator('.hm-it[data-k="n_g_fire"]'); await fire.scrollIntoViewIfNeeded(); const bb = await fire.boundingBox();
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height * .6); await p.click('[data-hm="L"]');
  await poll(() => p.evaluate(() => homeS.items.n_g_fire.sz === 'L'), 'size saved');
  const s0 = await p.evaluate(() => homeS.items.n_g_fire.s); await p.click('[data-hm="mv"]'); expect(await p.evaluate(s0 => homeS.items.n_g_fire.s !== s0, s0), 'move did nothing');
  await p.click('[data-hm="del"]'); await poll(() => p.evaluate(() => !homeS.items.n_g_fire && homeS.off.includes('n_g_fire')), 'put away');
  await p.click('.hm-ti[data-k="n_g_fire"]'); await poll(() => p.evaluate(() => !!homeS.items.n_g_fire), 'put back from tray');
});
test('focus: start and leave a pomodoro', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  await p.locator('.task:has(.t-title:text-is("写 essay")) [data-act="focus"]').click();
  await poll(() => p.$('#pomoPage'), 'focus page opened');
});
test('overview: open a later day', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'ov' }); await open(p);
  await p.locator('[data-act="ovday"]').nth(1).click(); await poll(() => p.evaluate(() => typeof ovOpen !== 'undefined' && !!ovOpen), 'day opened');
});
test('settings: switch language to English and back', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p);
  await p.evaluate(() => setLang ? setLang('en') : 0).catch(() => {}); await p.waitForTimeout(200);
  expect(await p.$eval('#tl-habit', e => e.textContent) !== '打卡', 'tabs not translated');
});

/* ---------------- Layer 5: accessibility + keyboard ---------------- */
const OVERLAY = { home: '#homePage', shop: '#shopPage', mailbox: '.mbpage', sticky: '.stkw' };
for (const theme of ['light', 'dark']) {
  // names / alt / ids and WCAG AA text contrast must all pass
  const check = v => expect(!v.length, v.join(' · '));
  for (const k of MAIN) test(`a11y ${theme}: ${k}`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), tab: k, theme }); await open(p); check(await a11yScan(p));
  });
  for (const k of ['forest', 'journal', 'home', 'shop', 'mailbox', 'sticky']) test(`a11y ${theme}: ${k}`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), theme }); await open(p); await SCREENS[k](p); await p.waitForTimeout(250); check(await a11yScan(p, OVERLAY[k]));
  });
}
test('keyboard: Tab walk reaches every visible control with a focus ring', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p); const r = await tabWalk(p, 60);
  expect(!r.noRing.length, 'no visible focus ring on: ' + r.noRing.slice(0, 6).join(', '));
}, { projects: ['desktop'] });
for (const theme of ['light', 'dark']) {
  const check = v => expect(!v.length, v.join(' · '));
  for (const v of ['shop', 'memo', 'wish', 'goals']) test(`a11y ${theme}: life/${v}`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), tab: 'life', theme }); await open(p); await p.click(`[data-act="lifesub"][data-v="${v}"]`); await p.waitForTimeout(150); check(await a11yScan(p));
  });
  test(`a11y ${theme}: focus page`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), tab: 'study', theme }); await open(p); await p.locator('.task:has(.t-title:text-is("写 essay")) [data-act="focus"]').click(); await poll(() => p.$('#pomoPage'), 'focus'); await p.waitForTimeout(250); check(await a11yScan(p, '#pomoPage'));
  });
  test(`a11y ${theme}: forest dex`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), theme }); await open(p); await SCREENS['forest-dex'](p); await p.waitForTimeout(250); check(await a11yScan(p));
  });
  test(`a11y ${theme}: task editor + subtasks`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), tab: 'study', theme }); await open(p); await p.locator('.t-main.fold .t-title').click(); await poll(() => p.$('#ed-title'), 'editor'); check(await a11yScan(p, '.sheet-bg'));
  });
  test(`a11y ${theme}: shop tabs`, async ({ newPage }) => {
    const p = await newPage({ data: populated(), theme }); await open(p); await SCREENS.shop(p); const all = [];
    for (const t of ['acc', 'expr', 'prop', 'lim', 'dood', 'set', 'vibe', 'mine']) { const b = p.locator(`[data-sh="tab"][data-v="${t}"]`); if (await b.count()) { await b.first().click(); await p.waitForTimeout(120); all.push(...(await a11yScan(p, '#shopPage')).map(x => t + ': ' + x)); } }
    check([...new Set(all)]);
  });
}
/* ---------------- Layer 4: visual regression ---------------- */
for (const theme of ['light', 'dark']) {
  for (const k of MAIN) test(`visual ${theme}: ${k}`, async ({ newPage, project }) => {
    const p = await newPage({ data: populated(), tab: k, theme }); await open(p); await shot(p, `${project}-${theme}-${k}`);
  });
  for (const k of ['forest', 'journal', 'home', 'shop', 'sticky']) test(`visual ${theme}: ${k}`, async ({ newPage, project }) => {
    const p = await newPage({ data: populated(), theme }); await open(p); await SCREENS[k](p); await p.waitForTimeout(300); await shot(p, `${project}-${theme}-${k}`);
  });
}
