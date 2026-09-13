# 🧭 Campus Compass

A personalised life planner for engineering students. Instead of handing everyone the same
empty timetable, it asks who you are — branch, semester, college hours, career goal, hobbies,
priorities — and **builds the day around that**.

Two students get completely different days:

| | Student A | Student B |
|---|---|---|
| Branch | CSE | Mechanical |
| Goal | Software Developer | GATE |
| Hobbies | Gym + Gaming | Cricket + Reading |
| Result | DSA → project coding → gym → gaming | GATE maths → core subject → PYQs → cricket |

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

First load drops you into a six-step onboarding. After that everything is saved in your browser
(`localStorage`). An account is optional — see [Accounts & cloud sync](#accounts--cloud-sync).

## What's in this version

| Feature | Where |
|---|---|
| Dashboard — progress, next up, schedule, tasks, attendance, countdowns, life balance, weekly chart | `/` |
| My Day — drag & drop timetable, four day modes, add/edit/delete blocks, regenerate | `/day` |
| Tasks — priority, due dates, subject, urgent-first sorting | `/tasks` |
| Focus — Pomodoro with session logging | `/focus` |
| Goals — career roadmap split into months + daily/weekly habits | `/goals` |
| Attendance — per subject %, "can I skip?" maths | `/attendance` |
| Deadlines — exams, assignments, lab files, project stage tracker | `/exams` |
| Profile — edit everything, themes, accent colours, backup/restore, account & sync | `/profile` |

### Day modes

Every day is generated for one of four modes, each weighting your life differently:

- **College Day** — college hours blocked, everything fits around them
- **Weekend** — no college, long project sessions and hobbies
- **Exam Mode** — study and revision expand, hobbies shrink but never disappear
- **Vacation** — skills, projects and internship prep take the whole day

## How the routine engine works

`src/lib/generator.js`:

1. **Anchor the fixed things** — wake, breakfast, travel buffer, college, lunch, dinner, wind-down, sleep.
2. **Collect the wishlist** — career-goal activities, subject study (rotating so every subject
   comes around), revision, and each hobby scheduled on its own weekdays.
3. **Scale to reality** — each activity's length is multiplied by its priority (High 1.25×,
   Medium 1×, Low 0.7×) and the day mode's weight, then scaled down if the day is overbooked.
   Anything that shrinks below 30 minutes is dropped, except one token block per category so
   hobbies never vanish entirely.
4. **Pour into the gaps** — each activity has a preferred time of day (gym in the evening,
   project coding at night, GATE maths in the morning) and is placed in the best-scoring free
   window, shrinking in 15-minute steps rather than accepting a bad slot. Leftover gaps of
   45 minutes or more become explicit **Free time**.

It is deterministic — the same profile and date always produce the same day, so ticking things
off survives a reload.

## Data model

Everything lives in one reducer (`src/lib/store.js`) persisted under
`student-planner-state-v1`. Editing a day saves a *template* for that day mode, so a change to
your College Day layout applies to every college day. "Regenerate" deletes the template and
falls back to the engine.

Catalogues — branches and their semester subjects, nine career goals with 8-stage roadmaps,
twenty hobbies, day modes — are all data in `src/lib/catalog.js`. Adding a goal or hobby is a
data change, not a code change.

## Not built yet

Push notifications, a notes section, deeper weekly analytics, and a real backend with accounts
and sync. Use Export/Import in Profile to move your data between devices in the meantime.
