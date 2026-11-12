# 🌱 My Life Server · 我的人生服务器

My "life server": a bilingual (中文 / English) task and habit tracker with a sprout that grows as you get things done. Built with AI in one night.

**Try it:** https://my-life-is-mine.netlify.app/

## What it does

- **Four boards, kept apart**: Habits, Life, Study and Work. Each task sits in Inbox, This week, This month or Long term.
- **Sprout grows with you**: every finished task waters it with 1 drop and every check-in with 2. It grows from a seed into a blooming tree over seven stages (200 drops), and flowers on days you finish every check-in.
- **Your forest**: plant each blooming tree on your own meadow (tap a tree to see when it bloomed), or switch to a map of the whole island once the forest gets big, then start a new seed in a colour you pick: Lemon, Sakura, Mint, Sky, Lavender or Maple.
- **Priorities**: mark a task high, medium or low with a little Sprout speech bubble. High ones float to the top, and tapping the bubble changes the level.
- **Quick capture**: tap Sprout in the corner and type something like "Finish my CV by Friday; buy eggs and milk this weekend". It splits the text into tasks, picks a board and works out the dates. Nothing is saved until you confirm.
- **Shopping list**: save staples you buy often, add them in one tap and tick items off at the shop.
- **Notes**: small reusable checklists, like what to pack for a day out. Tick things off, then start over next time with one tap. Pin the ones you use often.
- **Wishlist**: things to buy, places to go and things to do someday. Track how much you've saved toward a purchase, and when a wish comes true it's added to that day's moments.
- **Daily recap with a calendar**: see what you finished each day, pick a Sprout face for your mood, write a reflection, and tap any day in the calendar to read it again.
- **Moments worth remembering**: note the big and small things, like a job offer or your first home-cooked dinner. They light up in gold on the calendar and gather in one list.
- **Weekly and yearly recaps**: the first time you open it in a new week (Monday to Sunday) or a new year, Sprout sums up what you did, says a few kind words and leaves space for your thoughts. You can also open them anytime from the calendar.
- **Light and dark**: light sky blue during the day, deep blue at night.
- **Bilingual**: switch between 中文 and English in ⚙️ settings.
- **Only the boards you need**: turn Habits, Life, the shopping list, Study or Work on and off in ⚙️ settings. Nothing is deleted.

## Your data

Without signing in, everything stays in your own browser (localStorage) and no account is needed. Sign in with Google or email to sync your phone and computer: data is stored in Firebase under your own account, and security rules let only you read or write it. Records you made on a device before signing in are merged into your account. Use ⚙️ → Export backup any time you want a copy.

Firebase isn't reachable from mainland China, so there the app keeps working in local mode.

## 中文说明

一个会长大的个人任务和打卡工具。完成任务、打卡就是给小芽浇水，它会从一颗种子经过七个阶段慢慢长成开花的大树。开花后可以把它种进森林，再选一个颜色种下一颗新种子。

- 打卡、生活、学习、工作四个板块分开管理，每个板块按收件箱、近期、中期、长期分组
- 任务可以设高、中、低优先级，用小芽气泡标在右边，高优先级自动排在最前面
- 点右下角的小芽随手记，自动拆成几条任务、分到对应板块、换算日期，确认后才保存
- 生活板块里有购物清单，常买的东西点一下就加进去
- 还有备忘录：可以反复使用的小清单，比如出门要带的东西，勾完一键重来，常用的可以置顶
- 还有愿望清单：想买的、想去的、想做的都可以放进去，想买的东西能记攒钱进度；愿望实现时会自动记进当天值得记住的大小事
- 今日小结汇总当天完成的事，小芽会写一段鼓励，你也可以选心情、写感想；用月历点任意一天就能回看
- 可以记下「值得记住的大小事」（比如拿到 offer、第一次自己做饭），日历上那天会变成金色，所有大小事也会汇总在一起
- 每周一后第一次打开会弹出「上周小记」，新年第一次打开会弹出「年度总结」，汇总完成的事、小芽说一段话、留一个写感想的框；也可以随时在日历下面回看
- 用不到的板块可以在 ⚙️ 里关掉，数据不会删除
- 不登录时数据只存在你自己的浏览器里；用 Google 或邮箱登录后，手机和电脑自动同步，只有你自己能看到（中国大陆无法使用同步，会自动保持本地模式）

## Run it yourself

It's a single `index.html` file with no build step. Open it in a browser, or host it anywhere that serves static files. The live version runs on Netlify.
