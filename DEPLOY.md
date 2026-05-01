# Pour — Phase 1 Deployment Runbook

Everything is automated via GitHub Actions. The steps below are one-time account
setup and credential injection. Once done, push to `main` and CI takes over.

---

## Step 1 — Render.com (API + DB + Redis) ~10 min

1. Create account at [render.com](https://render.com) and connect the GitHub repo.
2. Click **New → Blueprint** and point it at this repo — Render reads `render.yaml`
   and provisions:
   - `pour-api` — web service (Fastify)
   - `pour-workers` — background worker
   - `pour-db` — managed PostgreSQL (Starter, ~$7/mo)
   - `pour-redis` — managed Redis (Starter, ~$10/mo)
3. After provisioning, note the **deploy hook URLs** for each service
   (Dashboard → Service → Settings → Deploy Hook).
4. Add these as **GitHub Actions secrets** (repo → Settings → Secrets):

   | Secret name                 | Value                        |
   |-----------------------------|------------------------------|
   | `RENDER_API_DEPLOY_HOOK`    | Deploy hook URL for pour-api |
   | `RENDER_WORKERS_DEPLOY_HOOK`| Deploy hook URL for pour-workers |
   | `DATABASE_URL`              | Connection string from Render DB (Settings → Connection) |

5. In the Render dashboard, fill in the env vars marked `sync: false`
   (Clerk, Typesense, R2 — see steps below) after you complete those accounts.

---

## Step 2 — Clerk (Auth) ~5 min

1. Create project at [clerk.com](https://clerk.com) → **Pour**.
2. Copy the keys from the Clerk dashboard:
   - Add `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` to Render → pour-api env vars.
   - Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (same publishable key) to Render → pour-api
     (also set it in `apps/mobile/.env` for local builds).

---

## Step 3 — Typesense Cloud (Search) ~5 min

1. Create cluster at [cloud.typesense.org](https://cloud.typesense.org) (~$25/mo).
2. Generate an **API key** with all permissions.
3. Add to Render env vars for both `pour-api` and `pour-workers`:
   - `TYPESENSE_HOST` — cluster hostname (e.g. `xyz.a1.typesense.net`)
   - `TYPESENSE_API_KEY` — your key
   - `TYPESENSE_PROTOCOL` — `https` (already defaulted in render.yaml)

---

## Step 4 — Cloudflare R2 (Images) ~5 min

1. Create a Cloudflare account → R2 → **New bucket** named `pour-images`.
2. Enable **Public access** on the bucket and note the public URL
   (format: `https://pub-<hash>.r2.dev`).
3. Create an **API token** with Object Read & Write on that bucket.
4. Add to Render env vars for both `pour-api` and `pour-workers`:
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET` = `pour-images`
   - `CLOUDFLARE_R2_PUBLIC_URL` = public URL from above

---

## Step 5 — Expo / EAS (Mobile builds) ~5 min

1. Create account at [expo.dev](https://expo.dev) → **New project** named `pour`.
2. Go to **Account Settings → Access Tokens** → create token.
3. Add `EXPO_TOKEN` as a **GitHub Actions secret**.
4. In `apps/mobile/app.json`, update `expo.slug` and `expo.owner` to match your Expo account.

---

## Step 6 — iOS TestFlight ~15 min

1. Enroll in [Apple Developer Program](https://developer.apple.com) ($99/yr) if not already.
2. In App Store Connect, create a new app — note the **ASC App ID**.
3. Find your **Team ID** in Membership section.
4. Update `apps/mobile/eas.json`:
   ```json
   "ios": {
     "appleId": "your@apple.com",
     "ascAppId": "1234567890",
     "appleTeamId": "XXXXXXXXXX"
   }
   ```
5. Invite board members in TestFlight → Internal Group.

---

## Step 7 — Android Firebase App Distribution ~10 min

1. Create project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add an Android app with package name from `apps/mobile/app.json`.
3. Create a **service account** with Firebase App Distribution Admin role → download JSON.
4. Save JSON as `apps/mobile/google-play-service-account.json`
   (already in `.gitignore` — do not commit).
5. Invite board members in Firebase App Distribution → Testers.

---

## Step 8 — Seed the database ~30-60 min

Download the public data files and place them in `data/`:

| File | Source |
|------|--------|
| `data/ttb-cola.csv` | [ttbonline.gov/colasonline](https://www.ttbonline.gov/colasonline/publicSearchColasSimple.do) → Export CSV |
| `data/openfoodfacts.csv` | [world.openfoodfacts.org/data](https://world.openfoodfacts.org/data) → CSV export |
| `data/lcbo-products.csv` | [data.ontario.ca](https://data.ontario.ca/dataset/lcbo-product-assortment) → CSV |
| `data/wslcb-price-list.tsv` | [lcb.wa.gov](https://lcb.wa.gov/sites/default/files/publications/spirits/2024/spirits_pricelist.tsv) |

Then run (with `DATABASE_URL` + all R2/Typesense env vars set):

```bash
pnpm --filter workers run seed:all
```

This takes 30–60 minutes and targets 40K+ spirits, 25K+ barcodes, 20K+ images.

---

## Step 9 — Trigger production mobile builds

Once `EXPO_TOKEN` is set and iOS/Android configs are filled in:

```bash
# Via GitHub Actions UI:
# Actions → EAS Build → Run workflow → profile: production, platform: all

# Or locally (requires eas-cli):
cd apps/mobile
eas build --profile production --platform all
```

---

## Checklist

- [ ] Render Blueprint deployed (API + DB + Redis live)
- [ ] All Render env vars filled in (Clerk, Typesense, R2)
- [ ] GitHub Actions secrets set (deploy hooks, DATABASE_URL, EXPO_TOKEN)
- [ ] Database seeded (`seed:all` completed successfully)
- [ ] EAS production build triggered
- [ ] Board members invited to TestFlight (iOS) and Firebase (Android)
- [ ] `/health` endpoint returns 200 on the Render URL
- [ ] Board members can scan a barcode and see a result
