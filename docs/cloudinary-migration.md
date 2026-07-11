# Migrating off Cloudinary → object store + CDN + `sharp`

Companion to [`scaling-plan.md`](./scaling-plan.md) §6b. This is the implementation plan for replacing Cloudinary with a plain object store (**Cloudflare R2** recommended) plus server-side resizing via **`sharp`**, so media hosting costs ~$0 and the free-tier *suspension* risk disappears permanently.

**Why it's viable (from the usage data):** Cloudinary transformations = 0; the app produces just **two fixed derivatives** at upload (2500px scaled `url`, 288×192 `thumbnailUrl`) and never transforms at view time. So Cloudinary is only storage + CDN + an upload-time resize — all replaceable.

**Why it's cheap to do (from the code inventory):** the storage layer holds **full derivative URLs**, and uploads go through a **single dependency-injection seam**. Delivery needs no code change beyond the stored URLs pointing at the new CDN.

---

## 1. The seam

Uploads are injected in `src/environment/getEnvironment.ts:137,146`:

```ts
saveSceneImage(log, getDB, uploadImageToCloudinary(log), createImageInDatabase(...))
saveSceneAudio(log, getDB, uploadAudioToCloudinary(log), createAudioInDatabase(...))
```

`uploadImageToCloudinary(log)` returns an `UploadImage` = `(name, data: Buffer) => Promise<{ url, thumbnailUrl }>`; the audio one returns `UploadAudio` = `(name, data) => Promise<{ url }>`. `name` is the deterministic `"{storyId}-{sceneId}"` (from `imageName`/`audioName`). **Swap these implementations and the domain layer (`saveSceneImage`, `saveSceneImage`, mappers, routes, frontend) never knows.**

Delete has the same shape via `src/util/cloudinary/deleteMediaInCloudinary.ts` (`destroy(name)`), wired through `deleteImageFromCloudinary` / `deleteAudioFromCloudinary`.

---

## 2. Backend choice — Cloudflare R2 (recommended)

| | **Cloudflare R2** | Bunny.net |
|---|---|---|
| Egress | **Free** (the whole point for a bandwidth spike) | ~$0.01/GB (30 GB ≈ $0.30) |
| Storage (1.2 GB) | ~$0.02/mo | ~$0.01/mo |
| API | **S3-compatible** (`@aws-sdk/client-s3`) | HTTP / S3-ish |
| CDN + header control | Cloudflare in front, full response-header control | Edge rules |
| COEP/CORS headers (critical, §5) | Set via Cloudflare rules / R2 CORS | Bunny edge rules |

**R2 + a Cloudflare custom domain** wins: free egress makes the workshop spike cost nothing, it's S3-compatible so `@aws-sdk/client-s3` "just works", and Cloudflare gives the response-header control we need for A-Frame textures under COEP (§5).

---

## 3. New adapter (replaces the Cloudinary upload/delete files)

New files under e.g. `src/domain/image/objectstore/` and `src/domain/audio/objectstore/`, keeping the same exported function types.

**Image** — resize with `sharp`, put both derivatives:

```ts
// uploadImageToObjectStore(log): UploadImage
const scaled = await sharp(data).rotate()            // respect EXIF orientation
  .resize({ width: 2500, withoutEnlargement: true })  // matches c_scale,w_2500
  .jpeg({ quality: 82 }).toBuffer();
const thumb = await sharp(data).rotate()
  .resize({ width: 288, height: 192, fit: "cover" })  // ⚠ verify vs current thumbnail (§7)
  .jpeg({ quality: 80 }).toBuffer();

await put(`image/${name}.jpg`, scaled, "image/jpeg");
await put(`image/${name}-thumb.jpg`, thumb, "image/jpeg");
return {
  url:          `${PUBLIC_BASE}/image/${name}.jpg`,
  thumbnailUrl: `${PUBLIC_BASE}/image/${name}-thumb.jpg`,
};
```

**Audio** — no transform; put the buffer:

```ts
// uploadAudioToObjectStore(log): UploadAudio
await put(`audio/${name}`, data, contentType);
return { url: `${PUBLIC_BASE}/audio/${name}` };
```

`put` = `@aws-sdk/client-s3` `PutObjectCommand` against the R2 endpoint (`region: "auto"`). **Delete** = `DeleteObjectsCommand` on `image/${name}.jpg` + `image/${name}-thumb.jpg` (and `audio/${name}`).

Then in `getEnvironment.ts` swap `uploadImageToCloudinary` → `uploadImageToObjectStore`, etc. Add `sharp` and `@aws-sdk/client-s3` to deps; drop `cloudinary` once the migration script (below) has run.

---

## 4. One-time data migration (386 assets)

The stored URLs already ARE the two derivatives, so **we can copy bytes directly — no re-derivation needed**:

```
for each row in image:
  public_id = basename(url) without extension     # e.g. "341-872" from .../341-872.jpg
  if url already starts with PUBLIC_BASE: skip     # idempotent
  copy bytes of `url`          → R2 image/{public_id}.jpg
  copy bytes of `thumbnailUrl` → R2 image/{public_id}-thumb.jpg
  UPDATE image SET url=.../image/{public_id}.jpg,
                   thumbnail_url=.../image/{public_id}-thumb.jpg
repeat for audio (single url → R2 audio/{public_id})
```

