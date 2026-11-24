// Deterministic data sets. "Today" is pinned to Mon 2026-11-23 10:00 (Europe/London = UTC).
export const NOW = new Date('2026-11-23T10:00:00Z');
const T = NOW.getTime(), D = 864e5;
const day = n => new Date(T + n * D).toISOString().slice(0, 10);

export const HINTS_SEEN = ["bd", "grat", "habit", "memo", "ms", "sleep", "wish"];
export const TOUR_SEEN = ['1118','1118b','1118c','1118d','1118e','1118f','1118g','1118h','1118i','1118j','1119','1119b','1119c','1119d','1119e','1119f','1121','1121b','1122','1122b','1122c','1122d','1122e','1123','1123b','1124','1124b','1124c','1124d','1124e'];

export function populated() {
  const tasks = {
    s1: { title: 'Phonetics 线上考试', space: 'study', horizon: 'week', tmode: 'win', start: day(-1), startTime: '14:00', due: day(1), dueTime: '14:00', note: '', done: false, pri: 3, createdAt: T - 5 * D },
    s2: { title: '写 essay', space: 'study', horizon: 'week', due: day(5), dueTime: '12:00', plan: day(2), note: '至少 3000 字', done: false, pri: 2, createdAt: T - 4 * D,
      subs: [{ t: '读文献', done: true }, { t: '列提纲', done: false, day: day(1) }, { t: '写初稿', done: false }, { t: '改稿', done: false }] },
    s3: { title: '和导师 meeting', space: 'study', horizon: 'week', tmode: 'at', due: day(2), dueTime: '15:00', note: 'Zoom', done: false, createdAt: T - 3 * D },
    s4: { title: '交 reading response', space: 'study', horizon: 'week', due: day(-2), note: '', done: false, createdAt: T - 9 * D },
    s5: { title: '复习 Syntax 第 6 章', space: 'study', horizon: 'month', due: null, note: '', done: true, doneAt: T - 2 * D, createdAt: T - 10 * D },
    w1: { title: '更新简历', space: 'work', horizon: 'week', due: day(3), note: '', done: false, pri: 1, createdAt: T - 2 * D },
    w2: { title: '给三家伦敦创业公司写 cold email', space: 'work', horizon: 'month', due: null, note: '', done: false, createdAt: T - 2 * D },
    l1: { title: '买洗衣液', space: 'life', horizon: 'week', due: day(0), note: '', done: false, createdAt: T - D },
    l2: { title: '每周运动 3 次', space: 'life', horizon: 'week', due: day(0), note: '', done: false, createdAt: T - 30 * D, repeat: { freq: 'week', days: [1, 3, 5] } },
    l3: { title: '学会做红烧肉', space: 'life', horizon: 'long', due: null, note: '', done: false, createdAt: T - 30 * D },
  };
  const habits = { h1: { name: '背 30 个单词', archived: false, order: 1, createdAt: T - 30 * D }, h2: { name: '运动 20 分钟', archived: false, order: 2, createdAt: T - 30 * D } };
  const checkins = {};
  for (let i = 1; i <= 6; i++) checkins[day(-i)] = { date: day(-i), done: { h1: T - i * D, ...(i % 2 ? { h2: T - i * D } : {}) } };
  const journal = { [day(-1)]: { date: day(-1), text: '今天把 Phonetics 的笔记整理完了，晚上和朋友吃了火锅。', mood: 4 } };
  const forest = {
    f1: { theme: 'lemon', drops: 60, grownAt: T - 20 * D, kind: 'apple', name: '小苹果' },
    f2: { theme: 'mint', drops: 60, grownAt: T - 8 * D, kind: 'pine', name: '松松' },
  };
  const closet = { n_g_house: { p: 80, at: T - 5 * D }, n_g_fire: { p: 60, at: T - 5 * D }, n_g_cat: { p: 60, at: T - 5 * D }, dz_crown: { p: 80, at: T - 4 * D } };
  const wishes = { wi1: { title: 'Kindle', kind: 'buy', price: 120, cur: 'GBP', saved: null, note: '', img: null, link: null, ord: null, done: false, createdAt: T - 3 * D } };
  const memos = { m1: { title: '出门清单', items: [{ t: '钥匙', done: false, sub: [] }, { t: '学生卡', done: true, sub: [] }], note: '', pinned: true, createdAt: T - D, updatedAt: T - D } };
  const stickies = { k1: { raw: '周五前看完 lecture 5 的 recording', text: '看完 lecture 5 的 recording', date: day(4), before: true, done: false, createdAt: T - D } };
  const pomos = { p1: { taskId: 's2', space: 'study', start: T - D - 25 * 6e4, end: T - D, mins: 25, day: day(-1), mode: 'pomo', tomato: true } };
  const staples = { st1: { name: '鸡蛋', order: 1, createdAt: T - 30 * D }, st2: { name: '牛奶', order: 2, createdAt: T - 30 * D } };
  const weekly = { '2026-11-16': { seen: true }, '2026-11-09': { seen: true } }, yearly = { 2025: { seen: true } };
  return { tasks, habits, checkins, journal, forest, closet, wishes, memos, stickies, pomos, staples, weekly, yearly };
}

// Edge: long text, hostile HTML, many items.
export function edge() {
  const d = populated();
  d.tasks.x1 = { title: '<img src=x onerror="window.__xss=1">超长标题'.padEnd(200, '长'), space: 'study', horizon: 'week', due: day(1), note: '<script>window.__xss=2</script>', done: false, createdAt: T };
  d.tasks.x2 = { title: 'javascript:alert(1)', space: 'life', horizon: 'week', due: null, note: '', done: false, createdAt: T };
  for (let i = 0; i < 120; i++) d.tasks['bulk' + i] = { title: '批量任务 ' + i, space: ['study', 'work', 'life'][i % 3], horizon: ['week', 'month', 'long'][i % 3], due: i % 4 ? null : day(i % 9), note: '', done: i % 5 === 0, createdAt: T - i * 6e4 };
  d.habits.hx = { name: '<b onmouseover="window.__xss=3">'.padEnd(80, '很长的习惯名'), archived: false, order: 3, createdAt: T };
  d.wishes.wx = { title: '"><svg onload="window.__xss=4">', kind: 'buy', price: 99999999, cur: 'GBP', saved: null, note: '', img: null, link: 'javascript:alert(1)', ord: null, done: false, createdAt: T };
  d.stickies.kx = { raw: 'x', text: '<img src=x onerror="window.__xss=5">'.padEnd(200, '便'), date: null, done: false, createdAt: T };
  return d;
}
