# AgenticCore Pakistan — Product 2.0 / Phase 1 report

**Status at hand-off**
- Branch: `claude/pk-product2-phase1`, created from `claude/hello-ym5p20` @ `fb60ca4`. The final commit SHA is given in the hand-off message; see `git log`.
- **Merged:** yes, into `claude/hello-ym5p20` on 1 Oct 2026 (owner approved).
- **Production touched:** no. agenticcorepk.netlify.app is a manual upload deploy and was not redeployed. agenticcore.estate was not changed.
- **Migrations applied:** `pk_0003_estate_listing_ownership` on 1 Oct 2026 (owner approved).
- **Database side effect, disclosed:** the `pk_0003` dry run ran inside a transaction that was rolled back. Postgres sequences don't roll back, though, so it advanced the task and invoice counters. The pk tables had **0 tasks, 0 invoices and 0 orders**, so I reset exactly those two counters to their starting point. The next real order is still **ACPK-0001 / INV-0001**. No data was created, changed or deleted.
- **Prices, packages, referral and points:** unchanged. `node scripts/validate-data.mjs` still reports 56 services, 73 price lines and 5 packages, all totals matching.

## 1. Executive summary

AgenticCore Pakistan now reads as a marketing workspace rather than a price list. A visitor sees what we can create within the first screen, then:
- picks what they need, or answers two questions to get a suggestion
- sees a sample workflow ("you send rough details → we send the marketing")
- builds a Property Marketing Pack with published prices
- browses labelled sample concepts
- sees how Estate and Pakistan work together

Signed-in clients get:
- a workspace home
- a pack builder that can prefill from **their own** Estate listing (ownership-checked) and orders through the existing task and invoice system
- visible Brand Kit reuse
- a free in-browser content tool

Nothing is AI-generated or faked.

## 2. Before → after

| Before | After |
|---|---|
| Hero: text + dashboard mock-up; CTA "WhatsApp us / packages" | Hero: "Turn properties into marketing that sells." with **Market a property / Promote a project / Explore services** and "See what we can create", next to a collage of 4 labelled sample concepts |
| 56 services browsed by 8 groups | Kept, plus an **8-intent** "Start with what you need" and a deterministic **2-question selector** |
| 4 hard-coded CSS samples | **Data-driven sample system** (10 concepts, 6 categories, filter), always labelled |
| No product concept around a single property | **Property Marketing Pack**: you send → we prepare, with real prices, into the existing order flow |
| Estate: one "sister site" paragraph | **"List it. Market it. Share it."**, Estate → PK handoff, "Promote" on every owned listing |
| Services shown as catalog rows | Reusable **service detail** view (get / for / need / delivery / price / sample / related / package) |
| Dashboard Estate tab: read-only list | Listing cards with photo, facts, **Promote**, **Create content**, free Estate share card |
| Brand Kit buried in Profile | "Upload once, reuse" explainer, completeness chips, "Use my saved Brand Kit" in orders and the pack |
| – | **Free content tool** (`create.html`) |

## 3. Homepage changes (`index.html`, `js/landing.js`, `css/p2.css`)

**Order of sections:**
1. Hero
2. "What we can create" strip (8 tiles, each with a "from Rs X" computed from the catalog)
3. Start with what you need, plus the guided selector
4. Sample workflow
5. Property Marketing Pack
6. Sample gallery
7. Estate + Pakistan
8. Promises (kept)
9. Problems by audience (kept)
10. All 56 services (kept, plus a Details button on every service)
11. Packages (kept, plus "What it solves / How it runs")
12. How it works (the dashboard phone mock-up moved here)
13. Referrals (kept)
14. FAQ (kept)
15. Callback form (kept)

**Removed from the homepage:** the old hero copy, the "See packages from Rs 6,499" button (a hand-typed price) and the old 4-sample block (superseded by the gallery). The lead-magnet section stays hidden behind its config flag.

**SEO:** new title and description, OG and Twitter title/description, `og:locale`. Existing canonical, Organization JSON-LD and data-generated FAQ/Offer JSON-LD are kept.

## 4. Portfolio / sample system

