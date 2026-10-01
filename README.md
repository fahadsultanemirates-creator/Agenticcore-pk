# AgenticCore Pakistan — agenticcorepk.com

Property marketing services for Pakistan's real estate community (dealers,
agents, agencies, developers, builders), priced in PKR. Sister site to
[agenticcore.estate](https://agenticcore.estate): same colours and logo, the
same English / اردو toggle, and the **same account and points balance** (both
sites use one Supabase project).

Static site, no build step, deployed on Netlify like the other AgenticCore
sites. Open `index.html` through any static server (`python3 -m http.server`).

## Pages

| Page | What it is |
|---|---|
| `index.html` | Landing page (Product 2.0): action-first hero with sample-concept collage, "what we can create" strip, *start with what you need* intents + guided selector, sample workflow, Property Marketing Pack builder, sample gallery, Estate "List it. Market it. Share it.", promises, problems by audience, all 56 services, 5 packages (with who/what it solves/how it runs), how it works, referrals, FAQ, callback form |
| `create.html` | Free Quick Property Content tool: WhatsApp text, English + Roman Urdu captions, info sheet and a 1080×1350 share card, all generated in the browser from typed facts (no AI, nothing sent) |
| `services.html` | Full price list: every service, every price line, delivery times, the three ways of working, running costs, pricing notes |
| `legal.html` | Terms, privacy, refund policy (marked *to be confirmed*), referral terms |
| `login.html` / `signup.html` | Shared login with agenticcore.estate (phone or email + password) |
| `dashboard.html` | Client dashboard (brief B2–B10) + Product 2.0 workspace: home tiles, **Market a property** (`#pack`, `#pack/estate/<uuid>`), new order, my tasks + task detail, deliveries, invoices, package usage, points & referrals, Estate listings (Promote / Create content), support & notifications, profile & brand kit |
| `admin.html` | Owner view (B11): today, all tasks (status, deliver files, messages, log WhatsApp/Telegram orders), payments & packages, clients, visits & leads, packages & prices, settings |

## Prices come from one place

`data/services.json` (56 services, 73 price lines) and `data/packages.json`
(5 packages) are transcribed from the pricing PDF (27 Sep 2026). Every price
on the site is rendered from them — nothing is hand-typed into HTML.

- `node scripts/validate-data.mjs` checks every package's "bought separately"
  total and saving against the figures printed in the PDF. Netlify runs it on
  every deploy, so a price typo fails the deploy instead of going live.
- `node scripts/gen-seed-sql.mjs` regenerates
  `supabase/migrations/pk_0002_seed_catalog.sql`, the database copy of the
  prices. Orders are priced **server-side** from that table, never from the
  browser. After changing a price: edit the JSON → validate → regenerate →
  apply the seed.

## Product 2.0 data files (no prices in them)

- `data/discovery.json`: intents, guided-selector rules, "what we can create" tiles and the Property Marketing Pack outputs. It only **points** at service numbers and price-line IDs; prices are always read from `services.json`.
- `data/samples.json`: sample concepts for the gallery. Every item is a labelled demonstration. Until `"installed": true`, a CSS mock-up is drawn. See `docs/SAMPLE_ASSET_MANIFEST.md`.
- `node --test tests/*.test.mjs` checks:
  - every reference exists
  - every new label has English and Urdu
  - samples stay labelled
  - no new file hard-codes a price
  - the content tool only repeats typed facts
  - pack orders send line IDs only
- Estate → PK handoff and the future bot/MCP operations are documented in `docs/INTEGRATION_CONTRACT.md`.

## Database (shared with agenticcore.estate)

`js/supabase-client.js` points at the estate project `iuwjlvcfnxbfhbkztsel`.
`profiles`, `referral_code`, `points` and `referral_ledger` stay the single
source of truth there. This site only adds `pk_`-prefixed tables
(`supabase/migrations/pk_0001_init.sql`):

- **Task IDs** `ACPK-0001…` come from a Postgres sequence (no row counting).
- **8 statuses**: Received → Waiting on you → Confirmed → In progress →
  Ready for review → Changes requested → Delivered → Cancelled. The clock is
  paused while *Waiting on you* and the pause is added back to the due time.
- **Due time**: same day (9pm PKT) if confirmed by 6pm PKT, otherwise next
  day; 2–3 day and 1-week services add their days. Cut-off, due hour and free
  revision rounds are editable in Admin → Settings.
- **Two free rounds of changes**, then "quoted separately".
- **Referrals (new flat model)**: when an admin marks a pk invoice *paid*, the
  client's direct referrer gets 10% of the paid amount as points
  (`referral_ledger` row + `profiles.points`), once per invoice. No tiers,
  no cards.
- RLS on every table; clients read only their own rows; every status change
  goes through a `security definer` function gated by `is_admin()`.
- Private storage buckets `pk-attachments`, `pk-brand-kits`, `pk-deliverables`.

`supabase/tests/pk_dry_run.sql` runs the whole order → confirm → pause →
deliver → 2 revisions → approve → paid → 10% credit flow and always rolls back.
It passed against the live project on 27 Sep 2026 with nothing persisted.

**Applied to the live project on 29 Sep 2026** (`pk_0001_init`,
`pk_0002_seed_catalog`), together with the estate security lockdown
(agenticcore-estate migrations 0012 and 0013).

## Deliberately left out (per Fahad)

- The personal "built by … 15 years" trust section. Proof is shown as
  labelled sample concepts + written promises instead.
- JazzCash / Easypaisa and any payment method or account details. Invoices
  exist; the site tells clients the team confirms payment details directly
  and to only pay an account confirmed in writing. `pk_payments` exists for
  later proof-of-payment uploads, with no UI yet.

## Before launch — to fill in / confirm

- `js/config.js`: **PK WhatsApp number**, phone, email, hours. While the
  number is empty, WhatsApp buttons fall back to sign-up / the task thread.
- Free lead magnets (A7): built, hidden behind `leadMagnets: false`.
- Refund policy wording (`legal.html#refunds`).
- Whether unused package allowances carry over; auto-approve after N days.
- Urdu: the UI, headings, service and package names are translated as a
  first pass — have a native speaker review before launch. Service
  descriptions and price lines stay in English.
- Where Telegram-bot orders live (this project vs agenticcore.agency's) — the
  admin can log WhatsApp/Telegram orders manually meanwhile.
- ~~Share image~~: `images/og-share.jpg` (1200×630) is installed. `og:image` and
  `twitter:image` point to `https://agenticcorepk.netlify.app/images/og-share.jpg`
  because agenticcorepk.com isn't connected yet; switch them (and the canonical
  URLs) once the domain is live.
- Sample images for the gallery (`docs/SAMPLE_ASSET_MANIFEST.md`).
- ~~Migration `pk_0003_estate_listing_ownership.sql` (server-side check for the
  Estate handoff)~~ — applied 1 Oct 2026.

## Launch steps

1. ~~Estate profiles hole~~ — fixed and applied (agenticcore-estate
   migration 0012; `supabase/proposed/` kept for history).
2. ~~Apply `pk_0001_init.sql` then `pk_0002_seed_catalog.sql`~~ — applied.
3. Netlify: new site from this repo (publish dir `.`), add the
   `agenticcorepk.com` domain.
4. Supabase → Authentication → URL Configuration: add
   `https://agenticcorepk.com` and `https://agenticcorepk.com/**` to the
   redirect URLs.
5. Make an admin: sign up, then `update profiles set role = 'admin' where …`
   in the SQL editor.
