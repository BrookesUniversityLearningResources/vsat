# VSAT / VSATOOL — Scaling & Provisioning Plan

**Purpose:** size the production stack (`vsatool` on Heroku) for higher-usage scenarios, and set out what to buy, when, and how to switch back afterwards.

**Prepared:** 2026-07-02 · **Target app:** `vsatool` (production) · **Cloudinary:** `cloudinary-cubic-38946`

---

## Decisions at a glance

**Bottom line:** `vsatool` runs on minimum tiers today — fine for everyday use, **not sized for the ~200-person Dublin workshop**. The workshop needs a short, reversible scale-up. Two optional upgrades save money and remove risk long-term.

| # | Decision | Options | Recommendation | Cost of recommended path |
|---|---|---|---|---|
| 1 | **Workshop server shape** (Dublin) | **One bigger server, keep the database** (simple) · vs · **several servers + bigger database** (redundant) | **One bigger server for a one-off event** — two reversible commands, no database migration; trade-off is *no backup if that one server fails mid-event*. Choose the redundant setup only if a mid-workshop outage is unacceptable (details §5b/§7) | **~$16** for the event. The redundant setup costs *similar dollars* but adds a rehearsed database migration + a brief downtime window |
| 2 | **Workshop media/images** | Temporary paid Cloudinary tier · vs · migrate first (row 3) | **Paid tier for the event if Dublin is one-off** — free plan can *suspend images mid-event* | **~$10** — Silver plan billed hourly, on for the event only ($99/mo cap) |
| 3 | **Long-term media** | Stay on Cloudinary · vs · move to Cloudflare R2 | **Migrate if workshops will recur** — media becomes near-free and the suspension risk is gone for good | **~1 day dev, then ~$1–2/yr** (storage; egress is free) |
| 4 | **Login experience** | Email-link only · vs · **add "Sign in with Google"** (email link kept as fallback) | **Add Google** — one click, no inbox trip (helps Eric daily + the workshop) | **~1 day dev, $0/mo to run** |
| 5 | **Workshop login capacity** | Pre-authenticate + ask Magic (our login provider) for a temp limit · vs · nothing | **Pre-authenticate + email Magic 2–4 weeks out** | **$0** |

*Everyday cost stays ~$0 for media (usage is ~10% of the free allowance; stored media is tiny, so dropping back to free after a workshop is safe).*
*Total one-off cost for the Dublin workshop on the recommended path: **~$25–30** (both the server and Cloudinary are billed hourly/pro-rated, so you pay only for the event days — see Action Plan §A).*

### Bottom line — 1-year total

Two Heroku apps run year-round: **`vsatool`** (production) and **`vsat-dev`** (dev/staging — the safe place to test changes and rehearse migrations before they touch production). The dev/staging cost is **common to every path**, so it isn't what distinguishes the options.

These are the actual Heroku invoice line items for the recommended (lean) path:

| Billed line item | Plan & billing | 1-year cost |
|---|---|---|
| `vsat-dev` — Basic dyno + Essential-0 Postgres | $12/mo, always on | **~$145** |
| `vsatool` — Basic dyno + Essential-0 Postgres | $12/mo, always on (everyday baseline) | **~$145** |
| `vsatool` — Performance-M dyno | ~$8/day, hourly, **only on workshop days** (~4 events) | **~$65** |
| `vsatool` — Cloudinary Silver add-on | ~$0.138/hr, hourly, **only on workshop days** (~4 events) | **~$40** |
| **All-in total** | | **≈ $395/yr (≈ £310)** |

The last two lines are the only "workshop" costs — the temporary Performance-M dyno and the temporary Cloudinary Silver add-on, both billed hourly and switched off after each event. Everything else is the steady baseline.

| Path | All-in 1-year total | One-off development |
|---|---|---|
| **Recommended (lean, scale per event)** | **≈ $395/yr** | Google sign-in + R2 migration ≈ **~2 days**, both optional |
| Always-on ("set and forget") | ~$3,750–4,350/yr | none |

