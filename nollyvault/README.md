# NaijaRewind — Deployment Guide

The Home of Classic Nollywood. Complete step-by-step to go live.

---

## What You Have

```
naijaRewind/
├── pages/
│   ├── _app.js                        ← App wrapper with Supabase auth
│   └── api/
│       ├── stream/[movieId].js        ← Protected video URL endpoint
│       ├── progress.js                ← Continue watching save/load
│       ├── watch-party/create.js      ← Watch party creation
│       ├── admin/
│       │   ├── upload-url.js          ← Cloudflare upload endpoint
│       │   └── royalties/calculate.js ← Monthly royalty pool calc
│       └── payments/
│           └── paystack/
│               ├── initialize.js      ← Start subscription payment
│               ├── callback.js        ← After payment redirect
│               └── webhook.js         ← Renewals & cancellations
├── lib/
│   ├── supabase.js                    ← DB client
│   ├── cloudflare.js                  ← Video streaming helpers
│   ├── payments.js                    ← Paystack + Stripe helpers
│   └── schema.sql                     ← Full database schema
├── middleware.js                      ← Auth protection on all routes
├── naijaRewind.jsx                     ← The full UI (in /outputs root)
├── .env.local.example                 ← All env vars you need
├── vercel.json                        ← Vercel deployment config
└── package.json
```

---

## STEP 1 — Supabase (Free)

1. Go to https://supabase.com → New Project
2. Name it `naijaRewind`, pick a region close to Nigeria (e.g. Europe West)
3. Go to **SQL Editor** → paste the entire contents of `lib/schema.sql` → Run
4. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Authentication → Email** → enable email confirmations (optional for MVP, disable for faster testing)

---

## STEP 2 — Cloudflare Stream (Pay as you go)

1. Go to https://cloudflare.com → sign up (free account)
2. Go to **Stream** in the dashboard
3. Go to **API Tokens** → Create token with Stream:Edit permission
4. Copy:
   - Account ID (top right of dashboard) → `CLOUDFLARE_ACCOUNT_ID`
   - Token → `CLOUDFLARE_STREAM_API_TOKEN`

