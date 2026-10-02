# Sample asset manifest — AgenticCore Pakistan

The "See what we can create" gallery, the hero collage and the service detail examples all read `data/samples.json`.

**Current state (final full-resolution pass, 1 Oct 2026)**

Six standalone sample artworks supplied by the owner replace the earlier board crops and CSS mock-ups. They were not extracted from a board, upscaled or redesigned. Each was only downscaled where needed (aspect ratio kept, never stretched) and exported as WebP at most 200 KB. A smaller thumbnail of the same artwork is used through `srcset` in tiles. `width`/`height` in `samples.json` are the real pixel sizes, and `tests/p2.test.mjs` checks them against the files.

| Sample | Full file (real size, weight) | Thumbnail | Source upload | Display | Extra disclosure |
|---|---|---|---|---|---|
| Property flyer: "Showcase Your Property at Its Best" | `property-flyer.webp` 1080×1350, 193 KB | `-600` 600×750, 74 KB | 1122×1402 | cover, top | – |
| WhatsApp card: "List Your Property with Ease" | `whatsapp-property-card.webp` 1080×1350, 179 KB | `-600` 600×750, 72 KB | 1122×1402 | cover, top | Alt text says it is illustrative, not a real listing or WhatsApp screenshot |
| Social post: "Premium Properties Deserve Premium Marketing" | `social-property-post.webp` 1080×1080, 196 KB | `-640` 640×640, 70 KB | 1254×1254 | cover, top | – |
| Brochure: "Exceptional Properties — Expert Marketing" | `property-brochure.webp` 1492×1054 (native), 199 KB | `-800` 800×565, 82 KB | 1492×1054 | contain | – |
| Payment plan: "Flexible Payment Plan" | `project-payment-plan.webp` 1600×900, 194 KB | `-800` 800×450, 66 KB | 1672×941 | contain | `sample_note_plan`: figures illustrative, not a real project, price or offer (the artwork also says so) |
| Reel cover: "Premium Properties — For a Brighter Tomorrow" | `reel-cover.webp` 1280×720, 194 KB | `-800` 800×450, 68 KB | 1672×941 | contain | `sample_note_reel`: cover artwork only, no video behind the play button (no video link exists) |
| Share image | `images/og-share.jpg` 1200×630, 167 KB | – | – | – | Rebuilt with the real logo and the new post and brochure, downscaled only |

All files are under `images/samples/`. The embedded AgenticCore logos and the "Sample Concept" corner tags in the artwork are kept as supplied. The site adds its own "Sample concept" label and the "Illustrative details — not a real listing or offer" line.

**Where they appear (all data-driven from `data/samples.json`):**
- hero collage: flyer, WhatsApp card, post, reel
- "What we can create": decorative thumbnails on flyer, WhatsApp, social, brochure, reel and project tiles
- Property Marketing Pack preview: WhatsApp card, post, flyer, reel
- sample gallery: all six, each with "View full size", which opens the image file itself
- service detail "Example" sections (services 4, 6, 7, 10, 11, 22, 23, 31)

**Wording inside the artwork worth an owner review** (soft brand claims, not results or guarantees): "Trusted & Professional" (WhatsApp card footer), "Secure Investment" (payment plan footer) and "Pakistan's Real Estate Growth Partner" (several footers). They were left unchanged because this pass doesn't edit artwork.

**Still CSS mock-ups:** progress reel, WhatsApp catalogue, approval kit, Estate QR card (a live feature).

**Not used:** the reference boards (first message and the master board) are not used on the site, as instructed.

## How to install an image

1. Save the file under `images/samples/` (WebP, sRGB, at most 200 KB; downscale only, never stretch). Optionally add a smaller thumbnail with the same aspect ratio (at most 120 KB).
2. In `data/samples.json`, set `"installed": true`, `width`/`height` to the file's real size, and `thumb`/`thumbWidth` if there is a thumbnail. Add `alt_<id>` in English and Urdu in `js/i18n-p2.js`.
3. Deploy. The mock-up is replaced automatically; the "Sample concept" label stays.

`tests/p2.test.mjs` fails if a file is missing, if a size doesn't match, if a thumbnail changes the aspect ratio, if alt text is missing, or if an unreferenced file is shipped.

## Rules for every sample

- It is a **demonstration**, not client work: no real client names, logos, phone numbers, testimonials or results.
- Use fictional project names (e.g. "Sample Residencia"). Use `0300 000 0000`-style or blank phone numbers.
- Prices and areas are examples only.
- A "Listed on AgenticCore Estate" mark and QR are fine; the QR should point to `https://agenticcore.estate`, not a fake listing.
- No approval, NOC or government claims unless marked as an example (as in the approval-kit mock-up).

## Original file brief (now delivered, except the optional workflow image)