*Heroku bills in USD; £ shown at ~1.27. The two workshop line items above assume **~4 Dublin-style (~200-person) events** at ~$25–30 each. **Small classroom events (~10–20 people) cost only ~$4–15 each** (Standard-2X, usually no Cloudinary upgrade — see §A "Match the scale-up to the event size"), so a year of mostly-small events lands well below $395 — closer to **~$330/yr** (~$290 baseline for the two apps + ~$40 of small events). Adjust to your real event mix. After the optional R2 migration, the Cloudinary line disappears entirely (R2's free egress absorbs the spike), leaving only ~$1–2/yr of R2 storage.*

---

## Action plan

Who does what: **Joe** runs the commands; **Eric** approves the spend. Everything below lands on the **existing Heroku monthly invoice** (the Cloudinary add-on bills through Heroku too) — there is **nothing to purchase upfront** and no card to enter on the day; Heroku is pay-as-you-go and pro-rated.

### §A — Dublin workshop: temporary scale-up (recommended simple path)

Two changes, both reversible. This path uses **one bigger web server** and **keeps the current database**, so there is **no database migration** — just two commands up, two commands down.

**~1 week before (Joe):** deploy the vsatlatarium layout-caching change (§8) so a single server comfortably serves ~200 readers; rehearse the steps on `vsat-dev`. **De-risk the single-server choice with a quick load test** (~200 simulated readers against a Performance-M) — if it holds, Option B is confirmed; if it strains, fall back to the redundant setup (§A alternative below). This is the cheapest way to retire the "no backup" worry without paying for redundancy you may not need.

**Day before (Joe, ~10 min):**
```bash
# 1. Bigger web dyno (dedicated CPU, 2.5 GB) — one command, reversible
heroku ps:type web=performance-m --app vsatool

# 2. Cloudinary → Silver (the add-on's Plus-equivalent, ~225 credits)
heroku addons:upgrade cloudinary:silver-2 --app vsatool
#   Billed HOURLY (~$0.138/hr, capped at $99/mo) — so a few days ≈ ~$10, not $99.
#   Gold (cloudinary:gold-2, ~$0.346/hr, $249/mo cap) if you want more headroom.
```
> Confirm Silver's included credits after upgrading (`heroku addons:open cloudinary` → usage). Whether the monthly credit *allowance* pro-rates for a partial month is unverified; to be safe, **upgrade 2–3 days before** (not hours before) so the ceiling is well clear of the ~15–30 GB spike, or use **Gold** for extra headroom. Either way, while on a paid tier the suspension ceiling is far above free's 25 credits.
Then **pre-warm the image cache** (load each story's photospheres once so the first 200 viewers hit a warm CDN), and **ask attendees to log in ahead of time** (spreads the login load; the session then lasts — see §9 / decision 4).

**Day after (Joe, ~5 min):**
```bash
heroku ps:type web=basic --app vsatool                # back to the small server
heroku addons:downgrade cloudinary:starter --app vsatool   # back to free (safe — stored media is tiny)
```

**Web-UI equivalent** (if you prefer clicking): Heroku Dashboard → `vsatool` → **Resources** → change the web dyno type and the Cloudinary add-on plan there; the Cloudinary plan can also be changed in the Cloudinary console.

**Event cost (both pro-rated, so you pay only for the days they're on):** Performance-M ~$8/day → ~$16 for two days; Cloudinary Silver ~$0.138/hr → ~$10 for two days. **≈ $25–30 total** for the event, then everything returns to ~$0/mo. (Worst case, if you leave them on a full month, ~$350 — but there's no reason to.)

#### Match the scale-up to the event size

"Workshop" covers two very different profiles — size the dyno to the crowd:

| Event profile | Concurrent | Web dyno (workshop days) | Postgres | Cloudinary | Per-event cost (2–3 days) |
|---|---|---|---|---|---|
| **Small / classroom** (incl. uploaders) | ~10–20 | **Standard-2X** (~$1.65/day) | Essential-0 (no change) | **Free** on bandwidth; **+Silver only if uploads >10 MB** | **~$4–15** |
| **Dublin-style** | ~200 | **Performance-M** (~$8/day) | Essential-0 (no change) | **Silver** (~$0.138/hr) | **~$25–30** |

Both keep the database as-is, so neither needs the Postgres migration. For a *read-only* small group, even Basic (the everyday dyno) may cope with no upgrade at all — Standard-2X is the safe choice mainly to give RAM headroom for **concurrent uploads** (each buffers up to ~20 MB in the dyno's memory). Command differs only in the tier: `heroku ps:type web=standard-2x` instead of `performance-m`.

#### If the workshop is participatory (attendees *upload*, not just view)

The plan above assumes a read-heavy audience. If attendees also upload photospheres, three extra things apply:

1. **Fix the upload size cap first (code, §8) — before the event.** The app allows 30 MB images, but Cloudinary Silver caps images at **20 MB** (and the free tier at 10 MB), so 20–30 MB uploads would silently fail mid-workshop. Align the app limit to 20 MB (or resize client-side) beforehand.
2. **"Clawback" the created content before downgrading.** Uploads made during the event live on the *temporarily* upgraded Cloudinary. Before reverting to free, run a clawback script: list assets created since the workshop start (Cloudinary Admin API, filter by `created_at`), download originals + derivatives, and store them safely — ideally straight into an R2 bucket. Reasons: **(a)** preservation/backup, and **(b)** if uploads pushed storage near the 25-credit free cap, you may need to move/clean up assets before the downgrade will stick.
3. **Check storage before downgrading.** `heroku addons:open cloudinary` → usage. Baseline was ~1.2 GB; a participatory event may add a few GB but likely stays far under the 25 GB free cap, so the downgrade is safe and images keep working. If it's near the cap, keep a paid tier or clean up after the clawback.

> ⚠️ **A download-only backup is not enough on its own:** the app stores full **Cloudinary URLs in Postgres**, so the created scenes would still point at Cloudinary after a downgrade/detach. Making that content usable elsewhere needs the URL rewrite — which is exactly the R2 migration (§C). **A participatory Dublin is therefore a strong reason to do the R2 migration *before* the event, not after:** uploads then land in R2 directly — no clawback, no downgrade storage risk, no suspension risk, and participants' content is simply there permanently at ~$1–2/yr. The clawback script is, in effect, the first half of that migration anyway.

> **Higher-resilience alternative** (multiple servers + a bigger database, survives a single-server crash): needs a rehearsed database migration and is documented in **§5b / §7**. Only worth the extra complexity if a single-server outage during the event is unacceptable.

**Prepay, autoscaling & scheduling (FAQs):**
- **Can we prepay?** Not on a standard account — Heroku is postpaid/usage-based; the ~$25–30 appears on next month's invoice (prepaid platform credits exist only for Heroku Enterprise, not worth it here). Because Cloudinary is upgraded via the Heroku add-on, media cost lands on that same one invoice. Prepaying wouldn't save money — pro-rated billing already means you pay only for the event days.
- **Should we use autoscaling instead?** No, for a *scheduled* event. Native Heroku autoscaling (Performance dynos only, driven by p95 latency) *reacts* after latency degrades — the first users hit an overloaded box — and it adds *more* dynos, which would exceed Essential-0's connection limit and force the very database migration Option B avoids. Autoscaling earns its keep only for *unpredictable* ongoing traffic (paired with Standard-0 Postgres, i.e. Option A).
- **Can we arrange it in advance?** Yes — since the workshop time is known, schedule the scale-up/down commands with an external cron or GitHub Action (up in the morning, revert in the evening) rather than running them by hand. Deterministic and hands-off, without autoscaling's lag.

### §B — "Sign in with Google" (optional, decision 4)

One-time setup, no running cost. Requires a Google Cloud OAuth client (Joe creates it): **Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application)**, with authorised redirect URIs for `vsatool`, `vsat-dev`, and localhost. The client ID/secret go into Heroku config vars; the email-link login stays as a fallback. Implementation is a small change to the existing Passport setup — see the auth notes (separate task).

### §C — Media migration to Cloudflare R2 (optional, decision 3)

Only if workshops will recur / to remove the suspension risk permanently. ~1 day of work; full implementation plan in [`cloudinary-migration.md`](./cloudinary-migration.md). After it ships, decisions 1–2 no longer need a Cloudinary upgrade at all.

---

## "Set and forget": the always-on option (what was asked for)

A fair question: *can we just provision it once, big enough for anything, and never touch it again?* **Yes — it's entirely possible.** Here is what it costs, and why we recommend a different route.

**What "always ready for 200 users, 24/7" requires:**

| Layer | Always-on plan | Monthly |
|---|---|---|
| Web server | Performance-M running 24/7 (or 3× Standard-2X for redundancy) | ~$150–250 |
| Database | Standard-0 (needed once you run redundant/autoscaled servers) | ~$50 |
| Media | Cloudinary Silver, always on | ~$99 |
| **Total** | | **~$300–350/month (~$3,600–4,200/year)** |

**Versus running lean and scaling up only for events:**

| | Everyday baseline | Per workshop | ~4 workshops/year |
|---|---|---|---|
| Cost | ~$12/month (today's tiers) | ~$25–30 | **≈ $260/year** |

Always-on costs roughly **15× more per year** — about **$3,600 vs $260** — to keep capacity permanently reserved for a 200-person peak that happens a handful of times a year, while everyday load (~60 users) is a small fraction of what the baseline already handles comfortably. It's renting a 500-seat auditorium every day of the year for an event held once a quarter.

**Why we don't recommend it:** the money buys idle capacity, not reliability or convenience you can't get more cheaply. The one thing that genuinely *feels* risky about the lean approach — "what if I forget, and images go dark mid-event?" — is better solved directly and permanently (below) than by paying $99/month indefinitely for media headroom you use ~10% of.

**How to get the *feeling* of set-and-forget at on-demand cost** — this is the actual recommendation:

1. **Migrate media to Cloudflare R2 once** (decision 3). This *permanently* removes the only scary always-on risk — mid-event image suspension — for ~$1–2/year (storage; egress is free). After this, media never needs a thought again.
2. **Put the compute scale-up/down on a schedule** (a small cron job / GitHub Action tied to workshop dates). On the day, the server grows and shrinks by itself; nobody touches anything.

The result: **you never manually manage infrastructure, the suspension risk is gone for good, and it costs ~$260/year instead of ~$3,600.** The only thing that scales is compute — automatically, on dates you set in advance. That is the honest way to deliver "set and forget" without paying a permanent premium for idle capacity.

### When always-on *would* be the right call

The instinct isn't wrong — it's a **scaling-maturity instinct that's simply early** for a pilot with occasional workshops. It becomes the correct choice the moment VSAT crosses from *occasional scheduled events* into *continuous or unpredictable usage*. Concretely, revisit always-on when **any** of these becomes true:

- **Frequency** — high-load sessions happen ~weekly or more. (Pure cost break-even is ~100+ events/year, i.e. roughly twice a week; but manual toggling gets tiresome well before that — at which point the answer is the *scheduled-cron automation* above, not permanent infrastructure.)
- **Unpredictability** — load can arrive with **no known date** (a public launch, press coverage, or many independent teachers each on their own timetable). On-demand scaling works *because* Dublin has a date; remove the date and you have to be permanently ready.
- **Sustained growth** — everyday concurrency settles in the **low hundreds** as a steady state rather than a spike. Then the bigger tiers aren't a premium — they're just correct sizing.
- **Contractual reliability** — schools come to depend on it *during* class. Then redundancy and database high-availability must be always-on for uptime, independent of cost.

**The vivid version — "rolled out across UK schools, ~2,000 concurrent."** That isn't "always-on vs on-demand"; it's a **different architecture**. At that scale you'd need: a horizontal fleet of web dynos with **autoscaling**; user sessions moved to **Redis** (or PgBouncer) so the database survives thousands of connections; **Cloudflare R2 for media**, because Cloudinary bandwidth at 2,000 viewers would be enormous and R2's egress is free; and a **scalable sign-in** path (Google / enterprise SSO — Magic's 500-requests/minute cap would break instantly). At that point, provisioning permanently and autoscaling *within* it is simply the correct design.

**The reassuring part: nothing we're recommending now is throwaway.** The two lean-path steps — **R2 media** and **scheduled scaling automation** — are the *first two building blocks* of that at-scale architecture. R2 is outright *required* at 2,000 concurrent; the scheduled cron matures into autoscaling. So the economical path today sits directly on the road to the at-scale path — we're not building anything we'd later throw away.

---

## Executive summary

**The ask:** size `vsatool` for two cases — ~60 everyday users, and a Dublin workshop with ~500 registered / **~200 simultaneous** readers.

**Where we stand:** `vsatool` runs today on the *minimum* paid tier of everything — a single Basic web dyno, the smallest Postgres, and Cloudinary's **free** media plan. That is fine for everyday use but is **not sized for 200 concurrent users**.

**The one urgent risk:** on the free Cloudinary plan, if the workshop's image traffic exceeds the monthly allowance, Cloudinary **suspends delivery rather than billing us** — i.e. images could go dark *mid-workshop*. This must be addressed before Dublin.

**The plan — a temporary scale-up, not a permanent bill.** For the workshop we raise two things: the web server (a bigger machine) and Cloudinary (a temporary paid tier). Both are billed **by the hour** and revert with a single command, so we **scale up the day before and back down after** — the real cost is **~$25–30 for the event**, not an ongoing expense.

**Good news from checking the numbers:** our stored media is tiny (~1.2 GB), so returning to the free plan afterwards is safe; and everyday usage sits at ~10% of the free allowance, so **outside workshops we pay nothing for media.**

**Two optional improvements worth considering** (details inside):
1. **Move media off Cloudinary** to a cheaper backend (Cloudflare R2). ~1 day of work, then media costs ~$1–2/year (egress is free) *and* the suspension risk is gone permanently. Worth it if workshops recur.
2. **Add "Sign in with Google"** alongside the current email-link login. One click, no inbox round-trip — removes a daily annoyance (incl. for Eric) and also sidesteps the login-related workshop risks. The email link stays as a fallback.

**On login (Magic — our current email-link login provider, magic.link):** the free tier covers the workshop on volume, but a mass simultaneous login could hit a rate limit — mitigated by asking people to log in ahead of time and by requesting a temporary limit increase from Magic 2–4 weeks out. Note Magic has pivoted toward crypto; we should confirm our email-login product is still supported (another reason to add Google).

**Decisions needed from Eric:** (a) is Dublin one-off or the first of several? (governs media strategy); (b) go ahead with "Sign in with Google"? (c) approve the temporary workshop scale-up budget; (d) does OBU have a Heroku Enterprise account these apps could sit under? (enables prepaid/committed budget + institutional ownership — see §6c).

---

## 1. Usage scenarios

| Scenario | Load | Nature |
|---|---|---|
| **Steady state** | "~60 users maximum" | Mixed authoring + reading, rarely all concurrent |
| **Dublin workshop** | ~500 registered online, **~200 simultaneous** | Almost entirely **read-heavy** — reader + vsatlatarium |

The workshop is the sizing driver. It is a **one-off spike**, so the plan is to scale up shortly before and scale back down after — not to run large infrastructure year-round.

---

## 2. Current state (`vsatool`, as provisioned today)

| Layer | Current plan | Key limit |
|---|---|---|
| Web dyno | **Basic** ×1 ($7/mo, 512 MB, shared CPU) | Basic/Eco dynos **cannot run more than one instance** — no horizontal scaling |
| Postgres | **Essential-0** ($5/mo) | **20 connections total**; no HA, fork, or rollback |
| Cloudinary | **Starter = free** (25 credits/mo) | 25 credits = 25 GB bandwidth **shared with storage + transforms**; overage → **account suspension, not billing** |
| Auth | **magic.link** (free "Developer" tier) | 1,000 monthly active users free |

Two facts from the code that drive the sizing:

1. **Every authenticated request touches Postgres** — sessions are stored in PG (`connect-pg-simple`), and the `pg.Pool` is created with no config, so it defaults to **max 10 connections**. The 20-connection Essential-0 ceiling is the real throughput cap.
2. **Photospheres are delivered directly from Cloudinary's CDN**, not through the dyno. Under a 200-viewer read load the **dyno stays light but Cloudinary bandwidth spikes** — and the free tier *suspends delivery* when credits run out. This is the single highest-risk item for a live event.

---

## 3. Why the current stack won't hold 200 concurrent users

- **Cloudinary free tier suspends on overage.** 200 concurrent photosphere viewers can plausibly push 15–30 GB of delivery in the event window (see §4), at/over the 25 GB free cap — and the failure mode is *delivery stops mid-workshop*, not a bill.
- **Basic dyno can't scale out.** You cannot add instances without moving to the Standard tier; a single Basic dyno (shared CPU, one Node process) won't serve 200 concurrent readers reliably.
- **Postgres 20-connection ceiling.** With sessions in PG, connections are consumed per request; scaling to multiple dynos immediately exceeds 20.

---

## 4. Bandwidth estimate (verify against the dashboard)

A 2500px photosphere delivered as an auto-quality JPEG is roughly **1–2 MB**. A single workshop session:

```
200 users × ~15 scenes × ~1.5 MB ≈ 4.5 GB   (cold cache, one pass)
```

Add repeat browsing, the vsatlatarium loading many images at once, and thumbnails, and **15–30 GB across the event is realistic** — right at or over the 25 GB free cap, before counting stored library or transforms.

> **Empirical check (in the Cloudinary dashboard Rich shared):** current-month **credits used**, **total storage** (see the downgrade caveat in §6), and **average delivered bytes per image**. Those three numbers turn this estimate into a real figure.

---

## 5. Recommended configuration

### 5a. Steady state (~60 users) — minimal change

- **Dyno:** Basic is workable; **Standard-1X ($25)** only if you want metrics and consistent CPU.
- **Postgres:** Essential-0 (20 conn) survives on one dyno **if the pool max is set explicitly (~15)** and monitored.
- **Cloudinary:** free may survive light months, but steady photosphere viewing drifts toward 25 GB — **watch the credit meter and be ready to move to Plus**.
- **Magic:** free tier, no action.

### 5b. Dublin workshop (~200 concurrent) — temporary scale-up

Two viable shapes; pick based on how much production churn you want. **The Action Plan (§A) uses Option B as the recommended default** for its simplicity; Option A is the resilience upgrade.

**Option B — Vertical (recommended default: fewest moving parts)**
- **Dyno:** **1 × Performance-M ($250/mo, ~$8/day, 2.5 GB, dedicated CPU)** — a single reversible command, no database change.
- **Postgres:** **stay on Essential-0**, set pool max ~15 — one dyno keeps total connections under 20, so **no PG migration needed**.
- Trade-off: single dyno = single point of failure and one Node event loop. Fine for read-heavy load with a cached vsatlatarium layout and CDN-served images, but no redundancy.

**Option A — Horizontal (resilience upgrade)**
- **Dyno:** move to **Standard** and run **3–4 × Standard-2X ($50 each)**. Sessions are shared in PG, so scaling out is clean (no sticky sessions). Redundancy: if one dyno dies, the event continues.
- **Postgres:** **Standard-0 ($50/mo, 120 connections + PgBouncer)** — required because 3 dynos × pool-10 = 30 connections exceeds Essential's 20.
- ⚠️ Essential→Standard is a **data migration, not a plan flip** (Essential has no fork/follow). Provision and test **in advance** (see §7), don't do it on the day. Choose this only if a single-server outage during the event is unacceptable.

**Both options also need:**
- **Cloudinary → Plus ($99/mo monthly) minimum**, Advanced (~$224/mo) for headroom. Pre-warm the CDN cache (load the images once beforehand) so 200 cold caches don't all hit origin.
- **Magic:** free tier covers 500 users on volume. **Pre-authenticate attendees** ahead of time to spread the login burst (the 24 h session cookie means they won't re-auth during the event); confirm burst email rate limits with Magic.

> The app runs **one Node process per dyno** (no `WEB_CONCURRENCY` clustering), so under Option A parallelism comes from *more dynos*, not bigger ones. Either way, **cache the vsatlatarium server-side layout** so 200 loads don't each recompute the spring physics.

---

## 6. Billing — what to buy, when, and how to switch back

The whole strategy depends on **paying the premium only for the event window**. Here's how each service bills:

| Service | Billing model | Switch up/down? | Prepay needed? |
|---|---|---|---|
| **Heroku dynos** | **Per-second**, postpaid, prorated | Instant via `ps:type` / `ps:scale`; scale down anytime | No |
| **Heroku Postgres** | Prorated per plan; postpaid | Essential↔Standard is a **data migration**, not instant — plan the window | No |
| **Cloudinary** | Monthly or annual subscription; **credits reset monthly** | Self-service monthly plans up/downgrade at the period boundary | Only if you choose annual (don't — see below) |
| **Magic** | Free tier, or Startup $99/mo month-to-month | Subscribe/cancel monthly | No |

**Nothing here requires true upfront prepayment.** Heroku is postpaid and billed to the second, so running Standard/Performance dynos for a few days costs a few days' worth. The only "prepay" option is a Cloudinary *annual* commitment — which we specifically want to avoid for episodic use.

### The Cloudinary $89 vs $99 question

Not a bait-and-switch. **$89/mo is the price when billed annually** (a 12-month commitment, ~$1,068 up front); **$99/mo is month-to-month.** For our pattern — pay only in conference months, drop back to free otherwise — **take the monthly $99 plan.** The $89 annual rate would lock in a full year and defeat the switch-back strategy.

### Downgrade caveat — checked, and it's fine

Cloudinary's free tier's 25 credits are **shared across storage *and* bandwidth *and* transforms**, so a large stored library could in principle block a return to Free. **We measured it** (Cloudinary usage API, `vsatool`, 2026-07-02):

| Metric | Current usage | Credits |
|---|---|---|
| Storage | **~1.2 GB** (386 originals + 596 derived = 982 objects) | 1.12 |
| Bandwidth (rolling period) | **~1.9 GB** | 1.77 |
| Transformations | **0** | 0.00 |
| **Total** | | **2.89 / 25 (11.6%)** |

Storage is ~1.2 GB — nowhere near the 25-credit floor — so **dropping back to Free after the workshop is completely safe**. Normal monthly bandwidth (~1.9 GB) is only ~7% of the free cap; the *only* reason we'd ever pay Cloudinary is the one-off workshop spike.

### What Cloudinary Plus covers (media limits)

- 20 MB max image file size
- 2 GB max video file size
- 20 MB max raw file size
- 100 MB max image transformation size
- 300 MB max video transformation size
- 25 MP max image megapixel
- 100 MP max megapixel across all frames

> ⚠️ **Upload-cap mismatch:** the app currently allows **30 MB** image uploads (`config/default.json`), but Cloudinary caps images at **10 MB (free) / 20 MB (Plus) / 40 MB (Advanced)**. So today any 10–30 MB image upload silently fails at Cloudinary, and even on Plus, 20–30 MB uploads fail. Either **cap app uploads at 20 MB** (align to Plus), resize client-side, or go **Advanced (40 MB)** if large originals are needed. See §8.

### Indicative cost — workshop window only

| Item | Option A (horizontal) | Option B (vertical) |
|---|---|---|
| Dynos | 3× Standard-2X = $150/mo equiv | 1× Performance-M = $250/mo equiv |
| Postgres | Standard-0 = $50/mo | Essential-0 = $5/mo (no change) |
| Cloudinary | Plus $99 (or Advanced ~$224) | Plus $99 (or Advanced ~$224) |
| Magic | $0 (free) | $0 (free) |
| **Monthly-equivalent** | **~$300–370** | **~$355–480** |

Because dynos bill per-second and add-on changes prorate, the **actual spend is only the days the higher tiers are live** — scale up ~1 day before, down ~1 day after. The workshop premium is realistically tens of dollars, not the full monthly figures above (except Cloudinary, which bills a full month minimum).

---

## 6b. Alternative: swap the media backend instead of paying Cloudinary

The usage data (§6) shows we barely use Cloudinary's actual product: **transformations = 0**, and the app produces just **two fixed derivatives at upload time** (2500px scale + 288×192 thumbnail), never transforming at view time. So Cloudinary is functioning only as **storage + CDN + an upload-time resize** — all of which are replaceable. This opens a cheaper path than paying for Plus during spikes.

**Option 1 — Stay on Cloudinary; one month of Plus, then downgrade (~$99, near-zero effort).**
Storage is ~1.2 GB, so the post-workshop downgrade to Free is proven safe (§6). No code changes, no migration, no production risk. **For a genuinely one-off event this is almost certainly cheaper than the engineering time to swap.**

**Option 2 — Swap to a zero/low-egress backend (near-free steady state, real dev work).**
Feasible precisely because we need only 2 fixed sizes and no runtime transforms:

| Backend | Storage (1.2 GB) | Bandwidth (30 GB workshop spike) | Resize approach |
|---|---|---|---|
| **Cloudflare R2** | ~$0.02/mo | **$0** (egress free) | `sharp` in the upload route |
| **Bunny.net** | ~$0.01/mo | ~$0.30 | `sharp`, or Bunny Optimizer (~$9.50/mo flat) |
| Cloudinary Free | 1.12 credits | suspends past 25 GB | built-in (current) |

Either backend **eliminates the mid-event suspension risk permanently** and drops steady-state media cost to ~$0. The cost is engineering effort:
- Replace the Cloudinary eager transforms with **`sharp`** at upload (generate the 2500px + thumbnail server-side).
- Rewrite upload + delivery-URL handling; **audio** currently rides on Cloudinary (as a `video` resource type) too.
- **Migrate 386 existing assets** and their stored URLs/public_ids (one-off script).
- Provision bucket + CDN + credentials; test.

**Recommendation:** if Dublin is essentially one-off, **take Option 1** — $99 for the month beats the migration cost, and the downgrade is safe. If workshops will **recur**, or you want to remove the suspension risk structurally, **Option 2 (R2 + `sharp`)** pays for itself quickly and is well-scoped because we use none of Cloudinary's dynamic features. It also composes with the "signed direct upload" idea (§8.4) — a browser→R2 direct PUT plus a `sharp` step.

> **Full implementation plan for Option 2:** see [`cloudinary-migration.md`](./cloudinary-migration.md). Short version: the swap is a single dependency-injection seam (`getEnvironment.ts:137,146`), the DB already stores full derivative URLs so delivery needs no code change, and a one-time script copies 386 assets + rewrites their URLs. The one real gotcha is COEP/CORS headers on the new CDN (A-Frame textures). Honest effort: a focused half-to-full day, not an hour — but a one-time cost that permanently deletes the media line item and the suspension risk.

---

## 6c. If OBU has a Heroku Enterprise account (worth checking)

Prepaying / committing budget in advance is **only** possible under Heroku Enterprise (standard accounts are strictly postpaid). So it's worth asking whether **Oxford Brookes already holds a Heroku Enterprise agreement** these apps could sit under. If it does, Enterprise changes the *procurement and governance* picture — **not** the technical plan and not really the cost.

**What it would give us:**
- **Prepaid / committed budget** — Enterprise buys **add-on credits (1 credit = $1)**; OBU could commit a budget via purchase order and run the apps against that pool. This is the legitimate version of Eric's "pay for it up front" instinct — on the *budget* side, not the infrastructure side.
- **Institutional billing & ownership** — the apps run under OBU's account, billed through their existing agreement rather than an individual's card. Good for continuity and handover: the *university* owns the infrastructure, not one person.
- **Governance** — SSO, usage reports, audit logs, spend visibility.
- **Support / SLA** — matters only if the project becomes something people depend on.

**⚠ Crucial distinction — use an Enterprise *Team* (Common Runtime), NOT a Private Space:**
- An **Enterprise Team** keeps the exact same cheap dynos (Basic/Standard/Performance) and the hourly add-on billing this whole plan is built on — so **every number above (~$395/yr, per-event costs) still holds**; you just gain the governance/credits layer on top.
- A **Private Space** (network-isolated runtime) is a different, far pricier product: **$1,000/month per space** *plus* costlier Fir-generation dynos with **no Basic tier** — wildly disproportionate for a ~$400/yr app. Only consider it if OBU compliance *mandates* network isolation or a specific data region (e.g. for student personal data).

**What Enterprise itself costs — and why this is strictly a "piggyback" play:** Heroku Enterprise has **no published price**; it's a custom, negotiated Salesforce contract, historically a committed-use agreement **in the tens of thousands of dollars per year** with an annual minimum. So the logic is binary:
- **If OBU does *not* already have Enterprise → forget it.** Signing a ~$X0,000/yr contract to host a ~$400/yr app is a ~100× mismatch (plus a procurement cycle). Not worth considering.
- **If OBU *already* has Enterprise → adding VSAT costs ~$0 marginal.** The ~$400/yr of real usage simply draws down their existing credit pool; the governance/ownership/prepaid-budget benefits come essentially free because the contract is already paid for.

**Net:** Enterprise won't make this cheaper — on ~$400/yr any volume discount is rounding error — and a Private Space would make it *much* more expensive. It's **only ever worth it as a piggyback on an account OBU already pays for**, never as something acquired for this project. Its value in that case is **procurement, institutional ownership, and governance**, which happen to satisfy the "commit it in advance" instinct on the budget side while the technical scale-up stays identical.

**To confirm with OBU IT:** (a) do they have a Heroku Enterprise account? (b) can `vsatool` / `vsat-dev` be transferred into their Enterprise Team? (c) any data-residency / compliance requirements for the content? (d) their committed rates, if any.

---

## 7. Timeline & commands (run against `vsatool`, test on `vsat-dev` first)

> `vsatool` is production and deploy-sensitive (migrate-on-boot). Dyno scaling and Postgres provisioning below are reversible/prorated, but rehearse the Postgres migration on `vsat-dev` first.

**Decide first:** media strategy — Cloudinary Plus for the month (§6b Option 1) vs. backend swap (§6b Option 2). The steps below assume Option 1; a swap replaces the Cloudinary upgrade with the R2/Bunny migration and should land ~2+ weeks out.

**~1 week before**
- [x] ~~Verify Cloudinary storage/bandwidth~~ — measured 2026-07-02: ~1.2 GB storage, ~1.9 GB bandwidth, 2.89/25 credits (downgrade after is safe).
- [ ] Confirm Magic burst email rate limits; plan attendee pre-authentication.
- [ ] (Option A) Rehearse the Postgres migration on `vsat-dev`.
- [ ] Ship code changes (§8) via the normal deploy path.

**~1 day before**
- [ ] Upgrade Cloudinary to **Plus** (monthly): `heroku addons:upgrade cloudinary:plus --app vsatool` *(confirm the Heroku add-on plan name exists; otherwise upgrade in the Cloudinary console directly)*.
- [ ] Scale dynos:
  - Option A: `heroku ps:type web=standard-2x --app vsatool` then `heroku ps:scale web=3 --app vsatool`
  - Option B: `heroku ps:type web=performance-m --app vsatool`
- [ ] (Option A) Provision + promote Standard-0 Postgres:
  ```
  heroku addons:create heroku-postgresql:standard-0 --app vsatool
  heroku maintenance:on  --app vsatool
  heroku pg:copy DATABASE_URL <NEW_URL> --app vsatool
  heroku pg:promote <NEW_URL> --app vsatool
  heroku maintenance:off --app vsatool
  ```
- [ ] Pre-warm the CDN: load each story's photospheres once.

**After the event**
- [ ] `heroku ps:scale web=1 --app vsatool` and `heroku ps:type web=basic --app vsatool`
- [ ] (Option A) Migrate back to Essential-0 (same copy/promote pattern) and destroy the Standard DB.
- [ ] Downgrade Cloudinary back to Free (safe — storage ~1.2 GB, see §6).

---

## 8. Code changes to make regardless of plan

These reduce the tier you need and remove latent failures. All require the normal deploy path + testing.

1. **Explicit `pg.Pool` config** — set `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` (currently unconfigured, default max 10). Under Option A also validate PgBouncer/transaction-mode compatibility with `connect-pg-simple`.
2. **Cache the vsatlatarium layout** — the server-side spring-physics layout is recomputed per request; cache it so 200 simultaneous loads don't each recompute.
3. **Align the upload cap** — bring the 30 MB image limit into line with the Cloudinary plan (20 MB on Plus) or resize client-side, to stop silent upload failures.
4. **(Optional) Signed direct-to-Cloudinary uploads** — today `multer` buffers the whole file in dyno RAM before streaming to Cloudinary. Signed browser-direct uploads remove the dyno from the upload data path. Worth doing **if authors will create content live during the workshop**; not a blocker for a read-heavy audience.
5. **(Optional) Redis session store** — moving sessions off Postgres to a Heroku Key-Value Store relieves the DB connection pressure during the login burst.

---

## 9. Magic Link — capacity vs. strategy

- **Capacity:** 500 attendees + 60 regulars < the 1,000-MAU free tier, so **no upgrade is needed for volume**. Startup ($99/mo, month-to-month, 2,500 MAU + MFA/managed sessions) is available but its headline features are redundant here (VSAT already runs its own PG sessions) — you'd buy it only for support/rate-limit insurance during the live event.
- **Rate limit (checked 2026-07-02):** Magic's documented default is **500 API requests/minute per application** (`429` when exceeded); no separate email throttle. The risk is a **synchronized login rush**, not total volume — `200 logins × ~2–3 requests ≈ 400–600 req/min`, right at/over the cap. Mitigations: (1) **stagger / pre-authenticate** attendees before the session (the 24 h session cookie means they don't re-auth, so spreading logins over 5–10 min stays well under 500/min); (2) **contact Magic sales 2–4 weeks ahead** — their docs explicitly invite a temporary custom rate limit for high-volume events. *This is the concrete "upgrade beyond the basic offering": a temporary rate-limit bump, arranged in advance — not a plan tier.*
- **Product-continuity red flag:** Magic's `dedicated`/email-magic-link docs now **redirect to the docs root** and the whole site is rebranded to "embedded wallets" (web3); the documented rate limit also dropped from 2,000→500/min. Strong signal the classic passwordless-email product is being de-emphasized. **Confirm directly with Magic that it's still supported.** Since Magic here only does email-link delivery + token verification, it's cleanly replaceable (self-hosted links via Postmark/SES, or Clerk/Supabase) if long-term de-risking is wanted.

---

## 10. Open items to confirm

- [x] ~~Cloudinary storage/usage~~ — measured (§6): ~1.2 GB storage, ~1.9 GB bandwidth, 2.89/25 credits.
- [x] ~~Heroku Cloudinary add-on plan names~~ — confirmed: `silver-2` (~$99/mo cap, Plus-equiv), `gold-2` (~$249, Advanced-equiv), billed hourly.
- [ ] **Media strategy decision:** temporary Cloudinary Silver per event (§6b Opt 1) vs. backend swap to R2 (§6b Opt 2) — and **will the workshop be participatory (attendees upload)?** (a participatory event pushes R2 to *before* Dublin — §A).
- [ ] **Does OBU have a Heroku Enterprise account** these apps could sit under? If so, transfer into an Enterprise *Team* (not a Private Space) for prepaid budget + institutional ownership (§6c).
- [ ] Magic: burst email rate limits; is the passwordless email product still supported on our plan?
- [ ] Choose **Option B (vertical, simplest — default)** vs **Option A (horizontal, resilient)** for compute.
- [ ] If staying on Cloudinary: decide **Silver vs Gold** once avg delivered-bytes is confirmed (note the 20 MB vs 40 MB upload-cap implication).
