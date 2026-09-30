# AgenticCore Pakistan — Product 2.0 / Phase 1: audit and plan

Branch: `claude/pk-product2-phase1`, from `claude/hello-ym5p20` @ `fb60ca4`.
Production is untouched until the owner approves a merge: agenticcorepk.netlify.app is a manual upload deploy, not git-linked.

## Stage A — what exists today

**Architecture.** Static HTML/CSS/vanilla JS, no build step. Netlify runs only `node scripts/validate-data.mjs`, which fails the deploy if a transcribed price stops matching the PDF totals. The site shares the Supabase project `iuwjlvcfnxbfhbkztsel` with agenticcore.estate.

**Source of truth for prices.**
- `data/services.json`: 8 groups, 56 services, 73 price lines.
- `data/packages.json`: 5 packages.
- `js/catalog-core.js` holds the pure maths, shared by the browser and the validator.
- `supabase/migrations/pk_0002_seed_catalog.sql` is the DB copy (`pk_catalog_lines`) that `pk_place_order` prices from, **server-side**.

**Working features to protect.**
- **Landing page:** hero, proof and promises, problems-by-audience tabs, services by group, packages, how it works, a hidden lead-magnet section, referrals, Estate link, FAQ, callback form.
- **Other public pages:** `services.html` (full price list), `legal.html`.
- **Auth:** shared login/signup (phone or email).
- **Dashboard** (hash routes): home, order (+ per-service brief fields), tasks and task detail (messages, attachments, request changes, approve), deliveries (signed URLs, ZIP), invoices (printable), package usage, points and referrals, Estate listings (read-only list), support/notifications, profile and **brand kit**.
- **Admin:** today, tasks, deliver, payments, clients, leads, events, settings.

**Database (applied 29 Sep).**
- `pk_*` tables, all with RLS; clients see only their own rows.
- Every state change goes through `security definer` RPCs.
- Private buckets: `pk-attachments`, `pk-brand-kits`, `pk-deliverables`.
- `pk_place_order(p_items jsonb)` already accepts per-item `details` (jsonb) and `use_brand_kit`, so a multi-output "marketing pack" can be placed as one order through the existing workflow.
- `pk_brand_kits` stores colours, fonts, contact (phone, whatsapp, address, website, socials), taglines, approvals and files (logos, photos).

**Estate data.**
- `listings` has one RLS policy for reads: *"listings are publicly readable" (true)*. Every listing column is public by design (they are shown on agenticcore.estate).
- The owner's phone lives in `profiles` and is only reachable through the `get_listing_contact` RPC; nothing private sits in `listings`.
- Listing photos are public URLs in the `listing-photos` bucket.

**Gaps against the Product 2.0 brief.**
- The homepage leads with text plus a dashboard mock-up; there are no visual outputs, and 56 services are browsed by group only.
- Samples are 4 CSS mock-ups hard-coded in HTML.
- There is no intent-based discovery, guided selector, marketing pack, service detail view, Estate → PK handoff or content tool.
- The dashboard's Estate tab is a read-only list.
- Most dashboard copy is English-only (pre-existing).
- `og:image` is the Estate icon.
- There are no automated tests beyond price validation and the SQL dry run.

## Decisions

1. **No new pricing data.** New features reference existing service numbers and line IDs through `data/discovery.json`: intents, selector rules and pack outputs. A new test fails if any referenced service or line doesn't exist. Every displayed price is computed from `services.json` at render time.
2. **Samples are data-driven** (`data/samples.json`).
   - Every sample is `"label": "sample"` and shows "Sample concept".
   - When the image file isn't installed yet, a CSS mock-up placeholder renders instead.
   - Adding a sample is one JSON entry plus an image; no HTML changes.
   - The owner's reference board is **not** used on the site, as instructed; file names and sizes are listed in `docs/SAMPLE_ASSET_MANIFEST.md`.
3. **Property Marketing Pack** is a grouping, not a new product or price.
   - The dashboard's `#pack` route lets the client choose outputs mapped to existing lines, then places **one order through `pk_place_order`**: one task per output, one invoice, priced server-side.
   - Property facts, the Estate listing ID/URL and the brand-kit flag travel in each task's `details`.
4. **Estate → PK handoff:** `/?from=estate&listing=<uuid>&intent=promote` → `dashboard.html#pack/estate/<uuid>`.
   - Login is required.
   - The listing is prefilled **only if** `listings.owner_id = auth.uid()`.
   - Otherwise it shows "not in your account" and falls back to manual entry.
   - Malformed IDs are rejected before any query.
   - The admin task view shows whether the referenced listing belongs to the ordering client.
   - A server-side check inside `pk_place_order` is proposed as migration `pk_0003` (**not applied**).
5. **Quick Property Content tool** (`create.html`):
   - Public, and runs entirely in the browser. Nothing is sent or stored, and there's no AI.
   - It outputs:
     - an info sheet
     - WhatsApp text
     - English and Roman Urdu captions (templates, only from typed facts)
     - a share-card PNG (canvas)
   - Signed in, it can prefill from an owned Estate listing and use the brand-kit name/phone.
   - An LLM-assisted version is documented for Phase 2.
6. **Service detail view** (`js/service-detail.js`), shared by the homepage, services page and dashboard. It is built from the catalog plus brief fields; the brief fields move to the shared `js/briefs.js`.
7. **Brand Kit** becomes visible:
   - an explainer card
   - a completeness summary
   - a "Use my saved Brand Kit" toggle with a summary in the pack builder and order form

   The kit stays private: no public URLs, and signed URLs are used only for the owner's own preview.
8. **Dashboard workspace:**
   - quick actions on Home
   - richer Estate listing cards (photo, facts, Promote, Create content)
   - deliverable cards with kind labels

   Nothing is rebuilt.
9. **Docs:** `docs/INTEGRATION_CONTRACT.md` (catalog/estate/order/task/deliverable operations for future Telegram/Grok/MCP), `docs/SAMPLE_ASSET_MANIFEST.md`, and a final report.
10. **Not changed:** prices, packages, referral and points economics, RLS, existing RPCs, storage policies. No migration is applied, and no production deploy happens.

## Files

- **New:** `data/discovery.json`, `data/samples.json`, `js/briefs.js`, `js/discovery.js`, `js/service-detail.js`, `js/share-card.js`, `js/create.js`, `create.html`, `css/p2.css`, `supabase/proposed/pk_0003_estate_listing_ownership.sql`, `tests/*.test.mjs`, docs.
- **Changed:** `index.html`, `js/landing.js`, `js/i18n.js`, `js/dashboard.js`, `js/admin.js` (listing ownership note), `services.html`, `js/catalog-render.js`, `sitemap.xml`, `README.md`.

## Owner approval needed later

- Merging to production and redeploying agenticcorepk.netlify.app.
- Applying the proposed `pk_0003` migration.
- Supplying the sample images and the 1200×630 `og:image`.
- The PK WhatsApp number (still empty; the existing fallback stays).
