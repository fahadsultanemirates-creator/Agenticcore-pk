# Catalogue V2 — mapping, migration and rollout notes

Branch `claude/pk-catalogue-v2` (from production `441920b`). **Not merged, not deployed, and no migration applied to production.** This is waiting for owner approval.

## Summary

| | V1 (production) | V2 (this branch) |
|---|---|---|
| Customer-facing services | 56 in 8 groups | **74 in 4 sections**: Property Marketing 1–24, Project Marketing 25–48, AI & Automation 49–62, Specialist / add-on 63–74 (collapsed, secondary) |
| Orderable price lines | 73 | **77** (54 reused ids, 23 new ids); 19 retired |
| Packages | 5 (Dealer Starter, AgenticCore Package, Growing Agent, Agency Pro, Project Partner) | **8 offers / 10 orderable rows**: Agent Monthly, Agent Pro, Agency Growth, Project Monthly, Project Growth, Developer Partner (proposal only), Agency Launch Kit (+ website variant), Project Launch Kit (+ website variant) |
| Homepage discovery | 8 intents + 2-question selector | "Who are you?" (Agent / Dealer · Agency · Project / Developer) → 4 journeys each |
| Package selling | "bought separately / you save" maths | Sold on monthly output; minimum term beside every price; no savings figures |

## Rules followed

- One price source: `data/services.json` → `scripts/gen-seed-sql.mjs` → `pk_catalog_lines`. The server re-prices every order (`pk_place_order`) and package (`pk_buy_package`). The browser sends line ids only.
- A line id was **reused** when the deliverable kept its meaning (all 54 reused lines kept their V1 price). A **new** id was created when the meaning changed — including service 74, whose old id `29-event` was billed monthly in V1 and is now per event, so it became `balloting-event`: single-property creatives, the new AI set-ups (different scope and price from the old bots), and project-specific counterparts of property services. The old AI lines were retired rather than re-priced, so past invoices still read correctly.
- Nothing is deleted. Retired lines and packages are set `active = false`; existing orders, invoices and subscriptions keep their references. RLS, auth, `pk_0003` (Estate listing ownership trigger) and Estate itself are unchanged.

## Line mapping (V2 service → line id)