- Idempotent and re-runnable. Run against **`vsat-dev` first**, then `vsatool`.
- On `vsatool` (production, deploy-sensitive) do it behind `heroku maintenance:on` or accept a brief window where some rows point old/new — either is fine since old Cloudinary URLs keep working until the account is torn down.
- Keep the Cloudinary account alive until migration is verified; only then downgrade/detach.

**Standalone "clawback" variant (post-workshop backup).** If a participatory workshop happens *before* this migration ships (uploads landing on a temporarily-upgraded Cloudinary), the same copy loop — filtered to `created_at >= workshopStart` via the Cloudinary Admin API instead of driven from the DB — serves as a backup/clawback: it pulls the event's new assets off Cloudinary into R2 before the plan is downgraded. Note it only *preserves bytes*; the DB rows still point at Cloudinary until the full migration runs the URL rewrite. Best avoided entirely by migrating **before** a participatory event (see `scaling-plan.md` §A → "If the workshop is participatory").

---

## 5. ⚠ COEP / CORS — the one real gotcha

The app runs under **COEP** (see commit `df1b909` "Load scene images with crossorigin so they work under COEP"); scene images use `crossorigin`/`crossOrigin="anonymous"` and A-Frame loads them as WebGL textures (`<a-sky src>`, `PrepareAssets.astro`, `ExistingImage.tsx`). The new media host **must** return:

- `Access-Control-Allow-Origin: *` (or the app origin) — CORS for `crossorigin` fetch
- `Cross-Origin-Resource-Policy: cross-origin` — required so COEP lets the texture load

Configure via the R2 bucket CORS policy **and** a Cloudflare Response-Header rule for `Cross-Origin-Resource-Policy`. **Verify with the Playwright e2e screenshot** (the project's standard for A-Frame changes) — a missing CORP header shows up as a blank/failed `<a-sky>`, which DOM inspection misses.

---

## 6. Files to change (from the inventory)

**Swap / add (the seam):**
- `src/environment/getEnvironment.ts` — swap injected functions
- new `src/domain/image/objectstore/uploadImageToObjectStore.ts` (+ delete)
- new `src/domain/audio/objectstore/uploadAudioToObjectStore.ts` (+ delete)
- new `src/util/objectstore/` client (S3 client wrapper)
- retire `src/domain/image/cloudinary/*`, `src/domain/audio/cloudinary/*`, `src/util/cloudinary/*`

**Config / env:**
- `src/environment/config.ts` — replace `CloudinaryConfigModel` with object-store config (endpoint, bucket, keys, publicBaseUrl)
- `config/custom-environment-variables.json` — map `CLOUDINARY_URL` → R2 vars (`R2_*` / `S3_*` + `MEDIA_PUBLIC_BASE`)
- `config/default.json` — upload limits unchanged (30 MB image / 50 MB audio) — and note this now works, since the 10/20/40 MB Cloudinary caps no longer apply (fixes the mismatch flagged in scaling-plan §6/§8)

**Seed / tests (string swaps, no logic):**
- `src/database/seed/seedDevelopment.ts` — replace hardcoded `res.cloudinary.com/hp6ok6fmb/...` URLs
- 6 unit test fixtures under `tests/unit/domain/story/publish/**` using `res.cloudinary.com/1-X.jpg`

**Migration script:**
- new `src/database/scripts/migrateMediaToObjectStore.ts` (§4)

---

## 7. Verify before calling it done

- [ ] Upload a new scene image via the editor → both derivatives land in R2, DB stores R2 URLs, scene renders in the A-Frame viewer.
- [ ] **Thumbnail parity:** confirm `sharp` `fit: "cover"` matches Cloudinary's current 288×192 crop behaviour (Cloudinary's default without an explicit crop mode may differ from `cover`) — compare a screenshot; adjust `fit` if needed.
- [ ] Audio upload + playback works.
- [ ] Delete a scene image/audio → objects removed from R2.
- [ ] **COEP/CORS:** e2e screenshot of a published story shows the photosphere (not a blank sky) — proves CORP/CORS headers are right.
- [ ] Migration script run on `vsat-dev`, spot-check old stories still render.
- [ ] Unit + e2e suites green.

---

## 8. Effort & payoff (honest)

The **code swap is small** (~1–2 h) thanks to the DI seam and full-URL storage. The time really goes into: `sharp` thumbnail parity, R2 + Cloudflare setup with correct **COEP/CORS headers**, the migration script, updating seed + 6 test fixtures, and e2e verification on a deploy-sensitive prod app. Realistically a **focused half-to-full day**, not an hour.

But it's a **one-time cost that permanently**: removes the Cloudinary line item (~$0/mo steady state), eliminates the mid-event *suspension* risk, and fixes the 30 MB-upload-vs-Cloudinary-cap mismatch for free. If Dublin is the first of several workshops, it pays back after the first one you'd otherwise have put on Plus. If Dublin is truly one-off, the $99 Plus-for-a-month path (scaling-plan §6b Option 1) is the cheaper call.

**Decision hinge:** recurring workshops or a desire to structurally remove the suspension risk → do the migration. Genuinely one-off → pay for one month of Plus.