- `data/samples.json` holds 10 concepts: property flyer, WhatsApp card, social post, brochure, payment plan, reel cover, progress reel, WhatsApp catalogue, approval kit, Estate share card. Categories: property, project, social, video, print, estate.
- Every card shows **"Sample concept"** (the Estate card shows "Free tool", because it is a real Estate feature). The gallery intro says they are demonstrations with example names and prices.
- **No image files are installed yet.** Each sample renders a CSS mock-up until `"installed": true`.
- Adding a sample means one JSON entry and an image, with no HTML changes.
- Each sample links to its real service detail with the published price.

## 5. Property Marketing Pack

- **Outputs** (`data/discovery.json`) map to existing lines: WhatsApp card `7-one`, offer post `11-dfy`, photo clean-up `28-dfy`, captions/ad copy `37-dfy`, QR flyer `10-dfy`, catalogue `7-cat`, promo reel `23-dfy`, voiceover reel `22-dfy`, 3D plan `25-plan`, landing page `15-dfy`.
- The first four are preselected. The total is computed from `services.json`, and nothing is marked up.
- **On the homepage**, "Build my property marketing pack" carries the selection to `dashboard.html#pack/lines/…`.
- **In the dashboard:** property facts (manual, or from an owned Estate listing), optional photos (JPG/PNG/WebP, ≤10 × 10 MB), Brand Kit toggle and summary, total, **review dialog**, then **one `pk_place_order` call**. That means one task per output, one invoice, prices recomputed server-side; the browser sends line IDs only.
- It is a grouping, not a new package or price.

## 6. Guided service discovery