| V2 service | Line id | Status | Price |
|---|---|---|---|
| 1 Property WhatsApp Card | `p-wa-card` | NEW line | Rs 999 |
| 2 Property Social Media Post | `p-social-post` | NEW line | Rs 999 |
| 3 Property Flyer | `p-flyer` | NEW line | Rs 999 |
| 4 Property Photo Enhancement | `28-dfy` | reused (old 28 Listing photo enhancement) | same |
| 5 Property Captions — English + Roman Urdu | `p-captions` | NEW line | Rs 999 |
| 6 Property Reel — AI Voiceover | `22-dfy` | reused (old 22 AI voiceover reels) | same |
| 7 Property Promo Reel | `23-dfy` | reused (old 23 Text-and-motion promo videos) | same |
| 8 Property PDF / WhatsApp Catalogue | `7-cat` | reused (old 7 WhatsApp catalogues and one-pagers) | same |
| 9 QR Property Flyer | `10-dfy` | reused (old 10 QR-coded flyers and hoardings) | same |
| 10 3D Floor Plan | `25-plan` | reused (old 25 3D floor plans and AI-staged interiors) | same |
| 11 AI-Staged Interior | `25-room` | reused (old 25 3D floor plans and AI-staged interiors) | same |
| 12 Single Property Landing Page | `15-dfy` | reused (old 15 Single property or project landing pages) | same |
| 13 Agent Personal Branding Kit | `3-dfy` | reused (old 3 Agent personal branding kit) | same |
| 14 Agency Logo + Brand Kit | `1-dfy` | reused (old 1 Logo and brand identity) | same |
| 15 Social Media Pages Setup | `30-dfy` | reused (old 30 Page setup and optimisation) | same |
| 16 Agency Website | `14-dfy` | reused (old 14 Agency and developer websites) | same |
| 17 Website + Easy Listing Editor | `14-setup` | reused (old 14 Agency and developer websites) | same |
| 18 Google Business Profile Management | `51-mo` | reused (old 51 Google Business Profile and local SEO) | same |
| 19 Facebook Property Group Marketing | `35-mo` | reused (old 35 Facebook group marketing) | same |
| 20 Multi-Portal Listing Management | `49-setup` | reused (old 49 Multi-portal listing management) | same |
| 20 Multi-Portal Listing Management | `49-mo` | reused (old 49 Multi-portal listing management) | same |
| 21 Paid Ads Management — One Platform | `36-one` | reused (old 36 Paid ads management) | same |
| 22 Paid Ads Management — Two Platforms | `36-two` | reused (old 36 Paid ads management) | same |
| 23 Overseas Buyer Campaign | `ag-overseas-mo` | NEW line | Rs 12,999 |
| 24 Retargeting | `39-mo` | reused (old 39 Retargeting campaigns) | same |
| 25 Project Branding Kit | `2-dfy` | reused (old 2 Project branding kit) | same |
| 26 Payment / Instalment Plan Design | `4-dfy` | reused (old 4 Instalment and payment plan charts) | same |
| 27 Project Brochure | `6-dfy` | reused (old 6 PDF brochures and project booklets) | same |
| 28 Project WhatsApp One-Pager | `7-one` | reused (old 7 WhatsApp catalogues and one-pagers) | same |
| 29 Project Rate / Offer Creative | `11-dfy` | reused (old 11 Price lists and weekly promotion flyers) | same |
| 30 NOC / Approval Presentation Kit | `8-dfy` | reused (old 8 NOC and approval verification kits) | same |
| 31 Master Plan / Society Map Digitisation | `5-dfy` | reused (old 5 Master plan and society map digitisation) | same |
| 32 Investor Presentation | `13-dfy` | reused (old 13 Investor pitch decks) | same |
| 33 Project Landing Page | `proj-landing` | NEW line | Rs 9,999 |
| 34 Project / Developer Website | `proj-website` | NEW line | Rs 32,499 (from) |
| 35 Project Promo Video | `proj-promo-video` | NEW line | Rs 3,999 |
| 36 AI Presenter Project Video | `21-one` | reused (old 21 AI avatar walkthroughs) | same |
| 36 AI Presenter Project Video | `21-both` | reused (old 21 AI avatar walkthroughs) | same |
| 37 Drone Footage Editing | `24-dfy` | reused (old 24 Drone footage editing) | same |
| 38 360° Virtual Tour | `26-dfy` | reused (old 26 360° virtual tours) | same |
| 39 Site Progress Video Service | `27-mo` | reused (old 27 Site progress reels) | same |
| 40 Project Launch Campaign | `40-mo` | reused (old 40 Project launch campaigns) | same |
| 41 Overseas Project Campaign | `38-mo` | reused (old 38 Overseas Pakistani campaigns) | same |
| 42 Overseas Investor Webinar / Virtual Visit | `41-mo` | reused (old 41 Overseas investor webinars and virtual site visits) | same |
| 43 Interactive Plot Availability Map | `17-setup` | reused (old 17 Live plot availability map) | same |
| 44 Online Booking + E-Receipts | `20-setup` | reused (old 20 Online booking with e-receipts) | same |
| 45 Buyer Portal | `18-setup` | reused (old 18 Buyer portal) | same |
| 46 Dealer Portal | `19-setup` | reused (old 19 Dealer portal) | same |
| 47 Instalment / Dues Reminder System | `48-setup` | reused (old 48 Instalment and dues reminders) | same |
| 48 Project CRM + Sales Team Setup | `47-setup` | reused (old 47 CRM setup and agent training) | same |
| 49 AI Listing Assistant | `ai-listing` | NEW line | Rs 7,999 |
| 50 Website AI Assistant | `ai-website` | NEW line | Rs 7,999 |
| 51 WhatsApp Enquiry / Qualification Bot | `ai-wa-bot` | NEW line | Rs 9,999 |
| 52 Automatic Property Posting System | `ai-autopost` | NEW line | Rs 9,999 |
| 53 AI Property Content System | `ai-content` | NEW line | Rs 9,999 |
| 54 Lead Routing Automation | `ai-lead-routing` | NEW line | Rs 6,499 |
| 55 AI Document & Proposal Assistant | `ai-docs` | NEW line | Rs 12,999 |
| 56 AI Office Assistant | `ai-office` | NEW line | Rs 14,999 |
| 57 AI Lead Follow-up System | `ai-followup` | NEW line | Rs 14,999 |
| 58 Custom AI Assistant | `ai-custom` | NEW line | Rs 14,999 (from) |
| 59 CRM + AI Workflow Setup | `ai-crm` | NEW line | Rs 19,999 (from) |
| 60 Agency Automation Framework | `ai-agency-fw` | NEW line | Rs 24,999 (from) |
| 61 AI Voice Bot | `ai-voice` | NEW line | Rs 29,999 (from) |
| 62 Developer Automation Framework | `ai-dev-fw` | NEW line | Rs 39,999 (from) |
| 63 Video Script | `34-dfy` | reused (old 34 Video scripts for agents) | same |
| 64 English + Roman Urdu Ad Copy | `37-dfy` | reused (old 37 Roman Urdu and English ad copy) | same |
| 65 Advertising Wording Check | `42-dfy` | reused (old 42 Ad wording check) | same |
| 66 Market / Area Guide | `53-dfy` | reused (old 53 Market reports and area guides) | same |
| 67 Overseas Buyer Guide | `54-dfy` | reused (old 54 Overseas buyer guides) | same |
| 68 Blog + SEO Content | `55-mo` | reused (old 55 Blog and SEO articles) | same |
| 69 Review & Reputation Management | `52-mo` | reused (old 52 Review and reputation management) | same |
| 70 Urdu Sale / Purchase / Rental Agreement — First Draft | `56-dfy` | reused (old 56 First-draft sale, purchase or rental agreement in Urdu) | same |
| 71 Custom Agreement Drafting Assistant | `56-setup` | reused (old 56 First-draft sale, purchase or rental agreement in Urdu) | same |
| 72 Embeddable Property Calculator | `16-one` | reused (old 16 Embeddable calculators) | same |
| 72 Embeddable Property Calculator | `16-all` | reused (old 16 Embeddable calculators) | same |
| 73 Balloting Results Page | `29-setup` | reused (old 29 Balloting live-stream) | same |
| 74 Balloting Event Digital / Live Support | `balloting-event` | NEW line | Rs 25,999 (from) |