**Cost reference:** $5 per 1,000 minutes stored + $1 per 1,000 minutes watched.
50 movies × 100 min avg = 5,000 min stored = **$25/month storage**.
500 users × 5 movies × 100 min = 250,000 min watched = **$250/month** (but you're earning ~₦750k = ~$500+).

---


---

## STEP 2 — Bunny.net Video Hosting (~12x cheaper than Cloudflare Stream)

**Why Bunny.net:** $0.0055/GB delivered vs Cloudflare Stream's $1/1,000 minutes.
At 500 subscribers: Bunny.net costs ~$124/mo vs Cloudflare's ~$1,350/mo.

1. Go to https://bunny.net → Sign up (free)
2. Go to **Stream** → **Add Video Library** → Name it `naijarewind`
3. In library settings:
   - Enable **Token Authentication** (for DRM/signed URLs)
   - Set **Allowed Referrers** to `naijarewind.com` and `*.vercel.app`
4. Copy these values to Vercel env vars:
   - Library ID → `BUNNY_LIBRARY_ID`
   - Library API Key → `BUNNY_STREAM_KEY`  
   - CDN Hostname → `BUNNY_CDN_HOSTNAME` (e.g. `naijarewind.b-cdn.net`)
5. Main Account → API Keys → `BUNNY_API_KEY`

**Uploading a movie:**
1. Admin panel → Upload tab → fill in movie details → click Create
2. You'll get an `upload_url` back
3. PUT your video file to that URL with header `AccessKey: {BUNNY_STREAM_KEY}`
4. Bunny.net auto-encodes to SD/HD (5-15 minutes)
5. Go to Supabase → movies table → set `is_active = true` to publish

**Also add to Vercel:**
```
NEXT_PUBLIC_BUNNY_LIBRARY_ID=your_library_id
```
(Needed for the in-app player iframe)

---

## STEP 3 — Paystack (Nigeria subscriptions)

1. Go to https://dashboard.paystack.com → Sign up with your business email
2. Complete business verification (CAC or personal — personal works to start)
3. Go to **Products → Subscriptions → Plans** → Create 3 plans:
   - Classic: ₦1,500/month → copy the Plan Code → `PLN_classic_monthly`
   - Premium: ₦3,000/month → `PLN_premium_monthly`
   - Family: ₦5,000/month → `PLN_family_monthly`
4. Replace those codes in `lib/payments.js`
5. Go to **Settings → API Keys**:
   - Public key → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - Secret key → `PAYSTACK_SECRET_KEY`
6. Go to **Settings → Webhooks** → Add URL:
   `https://naijaRewind.vercel.app/api/payments/paystack/webhook`

---

## STEP 4 — Stripe (Diaspora — optional at launch)

1. Go to https://stripe.com → Sign up
2. Go to **Products** → Add 3 products with monthly prices:
   - Classic: $4.99/mo → copy Price ID → `price_classic_monthly`
   - Premium: $9.99/mo → `price_premium_monthly`
   - Family: $14.99/mo → `price_family_monthly`
3. Replace Price IDs in `lib/payments.js`
4. Dashboard → Developers → API Keys:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

---

## STEP 5 — Deploy to Vercel (Free)

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "NaijaRewind MVP"
   git remote add origin https://github.com/yourusername/naijaRewind.git
   git push -u origin main
   ```

2. Go to https://vercel.com → New Project → Import from GitHub

3. Add all environment variables (from `.env.local.example`) in Vercel's Environment Variables section

4. Add one more: `ADMIN_EMAILS=your@email.com,other@email.com`

5. Click Deploy. Your app will be live at `naijaRewind.vercel.app` in ~2 minutes.

---

## STEP 6 — Custom Domain

1. Buy `naijaRewind.com` (or your chosen name) at Namecheap (~$12/yr) or Cloudflare Registrar (~$10/yr — cheapest)
2. In Vercel → Project → Settings → Domains → Add `naijaRewind.com`
3. Follow Vercel's DNS instructions (update your domain's nameservers)
4. SSL is automatic via Vercel + Let's Encrypt

---

## STEP 7 — Upload Your First Movies

Once deployed, go to `/admin` in your browser. The upload flow:

1. Click **Upload New Movie**
2. Fill in title, year, category, description, actors, producer
3. Your browser calls `/api/admin/upload-url` → gets a Cloudflare direct upload URL
4. The file uploads directly to Cloudflare (bypasses your server — no bandwidth cost to you)
5. Cloudflare encodes to SD/HD automatically (~5-15 minutes)
6. You activate the movie in Supabase → it appears on the platform

For bulk uploads (50+ movies), use the Cloudflare Stream API or their dashboard directly.

---

## STEP 8 — Integrate the UI

The main UI is in `naijaRewind.jsx` (the artifact file). To wire it up with real data:

1. Place it in `pages/browse.jsx` (rename `.jsx`)
2. Replace the `MOVIES` mock array with a Supabase query:
   ```js
   const { data: movies } = await supabase.from('movies').select('*').eq('is_active', true)
   ```
3. Replace the mock auth with `useSession()` from `@supabase/auth-helpers-react`
4. Replace the video player mock with a Cloudflare Stream iframe:
   ```jsx
   <iframe src={signedStreamUrl} allow="accelerometer; autoplay; encrypted-media" allowFullScreen />
   ```

---

## Monthly Royalty Calculation

On the 1st of each month, call:
```bash
POST /api/admin/royalties/calculate
Body: { "period": "2024-06", "totalRevenueNGN": 3200000 }
```

This calculates each movie's share of the 30% pool based on watch minutes.
You'll get a full distribution breakdown to share with producers.

---

## Economics at a Glance

| Subscribers | Avg Plan | Revenue/mo | Costs/mo | Margin |
|-------------|----------|------------|----------|--------|
| 500 | ₦2,000 | ₦1M | ~₦300k | ~₦700k |
| 2,000 | ₦2,500 | ₦5M | ~₦1.2M | ~₦3.8M |
| 5,000 | ₦2,500 | ₦12.5M | ~₦2.5M | ~₦10M |

Costs include: Cloudflare Stream, Supabase (free → $25/mo at scale), Vercel (free → $20/mo at scale), Paystack fees (1.5%).

---

## What to Build Next (Post-MVP)

- [ ] Producer dashboard page (earnings, views, top countries)
- [ ] Offline downloads (PWA + Cloudflare R2 for download files)
- [ ] Watch party real-time sync (Supabase Realtime channels)
- [ ] Date Night mode UI (two-panel, romantic recommendations)
- [ ] "Nolly Memories" — share favorite scenes
- [ ] Mobile apps (React Native reusing most of this code)
- [ ] Annual plan discount (2 months free)
- [ ] Referral program
