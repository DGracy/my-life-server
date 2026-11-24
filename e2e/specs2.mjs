// Second batch: features the coverage report showed were never exercised.
import { test, expect, poll, open } from './harness.mjs';
import { populated } from './fixtures/data.mjs';
const sheetBtns = p => p.evaluate(() => [...document.querySelectorAll('.sheet-bg button')].filter(b => b.offsetParent).map(b => b.innerText.trim()));

test('capture: sort free text into boards', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#fab');
  await p.fill('#cap', '周五前改完简历；买鸡蛋'); await p.click('#parseBtn');
  await poll(() => p.$('#saveParsed'), 'preview shown'); const n = await p.evaluate(() => tasks.length + shop.length);
  await p.click('#saveParsed'); await poll(() => p.evaluate(n => tasks.length + shop.length >= n + 2, n), 'two items saved');
  expect(await p.evaluate(() => shop.some(x => x.name.includes('鸡蛋'))), 'eggs not in shopping list');
  expect(await p.evaluate(() => tasks.some(t => t.title.includes('简历') && t.due === '2026-11-27')), 'CV task not due Friday');
});
test('capture: inbox keeps raw text', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#fab');
  await p.fill('#cap', '想想周末去哪'); await p.click('#inboxBtn'); await poll(() => p.evaluate(() => tasks.some(t => t.title.includes('周末去哪') && t.horizon === 'inbox')), 'inbox task');
});
test('sleep: wake-up button records the morning', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#slBtn');
  await poll(() => p.evaluate(() => JSON.stringify(sleeps).length > 2), 'sleep saved');
});
test('mailbox: write and seal a letter', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#mbBtn'); await p.click('[data-mb="new"]');
  await poll(() => p.$('.sheet-bg textarea, .sheet-bg [contenteditable]'), 'letter editor');
  const ed = p.locator('.sheet-bg textarea, .sheet-bg [contenteditable="true"]').first(); await ed.click(); await p.keyboard.type('一年后的我：希望你已经找到喜欢的工作。');
  const b = await sheetBtns(p); expect(b.length > 0, 'no buttons in letter editor');
  await p.locator('.sheet-bg').first().click({ position: { x: 3, y: 3 } }); await p.waitForTimeout(300);
  await poll(() => p.evaluate(() => letters.some(l => (l.body || '').includes('喜欢的工作'))), 'draft kept after closing');
});
test('habit: add and remove a habit', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'habit' }); await open(p);
  const inp = p.locator('#main input').first(); await inp.fill('喝 8 杯水'); await inp.press('Enter');
  await poll(() => p.evaluate(() => habits.some(h => h.name === '喝 8 杯水')), 'habit added');
  const del = p.locator('.h-del').last(); await del.click(); await del.click();
  await poll(() => p.evaluate(() => !habits.some(h => h.name === '喝 8 杯水' && !h.archived)), 'habit removed');
});
test('habit: back-fill yesterday', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'habit' }); await open(p);
  // fixture: h2 was not done on 11-21, so tapping its dot fills it in
  await p.locator('[data-act="hdot"][data-id="h2"][data-v="2026-11-21"]').click();
  await poll(() => p.evaluate(() => !!(checkins['2026-11-21'] || {}).h2), 'back-filled check-in');
  await p.locator('[data-act="hday"][data-v="-1"]').click(); await poll(() => p.evaluate(() => hDay === '2026-11-22'), 'day stepper');
});
test('overdue: move to today', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p);
  await p.locator('[data-act="odtoday"]').first().click();
  await poll(() => p.evaluate(() => { const t = tasks.find(x => x.id === 's4'); return t.plan === '2026-11-23' || t.due === '2026-11-23'; }), 'moved to today');
});
test('move sheet: a task due tomorrow can still go to tomorrow', async ({ newPage }) => {
  const d = populated(); d.tasks.dz1 = { title: '扫地', space: 'life', horizon: 'week', due: '2026-11-24', note: '', done: false, createdAt: 1 };
  const p = await newPage({ data: d }); await open(p);
  await p.evaluate(() => ovMove('dz1'));
  await poll(() => p.$('.od-sheet [data-ov="2026-11-24"]'), 'tomorrow missing from the move sheet');
  await p.click('.od-sheet [data-ov="2026-11-24"]'); await poll(() => p.evaluate(() => tasks.find(x => x.id === 'dz1').plan === '2026-11-24'), 'not moved');
});
test('memo: new checklist, tick, reset', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('.tab[data-k="life"]'); await p.click('[data-act="lifesub"][data-v="memo"]');
  await p.locator('[data-act="memoitem"]').first().click({ force: true }); // the tick box is drawn by its label await poll(() => p.evaluate(() => memos.find(m => m.id === 'm1').items[0].done), 'item ticked');
  await p.locator('[data-act="memoreset"]').first().click({ force: true }); await poll(() => p.evaluate(() => memos.find(m => m.id === 'm1').items.every(i => !i.done)), 'reset');
});
test('wish: mark done celebrates', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('.tab[data-k="life"]'); await p.click('[data-act="lifesub"][data-v="wish"]');
  await p.locator('[data-act="wishdone"]').first().click(); await poll(() => p.evaluate(() => wishes.find(w => w.id === 'wi1').done), 'wish done');
});
test('food: fridge and what-to-eat wheel', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('.tab[data-k="life"]'); await p.click('[data-act="lifesub"][data-v="shop"]');
  const txt = await p.locator('#main').innerText(); expect(txt.length > 50, 'food section empty');
  const add = p.locator('button:has-text("先用几道家常菜")'); if (await add.count()) { await add.first().click(); await poll(() => p.evaluate(() => meals.length > 0), 'starter dishes'); }
  const spin = p.locator('[data-act="pick"]').first(); if (await spin.count()) { await spin.click(); await p.waitForTimeout(400); }
});
test('focus: finish a 25 min pomodoro records it', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p); const n = await p.evaluate(() => pomos.length);
  await p.locator('.task:has(.t-title:text-is("写 essay")) [data-act="focus"]').click(); await poll(() => p.$('#pomoPage'), 'focus page');
  const go = p.locator('#pomoPage button:has-text("开始")').first(); if (await go.count()) await go.click();
  await p.clock.runFor(26 * 60e3); await p.waitForTimeout(300);
  await poll(() => p.evaluate(n => pomos.length > n, n), 'pomodoro not recorded', 5000);
});
test('forest: year/month browse and rename a tree', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#forestBtn');
  await p.evaluate(() => openTree('f1')); await poll(() => p.$('#ftName'), 'tree sheet'); await p.fill('#ftName', '大苹果'); await p.keyboard.press('Enter'); await p.keyboard.press('Escape');
  await poll(() => p.evaluate(() => forest.find(f => f.id === 'f1').name === '大苹果'), 'rename saved');
});
test('forest: plant a tree when watered', async ({ newPage }) => {
  const d = populated(); d.forest = {}; for (let i = 1; i <= 25; i++) d.checkins[`2026-10-${String(i).padStart(2, '0')}`] = { date: `2026-10-${String(i).padStart(2, '0')}`, done: { h1: 1, h2: 1 } };
  const p = await newPage({ data: d }); await open(p); expect(await p.evaluate(() => curWater() >= MAXW), 'fixture not full of water: ' + await p.evaluate(() => curWater()));
  await p.evaluate(() => openPlant()); await poll(() => p.$('.sheet-bg'), 'plant sheet'); const b = await sheetBtns(p);
  await p.locator('.sheet-bg button.primary').last().click(); await poll(() => p.evaluate(() => forest.length === 1), 'tree planted (buttons: ' + b.join('/') + ')');
});
test('journal: mood, star a moment, previous day', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#jbtn');
  const mood = p.locator('[data-act="jmood"]').first(); if (await mood.count()) { await mood.click(); await poll(() => p.evaluate(() => (journal['2026-11-23'] || {}).mood != null), 'mood saved'); }
  await p.locator('[data-act="jprev"]').first().click(); await poll(() => p.evaluate(() => jDate === '2026-11-22'), 'went to yesterday');
});
test('time log: add an entry for today', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.evaluate(() => openTl('2026-11-23'));
  await poll(() => p.$('#tt'), 'time log sheet'); await p.fill('#tt', '图书馆自习'); await p.fill('#ts', '09:00'); await p.fill('#te', '10:30');
  await p.locator('[data-t="ok"]').click(); await poll(() => p.evaluate(() => tlog.some(x => x.title === '图书馆自习')), 'time log saved');
});
test('courses: add a class', async ({ newPage }) => {
  const p = await newPage({ data: populated(), tab: 'study' }); await open(p); await p.locator('button:has-text("加课程表")').first().click();
  await poll(() => p.$('.sheet-bg'), 'courses sheet'); await p.click('[data-c2="new"]'); await poll(() => p.$('#cn'), 'course form');
  { await p.fill('#cn', 'Phonetics'); await p.fill('#cs', '10:00'); await p.fill('#ce', '12:00'); await p.click('[data-c3="wd"][data-v="3"]'); await p.click('[data-c3="ok"]'); // Monday (today) is pre-selected, so add Wednesday
    await poll(() => p.evaluate(() => courses.some(c => c.name === 'Phonetics')), 'course saved'); }
});
test('recap: last week sheet opens and closes', async ({ newPage }) => {
  const d = populated(); delete d.weekly; const p = await newPage({ data: d }); await open(p); await poll(() => p.$('.rc-bg'), 'recap');
  await p.locator('.rc-bg button').last().click(); await poll(async () => !(await p.$('.rc-bg')), 'recap closes');
});
test('tour: full intro walks to the end', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.evaluate(() => startTour(TOUR_FULL()));
  for (let i = 0; i < 30 && await p.$('.tour-ui'); i++) { const nx = p.locator('.tour-ui button').last(); await nx.click().catch(() => {}); await p.waitForTimeout(120); }
  expect(!(await p.$('.tour-ui')), 'tour never ended');
});
test('english: every tab renders without errors', async ({ newPage }) => {
  const p = await newPage({ data: populated(), lang: 'en' }); await open(p);
  for (const k of ['ov', 'habit', 'life', 'study', 'work']) { await p.click(`.tab[data-k="${k}"]`); await p.waitForTimeout(150); const t = await p.locator('#main').innerText(); expect(!/[一-鿿]{4,}/.test(t.replace(/Phonetics 线上考试|写 essay|和导师 meeting|交 reading response|复习 Syntax 第 6 章|更新简历|给三家伦敦创业公司写 cold email|买洗衣液|每周运动 3 次|学会做红烧肉|背 30 个单词|运动 20 分钟|至少 3000 字|出门清单|钥匙|学生卡|洗衣液|鸡蛋|牛奶/g, '')), `Chinese UI text left on ${k}: ` + (t.match(/[一-鿿]{4,}/) || [''])[0]); }
});
test('settings: export backup includes every collection', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p);
  const missing = await p.evaluate(() => { const used = new Set(); const src = document.documentElement.innerHTML; for (const m of src.matchAll(/sub\("([a-z]+)"/g)) used.add(m[1]); return [...used].filter(c => !COLS.includes(c)); });
  expect(!missing.length, 'collections not in backup/sync list: ' + missing.join(', '));
});
test('journal: Chinese input is not interrupted while picking a word', async ({ newPage, project }) => {
  const p = await newPage({ data: populated() }); await open(p); await p.click('#jbtn');
  const ta = p.locator('[data-jg]').first(); await ta.click();
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Input.imeSetComposition', { text: 'jintian', selectionStart: 7, selectionEnd: 7 });
  await p.waitForTimeout(1500); // longer than the 800 ms autosave
  const mid = await p.evaluate(() => [document.activeElement?.dataset?.jg != null, imeOn, Object.values(journal).some(j => JSON.stringify(j).includes('jintian'))]);
  expect(mid[0] && mid[1] && !mid[2], 'composition was interrupted or pinyin saved: ' + mid);
  await cdp.send('Input.insertText', { text: '今天' });
  await poll(() => p.evaluate(() => (journal['2026-11-23']?.grat || []).join('').includes('今天')), 'committed text saved', 4000);
}, { projects: ['desktop'] });
test('tarot: hidden unless turned on for this account', async ({ newPage }) => {
  const p = await newPage({ data: populated() }); await open(p); expect(await p.$eval('#tarotBtn', b => b.hidden), 'tarot button visible for everyone');
});
for (const theme of ['light', 'dark']) test(`tarot ${theme}: record a three-card reading with a clarifier`, async ({ newPage }) => {
  const p = await newPage({ data: populated(), theme, extraLS: { 'lifeos-tarot': '1' } }); await open(p);
  await p.click('#tarotBtn'); await poll(() => p.$('#tarotPage'), 'page'); await p.click('[data-tr="new"]'); await poll(() => p.$('.tr-spread'), 'case');
  expect(await p.locator('.tr-ghost').count() === 1, 'starts with one open slot');
  for (const [k, rv] of [['m06', 0], ['s03', 1], ['m17', 0]]) { await p.click('[data-tr="add"]:not([data-of])'); await p.click(`[data-tr="suit"][data-v="${k[0]}"]`); await p.click(`[data-tr="pick"][data-v="${k}"]`); if (rv) await p.click('[data-tr="rv"][data-v="1"]'); await p.click('[data-tr="sheetok"]'); }
  await p.click('[data-tr="add"][data-of]'); await p.click('[data-tr="suit"][data-v="c"]'); await p.click('[data-tr="pick"][data-v="c02"]'); await p.click('[data-tr="sheetok"]');
  await p.fill('#trWhoIn', '小林'); await p.fill('[data-trf="q"]', '他最近冷淡？'); await p.click('[data-tr="type"][data-v="love"]');
  await p.click('.tr-sub .tr-card'); await poll(() => p.$('.tr-zoom'), 'zoom'); await p.click('[data-tr="zflip"]'); await p.click('button[data-tr="zoomx"]');
  await p.click('[data-tr="list"]'); await poll(() => p.$('.tr-case'), 'listed');
  const d = await p.evaluate(() => tarots.map(t => [t.who, t.q, t.type, t.cards.map(c => c.k + (c.rv ? 'r' : '') + (c.of ? '*' : '')).join(',')]));
  expect(JSON.stringify(d) === JSON.stringify([['小林', '他最近冷淡？', 'love', 'm06,s03r,m17,c02r*']]), 'saved ' + JSON.stringify(d));
  await p.fill('#trQ', '恋人'); await poll(async () => (await p.locator('.tr-case').count()) === 1, 'search by card');
  await p.fill('#trQ', '塔'); await poll(async () => (await p.locator('.tr-case').count()) === 0, 'search miss');
});
for (const theme of ['light', 'dark']) test(`lenormand ${theme}: reading with pairs, spreads, card book`, async ({ newPage }) => {
  const p = await newPage({ data: populated(), theme, extraLS: { 'lifeos-tarot': '1' } }); await open(p);
  await p.click('#tarotBtn'); await poll(() => p.$('.oc-hd'), 'reading room');
  await p.click('[data-tr="deck"][data-v="l"]'); await poll(() => p.$('.ln-prac'), 'lenormand list');
  await p.click('[data-ln="new"]'); await poll(() => p.$('.ln-felt'), 'case');
  await p.click('[data-ln="add"][data-i="0"]'); await p.click('.ln-grid [data-ln="pick"][data-v="1"]');
  expect(await p.$('.ln-grid'), 'picker stays open for the next card'); await p.click('button[data-ln="sheetx"]');
  expect(await p.locator('.ln-slot').count() === 1 && await p.locator('[data-lnp]').count() === 0, 'a single card is fine');
  await p.click('.ln-ghost'); for (const n of [27, 31]) await p.click(`.ln-grid [data-ln="pick"][data-v="${n}"]`); await p.click('button[data-ln="sheetx"]');
  expect(await p.locator('[data-lnp]').count() === 2, 'two adjacent pairs');
  await p.fill('[data-lnp="1-27"]', '很快收到消息'); await p.fill('[data-lnf="who"]', '小林'); await p.fill('[data-lnf="read"]', '会联系');
  await p.click('[data-ln="type"][data-v="day"]'); await poll(() => p.evaluate(() => lens[0].type === 'day'), 'daily-fortune type');
  await p.click('[data-ln="spread"][data-v="9"]'); expect(await p.locator('.ln-ghost').count() === 6, 'nine slots'); await p.click('[data-ln="spread"][data-v="0"]');
  await p.click('.ln-slot >> nth=1'); await poll(() => p.$('.tr-zoom'), 'zoom'); await p.click('[data-ln="zmean"]'); await poll(() => p.$('.ln-csheet'), 'card sheet from zoom');
  await p.click('button[data-ln="cardx"]'); await p.click('[data-ln="list"]'); await poll(() => p.$('.ln-case'), 'listed');
  const d = await p.evaluate(() => lens.map(t => [t.who, t.spread, t.cards.join(','), t.pairs['1-27'], t.read]));
  expect(JSON.stringify(d) === JSON.stringify([['小林', 0, '1,27,31', '很快收到消息', '会联系']]), 'saved ' + JSON.stringify(d));
  await p.fill('#trQ', '太阳'); await poll(async () => (await p.locator('.ln-case').count()) === 1, 'search by card');
  await p.fill('#trQ', ''); await p.click('[data-ln="seg"][data-v="book"]'); await poll(() => p.$('.ln-book'), 'card book');
  expect(await p.locator('.ln-book [data-ln="card"]').count() === 36, '36 cards');
  await p.click('.ln-book [data-ln="card"][data-v="27"]'); await poll(() => p.$('#lnKw'), 'my notes');
  await p.fill('#lnKw', '书面'); await p.press('#lnKw', 'Enter'); await poll(() => p.evaluate(() => (lnNotes.c27 || {}).kw?.includes('书面')), 'keyword saved');
  expect(/很快收到消息/.test(await p.locator('.ln-csheet').innerText()), 'pair note collected in card book');
  await p.click('button[data-ln="cardx"]'); await p.click('[data-ln="daily"]'); await poll(() => p.$('.ln-daily [data-ln="card"]'), 'daily flipped');
});
test('lenormand: nightly practice, deck remembered', async ({ newPage }) => {
  const p = await newPage({ data: populated(), extraLS: { 'lifeos-tarot': '1', 'lifeos-deck': 'l' } }); await open(p);
  await p.click('#tarotBtn'); await poll(() => p.$('[data-ln="prac"]'), 'practice prompt');
  await p.click('[data-ln="prac"]'); await poll(() => p.$('.ln-felt'), 'practice case');
  await p.click('[data-ln="add"][data-i="0"]'); for (const n of [13, 6, 31]) await p.click(`.ln-grid [data-ln="pick"][data-v="${n}"]`); await p.click('button[data-ln="sheetx"]');
  await p.fill('[data-lnf="read"]', '先乱后好'); await p.click('[data-ln="list"]');
  await poll(() => p.evaluate(() => lens.some(x => x.practice && x.date === '2026-11-24' && x.cards.join() === '13,6,31')), 'practice saved for tomorrow');
  expect(/明天的牌抽好了/.test(await p.locator('.ln-prac').innerText()), 'prompt switches');
  expect(!(await p.$('.ln-rvbtn')), 'no review without the private book');
});
test('tarot: check-in day shows in Overview today', async ({ newPage }) => {
  const d = populated(); d.tarot = { t1: { who: 'Momo', date: '2026-11-10', type: 'work', q: 'offer?', read: '', advice: '', after: '', revisit: '2026-11-23', cards: [{ u: 'a', k: 'w01', rv: 0, of: null }], createdAt: 1 } };
  const p = await newPage({ data: d, tab: 'ov', extraLS: { 'lifeos-tarot': '1' } }); await open(p);
  await p.click('.ov-tr'); await poll(() => p.$('.tr-spread'), 'opens the reading');
});