## Retired lines (`active = false`, not orderable)

| Line id | Was | V1 price |
|---|---|---|
| `6-extra` | old 6 PDF brochures and project booklets | Rs 999 (dfy) |
| `9-dfy` | old 9 Outdoor branding | Rs 2,499 (dfy) |
| `11-mo` | old 11 Price lists and weekly promotion flyers | Rs 4,999 (monthly) |
| `12-dfy` | old 12 Festive and occasion creatives | Rs 2,499 (dfy) |
| `12-mo` | old 12 Festive and occasion creatives | Rs 1,999 (monthly) |
| `17-mo` | old 17 Live plot availability map | Rs 6,499 (monthly) |
| `18-mo` | old 18 Buyer portal | Rs 9,999 (monthly) |
| `21-mo` | old 21 AI avatar walkthroughs | Rs 16,499 (monthly) |
| `22-mo` | old 22 AI voiceover reels | Rs 9,999 (monthly) |
| `31-mo` | old 31 Monthly social media management | Rs 9,999 (monthly) |
| `32-mo` | old 32 TikTok and YouTube Shorts channel management | Rs 16,499 (monthly) |
| `33-setup` | old 33 Automatic posting from listings | Rs 12,999 (setup) |
| `43-setup` | old 43 WhatsApp qualification bot | Rs 19,499 (setup) |
| `44-setup` | old 44 AI website chatbot | Rs 16,499 (setup) |
| `45-setup` | old 45 AI voice bot | Rs 51,999 (setup) |
| `46-setup` | old 46 Lead routing | Rs 9,999 (setup) |
| `48-mo` | old 48 Instalment and dues reminders | Rs 9,999 (monthly) |
| `50-setup` | old 50 Custom AI assistants | Rs 25,999 (setup) |
| `29-event` | old 29 Balloting live-stream | Rs 25,999 (monthly) — replaced by `balloting-event` (billing changed from monthly to per event) |

Old services with no V2 equivalent: 9 Outdoor branding, 12 Festive and occasion creatives, 31 Monthly social media management, 32 TikTok / YouTube Shorts channel management. Monthly social media management now lives inside the monthly packages.

## Packages

| Old package (retired, `active = false`) | Replaced by |
|---|---|
| Dealer Starter — Rs 6,499/mo | Agent Monthly — Rs 7,999/mo, 3-month minimum |
| Growing Agent — Rs 16,499/mo + 9,999 | Agent Pro — Rs 14,999/mo, 3-month minimum |
| Agency Pro — Rs 38,999/mo + 25,999 | Agency Growth — Rs 29,999/mo + Rs 9,999 set-up, 3-month minimum |
| AgenticCore Package — Rs 39,999 one-off | Agency Launch Kit — Rs 14,999 one-off (from Rs 39,999 with website) |
| Project Partner — Rs 77,999/mo + 194,999, 6 months | Project Monthly Rs 19,999/mo · Project Growth Rs 39,999/mo + 9,999 · Developer Partner from Rs 74,999/mo, set-up quoted (proposal only) |
| — | Project Launch Kit — Rs 39,999 one-off (from Rs 64,999 with full website) |

Monthly allowances (`pk_package_allowances`, monthly maximums that do not roll over):
- Agent Monthly: 10 property sets, 2 reels (extra at `22-dfy`), 4 rate updates (extra at `11-dfy`)
- Agent Pro: 25 sets, 4 reels, 8 rate updates
- Agency Growth: 50 sets, 8 reels
- Project Monthly: 12 project creatives, 4 reels, 4 rate updates, 2 progress updates
- Project Growth: 16 project creatives, 6 reels, 4 progress updates

