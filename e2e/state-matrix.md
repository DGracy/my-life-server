# 人生服务器 · state matrix

Every cell names the test that covers it. `—` = not applicable. `gap` = not covered yet (see README).

## Regions × data states

| Region | empty `{}` | populated | edge (200-char titles, hostile HTML, 120 tasks) | first run (seed) | corrupt storage |
|---|---|---|---|---|---|
| Overview tab | state empty: ov | state populated: ov | state edge: ov | state: first run seeds examples | state: corrupted storage |
| 打卡 habit | state empty: habit | state populated: habit | state edge: habit | ↑ | ↑ |
| 生活 life (To Do / 吃&买 / 备忘 / 愿望) | state empty: life | state populated: life + nav: life section × 4 | state edge: life | ↑ | ↑ |
| 学习 study | state empty: study | state populated: study | state edge: study | ↑ | ↑ |
| 工作 work | state empty: work | state populated: work | state edge: work | ↑ | ↑ |
| 森林 大陆 / 图鉴 | state empty: forest / forest-dex | state populated: forest(-dex) | state edge: forest(-dex) | — | — |
| 日记 journal | state empty: journal | state populated: journal | state edge: journal | — | — |
| 我的家园 home | state empty: home | state populated: home | state edge: home | — | — |
| 小商店 shop | state empty: shop | state populated: shop | state edge: shop | — | — |
| 信箱 mailbox | state empty: mailbox | state populated: mailbox | state edge: mailbox | — | — |
| 设置 settings | state empty: settings | state populated: settings | state edge: settings | — | — |
| 便签 sticky | state empty: sticky | state populated: sticky | state edge: sticky | — | — |
| 上周小记 recap | — | state: Monday shows last week recap once; recap: opens and closes | — | — | — |

Loading / error states: the app has no network loading in local mode (data is synchronous from localStorage); cloud sync is out of scope offline (gap).

## Controls × states

| Control | effect | validation / refusal | busy / undo |
|---|---|---|---|
| Tabs (5) | nav: tab X highlights exactly itself; nav: chosen tab survives reload | — | — |
| Life sections (4) | nav: life section X | — | — |
| Add task (+) | task: add via + | task: empty title does not save | — |
| Task tick | task: tick done and undo | — | undo snack asserted |
| Task time kinds | task: three time kinds save and show | task: window end before start is refused | — |
| Subtask fold / edit | subtasks: fold by tapping middle | — | — |
| Subtask reorder | subtasks: drag to reorder keeps step days | — | — |
| Habit check-in / back-fill / add / remove | habit: check in waters the sprout; habit: back-fill; habit: add and remove | — | — |
| Overdue → today | overdue: move to today | — | — |
| Capture (小芽 button) | capture: sort free text; capture: inbox | — | — |
| Shopping / wish / memo | life: add a shopping item; life: add a wish; wish: mark done; memo: tick, reset | — | — |
| Food (fridge / wheel) | food: fridge and wheel (smoke) | — | — |
| Sticky notes | sticky: add, tag date, done | — | — |
| Sleep | sleep: wake-up button | — | — |
| Mailbox letter | mailbox: write and seal (draft kept) | — | — |
| Forest | forest: land and dex; forest: rename; forest: plant a tree | — | — |
| Journal | journal: write and save; journal: mood, star, previous day | — | — |
| Time log / courses | time log: add; courses: add a class | — | — |
| Shop | shop: try on, buy, go to home | (cannot afford → disabled, gap) | — |
| Home | home: arrange - size, move, put away | — | — |
| Focus | focus: start; focus: finish a 25 min pomodoro | — | — |
| Tour | tour: full intro walks to the end | — | — |
| Language | settings: switch language; english: every tab renders | — | — |
| Backup | settings: export backup includes every collection | — | — |
| Overlays | nav: Escape closes overlay pages | — | — |