| # | Path | Size (source) | Shows | Alt text (EN) | Used in |
|---|---|---|---|---|---|
| 1 | `images/samples/property-flyer.webp` | 1080×1350 | "For sale" flyer: photo, price badge, facts, agency block, QR | Sample property flyer for a 10 marla house | hero collage, gallery (Property), service 10/11 |
| 2 | `images/samples/whatsapp-property-card.webp` | 1080×1350 | WhatsApp card: photo, white fact sheet, price, "Contact now" | Sample WhatsApp property card | hero collage, gallery, service 7 |
| 3 | `images/samples/social-property-post.webp` | 1080×1080 | Square Instagram/Facebook post | Sample square social media property post | hero collage, gallery (Social), service 11/31 |
| 4 | `images/samples/property-brochure.webp` | 1600×1130 (landscape preview of an A4 spread) | Brochure cover plus an inside page | Sample property brochure spread | gallery (Print), service 6/7 |
| 5 | `images/samples/project-payment-plan.webp` | 1600×900 | Payment-plan table for a fictional project | Sample project payment plan | gallery (Project), service 4 |
| 6 | `images/samples/reel-cover.webp` | 1280×720 | Reel/video cover with play button and duration | Sample property reel cover | hero collage, gallery (Video), service 22/23 |
| 7 | `images/samples/property-workflow.webp` | 1600×600 | Agent input → AgenticCore output strip | Sample workflow from agent notes to marketing outputs | reserved for the workflow section (currently built in HTML/CSS; the image is optional) |
| 8 | `images/og-share.jpg` | 1200×630, ≤200 KB | "Turn properties into marketing that sells." with the logo on the brand background | – (Open Graph) | `og:image` / `twitter:image` on every page (currently the Estate icon) |

Optional later additions, which need a new entry in `samples.json`:
- a progress-reel still (service 27)
- a WhatsApp catalogue (7-cat)
- an approval-kit layout (8)
- an Estate QR share card screenshot (a real feature: take the screenshot on agenticcore.estate)

## Performance

- Every image has explicit `width`/`height`, so there's no layout shift (measured CLS 0 at 390 px and 0.02 at 1280 px).
- Gallery, pack and out-strip images are `loading="lazy"`. The four hero images are eager but `fetchpriority="low"`, because the measured LCP element is the hero text, not an image.
- `srcset` serves the thumbnail in tiles. The full file loads only where the tile is wide enough on a high-DPI screen, or through "View full size".
- Don't use the full reference collage as a background.

## Entry-service visuals (1 Oct 2026, branch `claude/pk-entry-services-visuals`)

| Sample | File (real size, weight) | Thumbnail | Source | Where | Extra disclosure |
|---|---|---|---|---|---|
| Listing photo enhancement | `photo-enhancement.webp` 1600×900, 186 KB | `-800` 800×450, 85 KB | 1672×941 | gallery (Property), service 28 example | `sample_note_photos`: before/after is illustrative, not client photos |
| Agency website | `website-design.webp` 800×882 (native), 130 KB | `-480` 480×529, 65 KB | left panel of a 1672×941 two-panel image | "Website" tile, gallery (Websites & pages), service 14 example | – |
| Property landing page | `property-landing-page.webp` 1600×900, 196 KB | `-800` 800×450, 98 KB | 1672×941 | gallery (Websites & pages), service 15 example | `sample_note_landing`: not a real project, location, price or offer |
| Listing support | `listing-support.webp` 800×882 (native), 110 KB | `-480` 480×529, 56 KB | right panel of the same two-panel image | "Listing support" tile only (`gallery: false`) | – |

The listing-support artwork advertises "Pricing Guidance / Right Pricing", which no listing-support service (28, 49, 33) includes. It's therefore used only as the small decorative tile thumbnail (headline only, `alt=""`) and kept out of the gallery and service examples until corrected artwork arrives.

Not installed: the WhatsApp catalogue artwork (fictional business name "Al Noor Properties", "Great Investment / Strong Returns / High Growth", typos "Locatioly", "Architecte", "Llayouts") and the site-progress reel artwork (not part of this request; a candidate to replace the progress-reel mock-up later).

### Corrected replacements (owner-supplied, 1 Oct 2026)

The three earlier versions were replaced in place (same filenames) and the obsolete `listing-support-480.webp` was deleted.

| Sample | File | Thumbnail | Notes |
|---|---|---|---|
| Photo enhancement | `photo-enhancement.webp` 1600×900, 181 KB | `-800` 800×450, 80 KB | Rs 1,299 / up to 10 photos / Same Day: all match the catalogue (28-dfy, "Same day"). No results claims. |
| Property landing page | `property-landing-page.webp` 1600×900, 176 KB | `-800` 800×450, 80 KB | From Rs 9,999 / Same Day match 15-dfy. Urdu typos in the price box ("في" for "فی", "ڈبلیوری" for "ڈیلیوری", a cut-off "پیش کرد"). |
| Listing support | `listing-support.webp` 1200×501, 95 KB (crop 0–698 px of 1672×941) | `-600` 600×250, 37 KB | Tile only. The crop excludes the "From Rs 1,299 Per Listing" box: no catalogue line sells listing support per listing (the "from Rs 1,299" is 28-dfy, per 10 photos). It also excludes a garbled Urdu strip ("ربلما"). |

## Catalogue V2 (October 2026, branch `claude/pk-catalogue-v2`)

- `listing-support.webp` and `listing-support-600.webp` were **removed** (git rm) and the sample deleted from `data/samples.json`. The "Listing support" tile no longer exists; the eight homepage tiles are flyer, WhatsApp card, social post, photo enhancement, voiceover reel, project brochure, property landing page and agency website, each pointing at one exact V2 price line (`data/discovery.json` → `tiles`).
- Sample → V2 service numbers: property flyer → 3, 9 · WhatsApp card → 1 · social post → 2 · photo enhancement → 4 · reel cover → 6, 7 · property brochure → 27 · payment plan → 26 · website design → 16, 34 · property landing page → 12, 33 · (not installed) progress reel → 39, WhatsApp catalogue → 8, approval kit → 30.
- **Known mismatch to review:** the installed property-landing-page artwork shows "From Rs 9,999 / Same Day". In V2, service 12 is a fixed Rs 9,999 with a 2–3 working-day delivery. The image is still labelled "Sample concept", but the owner should decide whether to re-export it or accept it.
