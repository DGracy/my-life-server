# 人生服务器 · UI tests

Browser tests for every tab, built with the [ui-testing](https://github.com/viviannnl/ui-testing) method
(fixed data → behaviour → state matrix → visual → a11y + keyboard → coverage → strict console).
`@playwright/test` and axe weren't installable here, so `harness.mjs` is a small runner on plain `playwright`,
and `a11y.mjs` is a stand-in for axe (accessible names, img alt, duplicate ids, WCAG AA text contrast).

```bash
npm i playwright sharp            # once
node run.mjs all                  # every test, desktop 1280 + mobile 390
node run.mjs "^nav"               # a regex picks tests
UPDATE=1 node run.mjs "^visual"   # refresh screenshot baselines (look at the diff first!)
node coverage-report.mjs          # % of functions/code run + list of untouched functions
```

- Data: `fixtures/data.mjs` (empty / populated / edge with hostile HTML and 120 tasks). Clock pinned to Mon 23 Nov 2026 10:00 (21:00 for the night theme), `Math.random` seeded, all network blocked.
- Any console error or uncaught exception fails the test.
- `~` in the output = known issue (text contrast below WCAG AA, waiting on a palette decision).
- `state-matrix.md` maps every region/control state to its test.
- Results: `results/results.json`, `results/coverage.txt`, diffs in `results/diff/`.
