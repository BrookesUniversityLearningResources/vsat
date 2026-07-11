# Hosting alternatives — Heroku vs the rest (parked notes)

**Status:** exploratory / parked. This is **not** part of the scaling deliverable ([`scaling-plan.md`](./scaling-plan.md), which is scoped to sizing `vsatool` for workshops). It's a seed for a **future handover / architecture note** — "should VSAT stay on Heroku, or re-platform?" Captured now so the research isn't lost; revisit when a handover or a scale step-change makes it live.

**Bottom line up front:** for VSAT today, **stay on Heroku.** The reason is *ops*, not price — see §4. Prices below are 2026 ballparks; confirm before acting.

---

## 1. The core trade-off

Every alternative sits on one axis: **Heroku charges a premium to run the servers *for* you; everything cheaper hands more of that work back to you.** So the question is never purely "what's cheapest" — it's "how much ops labour are we willing to take on to save how much money."

For context, current Heroku spend is **~$395/yr all-in** (both `vsatool` and `vsat-dev`; see `scaling-plan.md` bottom line).

---

## 2. "Heroku but a bit cheaper" — managed PaaS (git-deploy, keeps the easy life)

| Platform | Rough cost | Fit / notes |
|---|---|---|
| **Render** | Web service $7/mo + managed Postgres from $6/mo ≈ **~$13/mo per app** | Closest Heroku analog; git deploys, autoscaling on paid plans. **Lowest-friction escape hatch** if we ever want off Heroku — slightly cheaper, similar DX. |
| **Railway** | Usage-based, **billed per second**; ~$5/mo baseline + compute | Potentially *cheaper than Heroku for spiky/low usage* like ours; the per-second model suits the workshop-spike pattern well. Managed Postgres less battle-tested than Heroku's. |
| **Fly.io** | Per-VM-second (a shared-cpu-1x/256 MB ≈ $2/mo 24/7); volumes $0.15/GB/mo | Scale-to-zero, global edge, full Docker control. Cheap, but **Postgres is more DIY** (managed offering via partners). More ops than Render. |

## 3. "Much cheaper, but you're now a sysadmin" — raw VPS/IaaS

**Linode (Akamai) / Hetzner / DigitalOcean / Vultr.** Raw compute is *far* cheaper: a Hetzner 8-vCPU / 16 GB box (~€15–30/mo) could serve ~200 concurrent **always on** for less than the Heroku baseline + workshops combined.

The catch: you own **everything Heroku silently does** — OS patching, Postgres install/backups/tuning, TLS certs (Let's Encrypt), the deploy pipeline, connection pooling, reverse proxy, process supervision, monitoring, security hardening, zero-downtime deploys.

---

## 4. Two things worth internalising

1. **"Always-on is ~15× more expensive" was a Heroku-pricing artifact.** On cheap IaaS, always-on big capacity is genuinely affordable (~$400/yr on Hetzner for a box that handles 200 concurrent 24/7). So if the goal is *true* set-and-forget always-on hardware (Eric's instinct — see `scaling-plan.md` "Set and forget"), a VPS is the only economical route — the price is that **someone has to own the box**.

2. **The ops saving is a false economy at this size.** Switching to a VPS might save ~$150–300/yr vs Heroku. At £75/h, even **2–4 hours/year** of maintenance (patching, a Postgres backup scare, a cert renewal) eats the entire saving. VPS economics only win when running *many* apps on one box, or when someone genuinely enjoys running servers.

---

## 5. Recommendation for VSAT — stay on Heroku (for now)

- **Spend is small (~$395/yr) and the ops are already solved and wired** — migrate-on-boot, add-ons, git deploys all work today.
- **Handover matters.** For a university client, "a managed PaaS (or *OBU's own* Heroku Enterprise — see `scaling-plan.md` §6c)" is a far cleaner deliverable than "a Linode box someone at OBU must patch forever."
- **The workshop worry is already handled** — Heroku's per-second scaling makes the spike cheap.
- Switching costs real dev time + risk for modest savings.

## 6. When to actually switch

- **Per-layer first, not all-or-nothing.** The **R2 media migration** (already planned — `cloudinary-migration.md`) is the highest-value "de-Heroku" move: it removes the biggest cost/risk (media bandwidth + suspension) *without* re-platforming the app. That's the pattern — pick the right tool per layer.
- **At the UK-schools / ~2,000-concurrent scale**, Heroku's premium compute genuinely hurts. There, **Fly.io / Render-with-autoscaling or a VPS fleet** would be dramatically cheaper and re-platforming pays for itself. This is the trigger to revisit, and it dovetails with the "different architecture" note in `scaling-plan.md` ("When always-on would be the right call").
- **If VSAT is handed to OBU to self-host**, revisit then — their existing infra (Heroku Enterprise? AWS/Azure? on-prem?) should drive the choice, not a greenfield pick.

---

## Sources (2026 pricing, approximate)

- [Render vs Railway pricing & DX](https://encore.dev/articles/render-vs-railway)
- [Fly.io alternatives & real post-free-tier pricing](https://expresstech.io/7-fly-io-alternatives-in-2026-real-pricing-after-the-free-tier-died/)
- [EU VPS / GDPR-compliant options (Hetzner, Linode EU, Vultr EU, …)](https://danubedata.ro/blog/render-com-alternatives-europe-2026)