- **8 intents:** sell a property, regular social media, launching a project, website, branding, photos/video, leads/ads, Estate listing help. Each shows its existing services, and relevant packages where they apply.
- **Selector:** 4 × 6 deterministic rules (what you're marketing × what you need), giving services and/or a package. The page says the suggestions come from a simple guide, not AI.
- Every service card opens the service detail view.

## 7. Estate integration

- A homepage section explains the loop in 4 steps: list free → improve (quality score) → share (free QR card) → promote (order here, prefilled).
- **Dashboard Home:** "From your Estate listings" shows up to 3 owned listings.
- **Estate listings tab:** cards with Promote, Create content, View and Free share card.
- The content tool can prefill from an owned listing, putting its first photo and a QR code to the listing on the card.
- Only the owner's listings are ever queried (`owner_id = auth.uid()`). Listings are public on Estate anyway, and nothing private (phone, CNIC) is read.

## 8. Estate → PK handoff contract

URL: `https://agenticcorepk.com/?from=estate&listing=<uuid>&intent=promote`

1. The UUID is validated; anything else is ignored.
2. The user is sent to `dashboard.html#pack/estate/<uuid>`, which requires login and returns there afterwards.
3. The listing is prefilled **only if** it is owned by the signed-in user. Otherwise the page says "That listing isn't in your AgenticCore account" and fills nothing.
4. The user reviews and confirms before any order is placed.
5. The admin task view re-checks ownership and warns on a mismatch.
6. **Proposed** `pk_0003`: a trigger enforcing ownership server-side. Its dry run passed.

Full contract: `docs/INTEGRATION_CONTRACT.md`. The Estate-side "Promote this listing" button was **not** added; that needs your go-ahead on the Estate repo.

## 9. Dashboard improvements

- **Home:** workspace tiles (Market a property, New order, My Estate listings, Brand Kit x/6, Deliveries, Packages, Points, Support), plus "From your Estate listings".
- **Navigation:** a new "Market a property" item.
- **Deliveries:** each card gets a type label (Flyer / Social post / Brochure / Video / Caption / Plan / Web / Other). Download, WhatsApp share, approve and request-changes are unchanged.
- **Fixes:**
  - a dialog from the previous view no longer stays open after navigating
  - the dashboard had no side gutter on phones (pre-existing CSS bug), now fixed
  - the login `next=` accepts the pack hash

## 10. Brand Kit improvements

- Explainer: "Upload your logo and brand details once. We reuse them on every flyer, card, post and video."
- Completeness chips: logo, business name, phone, WhatsApp, website, brand notes.
- "Use my saved Brand Kit" in the order form and the pack, with a link to edit.
- The content tool fills name and phone from the kit and can add the kit logo (fetched through a 1-hour signed URL, never public).
- The kit stays private (existing RLS and private bucket, unchanged).

## 11. Property Content tool status

**AUTOMATED TOOL, live in this branch.** `create.html` produces:
- WhatsApp text
- English caption with hashtags
- Roman Urdu caption
- information sheet
- a 1080×1350 share card (PNG download)

**How it works:** fixed templates filled only with the typed facts, so there are no superlatives and no invented numbers (tested). It runs entirely in the browser, and nothing is sent or stored.

**AI writing help:** labelled *planned*; its design is in the integration contract.

## 12. Files added

- **Pages:** `create.html`
- **Scripts:** `js/discovery.js`, `js/dashboard-p2.js`, `js/create.js`, `js/share-card.js`, `js/i18n-p2.js`, `js/briefs.js`
- **Styles:** `css/p2.css`
- **Data:** `data/discovery.json`, `data/samples.json`
- **Tests:** `tests/p2.test.mjs`
- **Migration (proposed):** `supabase/migrations/pk_0003_estate_listing_ownership.sql`
- **Docs:** `docs/PK_PRODUCT2_PHASE1_PLAN.md`, `docs/INTEGRATION_CONTRACT.md`, `docs/SAMPLE_ASSET_MANIFEST.md`, this report

## 13. Files changed

- `index.html`: restructured, SEO
- `services.html`: detail view, deep link `#service-N`
- `dashboard.html`: nav, scripts
- `admin.html`, `legal.html`, `login.html`, `signup.html`: string file only
- `js/landing.js`, `js/dashboard.js` (home tiles, deliverable labels, Brand Kit copy, dialog fix), `js/admin.js` (Estate ownership check), `js/db-client.js` (owned-listing queries; `service_no` on deliverables), `js/catalog-render.js` (Details button, package explainer), `js/partials.js` (nav link), `js/auth.js` (next hash)
- `css/dashboard.css`: mobile gutter
- `sitemap.xml`, `README.md`

## 14. Database migrations proposed

`supabase/migrations/pk_0003_estate_listing_ownership.sql` (**not applied**) adds one additive trigger on `pk_tasks`. A client-created task referencing `estate_listing_id` must reference a listing that client owns.

**Dry run** on the live project (rolled back):
- own listing: allowed
- unknown or other listing: blocked (42501)
- malformed: blocked (22023)
- orders without a listing: unaffected

No other schema changes.

## 15. Security review

- **Pricing** stays server-side: pack orders send `{line_id, quantity, details, use_brand_kit}` only (tested).
- **Estate listing reuse:**
  - UUID validation on the URL and in the query helper
  - an `owner_id` filter
  - another user's ID fills nothing and the message doesn't reveal whether the listing exists
  - admin warning on mismatch
  - the proposed trigger for server-side enforcement
- **Private files:**
  - Brand Kit, attachments and deliverables stay in private buckets, reached only through short-lived signed URLs for the owner or team
  - the sweep checked that no unsigned private storage path appears on any page
  - Estate photos used on cards are accepted only from the public `listing-photos` storage path
- **Escaping:**
  - all user and listing text is escaped
  - the injected `<img onerror>` listing title rendered as text in tests
- **File checks:** pack photos (JPG/PNG/WebP, 10 MB, max 10) and content-tool photo (15 MB) are checked before upload or use.
- **Login redirect:** `next` stays a strict same-site allow-list (commas added for the pack hash; no scheme or `//`).
- **Unchanged:** no service-role key anywhere and no new public API. RLS, RPCs and storage policies are unchanged.
- **Claims:** no fake client work, testimonials or results. Samples are labelled. The promises "only approvals you can show us" and "never promise a set number of leads" are kept.

## 16. Mobile testing

Widths 360, 390, 430, 768 and 1280, with Chromium through Playwright. No horizontal overflow on any page or dashboard route.

On phones:
- hero CTAs stack full-width
- the output strip scrolls sideways
- chips wrap
- the service detail fits within the screen with a sticky Order/WhatsApp footer
- the pack form is single-column with 44px targets
- the sticky WhatsApp / Call / Packages bar still works

## 17. English / Urdu testing

- About **230 new UI strings** exist in both English and Urdu. A test fails if any `data-i18n` or `pkT()` key used by the new pages is missing in either language.
- Urdu renders RTL at 430 and 1280 with no blank labels.
- Roman Urdu appears only inside generated captions, never as UI.
- **Not yet translated** (pre-existing): most older dashboard copy, service descriptions and price lines. Property-type option labels in the new forms are also English. Native review is still recommended.

## 18. Automated test results

- `node --test tests/*.test.mjs`: **9/9 pass** (catalogue references, no prices in discovery data, EN+UR coverage, sample labelling and install integrity, no hand-typed prices in new files, content tool facts-only, UUID-only handoff, orders send line IDs only, catalog validator).
- `node scripts/validate-data.mjs`: **OK**.
- **Browser flows:**
  - homepage interactions (intents, selector, pack totals 5,896 → 9,895, sample filter, service detail)
  - handoff redirect (valid UUID) and ignore (malformed)
  - pack from own listing: prefill and a correct `pk_place_order` payload
  - other user's listing and a bad link: nothing filled
  - empty-pack validation
  - listings, profile, order-form Brand Kit label
  - content tool: prefill, outputs, PNG export, refusal of a non-owned listing
- **Full sweep: 193 page loads** (6 public pages, 15 dashboard routes, 8 admin routes × anon/buyer/agency/admin × 5 widths × EN/UR): **0 JS errors, 0 failed requests, 0 overflow, 0 untranslated blanks, 0 broken images, 0 exposed private paths, 0 unlabelled samples.**
- **Not tested here:** real Supabase login and ordering from a browser (the sandbox blocks supabase.co). The order RPC path was exercised in SQL during the dry run.

## 19. Performance notes

- No framework and no new CDN libraries, apart from qrcode-generator (about 20 KB), which loads only when a QR is drawn.
- New JS/CSS/data: about 110 KB uncompressed (the Urdu strings are the biggest part).
- Sample mock-ups are pure CSS, with no images to download yet.
- Future sample images: `loading="lazy"`, explicit width/height, WebP, about 240px display, ≤200 KB each.
- The reference collage is not used as a background.

## 20. Sample assets currently installed

None. All 10 samples show CSS mock-ups.

## 21. Sample assets still needed

From `docs/SAMPLE_ASSET_MANIFEST.md`:

| File | Size |
|---|---|
| `images/samples/property-flyer.webp` | 1080×1350 |
| `images/samples/whatsapp-property-card.webp` | 1080×1350 |
| `images/samples/social-property-post.webp` | 1080×1080 |
| `images/samples/property-brochure.webp` | 1600×1130 |
| `images/samples/project-payment-plan.webp` | 1600×900 |
| `images/samples/reel-cover.webp` | 1280×720 |
| `images/samples/property-workflow.webp` | 1600×600 (optional) |
| `images/og-share.jpg` | 1200×630, ≤200 KB |

## 22. Needs owner approval

1. Merge `claude/pk-product2-phase1` and redeploy agenticcorepk.netlify.app. Better: link the Netlify project to GitHub so deploys run the price validator.
2. Apply `pk_0003`.
3. Add the "Promote this listing" button on Estate (Estate repo).
4. Supply the sample images and `og-share.jpg`.
5. The PK WhatsApp number (`js/config.js`). Until it's set, WhatsApp buttons keep the existing fallback.

## 23. Known limitations

- Samples are mock-ups until the images arrive.
- `og:image` is still the Estate icon.
- Older dashboard copy is English-only.
- Estate listing sizes show the stored unit key (e.g. "marla").
- Server-side handoff enforcement needs `pk_0003`.
- The content tool has no AI (by design in this phase).
- A pack with photos attaches them to the first task only; the team sees the others via the shared order.

## 24. Recommended Phase 2

1. The `/api/pk` orchestration endpoint (see the integration contract), then Telegram/Grok account linking and ordering with a confirm step.
2. AI-assisted brief clean-up and caption drafting, reusing Estate's provider-abstracted service and invented-fact guard.
3. The Estate "Promote this listing" button, with pack status visible on Estate.
4. Deliverable previews for PDF and video, plus a per-order gallery.
5. Full Urdu for the remaining dashboard copy and service descriptions.
6. Real sample images, and later real (consented) case studies.
7. Package-aware packs: use allowances when the client has an active package.