A "Property Marketing Set" = one WhatsApp property card + one social property creative + English/Roman Urdu captions for one property, with basic enhancement of up to 5 photos.

Existing subscribers on retired packages keep their subscription and allowances (allowances are only rewritten for V2 package ids).

## Database

1. `supabase/migrations/pk_0004_catalogue_v2.sql` (apply first). It is additive:
   - widens the `service_no` check to 1–99
   - adds `quote_only`, `is_from` and `section` to `pk_packages`
   - adds a `'proposal'` lead kind
   - replaces `pk_buy_package`: it refuses quote-only packages, and labels "from" prices on the invoice
2. Regenerated `supabase/migrations/pk_0002_seed_catalog.sql` (apply second). It upserts 77 lines, 10 packages and 15 allowances, then deactivates everything not in the JSON.
3. `supabase/migrations/pk_0005_seven_day_due.sql` (apply third): restates `pk_compute_due` with the 7-day operating rule written out (see below). Production already computes due dates this way, so applying it changes no deadline.
4. **Order matters at release.** Deploy the site and apply both files together. The new site sends new line ids (`p-flyer`, `ai-voice`, …) that the production table does not know yet. If the site deploys first, those orders fail with "Unknown service line". If the database is applied first, the old site's retired lines (e.g. `9-dfy`) and packages stop being orderable.
5. Tested on a local Postgres 16 copy (V1 schema + V1 seed + `pk_0003`, then V2):
   - every V2 package priced correctly
   - Developer Partner refused
   - old `dealer-starter` refused
   - retired `9-dfy` refused
   - a foreign Estate listing refused (42501), a malformed id refused (22023), the caller's own listing accepted
   - re-applying both files is idempotent
6. **Rollback:** re-apply the V1 seed from `441920b`. The V2 lines then remain but are switched off with `update … set active=false where line_id in (…)`. The pk_0004 columns are harmless to V1.

## Delivery-time changes (material)

AgenticCore Pakistan works 7 days a week. Small creatives are delivered the same day for orders confirmed before 6pm PKT. Other work is quoted in plain day ranges:
- reels, 3D plans, branding kits: 1–2 days
- catalogues, landing pages, brochures, decks, maps: 2–3 days
- project branding and CRM: 3–5 days
- websites: 5–7 days
- website + editor: 7–10 days
- plot map, booking, dues reminders: 1–2 weeks
- portals: 2–3 weeks
- frameworks and custom AI: after scoping

Customer wording (EN): "We work 7 days a week. Orders confirmed before 6pm PKT start the same day; orders confirmed at or after 6pm start the following day."
Customer wording (UR): "ہم ہفتے کے ساتوں دن کام کرتے ہیں۔ شام 6 بجے (پاکستانی وقت) سے پہلے کنفرم ہونے والے آرڈرز پر کام اسی دن شروع ہوتا ہے؛ شام 6 بجے یا اس کے بعد کنفرم ہونے والے آرڈرز پر کام اگلے دن شروع ہوتا ہے۔"

### Due dates — 7-day operation (pk_0005)

Internal due dates use the same rule the customer reads. All times are Pakistan time (Asia/Karachi), and every calendar day counts: there are no weekend or public-holiday exclusions, so no holiday calendar has to be maintained.

1. **Start day.** The calendar day the task is confirmed. If it is confirmed at or after 6pm (`cutoff_hour_pkt`), the start day is the next calendar day.
2. **Due day.** Start day plus the service's turnaround in calendar days. A turnaround of 0 (same day) means the start day itself.
3. **Due time.** 9pm (`due_hour_pkt`) on the due day.

Paused tasks: "waiting on you" stops the clock. On resume, the paused time is added back to the existing due time, so a promised deadline only moves later, never earlier. Re-confirming a task never recalculates an existing deadline.

| Confirmed | Turnaround | Due |
|---|---|---|
| Friday 10am | 3 days | Monday 9pm |
| Friday 7pm | same day | Saturday 9pm |
| Saturday 10am | same day | Saturday 9pm |
| Sunday 10am | 2 days | Tuesday 9pm |

`tests/db/seven_day_due.test.sql` covers these cases:
- Friday → Saturday, Saturday → Sunday, Sunday → Monday
- before, exactly at, and after the 6pm cut-off
- same-day service on Saturday and on Sunday
- a multi-day turnaround that crosses the weekend
- a pause and resume through the real admin RPC (never shortened)

Run it with `tests/db/run.sh`, on a local Postgres only.
